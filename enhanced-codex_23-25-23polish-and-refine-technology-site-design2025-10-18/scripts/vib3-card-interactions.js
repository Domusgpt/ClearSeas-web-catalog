/**
 * VIB3+ Card Holographic Float & Tilt System
 * Interactive card bending with dynamic VIB3+ engine visualization
 * © 2025 Clear Seas Solutions
 */

(function() {
  'use strict';

  // Card level registry so every tile owns its own overlay
  const cardRegistry = new Map();
  const preparedCards = new WeakSet();
  let activeCard = null;
  let rafId = null;
  let motionEnabled = true;

  // Configuration
  const CONFIG = {
    tiltStrength: 15,        // Max tilt degrees
    floatDistance: 25,       // Max float distance in px
    glowIntensity: 40,       // Glow blur in px
    vib3Opacity: 0.35,       // VIB3+ engine opacity
    transitionSpeed: 200,    // Transition duration in ms
    vib3Scale: 0.48,         // Scale of VIB3+ iframe
    overlayParallax: 22,     // Max px overlay translation for parallax
    frameSize: 1400,         // Size of the iframe viewport for cropping
    frameFocusOffsetX: 50,   // Percentage offset to center VIB3+ focal point
    frameFocusOffsetY: 54,   // Percentage offset to center VIB3+ focal point
  };

  /**
   * Create / cache a VIB3+ overlay inside the provided card
   */
  function ensureCardOverlay(card) {
    let overlay = cardRegistry.get(card);

    if (overlay) {
      return overlay;
    }

    const computedStyle = window.getComputedStyle(card);
    const cardPosition = computedStyle.position;

    if (cardPosition === 'static') {
      card.style.position = 'relative';
    }

    const container = document.createElement('div');
    container.className = 'vib3-dynamic-viz';
    container.style.cssText = `
      position: absolute;
      inset: 0;
      pointer-events: none;
      overflow: hidden;
      border-radius: ${computedStyle.borderRadius || '24px'};
      opacity: 0;
      transition: opacity 0.4s ease-out, transform 0.4s ease-out;
      mix-blend-mode: screen;
      filter: blur(0.4px);
      z-index: 0;
    `;

    const frame = document.createElement('iframe');
    frame.src = '';
    frame.setAttribute('tabindex', '-1');
    frame.setAttribute('aria-hidden', 'true');
    frame.setAttribute('loading', 'lazy');
    frame.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: ${CONFIG.frameSize}px;
      height: ${CONFIG.frameSize}px;
      transform: translate(-${CONFIG.frameFocusOffsetX}%, -${CONFIG.frameFocusOffsetY}%) scale(${CONFIG.vib3Scale});
      transform-origin: 50% 50%;
      border: none;
      background: transparent;
      pointer-events: none;
    `;

    container.appendChild(frame);
    card.insertBefore(container, card.firstChild);

    overlay = { container, frame };
    cardRegistry.set(card, overlay);

    return overlay;
  }

  /**
   * Calculate card tilt based on mouse position
   */
  function calculateTilt(card, e) {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const deltaX = x - centerX;
    const deltaY = y - centerY;

    const tiltX = -(deltaY / centerY) * CONFIG.tiltStrength;
    const tiltY = (deltaX / centerX) * CONFIG.tiltStrength;

    return { tiltX, tiltY, deltaX, deltaY, centerX, centerY };
  }

  /**
   * Apply holographic float and tilt to card
   */
  function applyCardTransform(card, tilt) {
    const { tiltX, tiltY } = tilt;
    const scale = 1.05;
    const translateZ = CONFIG.floatDistance;

    card.style.transform = `
      perspective(1000px)
      translateY(-${translateZ}px)
      translateZ(${translateZ}px)
      rotateX(${tiltX}deg)
      rotateY(${tiltY}deg)
      scale(${scale})
    `;

    // Add glow based on tilt intensity
    const glowStrength = Math.abs(tiltX) + Math.abs(tiltY);
    const glowColor = card.classList.contains('signal-card') || card.classList.contains('platform-card')
      ? '0, 212, 255'
      : '192, 132, 252';

    card.style.boxShadow = `
      0 ${CONFIG.floatDistance * 1.5}px ${CONFIG.glowIntensity + glowStrength}px rgba(0, 0, 0, 0.4),
      0 0 ${CONFIG.glowIntensity}px rgba(${glowColor}, ${0.3 + (glowStrength / 100)})
    `;
  }

  /**
   * Position VIB3+ visualization behind card
   */
  function positionVib3Visual(card, tilt) {
    const overlay = cardRegistry.get(card);

    if (!overlay) return;

    const { tiltX, tiltY, deltaX, deltaY, centerX, centerY } = tilt;
    const { container, frame } = overlay;

    const parallaxX = (deltaX / centerX) * CONFIG.overlayParallax;
    const parallaxY = (deltaY / centerY) * CONFIG.overlayParallax;

    container.style.transform = `translate3d(${parallaxX}px, ${parallaxY}px, 0)`;

    frame.style.transform = `
      translate(-${CONFIG.frameFocusOffsetX}%, -${CONFIG.frameFocusOffsetY}%)
      scale(${CONFIG.vib3Scale})
      rotateX(${-tiltX * 0.4}deg)
      rotateY(${tiltY * 0.4}deg)
    `;

    container.style.opacity = CONFIG.vib3Opacity;
  }

  /**
   * Handle card mouse enter
   */
  function handleCardEnter(card) {
    if (!motionEnabled) return;

    activeCard = card;
    card.style.transition = `transform ${CONFIG.transitionSpeed}ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow ${CONFIG.transitionSpeed}ms ease`;
    card.style.transformStyle = 'preserve-3d';
    card.style.willChange = 'transform';

    const overlay = ensureCardOverlay(card);

    // Randomize VIB3+ engine on each hover
    const randomGeometry = ['tesseract', '24-cell', '600-cell', '120-cell', '16-cell', '5-cell'][Math.floor(Math.random() * 6)];
    const randomHue = Math.floor(Math.random() * 360);
    const randomIntensity = 0.6 + (Math.random() * 0.4);

    overlay.frame.src = `https://domusgpt.github.io/vib3-plus-engine/?geo=${randomGeometry}&hue=${randomHue}&intensity=${randomIntensity}&auto=1&shimmer=1`;
    overlay.container.style.opacity = CONFIG.vib3Opacity;
    overlay.container.style.transform = 'translate3d(0, 0, 0)';
  }

  /**
   * Handle card mouse move
   */
  function handleCardMove(card, e) {
    if (activeCard !== card) return;

    if (rafId) {
      cancelAnimationFrame(rafId);
    }

    rafId = requestAnimationFrame(() => {
      const tilt = calculateTilt(card, e);
      applyCardTransform(card, tilt);
      positionVib3Visual(card, tilt);
    });
  }

  /**
   * Handle card mouse leave
   */
  function handleCardLeave(card) {
    if (activeCard !== card) return;

    activeCard = null;

    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    card.style.transform = '';
    card.style.boxShadow = '';
    card.style.willChange = 'auto';

    const overlay = cardRegistry.get(card);

    if (overlay) {
      overlay.container.style.opacity = '0';
      overlay.container.style.transform = 'translate3d(0, 0, 0)';
      overlay.frame.style.transform = `
        translate(-${CONFIG.frameFocusOffsetX}%, -${CONFIG.frameFocusOffsetY}%)
        scale(${CONFIG.vib3Scale})
      `;
    }
  }

  /**
   * Attach listeners to all interactive cards
   */
  function attachCardListeners() {
    const selectors = [
      '.signal-card.vcodex-neoskeu-card',
      '.capability-card.vcodex-neoskeu-card',
      '.platform-card.vcodex-neoskeu-card',
      '.research-lab.vcodex-neoskeu-card',
      '.step.vcodex-neoskeu-card',
      '.legacy-signal.vcodex-neoskeu-card'
    ];

    selectors.forEach(selector => {
      const cards = document.querySelectorAll(selector);

      cards.forEach(card => {
        if (!cardRegistry.has(card)) {
          ensureCardOverlay(card);
        }

        if (preparedCards.has(card)) return;

        card.addEventListener('mouseenter', () => handleCardEnter(card));

        card.addEventListener('mousemove', (e) => handleCardMove(card, e));

        card.addEventListener('mouseleave', () => handleCardLeave(card));

        preparedCards.add(card);
      });
    });
  }

  /**
   * Initialize on DOM ready
   */
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attachCardListeners);
    } else {
      attachCardListeners();
    }
  }

  /**
   * Respect reduced motion preference
   */
  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (!reduceMotionQuery.matches) {
    motionEnabled = true;
    init();
  } else {
    motionEnabled = false;
  }

  function teardownOverlays() {
    cardRegistry.forEach(({ container }) => {
      if (container.parentElement) {
        container.parentElement.removeChild(container);
      }
    });
    cardRegistry.clear();
  }

  // Listen for changes in motion preference
  reduceMotionQuery.addEventListener('change', (e) => {
    motionEnabled = !e.matches;

    if (motionEnabled) {
      init();
      return;
    }

    activeCard = null;

    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    teardownOverlays();
  });

})();

/**
 * © 2025 Clear Seas Solutions LLC
 * "The Revolution Will Not be in a Structured Format"
 */
