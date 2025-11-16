/**
 * Optimized Scroll Animations
 * Lightweight, CSS-based animations with IntersectionObserver
 */

(function() {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    console.log('Animations disabled (reduced motion preference)');
    return;
  }

  // Simple intersection observer for reveal animations
  if ('IntersectionObserver' in window) {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target); // Stop observing once visible
        }
      });
    }, observerOptions);

    // Observe elements with data-animate attribute
    const animatedElements = document.querySelectorAll('[data-animate="reveal"]');
    animatedElements.forEach(el => observer.observe(el));

    // Observe all cards
    const cards = document.querySelectorAll('.signal-card, .capability-card, .platform-card, .research-lab, .step');
    cards.forEach(el => observer.observe(el));

    // Observe section headings
    const headings = document.querySelectorAll('.section-heading');
    headings.forEach(el => observer.observe(el));

    console.log('🎨 Optimized animations initialized');
  }

})();
