#!/usr/bin/env python3
"""Banco di prova per statusline.py.

    python3 tests/bench_statusline.py            # test automatici, in sandbox isolata
    python3 tests/bench_statusline.py --diagnose # controlla l'ambiente reale (sola lettura)

I test copiano il repo in una cartella temporanea e usano un HOME fittizio: data/*.json
e ~/.claude reali non vengono mai toccati.
"""
import datetime
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
import unittest

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STALE_S = 20 * 60  # come STALE_THRESHOLD_MS in js/app.js


def payload(seven_day=None, five_hour=None, session="bench-session"):
    d = {
        "session_id": session,
        "cwd": "/tmp/bench",
        "model": {"display_name": "Bench Model"},
        "version": "bench",
    }
    if seven_day is not None or five_hour is not None:
        d["rate_limits"] = {}
        if seven_day is not None:
            d["rate_limits"]["seven_day"] = seven_day
        if five_hour is not None:
            d["rate_limits"]["five_hour"] = five_hour
    return d


class Sandbox:
    def __init__(self):
        self.root = tempfile.mkdtemp(prefix="cm-bench-")
        self.repo = os.path.join(self.root, "repo")
        self.home = os.path.join(self.root, "home")
        os.makedirs(os.path.join(self.repo, "data"))
        os.makedirs(os.path.join(self.home, ".claude", "projects"))
        shutil.copy(os.path.join(REPO, "statusline.py"), self.repo)

    def run(self, data, raw=None):
        env = {**os.environ, "HOME": self.home, "PYTHONDONTWRITEBYTECODE": "1"}
        stdin = raw if raw is not None else json.dumps(data)
        return subprocess.run(
            [sys.executable, os.path.join(self.repo, "statusline.py")],
            input=stdin, capture_output=True, text=True, env=env, timeout=20,
        )

    def state(self):
        with open(os.path.join(self.repo, "data", "state.json")) as f:
            return json.load(f)

    def write(self, name, obj):
        with open(os.path.join(self.repo, "data", name), "w") as f:
            json.dump(obj, f)

    def cleanup(self):
        shutil.rmtree(self.root, ignore_errors=True)


class StatuslineBench(unittest.TestCase):
    def setUp(self):
        self.sb = Sandbox()
        self.week_reset = int(time.time()) + 3 * 86400
        self.hour_reset = int(time.time()) + 2 * 3600

    def tearDown(self):
        self.sb.cleanup()

    def full(self, week=47.0, hour=12.0, week_reset=None, session="bench-session"):
        return payload(
            {"used_percentage": week, "resets_at": week_reset or self.week_reset},
            {"used_percentage": hour, "resets_at": self.hour_reset},
            session=session,
        )

    def test_full_payload_writes_ok(self):
        r = self.sb.run(self.full())
        self.assertEqual(r.returncode, 0, r.stderr)
        s = self.sb.state()
        self.assertEqual(s["status"], "ok")
        self.assertEqual(s["used_pct"], 47.0)
        self.assertEqual(s["five_hour_pct"], 12.0)
        self.assertFalse(s["limits_missing"])
        self.assertIn("hook_at", s)
        self.assertIn("47%", r.stdout)

    def test_missing_rate_limits_on_empty_state_is_nd(self):
        self.sb.run(payload())
        s = self.sb.state()
        self.assertEqual(s["status"], "n/d")
        self.assertTrue(s["limits_missing"])
        self.assertIn("hook_at", s)

    def test_session_without_limits_does_not_wipe_good_data(self):
        # il baco: una sessione CLI non loggata / senza messaggi azzerava i dati validi
        self.sb.run(self.full(week=63.0, session="logged-in"))
        before = self.sb.state()
        time.sleep(0.05)
        self.sb.run(payload(session="idle-not-logged-in"))
        after = self.sb.state()
        self.assertEqual(after["status"], "ok")
        self.assertEqual(after["used_pct"], 63.0)
        self.assertEqual(after["updated_at"], before["updated_at"])  # età reale dei dati
        self.assertGreater(after["hook_at"], before["hook_at"])
        self.assertTrue(after["limits_missing"])
        # e appena torna una sessione con i limiti, il flag si spegne
        self.sb.run(self.full(week=64.0, session="logged-in"))
        self.assertFalse(self.sb.state()["limits_missing"])

    def test_clamp_same_window_never_decreases(self):
        self.sb.run(self.full(week=94.0))
        self.sb.run(self.full(week=71.0))
        self.assertEqual(self.sb.state()["used_pct"], 94.0)
        self.sb.run(self.full(week=96.0))
        self.assertEqual(self.sb.state()["used_pct"], 96.0)

    def test_clamp_new_window_resets(self):
        self.sb.run(self.full(week=94.0))
        self.sb.run(self.full(week=5.0, week_reset=self.week_reset + 7 * 86400))
        self.assertEqual(self.sb.state()["used_pct"], 5.0)

    def test_no_reset_info(self):
        self.sb.run(payload({"used_percentage": 30.0}))
        s = self.sb.state()
        self.assertEqual(s["status"], "no_reset_info")
        self.assertIn("hook_at", s)

    def test_malformed_input_does_not_crash(self):
        r = self.sb.run(None, raw="non json")
        self.assertEqual(r.returncode, 0)
        self.assertIn("no input", r.stdout)

    def test_passthrough_prints_original_command(self):
        self.sb.write("display-config.json", {"mode": "passthrough", "original_command": "echo ORIGINALE"})
        r = self.sb.run(self.full())
        self.assertEqual(r.stdout.strip(), "ORIGINALE")
        self.assertEqual(self.sb.state()["status"], "ok")  # il dashboard riceve comunque i dati

    def test_passthrough_broken_command_falls_back_to_bar(self):
        self.sb.write("display-config.json", {"mode": "passthrough", "original_command": "comando-inesistente-xyz"})
        r = self.sb.run(self.full())
        self.assertIn("47%", r.stdout)

    def test_debug_log_records_missing_key(self):
        self.sb.run(payload())
        with open(os.path.join(self.sb.repo, "data", "debug-writes.log")) as f:
            entry = json.loads(f.readlines()[-1])
        self.assertFalse(entry["has_rate_limits_key"])


