const FLOURISH_GIFS = [
  '1000161066 (3).gif',
  '1000161066 (4).gif',
  '1000161066-1 (1).gif',
  '1000161066-1 (2).gif',
  '1000161066-1 (3).gif',
  '1000161066-1 (5).gif',
  '1000161066-1 (6).gif',
  '1000161066-1 (8).gif',
  '1000161066-1 (9).gif',
  '1000161066-2 (1).gif',
  '1000161066-3.gif',
  '1000161066.gif',
  '26de614b-b6c2-4087-a3fd-351d047eeea1-1_all_104226-1.gif',
  '26de614b-b6c2-4087-a3fd-351d047eeea1-1_all_104226-2.gif'
].map((name) => `./${encodeURI(name)}`);

const FLOURISH_DURATION = 1400;

function randomIndexExcluding(max, exclude) {
  if (max <= 1) return 0;
  let next = Math.floor(Math.random() * max);
  if (next === exclude) {
    next = (next + 1) % max;
  }
  return next;
}

function setupLogoFlourish() {
  const logo = document.querySelector('[data-logo-flourish]');
  const flourishLayer = logo?.querySelector('[data-logo-flourish-layer]');

  if (!logo || !flourishLayer) {
    return;
  }

  let flourishTimeout = null;
  let lastIndex = -1;

  const triggerFlourish = () => {
    const nextIndex = randomIndexExcluding(FLOURISH_GIFS.length, lastIndex);
    lastIndex = nextIndex;
    flourishLayer.style.setProperty('--flourish-image', `url("${FLOURISH_GIFS[nextIndex]}")`);
    logo.classList.add('is-flourishing');

    if (flourishTimeout) {
      clearTimeout(flourishTimeout);
    }

    flourishTimeout = setTimeout(() => {
      logo.classList.remove('is-flourishing');
    }, FLOURISH_DURATION);
  };

  const clearFlourish = () => {
    if (flourishTimeout) {
      clearTimeout(flourishTimeout);
      flourishTimeout = null;
    }
    logo.classList.remove('is-flourishing');
  };

  logo.addEventListener('pointerenter', triggerFlourish);
  logo.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    triggerFlourish();
  });
  logo.addEventListener('pointerleave', clearFlourish);
  logo.addEventListener('pointercancel', clearFlourish);
  logo.addEventListener('blur', clearFlourish);
  logo.addEventListener('keydown', (event) => {
    if (event.key === ' ') {
      event.preventDefault();
    }
  });
  logo.addEventListener('keyup', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      triggerFlourish();
    }
  });
}

function setupIntroScroll() {
  const introSection = document.querySelector('#hero-intro');
  const veil = introSection?.querySelector('[data-intro-veil]');
  const inner = introSection?.querySelector('.hero-intro__inner');
  const mask = introSection?.querySelector('.hero-intro__mask');

  if (!introSection || !veil || !inner || !mask) {
    return;
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (prefersReducedMotion.matches || !window.gsap || !window.ScrollTrigger) {
    introSection.classList.add('hero-intro--static');
    veil.style.opacity = '0';
    return;
  }

  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  gsap.set(introSection, { autoAlpha: 1 });
  gsap.set(veil, { opacity: 1 });
  gsap.set(inner, { opacity: 1 });
  gsap.set(mask, { transformOrigin: '50% 50%' });

  const timeline = gsap.timeline({
    defaults: { ease: 'power2.out' },
    scrollTrigger: {
      trigger: introSection,
      start: 'top top',
      end: '+=160%',
      scrub: true,
      pin: true,
      anticipatePin: 1,
      onLeave: () => introSection.classList.add('is-passed'),
      onEnterBack: () => introSection.classList.remove('is-passed'),
    },
  });

  timeline
    .to(mask, { scale: 1.08, duration: 1.2, ease: 'power1.out' }, 0)
    .to(veil, { opacity: 0.1, duration: 0.8, ease: 'none' }, 0)
    .to(inner, { yPercent: -12, duration: 0.9 }, 0.25)
    .to(inner, { autoAlpha: 0, yPercent: -36, duration: 0.7, ease: 'power2.in' }, 0.85)
    .to(veil, { opacity: 0, duration: 0.6, ease: 'power2.inOut' }, 0.85)
    .to(introSection, { autoAlpha: 0, duration: 0.45, ease: 'power2.in' }, 1.05);

  ScrollTrigger.refresh();
}

function initHeroIntro() {
  setupLogoFlourish();
  setupIntroScroll();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHeroIntro);
} else {
  initHeroIntro();
}
