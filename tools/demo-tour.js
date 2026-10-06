// Sequenza per la GIF del README, caricata solo con ?demo&tour (vedi
// tools/make-demo-gif.sh): parte dal piano di default e attiva/disattiva
// alcune caselle. Parametri: theme=light|dark, lang=it|en, step=N (applica
// subito i primi N clic, per scattare un fotogramma; senza step li anima).
(function () {
  const params = new URLSearchParams(location.search);
  const theme = params.get('theme');
  if (theme) {
    localStorage.setItem(THEME_KEY, theme);
    applyTheme();
  }
  const lang = params.get('lang');
  if (lang && lang !== LOCALE) setLocale(lang);
  localStorage.setItem(CONSENT_KEY, '1');
  document.getElementById('consent-banner').hidden = true;

  // [riga (fascia), colonna (giorno)] nell'ordine in cui vengono cliccate
  const CLICKS = [[2, 1], [0, 5], [1, 5], [1, 2], [2, 3]];
  const click = ([row, col]) => {
    const t = document.querySelectorAll('.tile')[row * DAY_COUNT + col];
    if (t) t.click();
  };

  document.getElementById('reset-plan').click();
  if (params.has('step')) {
    CLICKS.slice(0, Number(params.get('step'))).forEach(click);
    return;
  }
  CLICKS.forEach((c, i) => setTimeout(() => click(c), 1000 + i * 800));
})();
