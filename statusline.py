#!/usr/bin/env python3
import datetime
import glob
import json
import os
import subprocess
import sys
import time

SEGMENTS = 6  # 5 giorni lavorativi standard + 1 extra, domenica esclusa
DAILY_QUOTA_PCT = 100 / SEGMENTS  # quota fissa di budget settimanale per giorno (~17%)
WEEKDAY_LETTERS = ["L", "M", "M", "G", "V", "S", "D"]  # date.weekday(): 0=lunedì ... 6=domenica

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
WEB_STATE_FILE = os.path.join(SCRIPT_DIR, "data", "state.json")
WORKED_CACHE_FILE = os.path.join(SCRIPT_DIR, "data", "worked_cache.json")
DISPLAY_CONFIG_FILE = os.path.join(SCRIPT_DIR, "data", "display-config.json")
SLOT_CONFIG_FILE = os.path.join(SCRIPT_DIR, "data", "slot-config.json")
CLAUDE_PROJECTS_DIR = os.path.expanduser("~/.claude/projects")
WORK_THRESHOLD_MINUTES = 15  # minuti distinti di attività per considerare uno slot "lavorato"
WORKED_CACHE_TTL = 60  # secondi: non ri-scansionare i log più spesso di così


def load_slot_config():
    """Se data/slot-config.json esiste (creato da configure-slots.py o dal pannello
    web via --apply), genera le fasce da un elenco esplicito di confini orari
    (boundaries, N+1 valori per N fasce, anche di durata diversa tra loro), con
    chiavi numeriche "0".."N-1" — stessa identica logica di buildSlotsFromConfig()
    in js/app.js, le due DEVONO restare in sincronia: entrambe leggono lo stesso
    file, quindi condividono sempre la stessa definizione di fascia, altrimenti il
    marcatore "log data" del calendario web non corrisponderebbe più agli slot
    letti da qui. day_count/icons nel file sono concern esclusivi del lato web
    (numero di colonne mostrate, icone dei confini) e qui vengono ignorati. In
    assenza del file, resta il preset di default (mattina/pomeriggio/sera)
    invariato rispetto a sempre."""
    try:
        with open(SLOT_CONFIG_FILE) as f:
            cfg = json.load(f)
        boundaries = cfg.get("boundaries")
        if not isinstance(boundaries, list) or len(boundaries) < 2:
            return None
        for i in range(1, len(boundaries)):
            if not isinstance(boundaries[i], (int, float)) or boundaries[i] <= boundaries[i - 1]:
                return None
        n = len(boundaries) - 1
        keys = [str(i) for i in range(n)]
        bounds = {keys[i]: (boundaries[i], boundaries[i + 1]) for i in range(n)}
        return keys, bounds
    except Exception:
        return None


_custom_slots = load_slot_config()
if _custom_slots:
    SLOT_KEYS_ORDER, SLOT_BOUNDS = _custom_slots
else:
    SLOT_KEYS_ORDER = ["mattina", "pomeriggio", "sera"]
    SLOT_BOUNDS = {"mattina": (0, 12), "pomeriggio": (12, 19), "sera": (19, 24)}

TICK_FULL = "█"
TICK_EMPTY = "░"
RED = "\033[31m"
GREEN = "\033[32m"
CYAN = "\033[36m"
RESET = "\033[0m"


MORNING_THRESHOLD_HOUR = 11  # reset entro quest'ora: il giorno di window_start conta per intero come giorno 1

