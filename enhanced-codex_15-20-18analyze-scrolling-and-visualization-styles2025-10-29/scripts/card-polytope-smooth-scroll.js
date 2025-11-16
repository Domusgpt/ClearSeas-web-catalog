/**
 * Clear Seas Scroll Choreography Fallback
 * Provides a lightweight parallax experience when the enhanced GSAP timeline
 * is unavailable. Automatically disables itself once the enhanced choreography
 * announces readiness via the global events dispatched in
 * `scroll-choreography-phase1.js`.
 */

(function () {
  'use strict';

  if (typeof window === 'undefined') {
    return;
  }

  const documentRef = document;
  if (!documentRef || !documentRef.body) {
    return;
  }

  if (window.__CLEAR_SEAS_SCROLL_FALLBACK_ACTIVE || window.__CLEAR_SEAS_SCROLL_CHOREO_READY) {
    return;
  }

  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduceMotionQuery && reduceMotionQuery.matches) {
    return;
  }

  const heroSection = documentRef.querySelector('[data-scroll-scene="hero"]') || documentRef.querySelector('.hero');
  if (!heroSection) {
    return;
  }

  const heroCards = Array.from(heroSection.querySelectorAll('[data-visualizer-card]'));
  if (heroCards.length === 0) {
    return;
  }

  const heroText = heroSection.querySelector('.hero-text');
  const rootElement = documentRef.documentElement;
  const rootStyle = rootElement && rootElement.style;
  const trackedRootProperties = ['--hero-mask-progress', '--hero-parallax-y', '--hero-focus-gain', '--texture-opacity'];

  window.__CLEAR_SEAS_SCROLL_FALLBACK_ACTIVE = true;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const smoothstep = (t) => t * t * (3 - 2 * t);

  let rafId = null;
  let destroyed = false;

  const applyFallbackState = () => {
    rafId = null;
    if (destroyed) {
      return;
    }

    const viewportHeight = window.innerHeight || 1;
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const heroRect = heroSection.getBoundingClientRect();
    const heroTop = heroRect.top + scrollY;
    const heroHeight = heroRect.height || heroSection.offsetHeight || viewportHeight;
    const activationStart = heroTop - viewportHeight * 0.85;
    const activationEnd = heroTop + heroHeight * 0.75;
    const progress = clamp((scrollY - activationStart) / Math.max(1, activationEnd - activationStart), 0, 1);
    const eased = smoothstep(progress);

    if (rootStyle) {
      rootStyle.setProperty('--hero-mask-progress', (0.2 + eased * 0.8).toFixed(3));
      rootStyle.setProperty('--hero-parallax-y', `${((0.5 - eased) * 90).toFixed(2)}px`);
      rootStyle.setProperty('--hero-focus-gain', (eased * 0.45).toFixed(3));
      rootStyle.setProperty('--texture-opacity', (0.68 + eased * 0.22).toFixed(3));
    }

    heroCards.forEach((card, index) => {
      const offset = index - (heroCards.length - 1) / 2;
      const translateX = offset * 14 * eased;
      const translateY = offset * -22 * (1 - eased) + eased * 26;
      const rotate = offset * (6 - eased * 4);
      const scale = 1 + eased * 0.12;

      card.style.transform = `translate3d(${translateX.toFixed(2)}px, ${translateY.toFixed(2)}px, 0) scale(${scale.toFixed(3)}) rotate(${rotate.toFixed(2)}deg)`;
      card.style.opacity = (0.75 + eased * 0.25).toFixed(3);
      card.style.willChange = 'transform, opacity';
    });

    if (heroText) {
      heroText.style.opacity = (1 - eased * 0.35).toFixed(3);
      heroText.style.transform = `translateY(${(-18 * eased).toFixed(2)}px)`;
      heroText.style.willChange = 'transform, opacity';
    }
  };

  const scheduleUpdate = () => {
    if (destroyed || rafId !== null) {
      return;
    }
    rafId = window.requestAnimationFrame(applyFallbackState);
  };

  const cleanup = () => {
    if (destroyed) {
      return;
    }
    destroyed = true;

    window.removeEventListener('scroll', scheduleUpdate);
    window.removeEventListener('resize', scheduleUpdate);
    window.removeEventListener('clearseas:choreography:ready', handleEnhancedReady);
    window.removeEventListener('clearseas:choreography:teardown', handleEnhancedTeardown);

    if (reduceMotionQuery) {
      if (reduceMotionQuery.removeEventListener) {
        reduceMotionQuery.removeEventListener('change', handleReduceMotionChange);
      } else if (reduceMotionQuery.removeListener) {
        reduceMotionQuery.removeListener(handleReduceMotionChange);
      }
    }

    if (rafId !== null) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
    }

    if (rootStyle) {
      trackedRootProperties.forEach((property) => rootStyle.removeProperty(property));
    }

    heroCards.forEach((card) => {
      card.style.removeProperty('transform');
      card.style.removeProperty('opacity');
      card.style.removeProperty('will-change');
    });

    if (heroText) {
      heroText.style.removeProperty('opacity');
      heroText.style.removeProperty('transform');
      heroText.style.removeProperty('will-change');
    }

    documentRef.body.classList.remove('scroll-choreography-fallback');
    window.__CLEAR_SEAS_SCROLL_FALLBACK_ACTIVE = false;
  };

  const handleEnhancedReady = () => {
    cleanup();
  };

  const handleEnhancedTeardown = () => {
    if (!window.__CLEAR_SEAS_SCROLL_CHOREO_READY && !destroyed) {
      scheduleUpdate();
    }
  };

  const handleReduceMotionChange = (event) => {
    if (event.matches) {
      cleanup();
    }
  };

  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate, { passive: true });
  window.addEventListener('clearseas:choreography:ready', handleEnhancedReady, { once: true });
  window.addEventListener('clearseas:choreography:teardown', handleEnhancedTeardown);

  if (reduceMotionQuery) {
    if (reduceMotionQuery.addEventListener) {
      reduceMotionQuery.addEventListener('change', handleReduceMotionChange);
    } else if (reduceMotionQuery.addListener) {
      reduceMotionQuery.addListener(handleReduceMotionChange);
    }
  }

  documentRef.body.classList.add('scroll-choreography-fallback');
  scheduleUpdate();
})();
