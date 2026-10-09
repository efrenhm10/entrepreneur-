// Boot.
(function () {
  try {
    const t = localStorage.getItem('grassroots_theme');
    if (t) document.documentElement.dataset.theme = t;
  } catch (e) { /* storage unavailable */ }
  GR.ui.boot();
})();