def calendar_segments(window_start_epoch):
    """Le 6 date della finestra di 7gg che non cadono di domenica, in ordine cronologico.

    window_start è l'istante esatto in cui la finestra precedente è scaduta. Se quell'istante
    cade tardi nel giorno (es. mercoledì 23:00), la fetta di giorno rimasta (dalle 23 a
    mezzanotte) è trascurabile e non conta come tacca: il giorno 1 diventa il giorno
    successivo. Se invece cade la mattina presto (es. entro le 11), la maggior parte di
    quel giorno è già dentro la finestra corrente, quindi conta per intero come giorno 1.
    """
    window_start_dt = datetime.datetime.fromtimestamp(window_start_epoch)
    if window_start_dt.hour < MORNING_THRESHOLD_HOUR:
        start_date = window_start_dt.date()
    else:
        start_date = window_start_dt.date() + datetime.timedelta(days=1)
    days = []
    for offset in range(7):
        d = start_date + datetime.timedelta(days=offset)
        if d.weekday() == 6:  # domenica: giorno di riposo, non è una tacca
            continue
        days.append(d)
    return days


def all_seven_days(window_start_epoch):
    """Tutti e 7 i giorni della finestra (domenica inclusa), stesso algoritmo usato lato web
    per il calendario di pianificazione (vedi computeSevenDays in index.html)."""
    window_start_dt = datetime.datetime.fromtimestamp(window_start_epoch)
    if window_start_dt.hour < MORNING_THRESHOLD_HOUR:
        start_date = window_start_dt.date()
    else:
        start_date = window_start_dt.date() + datetime.timedelta(days=1)
    return [start_date + datetime.timedelta(days=offset) for offset in range(7)]


def slot_for_hour(hour_float):
    for key, (start, end) in SLOT_BOUNDS.items():
        if start <= hour_float < end:
            return key
    return SLOT_KEYS_ORDER[-1]  # fuori da [day_start, day_end): conta per l'ultima fascia


SLOT_BOUNDS_SIGNATURE = json.dumps(SLOT_BOUNDS, sort_keys=True)


def load_worked_cache():
    try:
        with open(WORKED_CACHE_FILE) as f:
            cache = json.load(f)
    except Exception:
        cache = {}
    # se i confini delle fasce sono cambiati (configure-slots.py) da quando la cache è
    # stata scritta, gli offset per-file salvati punterebbero a byte già "consumati" con
    # la vecchia mappatura ora/fascia: si perderebbero minuti già passati sotto le nuove
    # fasce. Invalidare tutto e ripartire da zero è l'unico modo corretto di recuperarli.
    if cache.get("slot_bounds_signature") != SLOT_BOUNDS_SIGNATURE:
        cache = {}
    cache.setdefault("offsets", {})
    cache.setdefault("minutes", {})
    cache.setdefault("worked", {})
    cache.setdefault("last_update", 0)
    cache.setdefault("last_window_start", None)
    cache["slot_bounds_signature"] = SLOT_BOUNDS_SIGNATURE
    return cache


def save_worked_cache(cache):
    try:
        os.makedirs(os.path.dirname(WORKED_CACHE_FILE), exist_ok=True)
        with open(WORKED_CACHE_FILE, "w") as f:
            json.dump(cache, f)
    except Exception:
        pass  # cache best-effort, non deve mai rompere la statusline


