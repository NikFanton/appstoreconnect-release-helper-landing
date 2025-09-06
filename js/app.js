// Smooth scroll for internal anchors (respects prefers-reduced-motion)
(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isSamePage = (href) => href && href.startsWith('#') && href.length > 1;

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const { href } = link;
    const id = link.getAttribute('href');
    if (!isSamePage(id)) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    // Improve accessibility by moving focus
    const prevTabIndex = target.getAttribute('tabindex');
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    if (prevTabIndex === null) target.removeAttribute('tabindex');
  });
})();

// Reveal-on-scroll using IntersectionObserver
(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;
  if (reduceMotion || !('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
  items.forEach(el => io.observe(el));
})();

// Sticky header shadow after small scroll
(function () {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const toggle = () => {
    if (window.scrollY > 10) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };
  toggle();
  window.addEventListener('scroll', toggle, { passive: true });
})();

// Set canonical and og:url to current URL (avoids placeholder when deployed)
(function () {
  try {
    const canonical = document.getElementById('canonical-link');
    const url = location.origin + location.pathname;
    if (canonical) canonical.setAttribute('href', url);
    const og = document.querySelector('meta[property="og:url"]');
    if (og) og.setAttribute('content', url);
  } catch (_) {}
})();

// Waitlist form handling (hidden iframe submit + basic validation)
(function () {
  const form = document.getElementById('wl');
  if (!form) return;
  const email = document.getElementById('email');
  const submitBtn = document.getElementById('wl-submit');
  const source = document.getElementById('source');
  const msg = document.getElementById('msg');
  const iframe = document.getElementById('hidden_iframe');
  const success = document.getElementById('wl-success');
  let submitted = false;

  // Set source meta
  if (source) {
    try {
      source.value = (location.hostname || '') + (location.pathname || '');
    } catch (_) {}
  }

  form.addEventListener('submit', (e) => {
    // HTML5 validation first
    if (!email || !email.value || email.value.indexOf('@') === -1) {
      e.preventDefault();
      if (email) email.focus();
      alert('Please enter a valid email.');
      return;
    }
    submitted = true;
    if (msg) msg.textContent = 'Submitting…';
    if (submitBtn) { submitBtn.disabled = true; submitBtn.setAttribute('aria-disabled', 'true'); submitBtn.textContent = 'Submitting…'; }
  });

  if (iframe) {
    iframe.addEventListener('load', () => {
      if (!submitted) return;
      submitted = false;
      try { form.reset(); } catch (_) {}
      // Hide form; show success panel
      form.setAttribute('hidden', '');
      if (success) {
        success.hidden = false;
        const title = document.getElementById('wl-success-title');
        if (title) title.setAttribute('tabindex', '-1');
        if (title) title.focus({ preventScroll: true });
      }
    });
  }
})();
