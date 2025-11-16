/**
 * VIB3+ Orchestrated Card System
 * Smooth 3D tilt with VIB3+ visualizer - optimized for performance
 * © 2025 Clear Seas Solutions
 */

(function() {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  if (prefersReducedMotion || isTouchDevice) {
    console.log('VIB3+ cards disabled (reduced motion or touch device)');
    return;
  }

  // Wait for GSAP
  function waitForGSAP(callback) {
    const checkInterval = setInterval(() => {
      if (typeof gsap !== 'undefined') {
        clearInterval(checkInterval);
        callback();
      }
    }, 50);

    setTimeout(() => {
      clearInterval(checkInterval);
      console.warn('GSAP not loaded, using fallback card interactions');
      initFallback();
    }, 5000);
  }

  waitForGSAP(initVIB3Cards);

  // ===== VIB3+ VISUALIZATION SYSTEM =====
  let vib3Container = null;
  let vib3Frame = null;
  let activeCard = null;
  let currentTween = null;

  const CONFIG = {
    tiltStrength: 12,
    floatDistance: 20,
    glowIntensity: 35,
    vib3Opacity: 0.3,
    vib3Scale: 0.45,
  };

  function initVIB3Cards() {
    console.log('🎴 VIB3+ CARDS: Starting initialization...');
    console.log('🎴 VIB3+ CARDS: GSAP available =', typeof gsap);

    // Create VIB3+ container (reusable)
    createVIB3Container();

    // Select all interactive cards
    const cards = document.querySelectorAll(
      '.signal-card, .capability-card, .platform-card, .research-lab, .step'
    );

    cards.forEach(card => {
      // Mouse enter
      card.addEventListener('mouseenter', function() {
        handleCardEnter(this);
      });

      // Mouse move (throttled with RAF)
      let rafId = null;
      card.addEventListener('mousemove', function(e) {
        if (activeCard !== this) return;

        if (rafId) return; // Already processing

        rafId = requestAnimationFrame(() => {
          handleCardMove(this, e);
          rafId = null;
        });
      });

      // Mouse leave
      card.addEventListener('mouseleave', function() {
        handleCardLeave(this);
      });
    });

    console.log('✨ VIB3+ CARDS: Complete! Listening to', cards.length, 'cards');
    console.log('✨ VIB3+ CARDS: Container created =', !!vib3Container);
  }

  function createVIB3Container() {
    if (vib3Container) return;

    vib3Container = document.createElement('div');
    vib3Container.className = 'vib3-viz-container';
    vib3Container.style.cssText = `
      position: fixed;
      pointer-events: none;
      width: 500px;
      height: 500px;
      opacity: 0;
      z-index: 5;
      filter: blur(1.5px);
      mix-blend-mode: screen;
      will-change: opacity, transform;
    `;

    // Create iframe
    vib3Frame = document.createElement('iframe');
    vib3Frame.style.cssText = `
      width: 1000px;
      height: 1000px;
      transform: scale(${CONFIG.vib3Scale}) translate(-50%, -50%);
      transform-origin: top left;
      border: none;
      background: transparent;
    `;

    vib3Container.appendChild(vib3Frame);
    document.body.appendChild(vib3Container);
  }

  function handleCardEnter(card) {
    activeCard = card;

    // Randomize VIB3+ engine
    const geometries = ['tesseract', '24-cell', '600-cell', '120-cell', '16-cell', '5-cell'];
    const randomGeo = geometries[Math.floor(Math.random() * geometries.length)];
    const randomHue = Math.floor(Math.random() * 360);
    const randomIntensity = (0.5 + Math.random() * 0.5).toFixed(2);

    vib3Frame.src = `https://domusgpt.github.io/vib3-plus-engine/?geo=${randomGeo}&hue=${randomHue}&intensity=${randomIntensity}&auto=1&shimmer=1`;

    // Fade in VIB3+ container
    gsap.to(vib3Container, {
      opacity: CONFIG.vib3Opacity,
      duration: 0.4,
      ease: 'power2.out'
    });
  }

  function handleCardMove(card, e) {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const deltaX = x - centerX;
    const deltaY = y - centerY;

    const rotateX = -(deltaY / centerY) * CONFIG.tiltStrength;
    const rotateY = (deltaX / centerX) * CONFIG.tiltStrength;

    // Apply card transform with GSAP
    if (currentTween) currentTween.kill();

    currentTween = gsap.to(card, {
      rotationX: rotateX,
      rotationY: rotateY,
      y: -CONFIG.floatDistance,
      z: CONFIG.floatDistance,
      scale: 1.05,
      duration: 0.5,
      ease: 'power2.out',
      transformPerspective: 1000,
      transformStyle: 'preserve-3d'
    });

    // Dynamic glow
    const glowStrength = Math.abs(rotateX) + Math.abs(rotateY);
    const glowColor = card.classList.contains('signal-card') || card.classList.contains('platform-card')
      ? '0, 212, 255'
      : '192, 132, 252';

    gsap.to(card, {
      boxShadow: `
        0 ${CONFIG.floatDistance * 2}px ${CONFIG.glowIntensity + glowStrength * 1.5}px rgba(0, 0, 0, 0.5),
        0 0 ${CONFIG.glowIntensity}px rgba(${glowColor}, ${0.4 + glowStrength / 100}),
        0 0 ${CONFIG.glowIntensity * 0.5}px rgba(${glowColor}, ${0.6 + glowStrength / 80})
      `,
      duration: 0.3,
      ease: 'power2.out'
    });

    // Position VIB3+ viz behind card
    const left = rect.left + (rect.width / 2) - 250;
    const top = rect.top + (rect.height / 2) - 250;

    gsap.to(vib3Container, {
      left: left,
      top: top,
      duration: 0.3,
      ease: 'power2.out'
    });

    // Make VIB3+ respond to tilt
    gsap.to(vib3Frame, {
      rotationX: -rotateX * 0.5,
      rotationY: -rotateY * 0.5,
      duration: 0.4,
      ease: 'power2.out'
    });
  }

  function handleCardLeave(card) {
    if (activeCard !== card) return;

    activeCard = null;

    if (currentTween) currentTween.kill();

    // Elastic bounce back
    gsap.to(card, {
      rotationX: 0,
      rotationY: 0,
      y: 0,
      z: 0,
      scale: 1,
      duration: 0.8,
      ease: 'elastic.out(1, 0.5)'
    });

    // Reset shadow
    gsap.to(card, {
      boxShadow: '',
      duration: 0.4,
      ease: 'power2.out'
    });

    // Fade out VIB3+
    gsap.to(vib3Container, {
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in'
    });
  }

  // ===== FALLBACK FOR NO GSAP =====
  function initFallback() {
    const cards = document.querySelectorAll('.signal-card, .capability-card, .platform-card');

    cards.forEach(card => {
      card.addEventListener('mouseenter', function() {
        this.style.transition = 'transform 0.3s ease';
        this.style.transform = 'translateY(-8px) scale(1.02)';
      });

      card.addEventListener('mouseleave', function() {
        this.style.transform = '';
      });
    });
  }

})();