def compute_worked_slots(window_start_epoch, resets_at_epoch):
    """Legge in modo incrementale le sessioni Claude Code (~/.claude/projects/*/*.jsonl) e
    determina quali slot (giorno+fascia) hanno più di WORK_THRESHOLD_MINUTES minuti distinti
    di attività, usando i timestamp dei messaggi come proxy del tempo lavorato.

    Per non appesantire la statusline: rilettura throttled a WORKED_CACHE_TTL secondi, e ogni
    file viene riletto solo dal byte-offset dove si era arrivati l'ultima volta.
    """
    try:
        cache = load_worked_cache()
        now = time.time()
        if (
            now - cache.get("last_update", 0) < WORKED_CACHE_TTL
            and cache.get("last_window_start") == window_start_epoch
        ):
            return cache.get("worked", {})

        offsets = cache["offsets"]
        minutes = {k: set(v) for k, v in cache["minutes"].items()}

        day_dates = {d.isoformat() for d in all_seven_days(window_start_epoch)}
        for key in list(minutes.keys()):
            if key.split(":")[0] not in day_dates:
                del minutes[key]

        pattern = os.path.join(CLAUDE_PROJECTS_DIR, "*", "*.jsonl")
        paths = glob.glob(pattern)

        seen_paths = set()
        for path in paths:
            try:
                mtime = os.path.getmtime(path)
            except OSError:
                continue
            if mtime < window_start_epoch - 86400:
                continue
            seen_paths.add(path)

            try:
                size = os.path.getsize(path)
                start_offset = offsets.get(path, 0)
                if start_offset > size:
                    start_offset = 0  # file troncato o riscritto
                with open(path, "r") as f:
                    f.seek(start_offset)
                    new_data = f.read()
                offsets[path] = size
            except OSError:
                continue

            for line in new_data.splitlines():
                if '"timestamp"' not in line:
                    continue
                try:
                    entry = json.loads(line)
                except Exception:
                    continue
                raw_ts = entry.get("timestamp")
                if not raw_ts:
                    continue
                try:
                    dt_utc = datetime.datetime.strptime(raw_ts, "%Y-%m-%dT%H:%M:%S.%fZ")
                    dt_utc = dt_utc.replace(tzinfo=datetime.timezone.utc)
                except ValueError:
                    continue
                dt_local = dt_utc.astimezone()
                epoch = dt_local.timestamp()
                if epoch < window_start_epoch or epoch >= resets_at_epoch:
                    continue
                d_str = dt_local.date().isoformat()
                if d_str not in day_dates:
                    continue
                slot = slot_for_hour(dt_local.hour + dt_local.minute / 60)
                key = d_str + ":" + slot
                minutes.setdefault(key, set()).add(dt_local.hour * 60 + dt_local.minute)

        for path in list(offsets.keys()):
            if path not in seen_paths:
                del offsets[path]

        worked = {key: True for key, mins in minutes.items() if len(mins) > WORK_THRESHOLD_MINUTES}

        cache["offsets"] = offsets
        cache["minutes"] = {k: sorted(v) for k, v in minutes.items()}
        cache["worked"] = worked
        cache["last_update"] = now
        cache["last_window_start"] = window_start_epoch
        save_worked_cache(cache)
        return worked
    except Exception:
        return {}  # i log di lavoro sono un extra, non devono mai rompere la statusline


def build_bar(used_pct, current_index):
    filled = round(used_pct / 100 * SEGMENTS)
    filled = max(0, min(SEGMENTS, filled))
    chars = []
    for i in range(1, SEGMENTS + 1):
        char = TICK_FULL if i <= filled else TICK_EMPTY
        char = f"[{char}]" if i == current_index else f" {char} "
        chars.append(char)
    return "".join(chars)


DEBUG_LOG_FILE = os.path.join(SCRIPT_DIR, "data", "debug-writes.log")
DEBUG_LOG_MAX_LINES = 200


def log_write_source(data):
    """Traccia ogni invocazione (sessione/cwd/pid + i percentuali ricevuti) in un log
    locale a rotazione, per poter diagnosticare le percentuali che oscillano: se più
    sessioni Claude Code aperte contemporaneamente scrivono tutte su data/state.json
    (che è un unico file globale, non per-sessione), questo log rende visibile quale
    sessione ha scritto cosa e quando, invece di dover indovinare alla cieca."""
    try:
        rate_limits = data.get("rate_limits") or {}
        entry = {
            "ts": time.time(),
            "pid": os.getpid(),
            "session_id": data.get("session_id"),
            "cwd": data.get("cwd"),
            "seven_day_pct": (rate_limits.get("seven_day") or {}).get("used_percentage"),
            "five_hour_pct": (rate_limits.get("five_hour") or {}).get("used_percentage"),
            # diagnostica per il caso "n/d" persistente: rate_limits appare solo per
            # abbonati Claude.ai Pro/Max (o dietro un gateway con spend limit) e solo
            # dopo la prima risposta API della sessione (vedi doc statusline ufficiale).
            # Questi campi permettono di distinguere "chiave rate_limits assente del
            # tutto" da "presente ma vuota" da "presente con struttura diversa da
            # quella attesa", senza doverlo indovinare alla cieca.
            "has_rate_limits_key": "rate_limits" in data,
            "rate_limits_raw": rate_limits if rate_limits else None,
            "top_level_keys": sorted(data.keys()),
        }
        os.makedirs(os.path.dirname(DEBUG_LOG_FILE), exist_ok=True)
        lines = []
        if os.path.isfile(DEBUG_LOG_FILE):
            with open(DEBUG_LOG_FILE) as f:
                lines = f.readlines()[-(DEBUG_LOG_MAX_LINES - 1):]
        lines.append(json.dumps(entry) + "\n")
        with open(DEBUG_LOG_FILE, "w") as f:
            f.writelines(lines)
    except Exception:
        pass  # diagnostica best-effort, non deve mai rompere la statusline


