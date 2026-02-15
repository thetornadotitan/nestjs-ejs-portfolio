(() => {
  const root = document.documentElement;

  // ---------- Theme ----------
  const THEME_KEY = 'theme'; // 'dark' | 'light'
  const mql = window.matchMedia?.('(prefers-color-scheme: dark)');

  const getSavedTheme = () => localStorage.getItem(THEME_KEY);
  const getSystemTheme = () => (mql?.matches ? 'dark' : 'light');

  const applyTheme = (theme) => {
    root.classList.toggle('dark', theme === 'dark');
    syncThemeIcon();
  };

  const syncThemeIcon = () => {
    const isDark = root.classList.contains('dark');
    const sun = document.getElementById('themeIconSun');
    const moon = document.getElementById('themeIconMoon');
    if (!sun || !moon) return;

    // If currently dark -> show sun (meaning "switch to light")
    sun.classList.toggle('hidden', isDark);
    moon.classList.toggle('hidden', !isDark);
  };

  const initTheme = () => {
    const saved = getSavedTheme();
    applyTheme(saved ?? getSystemTheme());

    // If user hasn't chosen explicitly, follow system changes
    mql?.addEventListener('change', () => {
      if (getSavedTheme()) return;
      applyTheme(getSystemTheme());
    });

    const btn = document.getElementById('themeToggle');
    btn?.addEventListener('click', () => {
      const next = root.classList.contains('dark') ? 'light' : 'dark';
      localStorage.setItem(THEME_KEY, next);
      applyTheme(next);
    });
  };

  // ---------- Mobile Menu ----------
  const initMobileMenu = () => {
    const btn = document.getElementById('mobileMenuButton');
    const menu = document.getElementById('mobileMenu');
    if (!btn || !menu) return;

    const setOpen = (open) => {
      menu.classList.toggle('hidden', !open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    };

    setOpen(false);

    btn.addEventListener('click', () => {
      const open = menu.classList.contains('hidden');
      setOpen(open);
    });

    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && !btn.contains(e.target)) setOpen(false);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setOpen(false);
    });

    menu
      .querySelectorAll('a')
      .forEach((a) => a.addEventListener('click', () => setOpen(false)));
  };

  // ---------- Boot ----------
  window.addEventListener('DOMContentLoaded', () => {
    root.classList.remove('preload');
    initTheme();
    initMobileMenu();
  });
})();
