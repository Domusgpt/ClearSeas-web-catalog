/**
 * Scroll Choreography for Clear Seas Solutions
 * GSAP-powered smooth scroll animations and transitions
 * A Paul Phillips Manifestation
 * © 2025 Paul Phillips - Clear Seas Solutions LLC
 */

(function() {
  'use strict';

  // Wait for GSAP to load
  window.addEventListener('load', () => {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      console.error('GSAP or ScrollTrigger not loaded');
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    console.log('🎬 GSAP ScrollTrigger initialized');

    initScrollAnimations();
    initCardAnimations();
    initRealitySections();
  });

  function initScrollAnimations() {
    // Fade in sections as they enter viewport
    const sections = document.querySelectorAll('section');

    sections.forEach((section, index) => {
      gsap.from(section, {
        scrollTrigger: {
          trigger: section,
          start: 'top 80%',
          end: 'top 20%',
          scrub: 1,
          markers: false
        },
        opacity: 0,
        y: 60,
        duration: 1,
        ease: 'power2.out'
      });
    });

    // Parallax effect for headings
    const headings = document.querySelectorAll('h1, h2');

    headings.forEach(heading => {
      gsap.from(heading, {
        scrollTrigger: {
          trigger: heading,
          start: 'top 80%',
          end: 'top 30%',
          scrub: 1.5
        },
        y: 40,
        opacity: 0,
        ease: 'power1.out'
      });
    });
  }

  function initCardAnimations() {
    // Stagger animation for product cards
    const productCards = gsap.utils.toArray('.product-card');

    if (productCards.length > 0) {
      gsap.from(productCards, {
        scrollTrigger: {
          trigger: '.product-grid',
          start: 'top 70%',
          end: 'top 30%',
          scrub: 1
        },
        y: 80,
        opacity: 0,
        stagger: 0.15,
        duration: 1.2,
        ease: 'power3.out'
      });
    }

    // Stagger animation for capability cards
    const capabilityCards = gsap.utils.toArray('.capability-card');

    if (capabilityCards.length > 0) {
      gsap.from(capabilityCards, {
        scrollTrigger: {
          trigger: '.capabilities-grid',
          start: 'top 70%',
          end: 'top 30%',
          scrub: 1
        },
        y: 80,
        opacity: 0,
        stagger: 0.15,
        duration: 1.2,
        ease: 'power3.out'
      });
    }

    // Stagger animation for research cards
    const researchCards = gsap.utils.toArray('.research-card');

    if (researchCards.length > 0) {
      gsap.from(researchCards, {
        scrollTrigger: {
          trigger: '.research-grid',
          start: 'top 70%',
          end: 'top 30%',
          scrub: 1
        },
        y: 80,
        opacity: 0,
        stagger: 0.15,
        duration: 1.2,
        ease: 'power3.out'
      });
    }

    // Card hover GSAP enhancements
    const allCards = [...productCards, ...capabilityCards, ...researchCards];

    allCards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        gsap.to(card, {
          scale: 1.02,
          duration: 0.4,
          ease: 'power2.out'
        });
      });

      card.addEventListener('mouseleave', () => {
        gsap.to(card, {
          scale: 1,
          duration: 0.4,
          ease: 'power2.out'
        });
      });
    });
  }

  function initRealitySections() {
    // Pin and animate reality reframed sections
    const realitySections = document.querySelectorAll('.reality-section');

    realitySections.forEach((section, index) => {
      const quotes = section.querySelectorAll('.reality-quote, .reality-quote-accent');

      gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=100%',
          scrub: 1.5,
          pin: true,
          anticipatePin: 1,
          markers: false
        }
      })
      .from(quotes[0], {
        y: 100,
        opacity: 0,
        scale: 0.9,
        duration: 1,
        ease: 'power2.out'
      })
      .from(quotes[1], {
        y: 80,
        opacity: 0,
        scale: 0.95,
        duration: 1,
        ease: 'power2.out'
      }, 0.3);

      // Intensify visualizer during reality sections
      ScrollTrigger.create({
        trigger: section,
        start: 'top center',
        end: 'bottom center',
        onEnter: () => {
          if (window.clearSeasVisualizer) {
            window.clearSeasVisualizer.intensity = 2.0;
          }
        },
        onLeave: () => {
          if (window.clearSeasVisualizer) {
            window.clearSeasVisualizer.intensity = 1.0;
          }
        },
        onEnterBack: () => {
          if (window.clearSeasVisualizer) {
            window.clearSeasVisualizer.intensity = 2.0;
          }
        },
        onLeaveBack: () => {
          if (window.clearSeasVisualizer) {
            window.clearSeasVisualizer.intensity = 1.0;
          }
        }
      });
    });
  }

  // Smooth scroll to anchors
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;

      e.preventDefault();
      const target = document.querySelector(href);

      if (target) {
        gsap.to(window, {
          duration: 1.2,
          scrollTo: {
            y: target,
            offsetY: 80
          },
          ease: 'power3.inOut'
        });
      }
    });
  });

  console.log('✅ Scroll choreography initialized');

})();
