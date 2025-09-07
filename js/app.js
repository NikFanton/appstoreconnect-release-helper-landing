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

// Position beams from English (source) to each target center
(function () {
  const canvas = document.querySelector('.flow-canvas');
  const source = document.querySelector('.source-wrap .locale-tile.source');
  const targets = Array.from(document.querySelectorAll('.targets-row .locale-tile'));
  const beams = Array.from(document.querySelectorAll('.flow-canvas .beam'));
  if (!canvas || !source || beams.length !== 3 || targets.length !== 3) return;

  const layout = () => {
    const c = canvas.getBoundingClientRect();
    const s = source.getBoundingClientRect();
    const start = {
      x: s.left - c.left + s.width / 2,
      y: s.bottom - c.top
    };
    beams.forEach((beam, idx) => {
      const t = targets[idx].getBoundingClientRect();
      const end = {
        x: t.left - c.left + t.width / 2, // target top center X
        y: t.top - c.top // target top Y
      };
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const len = Math.sqrt(dx*dx + dy*dy);
      const ang = Math.atan2(dy, dx) * 180 / Math.PI;
      beam.style.left = `${start.x}px`;
      beam.style.top = `${start.y}px`;
      beam.style.width = `${len}px`;
      beam.style.transform = `rotate(${ang}deg)`;
    });
  };
  layout();
  window.addEventListener('resize', layout);
  // Expose for other modules
  window.__layoutBeams = layout;
})();

// Rotate example locales when slider wraps (with emoji flags)
(function () {
  const codeEls = document.querySelectorAll('.targets-row .locale-tile .locale-code');
  const flagEls = document.querySelectorAll('.targets-row .locale-tile .flag');
  const connectors = document.querySelectorAll('.beam');
  if (!codeEls.length || !flagEls.length || !connectors.length) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sets = [
    [ {name: 'Spanish', flag: '🇪🇸'}, {name: 'German', flag: '🇩🇪'}, {name: 'Chinese', flag: '🇨🇳'} ],
    [ {name: 'Ukrainian', flag: '🇺🇦'}, {name: 'French', flag: '🇫🇷'}, {name: 'Japanese', flag: '🇯🇵'} ],
    [ {name: 'Dutch', flag: '🇳🇱'}, {name: 'Italian', flag: '🇮🇹'}, {name: 'Korean', flag: '🇰🇷'} ]
  ];
  let i = 0;
  const apply = () => {
    const list = sets[i % sets.length];
    codeEls.forEach((code, idx) => {
      const tile = code.closest('.locale-tile');
      const flag = flagEls[idx];
      if (tile) tile.classList.add('swap');
      code.textContent = list[idx]?.name || '';
      if (flag) flag.textContent = list[idx]?.flag || '';
      if (tile) setTimeout(() => tile.classList.remove('swap'), 180);
    });
    i++;
    if (typeof window.__layoutBeams === 'function') {
      requestAnimationFrame(window.__layoutBeams);
    }
  };
  apply();
  if (reduce) return; // respect reduced motion
  const signal = document.querySelector('.beam.mid.progress') || connectors[0];
  signal.addEventListener('animationiteration', apply);
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
