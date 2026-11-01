(() => {
  const nodes = [...document.querySelectorAll('[data-en]')];
  nodes.forEach(node => { node.dataset.zh = node.textContent; });
  const languageLinks = {
    zh: document.getElementById('language-zh'),
    en: document.getElementById('language-en')
  };
  const attributeTranslations = [];
  ['aria-label', 'alt', 'content'].forEach(attribute => {
    document.querySelectorAll(`[data-en-${attribute}]`).forEach(node => {
      attributeTranslations.push({ node, attribute,
        zh: node.getAttribute(attribute), en: node.getAttribute(`data-en-${attribute}`) });
    });
  });
  const themeButton = document.getElementById('theme-toggle');
  let language = 'en';
  let theme = 'light';
  try {
    theme = localStorage.getItem('xz-theme') === 'dark' ? 'dark' : 'light';
  } catch {}
  const requestedLanguage = new URL(window.location.href).searchParams.get('lang');
  if (requestedLanguage === 'zh' || requestedLanguage === 'en') language = requestedLanguage;
  function updateThemeLabel() {
    themeButton.setAttribute('aria-label', language === 'en'
      ? (theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme')
      : (theme === 'dark' ? '切换浅色模式' : '切换深色模式'));
  }
  function setLanguage(value) {
    language = value;
    document.documentElement.lang = value === 'en' ? 'en' : 'zh-CN';
    nodes.forEach(node => { node.textContent = node.dataset[value]; });
    attributeTranslations.forEach(item => item.node.setAttribute(item.attribute, item[value]));
    document.title = value === 'en'
      ? 'Xianchao Zeng | Robot Learning'
      : '曾宪超 | 机器人学习';
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('lang', value);
    try { history.replaceState(null, '', currentUrl); } catch {}
    Object.entries(languageLinks).forEach(([locale, link]) => {
      const targetUrl = new URL(currentUrl);
      targetUrl.searchParams.set('lang', locale);
      link.href = targetUrl.pathname + targetUrl.search + targetUrl.hash;
      if (locale === value) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    updateThemeLabel();
  }
  function setTheme(value) {
    theme = value;
    document.documentElement.dataset.theme = value;
    document.querySelector('meta[name="theme-color"]').content = value === 'dark' ? '#1b1e21' : '#ffffff';
    themeButton.setAttribute('aria-pressed', String(value === 'dark'));
    updateThemeLabel();
    try { localStorage.setItem('xz-theme', value); } catch {}
  }
  Object.entries(languageLinks).forEach(([locale, link]) => {
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      setLanguage(locale);
    });
  });
  themeButton.addEventListener('click', () => setTheme(theme === 'dark' ? 'light' : 'dark'));
  setLanguage(language);
  setTheme(theme);

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const videoStates = new Map();
  function reconcileVideo(state) {
    const wantsPlay = !reducedMotion.matches;
    if (state.inView && !document.hidden && wantsPlay) {
      state.video.play().catch(() => {});
    } else {
      state.video.pause();
    }
  }
  document.querySelectorAll('.paper-video').forEach(video => {
    const state = { video, inView: false };
    video.muted = true;
    video.pause();
    videoStates.set(video, state);
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const state = videoStates.get(entry.target);
        state.inView = entry.isIntersecting;
        reconcileVideo(state);
      });
    }, { threshold: 0.15 });
    videoStates.forEach(state => observer.observe(state.video));
  } else {
    videoStates.forEach(state => { state.inView = true; reconcileVideo(state); });
  }
  document.addEventListener('visibilitychange', () => videoStates.forEach(reconcileVideo));
  reducedMotion.addEventListener('change', () => videoStates.forEach(reconcileVideo));
})();
