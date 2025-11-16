/**
 * Advanced Animations with GSAP ScrollTrigger
 * Provides sophisticated scroll-triggered animations and parallax effects
 * © 2025 Clear Seas Solutions
 */

(function() {
  'use strict';

  function initAdvancedAnimations() {
    // Check if GSAP and ScrollTrigger are available
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      console.warn('GSAP or ScrollTrigger not loaded, skipping advanced animations');
      return;
    }

    // Register ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger);

    // Integrate with Lenis smooth scroll if available
    if (window.lenis) {
      window.lenis.on('scroll', ScrollTrigger.update);

      gsap.ticker.add((time) => {
        window.lenis.raf(time * 1000);
      });

      gsap.ticker.lagSmoothing(0);
    }

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ===== HERO SECTION ANIMATIONS =====
    const heroText = document.querySelector('.hero-text');
    const heroPanels = document.querySelector('.hero-panels');

    if (heroText && !prefersReducedMotion) {
      gsap.from(heroText.children, {
        y: 60,
        opacity: 0,
        duration: 1.2,
        stagger: 0.15,
        ease: 'power3.out',
        delay: 0.3
      });
    }

    if (heroPanels && !prefersReducedMotion) {
      gsap.from(heroPanels.querySelectorAll('.signal-card'), {
        y: 80,
        opacity: 0,
        duration: 1.4,
        stagger: 0.2,
        ease: 'power3.out',
        delay: 0.6
      });
    }

    // ===== SECTION HEADING ANIMATIONS =====
    const sectionHeadings = document.querySelectorAll('.section-heading');

    sectionHeadings.forEach((heading) => {
      if (!prefersReducedMotion) {
        gsap.from(heading.children, {
          scrollTrigger: {
            trigger: heading,
            start: 'top 85%',
            end: 'top 60%',
            toggleActions: 'play none none none'
          },
          y: 50,
          opacity: 0,
          duration: 1,
          stagger: 0.1,
          ease: 'power3.out'
        });
      }
    });

    // ===== CARD REVEAL ANIMATIONS =====
    const cardSelectors = [
      '.capability-card',
      '.platform-card',
      '.research-lab',
      '.step'
    ];

    cardSelectors.forEach(selector => {
      const cards = document.querySelectorAll(selector);

      cards.forEach((card, index) => {
        if (!prefersReducedMotion) {
          gsap.from(card, {
            scrollTrigger: {
              trigger: card,
              start: 'top 90%',
              end: 'top 65%',
              toggleActions: 'play none none none'
            },
            y: 60,
            opacity: 0,
            duration: 1,
            delay: index * 0.1,
            ease: 'power3.out'
          });
        }
      });
    });

    // ===== PARALLAX EFFECTS =====

    // Hero parallax layers
    const heroSection = document.querySelector('#hero');
    if (heroSection && !prefersReducedMotion) {
      gsap.to(heroSection.querySelector('.hero-text'), {
        scrollTrigger: {
          trigger: heroSection,
          start: 'top top',
          end: 'bottom top',
          scrub: 1.5
        },
        y: 150,
        opacity: 0.3,
        ease: 'none'
      });

      gsap.to(heroSection.querySelector('.hero-panels'), {
        scrollTrigger: {
          trigger: heroSection,
          start: 'top top',
          end: 'bottom top',
          scrub: 1
        },
        y: 100,
        ease: 'none'
      });
    }

    // Section parallax backgrounds
    const sections = document.querySelectorAll('section');
    sections.forEach((section) => {
      const bg = section.querySelector('.pointer-events-none');

      if (bg && !prefersReducedMotion) {
        gsap.to(bg, {
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.5
          },
          y: (i, target) => -ScrollTrigger.maxScroll(window) * 0.05,
          ease: 'none'
        });
      }
    });

    // ===== HOLOGRAPHIC LAYERS PARALLAX =====
    const holoLayers = document.querySelectorAll('.vcodex-holo-layer');

    holoLayers.forEach((layer, index) => {
      if (!prefersReducedMotion) {
        const speed = 0.03 + (index * 0.015); // Different speeds for depth

        gsap.to(layer, {
          scrollTrigger: {
            trigger: 'body',
            start: 'top top',
            end: 'bottom bottom',
            scrub: true
          },
          y: (i, target) => -ScrollTrigger.maxScroll(window) * speed,
          ease: 'none'
        });
      }
    });

    // ===== MOUSE MOVE PARALLAX =====
    if (!prefersReducedMotion) {
      let mouseX = 0;
      let mouseY = 0;
      let currentX = 0;
      let currentY = 0;

      document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
      });

      gsap.ticker.add(() => {
        currentX += (mouseX - currentX) * 0.05;
        currentY += (mouseY - currentY) * 0.05;

        holoLayers.forEach((layer, index) => {
          const depth = (index + 1) * 10;
          gsap.set(layer, {
            x: currentX * depth,
            y: currentY * depth
          });
        });
      });
    }

    // ===== STAGGER FADE IN FOR LISTS =====
    const lists = document.querySelectorAll('ul li');

    if (lists.length > 0 && !prefersReducedMotion) {
      lists.forEach((item) => {
        gsap.from(item, {
          scrollTrigger: {
            trigger: item,
            start: 'top 90%',
            toggleActions: 'play none none none'
          },
          x: -30,
          opacity: 0,
          duration: 0.8,
          ease: 'power2.out'
        });
      });
    }

    // ===== SCALE ON SCROLL =====
    const scaleElements = document.querySelectorAll('.platform-heading, .lab-header');

    scaleElements.forEach((element) => {
      if (!prefersReducedMotion) {
        gsap.from(element, {
          scrollTrigger: {
            trigger: element,
            start: 'top 85%',
            end: 'top 65%',
            toggleActions: 'play none none none'
          },
          scale: 0.9,
          opacity: 0,
          duration: 1,
          ease: 'back.out(1.2)'
        });
      }
    });

    // ===== FOOTER REVEAL =====
    const footer = document.querySelector('.site-footer');

    if (footer && !prefersReducedMotion) {
      gsap.from(footer, {
        scrollTrigger: {
          trigger: footer,
          start: 'top 95%',
          toggleActions: 'play none none none'
        },
        y: 50,
        opacity: 0,
        duration: 1.2,
        ease: 'power3.out'
      });
    }

    // ===== GRADIENT BAR ANIMATIONS =====
    const gradientBars = document.querySelectorAll('[style*="linear-gradient"]');

    gradientBars.forEach((bar) => {
      if (!prefersReducedMotion) {
        gsap.from(bar, {
          scrollTrigger: {
            trigger: bar,
            start: 'top 90%',
            toggleActions: 'play none none none'
          },
          scaleX: 0,
          transformOrigin: 'left center',
          duration: 1,
          ease: 'power3.inOut'
        });
      }
    });

    console.log('🎨 Advanced animations initialized');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdvancedAnimations);
  } else {
    initAdvancedAnimations();
  }

})();
