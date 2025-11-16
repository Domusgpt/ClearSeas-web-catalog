/**
 * Master Orchestration Coordinator
 * Choreographed system that coordinates all animations, VIB3+, parallax, and 4D rotations
 * © 2025 Clear Seas Solutions
 */

(function() {
  'use strict';

  console.log('🎼 MASTER ORCHESTRATOR: Initializing choreographed system...');

  // Wait for all dependencies
  function waitForDependencies(callback) {
    const checkInterval = setInterval(() => {
      if (typeof Lenis !== 'undefined' && typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        clearInterval(checkInterval);
        callback();
      }
    }, 50);

    setTimeout(() => {
      clearInterval(checkInterval);
      console.error('❌ MASTER ORCHESTRATOR: Dependencies failed to load');
    }, 5000);
  }

  waitForDependencies(initMasterOrchestration);

  function initMasterOrchestration() {
    console.log('🎼 MASTER ORCHESTRATOR: Starting...');

    // Ensure all content is visible immediately (animations are enhancements only)
    document.body.classList.add('animations-loaded');

    // Register plugin
    gsap.registerPlugin(ScrollTrigger);

    // ===== INITIALIZE LENIS SMOOTH SCROLL =====
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      infinite: false,
    });

    window.lenis = lenis;

    // Integrate with GSAP
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    console.log('✅ MASTER ORCHESTRATOR: Lenis initialized');

    // ===== CHOREOGRAPHED VIB3+ SYSTEM =====
    const vib3System = createVIB3System();

    // ===== MASTER SCROLL TIMELINE =====
    createMasterScrollTimeline(vib3System);

    // ===== HERO ORCHESTRATION =====
    orchestrateHero();

    // ===== SECTION ORCHESTRATION =====
    orchestrateSections(vib3System);

    // ===== CARD ORCHESTRATION =====
    orchestrateCards(vib3System);

    // ===== 4D ROTATION SYSTEM =====
    orchestrate4DRotations();

    // ===== PARALLAX COORDINATION =====
    orchestrateParallax();

    // ===== ANCHOR LINKS =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          lenis.scrollTo(target, { offset: -80, duration: 1.5 });
        }
      });
    });

    console.log('✨ MASTER ORCHESTRATOR: Complete! All systems choreographed');
  }

  // ===== VIB3+ CHOREOGRAPHED SYSTEM =====
  function createVIB3System() {
    console.log('🎨 VIB3+ SYSTEM: Creating choreographed visualizer...');

    const container = document.createElement('div');
    container.className = 'vib3-master-viz';
    container.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      width: 800px;
      height: 800px;
      transform: translate(-50%, -50%);
      pointer-events: none;
      opacity: 0;
      z-index: 1;
      mix-blend-mode: screen;
      filter: blur(2px);
    `;

    const iframe = document.createElement('iframe');
    iframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      background: transparent;
    `;

    container.appendChild(iframe);
    document.body.appendChild(container);

    // VIB3+ parameter choreography
    const params = {
      geometry: 'tesseract',
      hue: 180,
      intensity: 0.7,
      rotation4d: { xy: 0, xz: 0, xw: 0, yz: 0, yw: 0, zw: 0 }
    };

    function updateVIB3URL() {
      const url = new URL('https://domusgpt.github.io/vib3-plus-engine/');
      url.searchParams.set('geo', params.geometry);
      url.searchParams.set('hue', Math.round(params.hue));
      url.searchParams.set('intensity', params.intensity.toFixed(2));
      url.searchParams.set('auto', '1'); // Enable auto-rotation
      url.searchParams.set('controls', '0'); // HIDE CONTROLS
      url.searchParams.set('menu', '0'); // HIDE MENU
      url.searchParams.set('shimmer', '1'); // Enable shimmer
      url.searchParams.set('rotXY', params.rotation4d.xy.toFixed(3));
      url.searchParams.set('rotXZ', params.rotation4d.xz.toFixed(3));
      url.searchParams.set('rotXW', params.rotation4d.xw.toFixed(3));
      url.searchParams.set('rotYZ', params.rotation4d.yz.toFixed(3));
      url.searchParams.set('rotYW', params.rotation4d.yw.toFixed(3));
      url.searchParams.set('rotZW', params.rotation4d.zw.toFixed(3));
      iframe.src = url.toString();
    }

    updateVIB3URL();

    return {
      container,
      iframe,
      params,
      updateURL: updateVIB3URL,
      show: (opacity = 0.6) => gsap.to(container, { opacity, duration: 1, ease: 'power2.out' }), // Increased opacity
      hide: () => gsap.to(container, { opacity: 0, duration: 0.5, ease: 'power2.in' })
    };
  }

  // ===== MASTER SCROLL TIMELINE =====
  function createMasterScrollTimeline(vib3System) {
    console.log('📜 SCROLL TIMELINE: Creating master timeline...');

    // Timeline for entire page scroll
    const masterTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: 'body',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
        onUpdate: (self) => {
          const progress = self.progress;

          // Choreograph VIB3+ parameters based on scroll
          vib3System.params.hue = 180 + (progress * 180); // 180° to 360°
          vib3System.params.intensity = 0.5 + (Math.sin(progress * Math.PI * 2) * 0.3);

          // 4D rotation choreography
          vib3System.params.rotation4d.xy = progress * Math.PI * 2;
          vib3System.params.rotation4d.xz = progress * Math.PI;
          vib3System.params.rotation4d.xw = Math.sin(progress * Math.PI * 3) * 0.5;
          vib3System.params.rotation4d.yz = Math.cos(progress * Math.PI * 2) * 0.3;
          vib3System.params.rotation4d.yw = progress * Math.PI * 1.5;
          vib3System.params.rotation4d.zw = Math.sin(progress * Math.PI * 4) * 0.2;

          // Update VIB3+ iframe every 10th frame for performance
          if (Math.round(progress * 1000) % 10 === 0) {
            vib3System.updateURL();
          }
        }
      }
    });

    // Show VIB3+ during middle sections
    ScrollTrigger.create({
      trigger: '#capabilities',
      start: 'top center',
      end: 'bottom center',
      onEnter: () => vib3System.show(0.5), // More visible
      onLeave: () => vib3System.hide(),
      onEnterBack: () => vib3System.show(0.5),
      onLeaveBack: () => vib3System.hide()
    });
  }

  // ===== HERO ORCHESTRATION =====
  function orchestrateHero() {
    const hero = document.querySelector('#hero');
    if (!hero) return;

    console.log('🎬 HERO: Orchestrating entrance...');

    const tl = gsap.timeline({ delay: 0.1 }); // Faster entrance

    // Staggered hero entrance (FROM opacity 1, subtle effect)
    tl.from('.hero-text .eyebrow', {
      y: 30, // Smaller movement
      opacity: 0.5, // Don't start fully invisible
      duration: 0.8,
      ease: 'power3.out'
    })
    .from('.hero-text h1', {
      y: 40,
      opacity: 0.5,
      duration: 1,
      ease: 'power3.out'
    }, '-=0.6')
    .from('.hero-text .hero-lede', {
      y: 20,
      opacity: 0.7,
      duration: 0.8,
      ease: 'power2.out'
    }, '-=0.7')
    .from('.hero-cta', {
      y: 15,
      opacity: 0.7,
      duration: 0.6,
      ease: 'power2.out'
    }, '-=0.5')
    .from('.hero-tags li', {
      x: -10,
      opacity: 0.7,
      duration: 0.4,
      stagger: 0.08,
      ease: 'power2.out'
    }, '-=0.4')
    .from('.hero-panels .signal-card', {
      y: 50,
      opacity: 0.5,
      scale: 0.95,
      rotationY: -10,
      duration: 1,
      stagger: 0.15,
      ease: 'back.out(1.2)'
    }, '-=0.8');

    // Hero parallax on scroll
    gsap.to('.hero-text', {
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: 1
      },
      y: 200,
      opacity: 0.2,
      scale: 0.95,
      ease: 'none'
    });

    gsap.to('.hero-panels', {
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: 1
      },
      y: 150,
      scale: 0.98,
      ease: 'none'
    });
  }

  // ===== SECTION ORCHESTRATION =====
  function orchestrateSections(vib3System) {
    console.log('📑 SECTIONS: Orchestrating reveals...');

    const sections = document.querySelectorAll('section:not(#hero)');

    sections.forEach((section, index) => {
      // Section heading choreography
      const heading = section.querySelector('.section-heading');
      if (heading) {
        const headingTl = gsap.timeline({
          scrollTrigger: {
            trigger: heading,
            start: 'top 80%',
            end: 'top 50%',
            scrub: 0.5
          }
        });

        headingTl
          .from(heading.querySelector('.eyebrow'), {
            y: 50,
            opacity: 0,
            ease: 'power2.out'
          })
          .from(heading.querySelector('h2'), {
            y: 60,
            opacity: 0,
            ease: 'power3.out'
          }, '-=0.3')
          .from(heading.querySelector('p'), {
            y: 40,
            opacity: 0,
            ease: 'power2.out'
          }, '-=0.2');
      }

      // Background parallax
      const bg = section.querySelector('.pointer-events-none');
      if (bg) {
        gsap.to(bg, {
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 2
          },
          y: -100,
          scale: 1.1,
          ease: 'none'
        });
      }

      // Section-specific VIB3+ geometry changes
      ScrollTrigger.create({
        trigger: section,
        start: 'top center',
        onEnter: () => {
          const geometries = ['tesseract', '24-cell', '600-cell', '120-cell', '16-cell', '5-cell'];
          vib3System.params.geometry = geometries[index % geometries.length];
          vib3System.updateURL();
        }
      });
    });
  }

  // ===== CARD ORCHESTRATION =====
  function orchestrateCards(vib3System) {
    console.log('🎴 CARDS: Orchestrating reveals...');

    const cardContainers = document.querySelectorAll('.capabilities-grid, .platform-grid, .engagement-steps');

    cardContainers.forEach(container => {
      const cards = container.querySelectorAll('.capability-card, .platform-card, .step, .research-lab');

      // Choreographed card entrance (subtle, content always visible)
      gsap.from(cards, {
        scrollTrigger: {
          trigger: container,
          start: 'top 75%',
          end: 'top 40%',
          scrub: 0.5
        },
        y: 40,
        opacity: 0.7, // Don't start invisible
        scale: 0.95,
        rotationY: -10,
        stagger: {
          amount: 0.3,
          from: 'start'
        },
        ease: 'power3.out'
      });

      // Individual card 3D interactions
      cards.forEach((card, idx) => {
        card.addEventListener('mouseenter', function() {
          gsap.to(this, {
            y: -15,
            scale: 1.05,
            rotationX: 0,
            rotationY: 0,
            duration: 0.4,
            ease: 'power2.out'
          });

          // Show VIB3+ for this card with higher opacity
          vib3System.params.hue = (idx * 60) % 360;
          vib3System.updateURL();
          vib3System.show(0.7); // Much more visible on hover
        });

        card.addEventListener('mousemove', function(e) {
          const rect = this.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;

          const rotateX = -(y - centerY) / centerY * 12;
          const rotateY = (x - centerX) / centerX * 12;

          gsap.to(this, {
            rotationX: rotateX,
            rotationY: rotateY,
            duration: 0.3,
            ease: 'power2.out',
            transformPerspective: 1000
          });
        });

        card.addEventListener('mouseleave', function() {
          gsap.to(this, {
            y: 0,
            scale: 1,
            rotationX: 0,
            rotationY: 0,
            duration: 0.8,
            ease: 'elastic.out(1, 0.5)'
          });

          vib3System.hide();
        });
      });
    });
  }

  // ===== 4D ROTATION ORCHESTRATION =====
  function orchestrate4DRotations() {
    console.log('🌀 4D ROTATIONS: Orchestrating holographic layers...');

    const holoLayers = document.querySelectorAll('.vcodex-holo-layer');

    holoLayers.forEach((layer, index) => {
      // Scroll-based 4D rotation simulation
      gsap.to(layer, {
        scrollTrigger: {
          trigger: 'body',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1
        },
        rotation: 360 * (index + 1) * 0.2,
        x: `${(index + 1) * 50}%`,
        y: `${Math.sin(index) * 30}%`,
        scale: 1 + (index * 0.05),
        ease: 'none'
      });

      // Mouse parallax with depth
      let mouseX = 0;
      let mouseY = 0;

      document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
      });

      gsap.ticker.add(() => {
        const depth = (index + 1) * 20;
        gsap.set(layer, {
          x: `+=${mouseX * depth}`,
          y: `+=${mouseY * depth}`,
          rotation: `+=${mouseX * 10}`,
        });
      });
    });
  }

  // ===== PARALLAX ORCHESTRATION =====
  function orchestrateParallax() {
    console.log('🌊 PARALLAX: Orchestrating depth layers...');

    // Create parallax groups
    const parallaxGroups = [
      { selector: '.hero-text', speed: 0.5, scale: 0.95 },
      { selector: '.hero-panels', speed: 0.3, scale: 0.98 },
      { selector: '.section-heading', speed: 0.2, scale: 1 },
      { selector: '.vcodex-holo-layer-1', speed: 0.8, scale: 1.1 },
      { selector: '.vcodex-holo-layer-2', speed: 0.6, scale: 1.05 },
      { selector: '.vcodex-holo-layer-3', speed: 0.4, scale: 1.02 },
      { selector: '.vcodex-holo-layer-4', speed: 0.2, scale: 1 }
    ];

    parallaxGroups.forEach(group => {
      const elements = document.querySelectorAll(group.selector);

      elements.forEach(el => {
        gsap.to(el, {
          scrollTrigger: {
            trigger: el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.5
          },
          y: (i, target) => {
            const distance = target.getBoundingClientRect().height;
            return -(distance * group.speed);
          },
          scale: group.scale,
          ease: 'none'
        });
      });
    });
  }

})();