def write_web_state(payload):
    try:
        payload = {**payload, "script_dir": SCRIPT_DIR}
        os.makedirs(os.path.dirname(WEB_STATE_FILE), exist_ok=True)
        with open(WEB_STATE_FILE, "w") as f:
            json.dump(payload, f)
    except Exception:
        pass  # il dashboard web è un extra, non deve mai rompere la statusline


def load_web_state():
    try:
        with open(WEB_STATE_FILE) as f:
            return json.load(f)
    except Exception:
        return None


def clamp_non_decreasing(used_pct, five_hour_pct, reset_date_str, five_hour_reset_str):
    """Più sessioni Claude Code aperte in parallelo scrivono tutte sullo stesso
    data/state.json globale (nessun modo per avere uno stato per-sessione, vedi
    todolist), e ciascuna riceve dall'API un proprio snapshot di rate_limits che può
    differire leggermente da quello delle altre sessioni allo stesso istante — "l'ultima
    che scrive vince" produceva un bounce visibile (es. 94% poi 71% poi 94% in pochi
    secondi). Finché la finestra di reset non cambia, l'uso reale non può calare: se il
    valore appena ricevuto è più basso di quello già scritto per la STESSA finestra,
    teniamo il valore più alto invece di sovrascrivere verso il basso."""
    prev = load_web_state()
    if not prev or prev.get("status") != "ok":
        return used_pct, five_hour_pct
    if (
        used_pct is not None
        and prev.get("used_pct") is not None
        and prev.get("reset_date") == reset_date_str
        and used_pct < prev["used_pct"]
    ):
        used_pct = prev["used_pct"]
    if (
        five_hour_pct is not None
        and prev.get("five_hour_pct") is not None
        and prev.get("five_hour_reset_date") == five_hour_reset_str
        and five_hour_pct < prev["five_hour_pct"]
    ):
        five_hour_pct = prev["five_hour_pct"]
    return used_pct, five_hour_pct


def load_display_config():
    try:
        with open(DISPLAY_CONFIG_FILE) as f:
            return json.load(f)
    except Exception:
        return {"mode": "bar", "original_command": None}


def emit_terminal_output(default_text, raw_stdin):
    """Stampa la riga per il terminale: la barra di claude-monitor, oppure — se l'utente ha
    scelto di preservare il proprio statusLine precedente (vedi install-statusline.py) — l'output
    di quel comando originale, invariato. In entrambi i casi data/state.json è già stato scritto
    da write_web_state() prima di questa chiamata, quindi il dashboard riceve sempre i dati
    indipendentemente da cosa viene mostrato nel terminale."""
    config = load_display_config()
    if config.get("mode") == "passthrough" and config.get("original_command"):
        try:
            result = subprocess.run(
                config["original_command"], shell=True, input=raw_stdin,
                capture_output=True, text=True, timeout=5,
            )
            if result.returncode == 0:
                sys.stdout.write(result.stdout)
                return
        except Exception:
            pass  # comando originale non eseguibile/fallito: ripiega sulla barra qui sotto
    print(default_text)


