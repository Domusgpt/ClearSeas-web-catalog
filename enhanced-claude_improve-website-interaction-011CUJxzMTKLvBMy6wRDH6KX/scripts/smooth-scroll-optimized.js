/**
 * Lightweight Smooth Scroll
 * Performance-optimized alternative to Lenis
 */

(function() {
  'use strict';

  // Check for reduced motion or mobile
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (prefersReducedMotion || isMobile) {
    console.log('Smooth scroll disabled (reduced motion or mobile)');
    return;
  }

  // Simple native smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  console.log('✨ Lightweight smooth scroll initialized');

})();
