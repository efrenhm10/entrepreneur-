// Boot.
(function () {
  try {
    const t = localStorage.getItem('mainstreet_theme');
    if (t) document.documentElement.dataset.theme = t;
  } catch (e) { /* storage unavailable */ }
  G.ui.boot();
})();
