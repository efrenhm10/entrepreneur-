// Boot.
(function () {
  try {
    const t = localStorage.getItem('grassroots_theme');
    // The situation-room look is dark by default; the menu switches to light or the system setting.
    document.documentElement.dataset.theme = t == null ? 'dark' : t;
    if (!document.documentElement.dataset.theme) delete document.documentElement.dataset.theme;
  } catch (e) { /* storage unavailable */ }
  GR.ui.boot();
})();
