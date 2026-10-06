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

    def load_module(self):
        """statusline.py importato in questo processo, con HOME fittizio (i path sono
        risolti all'import), per test che devono sostituirne funzioni o costanti."""
        import importlib.util
        old_home = os.environ.get("HOME")
        os.environ["HOME"] = self.home
        try:
            spec = importlib.util.spec_from_file_location(
                "statusline_" + os.path.basename(self.root), os.path.join(self.repo, "statusline.py"))
            mod = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)
        finally:
            os.environ["HOME"] = old_home
        return mod

    def fake_session_logs(self, window_start, files=12):
        """Un file .jsonl per giorno/fascia, ciascuno con 20 minuti distinti di attività."""
        proj = os.path.join(self.home, ".claude", "projects", "bench")
        os.makedirs(proj, exist_ok=True)
        day0 = datetime.datetime.fromtimestamp(window_start).replace(hour=0, minute=0, second=0, microsecond=0)
        for i in range(files):
            start = day0 + datetime.timedelta(days=1 + i // 3, hours=(8, 14, 20)[i % 3])
            with open(os.path.join(proj, f"s{i}.jsonl"), "w") as f:
                for m in range(20):
                    ts = (start + datetime.timedelta(minutes=m)).astimezone(datetime.timezone.utc)
                    f.write(json.dumps({"type": "assistant", "timestamp": ts.strftime("%Y-%m-%dT%H:%M:%S.000Z")}) + "\n")


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

    def test_terminal_bar_shows_raw_percentages_only(self):
        # il piano vive nel browser: la barra del terminale non deve inventarsi obiettivi
        r = self.sb.run(self.full(week=50.0, hour=12.0))
        self.assertIn("█████░░░░░ 50%", r.stdout)
        self.assertIn("5h 12%", r.stdout)
        for stale in ("obiettivo", "tacca", "quota", "limite"):
            self.assertNotIn(stale, r.stdout)
        self.assertNotIn("target_pct", self.sb.state())

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

    def test_values_changed_at_tracks_real_changes_only(self):
        # una sessione ferma ripete lo stesso snapshot: values_changed_at non deve avanzare
        self.sb.run(self.full(week=26.0, hour=21.0))
        first = self.sb.state()["values_changed_at"]
        time.sleep(0.05)
        self.sb.run(self.full(week=26.0, hour=21.0))
        self.assertEqual(self.sb.state()["values_changed_at"], first)
        self.sb.run(self.full(week=27.0, hour=29.0))
        self.assertGreater(self.sb.state()["values_changed_at"], first)

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

    def test_interrupted_scans_converge_to_full_scan(self):
        # a inizio settimana la scansione dei log è lunga: a pezzi deve arrivare allo
        # stesso risultato di una scansione completa, senza ripartire da zero
        resets = self.week_reset
        window_start = resets - 7 * 86400
        self.sb.fake_session_logs(window_start)
        full = Sandbox()
        try:
            full.fake_session_logs(window_start)
            expected = full.load_module().compute_worked_slots(window_start, resets)
        finally:
            full.cleanup()
        self.assertEqual(len(expected), 12)

        sl = self.sb.load_module()
        sl.WORKED_SCAN_BUDGET_S = 0  # un solo file per chiamata
        calls = 0
        while True:
            calls += 1
            got = sl.compute_worked_slots(window_start, resets)
            if sl.load_worked_cache()["last_update"]:
                break
            self.assertLess(calls, 50)
        self.assertGreater(calls, 1)
        self.assertEqual(got, expected)

    def test_percentages_written_even_if_log_scan_is_killed(self):
        # il baco del 6/10: Claude Code interrompeva lo script durante la lettura dei
        # log e state.json restava alla settimana precedente per minuti
        import io
        sl = self.sb.load_module()

        def killed(*a):
            raise SystemExit("interrotto da Claude Code")
        sl.compute_worked_slots = killed
        old_stdin = sys.stdin
        sys.stdin = io.StringIO(json.dumps(self.full(week=26.0, hour=21.0)))
        try:
            with self.assertRaises(SystemExit):
                sl.main()
        finally:
            sys.stdin = old_stdin
        s = self.sb.state()
        self.assertEqual((s["status"], s["used_pct"], s["five_hour_pct"]), ("ok", 26.0, 21.0))

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
