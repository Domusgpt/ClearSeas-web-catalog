/**
 * Optimized Card Interactions
 * Simplified 3D tilt without heavy iframe rendering
 */

(function() {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  if (prefersReducedMotion || isTouchDevice) {
    console.log('Card interactions disabled (reduced motion or touch device)');
    return;
  }

  // Lightweight card tilt effect
  const cards = document.querySelectorAll(
    '.signal-card, .capability-card, .platform-card, .research-lab'
  );

  let activeCard = null;

  cards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      activeCard = this;
      this.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
    });

    card.addEventListener('mousemove', function(e) {
      if (activeCard !== this) return;

      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -8; // Reduced from 15
      const rotateY = ((x - centerX) / centerX) * 8;

      this.style.transform = `
        perspective(1000px)
        rotateX(${rotateX}deg)
        rotateY(${rotateY}deg)
        translateY(-8px)
        scale(1.02)
      `;
    });

    card.addEventListener('mouseleave', function() {
      if (activeCard !== this) return;

      activeCard = null;
      this.style.transform = '';
      this.style.transition = 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'; // Bounce back
    });
  });

  console.log('🎴 Optimized card interactions initialized');

})();
