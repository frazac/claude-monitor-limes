# Claude Monitor Limes

*[Italian version] [Leggi questo testo in lingua italiana.](README.it.md)*

A small local dashboard that tracks your Claude Code usage against Anthropic's weekly
and 5-hour rate limits, and lets you plan your work slots around them.

## How it works

Claude Code exposes rate-limit usage (`five_hour` / `seven_day` percentages) only
through its **statusline hook** — there is no separate API or CLI command to query it
on demand. `statusline.py` is designed to be that hook: every time Claude Code
re-renders its statusline (on a new response, on session start, or every
`refreshInterval` seconds while idle), it receives the current rate-limit data on
stdin, prints a compact status line for the terminal, and writes a snapshot to
`data/state.json`. The web dashboard (`index.html`) just reads that file and displays
it — it never talks to Claude Code or Anthropic directly.

**Limitation, inherent to how Claude Code works, not a bug in this project:** the file
only updates while at least one interactive Claude Code session is open. If every
terminal is closed, the last known percentages go stale. The dashboard makes this
visible instead of silently showing an outdated number: a red banner at the top reads
"Stream not connected" whenever there's no data yet or the data is more than 20
minutes old, with the exact command to fix it; it turns green ("Stream connected")
as soon as fresh data comes in.

**Three requirements for the data to arrive** (from the official status line docs:
`rate_limits` is only sent to Claude.ai Pro/Max subscribers, and only after the first
API response in the session):

1. the session must be the **terminal** `claude` — Claude desktop app sessions don't
   run the status line command;
2. that `claude` must be **logged in** with your Pro/Max account (check with
   `claude auth status`; if `"loggedIn": false`, run `claude` then `/login`);
3. at least **one message** must have been sent in that session.

If the hook runs but one of 2–3 is missing, the banner says "Stream connected, but no
usage data" instead of asking you to reinstall.

**Test bench:** `python3 tests/bench_statusline.py` runs the automated tests in an
isolated sandbox; `python3 tests/bench_statusline.py --diagnose` checks the real setup
on this machine (read-only) and tells you which of the requirements above is missing.

## Setup

**Quick start:** run `python3 wizard.py` from this folder. It's a bilingual (IT/EN)
wrapper around the three steps below — it runs them in order, explains each one before
it starts, and can start the local server and open the dashboard for you at the end.
Nothing is skipped or hidden: read on for what each step actually does, or to run them
by hand instead.

1. **Wire up the data source.** Run `python3 install-statusline.py` from this folder.
   It edits your `~/.claude/settings.json` so Claude Code's `statusLine` hook points
   at `statusline.py` — that's the only way to receive usage data (see "How it works"
   above), so this step is mandatory. It backs up your previous settings file first,
   and asks for confirmation before replacing an existing `statusLine` command, so
   it's safe to run even if you already had one configured.

   It will then ask a **separate** question: what should your terminal show? By
   default (just press Enter) it keeps showing exactly what it showed before —
   `statusline.py` runs your previous command behind the scenes and prints its output
   unchanged, while still writing `data/state.json` for the dashboard. Answer `2` if
   you'd rather see claude-monitor's usage bar in the terminal instead. This choice is
   saved in `data/display-config.json` and can be changed any time by re-running the
   script.
2. **Open the dashboard in a browser.** `index.html` is a static file, but browsers
   block it from loading `data/state.json` correctly when opened directly (`file://`),
   so it needs to be served over HTTP. Two ways to do that:
   - **You already run a local/personal web server** (e.g. MAMP, XAMPP, `nginx`,
     VS Code's Live Server extension): point it at this folder and open the URL it
     gives you.
   - **You don't have one set up**: Python already includes a minimal one. From this
     folder, run:
     ```
     python3 -m http.server 8931 --bind 127.0.0.1
     ```
     then open `http://localhost:8931/` in your browser. Leave that terminal running
     for as long as you want to use the dashboard; press `Ctrl+C` there to stop it.
     `--bind 127.0.0.1` matters: without it, Python's server listens on every network
     interface, so anyone else on the same Wi-Fi/LAN could open the dashboard (and your
     usage data) too.
3. **Keep a Claude Code session open.** The dashboard only shows live numbers while
   at least one interactive Claude Code terminal is open — see "How it works" above.
   It refreshes on its own every 15 seconds while idle, and immediately after every
   response.

## Customizing the day slots

By default the calendar splits each day into 3 fixed slots (morning/afternoon/evening,
uneven hours meant to match a typical day) with 4 themed boundary icons (coffee, apple,
pizza, bed), 7 days shown.

You can customize the slot boundaries — including slots of different lengths from each
other, e.g. a longer overnight slot — and the number of days shown (1-7), two ways:

**From the dashboard**: click the round button next to the calendar grid to open the
customize panel. Set the number of days and the list of hour boundaries (add/remove
rows as needed), then click "Generate command" — it builds a
`python3 configure-slots.py --apply '<json>'` command for you to copy and run once in a
terminal, inside the project folder. Boundary icons are always assigned automatically
based on their hour (no manual picker yet).

**From a terminal**, interactively:

```
python3 configure-slots.py
```

It asks for the start/end hour of your active day, how many equal-length slots to split
it into, and how many days to show, and writes `data/slot-config.json` — read by
**both** the web dashboard and `statusline.py`, so they always agree on the same slot
definitions (this file doesn't exist until you run the script or apply a command from
the panel; without it, the default 3-slot/7-day preset is unchanged). Boundary icons
beyond the original 4 are pulled from a larger default pool (edit
`DEFAULT_BOUNDARY_ICON_POOL` in `js/app.js` to use your own). Run
`python3 configure-slots.py --reset` to go back to the default preset at any time.

**Note:** changing the slots/days changes the format of the keys your plan is saved
under in the browser — a plan saved under one configuration won't carry over to a
different one (it isn't deleted, just not applied until you switch back).

## Requirements

- Python 3
- Claude Code, with statusline hook support (`statusLine` in `~/.claude/settings.json`)
