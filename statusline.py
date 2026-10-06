#!/usr/bin/env python3
import datetime
import glob
import json
import os
import subprocess
import sys
import time

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
WEB_STATE_FILE = os.path.join(SCRIPT_DIR, "data", "state.json")
WORKED_CACHE_FILE = os.path.join(SCRIPT_DIR, "data", "worked_cache.json")
DISPLAY_CONFIG_FILE = os.path.join(SCRIPT_DIR, "data", "display-config.json")
SLOT_CONFIG_FILE = os.path.join(SCRIPT_DIR, "data", "slot-config.json")
CLAUDE_PROJECTS_DIR = os.path.expanduser("~/.claude/projects")
WORK_THRESHOLD_MINUTES = 15  # minuti distinti di attività per considerare uno slot "lavorato"
WORKED_CACHE_TTL = 60  # secondi: non ri-scansionare i log più spesso di così
# tempo massimo di lettura dei log per chiamata: a inizio settimana la prima scansione
# completa può durare secondi, e Claude Code interrompe la statusline prima che finisca;
# così ogni chiamata legge una parte, salva gli offset e la successiva riprende da lì
WORKED_SCAN_BUDGET_S = 0.5


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
CYAN = "\033[36m"
RESET = "\033[0m"


# reset entro quest'ora: il giorno di window_start conta per intero come giorno 1;
# più tardi (es. mercoledì 23:00) il giorno 1 diventa il giorno successivo
MORNING_THRESHOLD_HOUR = 11


def all_seven_days(window_start_epoch):
    """I 7 giorni della finestra, stesso algoritmo usato lato web per il calendario di
    pianificazione (computeDisplayDays in js/app.js)."""
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


def cached_worked_slots(window_start_epoch):
    cache = load_worked_cache()
    return cache["worked"] if cache.get("last_window_start") == window_start_epoch else {}


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

        deadline = time.time() + WORKED_SCAN_BUDGET_S
        complete = True
        files_read = 0  # almeno un file per chiamata, così la scansione avanza sempre
        seen_paths = set()
        for path in paths:
            if files_read and time.time() > deadline:
                complete = False
                break
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
                if new_data:
                    files_read += 1
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

        if complete:  # a scansione interrotta i file non visti sono solo ancora da leggere
            for path in list(offsets.keys()):
                if path not in seen_paths:
                    del offsets[path]

        worked = {key: True for key, mins in minutes.items() if len(mins) > WORK_THRESHOLD_MINUTES}

        cache["offsets"] = offsets
        cache["minutes"] = {k: sorted(v) for k, v in minutes.items()}
        cache["worked"] = worked
        cache["last_update"] = now if complete else 0  # incompleta: riprende alla prossima chiamata
        cache["last_window_start"] = window_start_epoch
        save_worked_cache(cache)
        return worked
    except Exception:
        return {}  # i log di lavoro sono un extra, non devono mai rompere la statusline


def build_bar(used_pct, width=10):
    filled = max(0, min(width, round(used_pct / 100 * width)))
    return TICK_FULL * filled + TICK_EMPTY * (width - filled)


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
        # sessione senza rate_limits (CLI non loggata, o nessun messaggio ancora inviato):
        # non deve cancellare i dati validi scritti da un'altra sessione, segnala solo
        # che l'hook è vivo ma senza limiti, così il dashboard sa distinguere i due casi
        now_ts = time.time()
        prev = load_web_state()
        if prev and prev.get("status") == "ok":
            write_web_state({**prev, "hook_at": now_ts, "limits_missing": True})
        else:
            write_web_state({
                "status": "n/d", "model": model, "updated_at": now_ts,
                "hook_at": now_ts, "limits_missing": True,
            })
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
            "hook_at": time.time(),
            "limits_missing": False,
        })
        emit_terminal_output(f"[{model}] {used_pct:.0f}% (7gg)", raw_input)
        return

    window_start = resets_at - 7 * 86400

    reset_date_str = time.strftime("%d/%m/%Y %H:%M", time.localtime(resets_at))
    five_hour_reset_str = (
        time.strftime("%d/%m/%Y %H:%M", time.localtime(five_hour_resets_at)) if five_hour_resets_at else None
    )
    used_pct, five_hour_pct = clamp_non_decreasing(used_pct, five_hour_pct, reset_date_str, five_hour_reset_str)

    five_hour_line = (
        f" · 5h {five_hour_pct:.0f}% (reset {five_hour_reset_str})"
        if five_hour_pct is not None and five_hour_reset_str
        else ""
    )

    # solo percentuali grezze: obiettivi e soglie dipendono dal piano, che vive nel
    # browser (localStorage) e non è leggibile da qui — li mostra solo la dashboard
    bar_text = (
        f"{CYAN}[{model}]{RESET} {build_bar(used_pct)} {used_pct:.0f}% "
        f"(7gg, reset {reset_date_str}){five_hour_line}"
    )

    # le percentuali si scrivono subito, con gli slot lavorati già in cache: la
    # lettura dei log viene dopo, così anche se Claude Code interrompe lo script
    # la dashboard ha già i dati nuovi
    now_ts = time.time()
    # una sessione claude ferma ripete l'ultimo snapshot ricevuto (verificato il
    # 6/10/2026): updated_at avanza comunque, quindi serve sapere da quando i
    # valori non cambiano per avvisare che potrebbero essere vecchi
    prev = load_web_state() or {}
    same_values = (
        prev.get("status") == "ok"
        and (prev.get("used_pct"), prev.get("five_hour_pct"), prev.get("reset_date"), prev.get("five_hour_reset_date"))
        == (used_pct, five_hour_pct, reset_date_str, five_hour_reset_str)
    )
    state = {
        "status": "ok",
        "model": model,
        "used_pct": used_pct,
        "reset_date": reset_date_str,
        "five_hour_pct": five_hour_pct,
        "five_hour_reset_date": five_hour_reset_str,
        "values_changed_at": prev.get("values_changed_at", now_ts) if same_values else now_ts,
        "worked_slots": cached_worked_slots(window_start),
        "updated_at": now_ts,
        "hook_at": now_ts,
        "limits_missing": False,
    }
    write_web_state(state)

    worked_slots = compute_worked_slots(window_start, resets_at)
    if worked_slots != state["worked_slots"]:
        write_web_state({**state, "worked_slots": worked_slots})

    emit_terminal_output(bar_text, raw_input)


if __name__ == "__main__":
    main()
