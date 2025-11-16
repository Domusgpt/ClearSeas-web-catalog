/**
 * Smooth Scrolling System with Lenis
 * Provides buttery smooth scrolling experience
 * © 2025 Clear Seas Solutions
 */

(function() {
  'use strict';

  // Initialize Lenis smooth scroll
  let lenis;

  function initSmoothScroll() {
    // Check if Lenis is available
    if (typeof Lenis === 'undefined') {
      console.warn('Lenis not loaded, skipping smooth scroll initialization');
      return;
    }

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      console.log('Reduced motion preferred, skipping smooth scroll');
      return;
    }

    // Initialize Lenis with optimized settings
    lenis = new Lenis({
      duration: 1.2,          // Scroll duration (higher = smoother but slower)
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Custom easing
      orientation: 'vertical', // Vertical scrolling
      gestureOrientation: 'vertical',
      smoothWheel: true,      // Smooth mouse wheel
      wheelMultiplier: 1,     // Mouse wheel sensitivity
      touchMultiplier: 2,     // Touch scroll sensitivity
      infinite: false,        // No infinite scroll
    });

    // Integrate with RAF (RequestAnimationFrame)
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Handle anchor links smoothly
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');

        // Skip if href is just "#"
        if (href === '#') return;

        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          lenis.scrollTo(target, {
            offset: -80, // Account for fixed header
            duration: 1.5,
            easing: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
          });
        }
      });
    });

    // Expose lenis instance globally for GSAP integration
    window.lenis = lenis;

    // Stop scroll on user interaction with forms
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      input.addEventListener('focus', () => lenis.stop());
      input.addEventListener('blur', () => lenis.start());
    });

    console.log('✨ Smooth scroll initialized');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSmoothScroll);
  } else {
    initSmoothScroll();
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (lenis) {
      lenis.destroy();
    }
  });

})();
