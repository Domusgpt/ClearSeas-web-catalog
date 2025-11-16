/**
 * Smooth Orchestration System
 * Webflow-style smooth interactions with proper performance
 * © 2025 Clear Seas Solutions
 */

(function() {
  'use strict';

  // Failsafe: Show all content after 3 seconds if animations don't initialize
  const failsafeTimeout = setTimeout(() => {
    console.warn('⏱️ ORCHESTRATION: Timeout - showing all content as fallback');
    document.body.classList.add('animations-timeout');
  }, 3000);

  // Check for reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    console.log('Orchestration disabled (reduced motion preference)');
    document.documentElement.style.scrollBehavior = 'smooth';
    document.body.classList.add('animations-failed');
    clearTimeout(failsafeTimeout);
    return;
  }

  // Wait for libraries to load
  function waitForLibraries(callback) {
    const checkInterval = setInterval(() => {
      if (typeof Lenis !== 'undefined' && typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        clearInterval(checkInterval);
        callback();
      }
    }, 50);

    // Timeout after 5 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      if (typeof Lenis === 'undefined' || typeof gsap === 'undefined') {
        console.warn('Libraries failed to load, using fallback');
        document.documentElement.style.scrollBehavior = 'smooth';
      }
    }, 5000);
  }

  waitForLibraries(initOrchestration);

  function initOrchestration() {
    console.log('🎭 ORCHESTRATION: Starting initialization...');
    console.log('🎭 ORCHESTRATION: Lenis =', typeof Lenis);
    console.log('🎭 ORCHESTRATION: gsap =', typeof gsap);
    console.log('🎭 ORCHESTRATION: ScrollTrigger =', typeof ScrollTrigger);

    // ===== LENIS SMOOTH SCROLL =====
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      smoothTouch: false, // Disable on touch for performance
      touchMultiplier: 2,
      infinite: false,
      autoResize: true,
    });

    // Expose globally
    window.lenis = lenis;

    // ===== GSAP INTEGRATION =====
    gsap.registerPlugin(ScrollTrigger);

    // Connect Lenis to GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    // Use GSAP ticker for smooth integration
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    // ===== SMOOTH ANCHOR LINKS =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;

        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          lenis.scrollTo(target, {
            offset: -80,
            duration: 1.5,
            easing: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
          });
        }
      });
    });

    // ===== HERO SECTION ORCHESTRATION =====
    const hero = document.querySelector('#hero');
    if (hero) {
      const heroText = hero.querySelector('.hero-text');
      const heroPanels = hero.querySelector('.hero-panels');

      if (heroText) {
        // Staggered entrance animation
        gsap.from(heroText.querySelectorAll('.eyebrow, h1, .hero-lede, .hero-cta, .hero-tags'), {
          y: 60,
          opacity: 0,
          duration: 1.2,
          stagger: 0.15,
          ease: 'power3.out',
          delay: 0.3
        });
      }

      if (heroPanels) {
        // Cards entrance with stagger
        gsap.from(heroPanels.querySelectorAll('.signal-card'), {
          y: 100,
          opacity: 0,
          scale: 0.95,
          duration: 1.4,
          stagger: 0.2,
          ease: 'power3.out',
          delay: 0.6
        });
      }

      // Hero parallax on scroll
      gsap.to(heroText, {
        scrollTrigger: {
          trigger: hero,
          start: 'top top',
          end: 'bottom top',
          scrub: 1
        },
        y: 200,
        opacity: 0.3,
        ease: 'none'
      });

      gsap.to(heroPanels, {
        scrollTrigger: {
          trigger: hero,
          start: 'top top',
          end: 'bottom top',
          scrub: 1
        },
        y: 150,
        ease: 'none'
      });
    }

    // ===== SECTION REVEALS WITH STAGGERS =====
    const sections = document.querySelectorAll('section');
    sections.forEach((section, index) => {
      // Section heading animations
      const heading = section.querySelector('.section-heading');
      if (heading) {
        gsap.from(heading.querySelectorAll('.eyebrow, h2, p'), {
          scrollTrigger: {
            trigger: heading,
            start: 'top 80%',
            toggleActions: 'play none none none'
          },
          y: 50,
          opacity: 0,
          duration: 1,
          stagger: 0.15,
          ease: 'power3.out'
        });
      }

      // Background parallax
      const bg = section.querySelector('.pointer-events-none');
      if (bg && index > 0) {
        gsap.to(bg, {
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.5
          },
          y: -100,
          ease: 'none'
        });
      }
    });

    // ===== CARD REVEALS WITH SOPHISTICATED STAGGERS =====
    const cardContainers = document.querySelectorAll('.capabilities-grid, .platform-grid, .engagement-steps');

    cardContainers.forEach(container => {
      const cards = container.querySelectorAll('.capability-card, .platform-card, .step, .research-lab');

      gsap.from(cards, {
        scrollTrigger: {
          trigger: container,
          start: 'top 75%',
          toggleActions: 'play none none none'
        },
        y: 80,
        opacity: 0,
        scale: 0.95,
        duration: 1.2,
        stagger: {
          amount: 0.6,
          from: 'start',
          ease: 'power2.inOut'
        },
        ease: 'power3.out'
      });
    });

    // ===== HOLOGRAPHIC LAYERS PARALLAX =====
    const holoLayers = document.querySelectorAll('.vcodex-holo-layer');
    holoLayers.forEach((layer, index) => {
      const speed = 0.05 + (index * 0.02);

      gsap.to(layer, {
        scrollTrigger: {
          trigger: 'body',
          start: 'top top',
          end: 'bottom bottom',
          scrub: true
        },
        y: `${speed * 100}%`,
        ease: 'none'
      });

      // Mouse parallax
      let mouseX = 0;
      let mouseY = 0;

      document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
      });

      gsap.ticker.add(() => {
        const depth = (index + 1) * 15;
        gsap.set(layer, {
          x: mouseX * depth,
          y: `+=${mouseY * depth}`,
        });
      });
    });

    // ===== LIST ITEMS STAGGER =====
    document.querySelectorAll('ul').forEach(list => {
      const items = list.querySelectorAll('li');
      if (items.length > 0) {
        gsap.from(items, {
          scrollTrigger: {
            trigger: list,
            start: 'top 85%',
            toggleActions: 'play none none none'
          },
          x: -30,
          opacity: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: 'power2.out'
        });
      }
    });

    // ===== GRADIENT BARS ANIMATE =====
    const gradientBars = document.querySelectorAll('.h-1[style*="linear-gradient"]');
    gradientBars.forEach(bar => {
      gsap.from(bar, {
        scrollTrigger: {
          trigger: bar,
          start: 'top 90%',
          toggleActions: 'play none none none'
        },
        scaleX: 0,
        transformOrigin: 'left center',
        duration: 1.2,
        ease: 'power3.inOut'
      });
    });

    // ===== STATUS BADGES ANIMATE =====
    const statusBadges = document.querySelectorAll('.status');
    statusBadges.forEach(badge => {
      gsap.from(badge, {
        scrollTrigger: {
          trigger: badge,
          start: 'top 90%',
          toggleActions: 'play none none none'
        },
        scale: 0,
        opacity: 0,
        duration: 0.6,
        ease: 'back.out(2)'
      });
    });

    // ===== FOOTER REVEAL =====
    const footer = document.querySelector('.site-footer');
    if (footer) {
      gsap.from(footer, {
        scrollTrigger: {
          trigger: footer,
          start: 'top 90%',
          toggleActions: 'play none none none'
        },
        y: 50,
        opacity: 0,
        duration: 1,
        ease: 'power3.out'
      });
    }

    // ===== FORM INPUTS HANDLING =====
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      input.addEventListener('focus', () => lenis.stop());
      input.addEventListener('blur', () => lenis.start());
    });

    // ===== CLEANUP =====
    window.addEventListener('beforeunload', () => {
      lenis.destroy();
      ScrollTrigger.getAll().forEach(st => st.kill());
    });

    console.log('✨ ORCHESTRATION: Complete! All animations initialized');
    console.log('✨ ORCHESTRATION: Lenis instance =', window.lenis);
    console.log('✨ ORCHESTRATION: ScrollTrigger instances =', ScrollTrigger.getAll().length);

    // Mark animations as loaded successfully
    document.body.classList.add('animations-loaded');
    clearTimeout(failsafeTimeout);
  }

})();