def main():
    try:
        raw_input = sys.stdin.read()
        data = json.loads(raw_input)
    except Exception:
        print("claude-monitor: no input")
        return

    log_write_source(data)

    model = data.get("model", {}).get("display_name", "?")
    rate_limits = data.get("rate_limits") or {}
    seven_day = rate_limits.get("seven_day")
    five_hour = rate_limits.get("five_hour") or {}
    five_hour_pct = five_hour.get("used_percentage")
    five_hour_resets_at = five_hour.get("resets_at")

    if not seven_day:
        write_web_state({"status": "n/d", "model": model, "updated_at": time.time()})
        emit_terminal_output(f"[{model}] limite settimanale: n/d", raw_input)
        return

    used_pct = seven_day.get("used_percentage", 0)
    resets_at = seven_day.get("resets_at")

    if not resets_at:
        write_web_state({
            "status": "no_reset_info",
            "model": model,
            "used_pct": used_pct,
            "five_hour_pct": five_hour_pct,
            "five_hour_resets_at": five_hour_resets_at,
            "updated_at": time.time(),
        })
        emit_terminal_output(f"[{model}] {used_pct:.0f}% (7gg)", raw_input)
        return

    window_start = resets_at - 7 * 86400
    days = calendar_segments(window_start)  # 6 date, domenica esclusa
    today = datetime.date.today()

    current_index = None
    for i, d in enumerate(days, start=1):
        if d == today:
            current_index = i
            break

    day_labels = [WEEKDAY_LETTERS[d.weekday()] for d in days]

    reset_date_str = time.strftime("%d/%m/%Y %H:%M", time.localtime(resets_at))
    five_hour_reset_str = (
        time.strftime("%d/%m/%Y %H:%M", time.localtime(five_hour_resets_at)) if five_hour_resets_at else None
    )
    used_pct, five_hour_pct = clamp_non_decreasing(used_pct, five_hour_pct, reset_date_str, five_hour_reset_str)

    bar = build_bar(used_pct, current_index)

    target_pct = (current_index or 0) * DAILY_QUOTA_PCT
    over_pace = current_index is not None and used_pct > target_pct
    color = RED if over_pace else GREEN
    pace_msg = (
        f" ⚠ sopra limite (obiettivo oggi {target_pct:.0f}%)" if over_pace
        else f" ✓ sotto limite (obiettivo oggi {target_pct:.0f}%)" if current_index is not None
        else ""
    )

    now = datetime.datetime.now()
    day_fraction = (now.hour * 3600 + now.minute * 60 + now.second) / 86400

    five_hour_line = (
        f" · 5h {five_hour_pct:.0f}% (reset {five_hour_reset_str})"
        if five_hour_pct is not None and five_hour_reset_str
        else ""
    )

    tacca_str = f"tacca {current_index}/{SEGMENTS}" if current_index else "oggi è riposo (domenica)"

    worked_slots = compute_worked_slots(window_start, resets_at)

    bar_text = (
        f"{CYAN}[{model}]{RESET} {bar} "
        f"{color}{used_pct:.0f}%{RESET} "
        f"({tacca_str}, quota {DAILY_QUOTA_PCT:.0f}%/g, reset {reset_date_str}){pace_msg}{five_hour_line}"
    )

    write_web_state({
        # nota: day_labels/segments/current_index/daily_quota_pct/over_pace/day_fraction
        # servivano alla vecchia barra a tacche settimanale, sostituita dal calendario di
        # pianificazione: non sono più letti dal frontend, tenuti solo per l'output terminale.
        "status": "ok",
        "model": model,
        "used_pct": used_pct,
        "target_pct": target_pct,
        "reset_date": reset_date_str,
        "five_hour_pct": five_hour_pct,
        "five_hour_reset_date": five_hour_reset_str,
        "worked_slots": worked_slots,
        "updated_at": time.time(),
    })

    emit_terminal_output(bar_text, raw_input)


if __name__ == "__main__":
    main()