def diagnose():
    """Sola lettura: dice perché il dashboard non riceve dati su QUESTA macchina."""
    def fmt(ts):
        return datetime.datetime.fromtimestamp(ts).strftime("%Y-%m-%d %H:%M:%S")

    ok = True
    print("1) statusLine in ~/.claude/settings.json")
    try:
        with open(os.path.expanduser("~/.claude/settings.json")) as f:
            cmd = (json.load(f).get("statusLine") or {}).get("command", "")
    except Exception:
        cmd = ""
    wired = "statusline.py" in cmd
    ok &= wired
    print("   ", "OK" if wired else "MANCA", "-", cmd or "(nessuno)")

    print("2) login della CLI (claude auth status)")
    try:
        out = subprocess.run(["claude", "auth", "status"], capture_output=True, text=True, timeout=20).stdout
        logged = json.loads(out).get("loggedIn")
    except Exception as e:
        logged = None
        out = str(e)
    ok &= bool(logged)
    print("   ", {True: "OK - loggato", False: "NON LOGGATO: lancia `claude`, poi /login (account Pro/Max)", None: "impossibile verificare"}[logged])

    print("3) ultime chiamate all'hook (data/debug-writes.log)")
    log = os.path.join(REPO, "data", "debug-writes.log")
    rows = []
    try:
        with open(log) as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    rows.append(json.loads(line))
                except ValueError:
                    pass  # riga troncata (scrittura interrotta): non invalida le altre
    except Exception:
        pass
    if not rows:
        ok = False
        print("    nessuna chiamata registrata: nessuna sessione CLI ha mai eseguito la statusline")
    else:
        last = rows[-1]
        age = time.time() - last["ts"]
        alive = age <= STALE_S
        ok &= alive
        sid = str(last.get("session_id"))
        print(f"    ultima chiamata {fmt(last['ts'])} ({age / 60:.0f} min fa) - sessione {sid[:8]}")
        if not alive:
            print("    nessuna sessione CLI aperta: l'app desktop non esegue la statusline, serve `claude` nel terminale")

        # Il log e' un anello di DEBUG_LOG_MAX_LINES righe che attraversa piu' sessioni,
        # anche di giorni diversi: contare su tutto il file mescola sessioni sane e rotte
        # (una vecchia sessione senza rate_limits sporca il rapporto per giorni). Il dato
        # utile e' quello della sessione corrente, cioe' quella dell'ultima chiamata.
        cur = [r for r in rows if str(r.get("session_id")) == sid]
        cur_with = [r for r in cur if r.get("seven_day_pct") is not None]
        other_with = [r for r in rows
                      if str(r.get("session_id")) != sid and r.get("seven_day_pct") is not None]
        print(f"    chiamate con rate_limits: {len(cur_with)}/{len(cur)} in questa sessione"
              f" ({len(rows) - len(cur)} chiamate di altre sessioni nel log, ignorate)")
        if not cur_with:
            # has_rate_limits_key distingue "Claude Code non ha passato la chiave" da
            # "chiave presente ma valori nulli": e' l'unico segnale che dice il perche'.
            no_key = sum(1 for r in cur if not r.get("has_rate_limits_key"))
            if no_key == len(cur):
                print("    rate_limits mai passati da Claude Code in questa sessione:"
                      " CLI non loggata, oppure nessun messaggio ancora inviato"
                      " (l'hook scatta anche a vuoto sul timer, prima del primo messaggio)")
            else:
                print(f"    rate_limits presenti ma vuoti in {len(cur) - no_key} chiamate su {len(cur)}:"
                      " risposta API senza dati di utilizzo (account senza limiti esposti?)")
            if other_with:
                print(f"    una sessione precedente li aveva ricevuti ({fmt(other_with[-1]['ts'])}):"
                      " l'aggancio funziona, manca solo il dato in questa sessione")
            else:
                ok = False

    print("4) data/state.json")
    try:
        with open(os.path.join(REPO, "data", "state.json")) as f:
            s = json.load(f)
        print(f"    status={s.get('status')} aggiornato {fmt(s.get('updated_at', 0))}")
        ok &= s.get("status") == "ok" and time.time() - s.get("updated_at", 0) <= STALE_S
    except Exception:
        ok = False
        print("    assente")

    print("\nESITO:", "tutto a posto" if ok else "c'è almeno un problema, vedi sopra")
    return 0 if ok else 1


if __name__ == "__main__":
    if "--diagnose" in sys.argv:
        sys.exit(diagnose())
    unittest.main(verbosity=2)
