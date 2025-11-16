/**
 * Emergent Motion Orchestrator
 * Scroll-driven choreography that keeps hero + sections locked in a holographic flow.
 */

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
const Flip = window.Flip;

class EmergentMotionOrchestrator {
  constructor() {
    this.heroSection = document.querySelector('[data-hero-section]');
    this.root = document.documentElement;
    this.sections = [];
    this.cards = [];
    this.cleanups = [];
    this.sectionLockCount = 0;
    this.isInitialized = false;
    this.currentSection = 'hero';
    this.visualizer = {
      pulse: window.pulseVisualizerTwin || (() => {}),
      lock: window.setVisualizerTwinLock || (() => {})
    };
    this.palette = {
      hero: 196,
      capabilities: 188,
      research: 266,
      founder: 320,
      platforms: 24,
      contact: 180,
      expansion: 150
    };
    this.overlayProfiles = {
      cyan: { density: 0.45, scale: 1.05, twist: '4deg' },
      magenta: { density: 0.5, scale: 1.08, twist: '8deg' },
      green: { density: 0.42, scale: 1.02, twist: '2deg' },
      purple: { density: 0.48, scale: 1.1, twist: '-6deg' },
      orange: { density: 0.52, scale: 1.12, twist: '10deg' }
    };
    this.sectionBlueprints = {
      capabilities: (tl, section) => this.animateCapabilityGrid(tl, section),
      research: (tl, section) => this.animateResearchAssets(tl, section),
      founder: (tl, section) => this.animateFounderNarrative(tl, section),
      platforms: (tl, section) => this.animatePlatformDeck(tl, section),
      contact: (tl, section) => this.animateContactCTA(tl, section),
      expansion: (tl, section) => this.animateExpansionOrb(tl, section)
    };
  }

  init() {
    if (!gsap || !ScrollTrigger) {
      console.error('GSAP/ScrollTrigger not available for EmergentMotionOrchestrator');
      return;
    }

    if (this.isInitialized) {
      this.destroy();
    }

    gsap.registerPlugin(ScrollTrigger, Flip);

    this.sections = gsap.utils.toArray('[data-section]:not([data-hero-section])');
    this.cards = gsap.utils.toArray('[data-fractal-card]');

    this.decorateSections();
    this.createCardVisuals();
    this.createCardVisuals();
    this.updateActiveSection('hero');
    this.initHeroTimeline();
    this.initSectionTimelines();
    this.initCardInteractions();
    this.initReactiveButtons();
    this.initKineticCopy();
    this.bindVisualizerBridge();
    this.bindPointerParallax();

    this.isInitialized = true;
    console.log('🌊 Emergent Motion Orchestrator initialized');
  }

  destroy() {
    this.cleanups.forEach((fn) => fn());
    this.cleanups = [];
    this.sectionLockCount = 0;
    document.body.classList.remove('is-section-stack-active');
    this.sections.forEach((section) => {
      section.classList.remove('is-focus-locked');
      section.style.removeProperty('--section-focus');
      const stage = section.querySelector('[data-section-stage]');
      if (stage && stage.dataset.injected === 'true') {
        while (stage.firstChild) {
          section.appendChild(stage.firstChild);
        }
        stage.remove();
      }
    });
    this.isInitialized = false;
  }

  decorateSections() {
    this.sections.forEach((section, index) => {
      if (section.querySelector('[data-section-stage]')) return;

      const stage = document.createElement('div');
      stage.className = 'section-stage';
      stage.dataset.sectionStage = 'true';
      stage.dataset.injected = 'true';
      stage.style.setProperty('--section-depth-index', index);

      const portal = document.createElement('div');
      portal.className = 'section-portal';
      portal.dataset.sectionPortal = section.dataset.section || `section-${index}`;
      portal.style.setProperty('--section-portal-index', index);
      portal.style.setProperty('--section-hue', this.palette[section.dataset.section] ?? 210);

      stage.appendChild(portal);
      const glyph = document.createElement('div');
      glyph.className = 'section-glyph';
      glyph.dataset.theme = section.dataset.theme || 'cyan';
      stage.appendChild(glyph);

      while (section.firstChild) {
        stage.appendChild(section.firstChild);
      }
      section.appendChild(stage);

      section.style.setProperty('--section-focus', '0');
      section.style.setProperty('--section-hue', this.palette[section.dataset.section] ?? 210);
    });
  }

  createCardVisuals() {
    const flowCards = document.querySelectorAll('.flow-card');
    flowCards.forEach((card, index) => {
      if (card.querySelector('.flow-card__visual')) return;
      const visual = document.createElement('div');
      visual.className = 'flow-card__visual';
      const hue = (index * 48) % 360;
      visual.style.setProperty('--card-visual-hue', `${hue}deg`);
      visual.style.setProperty('--card-visual-delay', `${index * 0.12}s`);
      card.prepend(visual);
      const glow = document.createElement('div');
      glow.className = 'card-glow';
      card.prepend(glow);
    });
  }

  initHeroTimeline() {
    if (!this.heroSection) return;

    const heroContent = this.heroSection.querySelector('.hero-immersive__content');
    const heroLogo = this.heroSection.querySelector('[data-hero-logo]');
    const heroTitle = this.heroSection.querySelector('.hero-immersive__title');
    const heroSubtitle = this.heroSection.querySelector('.hero-immersive__subtitle');
    const heroEnter = this.heroSection.querySelector('[data-hero-enter]');

    const heroTimeline = gsap.timeline({
      defaults: { ease: 'power2.out' },
      scrollTrigger: {
        trigger: this.heroSection,
        start: 'top top',
        end: '+=220%',
        scrub: 1.2,
        pin: true,
        anticipatePin: 1,
        onToggle: ({ isActive }) => {
          document.body.classList.toggle('is-hero-locked', isActive);
          const sectionEl = isActive ? this.heroSection : document.querySelector(`[data-section="${this.currentSection}"]`);
          this.updateActiveSection(isActive ? 'hero' : this.currentSection, sectionEl);
          this.visualizer.lock(isActive);
          this.visualizer.pulse(isActive ? 'hero-lock' : 'hero-release');
        },
        onUpdate: (self) => {
          this.heroSection.style.setProperty('--hero-immersive-progress', self.progress.toFixed(3));
          this.heroSection.style.setProperty('--hero-depth', self.progress.toFixed(3));
        }
      }
    });

    heroTimeline
      .fromTo(heroContent, { scale: 0.96, yPercent: 6 }, { scale: 1.18, yPercent: -8 }, 0)
      .fromTo(
        heroLogo,
        { scale: 0.95, filter: 'drop-shadow(0 0 20px rgba(0, 212, 255, 0.35))' },
        { scale: 1.42, filter: 'drop-shadow(0 0 85px rgba(0, 212, 255, 0.9))' },
        0
      )
      .fromTo(
        heroTitle,
        { scale: 0.94, opacity: 0.65 },
        { scale: 1.08, opacity: 0.95, duration: 1.4 },
        0
      )
      .fromTo(
        heroSubtitle,
        { letterSpacing: '0.22em', opacity: 0.55 },
        { letterSpacing: '0.42em', opacity: 1 },
        0.1
      )
      .fromTo(
        heroEnter,
        { opacity: 0.4, y: 20 },
        { opacity: 1, y: 0 },
        0.25
      );

    this.cleanups.push(() => {
      heroTimeline.scrollTrigger?.kill();
      heroTimeline.kill();
    });
  }

  createCardVisuals() {
    const flowCards = document.querySelectorAll('.flow-card');
    flowCards.forEach((card, index) => {
      if (card.querySelector('.flow-card__visual')) return;
      const visual = document.createElement('div');
      visual.className = 'flow-card__visual';
      visual.style.setProperty('--card-visual-hue', `${(index * 36) % 360}deg`);
      visual.style.setProperty('--card-visual-delay', `${index * 0.12}s`);
      card.prepend(visual);

      const glow = document.createElement('div');
      glow.className = 'card-glow';
      card.prepend(glow);
    });
  }

  initSectionTimelines() {
    const mm = ScrollTrigger.matchMedia();

    const createSectionStack = (options = {}) => {
      const {
        end = '+=220%',
        snap = [0, 0.38, 0.62, 1],
        pinSpacing = true
      } = options;

      const timelines = [];

      this.sections.forEach((section, index) => {
        const stage = section.querySelector('[data-section-stage]');
        const portal = section.querySelector('[data-section-portal]');
        const cards = section.querySelectorAll('[data-fractal-card]');
        const sectionId = section.dataset.section || `section-${index}`;

        const tl = gsap.timeline({
          defaults: { ease: 'power2.out' },
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end,
            scrub: 1.15,
            pin: true,
            pinSpacing: pinSpacing ? index !== this.sections.length - 1 : false,
            anticipatePin: 1,
            snap: {
              snapTo: snap,
              duration: { min: 0.3, max: 0.8 },
              ease: 'power1.inOut'
            },
            onToggle: ({ isActive }) => {
              section.classList.toggle('is-focus-locked', isActive);
              section.style.setProperty('--section-focus', isActive ? '1' : '0');
              this.sectionLockCount += isActive ? 1 : -1;
              if (isActive) {
                this.currentSection = sectionId;
                this.updateActiveSection(sectionId, section);
              } else if (this.sectionLockCount === 0) {
                this.updateActiveSection('hero');
              }
              document.body.classList.toggle('is-section-stack-active', this.sectionLockCount > 0);
              this.visualizer.pulse(isActive ? `${sectionId}-lock` : `${sectionId}-release`);
              this.mergeCardVisuals(section, isActive);
              this.animateSectionVisualizer(section, isActive);
            },
            onUpdate: (self) => {
              const value = self.progress.toFixed(3);
              section.style.setProperty('--section-focus', value);
              portal?.style.setProperty('--portal-progress', value);
              const numeric = parseFloat(value);
              this.root.style.setProperty('--minoots-density', (0.25 + numeric * 0.6).toFixed(3));
              this.root.style.setProperty('--minoots-scale', (0.92 + numeric * 0.18).toFixed(3));
              this.root.style.setProperty('--minoots-twist', `${(numeric * 12 - 6).toFixed(2)}deg`);
            }
          }
        });

        tl.fromTo(
          stage,
          { opacity: 0.35, scale: 0.92, rotationX: -8, yPercent: 12 },
          { opacity: 1, scale: 1, rotationX: 0, yPercent: 0, duration: 1.1 }
        )
          .fromTo(
            portal,
            { opacity: 0.2, filter: 'blur(60px)', scale: 0.8 },
            { opacity: 0.85, filter: 'blur(20px)', scale: 1.1, duration: 1.3 },
            0
          )
          .fromTo(
            cards,
            { opacity: 0, yPercent: 20, z: -120, rotateX: 8 },
            {
              opacity: 1,
              yPercent: 0,
              z: 0,
              rotateX: 0,
              duration: 1.2,
              stagger: 0.08,
              ease: 'power3.out'
            },
            0.05
          )
          );

        this.applySectionBlueprint(sectionId, tl, section);

        tl.to(
            stage,
            {
              opacity: 0.28,
              scale: 0.98,
              rotationX: 6,
              yPercent: -8,
              duration: 1
            },
            '+=0.45'
          );

        timelines.push(tl);
      });

      return () => {
        timelines.forEach((tl) => {
          tl.scrollTrigger?.kill();
          tl.kill();
        });
        this.sectionLockCount = 0;
        document.body.classList.remove('is-section-stack-active');
      };

    };

    const createSectionRevealFallback = () => {
      const tweens = this.sections.map((section) =>
        gsap.from(section, {
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
            end: 'top 25%',
            scrub: 1.05
          },
          opacity: 0,
          y: 120,
          duration: 1.2,
          ease: 'power3.out'
        })
      );

      return () => tweens.forEach((tween) => tween.kill());
    };

    mm.add('(min-width: 1024px)', () => createSectionStack());

    mm.add('(orientation: portrait) and (min-width: 768px)', () =>
      createSectionStack({ end: '+=190%', snap: [0, 0.5, 1] })
    );

    mm.add('(min-width: 600px) and (max-width: 767px)', () =>
      createSectionStack({ end: '+=180%', snap: [0, 0.55, 1], pinSpacing: false })
    );

    mm.add('(max-width: 599px)', () => createSectionRevealFallback());

    this.cleanups.push(() => mm.revert());
  }

  updateActiveSection(sectionId = 'hero', sectionEl) {
    if (!sectionEl) {
      sectionEl = document.querySelector(`[data-section="${sectionId}"]`);
    }
    const hue = this.palette[sectionId] ?? 210;
    this.root.style.setProperty('--active-section-hue', hue);
    this.root.style.setProperty('--minoots-hue', `${hue}deg`);
    document.body.dataset.activeSection = sectionId;
    if (sectionEl) {
      const portal = sectionEl.querySelector('.section-portal');
      portal?.style.setProperty('--section-hue', hue);
      this.applyOverlayProfile(sectionEl.dataset.theme);
    } else {
      this.applyOverlayProfile();
    }
    window.dispatchEvent(new CustomEvent('sectionFlowShift', {
      detail: { section: sectionId, hue }
    }));
  }

  applyOverlayProfile(themeName = 'cyan') {
    const profile = this.overlayProfiles[themeName] || this.overlayProfiles.cyan;
    this.root.style.setProperty('--minoots-density', profile.density.toFixed(3));
    this.root.style.setProperty('--minoots-scale', profile.scale.toFixed(3));
    this.root.style.setProperty('--minoots-twist', profile.twist);
  }

  applySectionBlueprint(sectionId, timeline, section) {
    const handler = this.sectionBlueprints[sectionId];
    if (typeof handler === 'function') {
      handler(timeline, section);
    } else {
      this.animateDefaultStage(timeline, section);
    }
  }

  animateDefaultStage(timeline, section) {
    const heading = section.querySelector('.section-heading');
    if (heading) {
      timeline.fromTo(
        heading.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.08 },
        0
      );
    }
    this.animateGlyphPulse(section, timeline);
  }

  animateCapabilityGrid(timeline, section) {
    const heading = section.querySelector('.section-heading');
    const listItems = section.querySelectorAll('.capability-card li');
    this.animateGlyphPulse(section, timeline, { scaleTo: 1.08, rotation: 8 });
    if (heading) {
      timeline.fromTo(
        heading.children,
        { opacity: 0, y: 28, filter: 'blur(8px)' },
        { opacity: 1, y: 0, filter: 'blur(0)', duration: 1, stagger: 0.1 },
        0
      );
    }
    if (listItems.length) {
      timeline.fromTo(
        listItems,
        { opacity: 0, x: -18 },
        { opacity: 1, x: 0, duration: 0.6, stagger: 0.03 },
        0.35
      );
    }
  }

  animateResearchAssets(timeline, section) {
    const links = section.querySelectorAll('.platform-link');
    this.animateGlyphPulse(section, timeline, { scaleTo: 1.12, rotation: -6 });
    timeline.fromTo(
      links,
      { opacity: 0, letterSpacing: '0.1em' },
      { opacity: 1, letterSpacing: '0.3em', duration: 0.8, stagger: 0.05 },
      0.2
    );
  }

  animateFounderNarrative(timeline, section) {
    const paragraphs = section.querySelectorAll('.section-heading p');
    this.animateGlyphPulse(section, timeline, { scaleTo: 1.05 });
    timeline.fromTo(
      paragraphs,
      { opacity: 0, y: 18, skewY: 3 },
      { opacity: 1, y: 0, skewY: 0, duration: 0.9, stagger: 0.1 },
      0
    );
  }

  animatePlatformDeck(timeline, section) {
    const cards = section.querySelectorAll('.platform-card');
    this.animateGlyphPulse(section, timeline, { scaleTo: 1.15, rotation: 12 });
    timeline.fromTo(
      cards,
      { opacity: 0, yPercent: 25, rotateY: -6 },
      {
        opacity: 1,
        yPercent: 0,
        rotateY: 0,
        duration: 1,
        ease: 'power3.out',
        stagger: 0.06
      },
      0.1
    );
  }

  animateContactCTA(timeline, section) {
    const ctas = section.querySelectorAll('.hero-cta .btn');
    this.animateGlyphPulse(section, timeline, { scaleTo: 1.1, rotation: -10 });
    timeline.fromTo(
      ctas,
      { opacity: 0, scale: 0.9 },
      { opacity: 1, scale: 1, duration: 0.6, stagger: 0.1, ease: 'back.out(1.4)' },
      0.15
    );
  }

  animateGlyphPulse(section, timeline, options = {}) {
    const glyph = section.querySelector('.section-glyph');
    if (!glyph) return;
    const {
      scaleFrom = 0.9,
      scaleTo = 1.06,
      rotation = 4,
      delay = 0
    } = options;

    timeline.fromTo(
      glyph,
      { opacity: 0.1, scale: scaleFrom, rotate: 0 },
      { opacity: 0.75, scale: scaleTo, rotate: rotation, duration: 1.2, ease: 'power3.out' },
      delay
    );
  }

  animateExpansionOrb(timeline, section) {
    const orb = section.querySelector('.expanding-orb');
    const accent = section.querySelector('.expanding-orb__line--accent');
    const secondary = section.querySelector('.expanding-orb__line--secondary');
    if (!orb) return;
    timeline.fromTo(
      orb,
      { width: 'min(220px, 40vw)', height: 'min(220px, 40vw)' },
      { width: 'min(520px, 75vw)', height: 'min(520px, 70vh)', duration: 1.4, ease: 'power3.out' },
      0
    );
    if (accent) {
      timeline.fromTo(accent, { opacity: 0 }, { opacity: 1, duration: 0.8 }, 0.3);
    }
    if (secondary) {
      timeline.fromTo(secondary, { opacity: 0 }, { opacity: 0.9, duration: 0.8 }, 0.5);
    }
  }

  initCardInteractions() {
    const flowCards = Array.from(document.querySelectorAll('.flow-card'));
    this.cards.forEach((card) => {
      card.classList.add('neon-card');
      card.style.setProperty('--card-tilt-x', '0deg');
      card.style.setProperty('--card-tilt-y', '0deg');

      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        const ratioX = (event.clientX - rect.left) / rect.width;
        const ratioY = (event.clientY - rect.top) / rect.height;
        const tiltX = (0.5 - ratioY) * 10;
        const tiltY = (ratioX - 0.5) * 10;
        card.style.setProperty('--card-tilt-x', `${tiltX}deg`);
        card.style.setProperty('--card-tilt-y', `${tiltY}deg`);
        card.style.setProperty('--card-spot-x', `${ratioX * 100}%`);
        card.style.setProperty('--card-spot-y', `${ratioY * 100}%`);
        if (card.classList.contains('flow-card')) {
          card.style.setProperty('--mouse-x', `${(ratioX * 100).toFixed(2)}%`);
          card.style.setProperty('--mouse-y', `${(ratioY * 100).toFixed(2)}%`);
          card.style.setProperty('--card-flare', `rgba(0, 212, 255, ${(0.2 + ratioX * 0.3).toFixed(2)})`);
        }
        const bendStrength = Math.min(1, (Math.abs(tiltX) + Math.abs(tiltY)) / 20);
        window.dispatchEvent(new CustomEvent('cardBend', { detail: { strength: bendStrength } }));
      });

      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--card-tilt-x', '0deg');
        card.style.setProperty('--card-tilt-y', '0deg');
        card.style.removeProperty('--card-spot-x');
        card.style.removeProperty('--card-spot-y');
        if (card.classList.contains('flow-card')) {
          card.style.removeProperty('--mouse-x');
          card.style.removeProperty('--mouse-y');
        }
        this.visualizer.pulse('card-release');
      });

      card.addEventListener('pointerenter', () => {
        const state = Flip.getState(card);
        card.classList.add('is-emerging');
        Flip.from(state, {
          duration: 1,
          ease: 'power3.out',
          absolute: false,
          simple: true
        });
        this.visualizer.pulse('card-hover');
      });

      card.addEventListener('focus', () => card.classList.add('is-emerging'));
      card.addEventListener('blur', () => card.classList.remove('is-emerging'));

      card.addEventListener('pointerdown', () => this.visualizer.pulse('card-press'));

      if (!card.closest('a')) {
        card.addEventListener('click', () => {
          if (!card.classList.contains('flow-card')) return;
          const isActive = card.classList.contains('is-active');
          flowCards.forEach((element) => element.classList.remove('is-active'));
          if (!isActive) {
            card.classList.add('is-active');
          }
        });
      }
    });
  }

  mergeCardVisuals(section, isActive) {
    const visuals = section.querySelectorAll('.flow-card__visual');
    if (!visuals.length || !gsap) return;
    const center = (visuals.length - 1) / 2;
    visuals.forEach((visual, index) => {
      const offset = index - center;
      gsap.to(visual, {
        xPercent: isActive ? offset * 8 : 0,
        yPercent: isActive ? -Math.abs(offset) * 5 : 0,
        scale: isActive ? 1.1 - Math.abs(offset) * 0.04 : 1,
        opacity: isActive ? 0.95 - Math.abs(offset) * 0.1 : 0.45,
        duration: 1.2,
        ease: 'power3.out'
      });
    });
    section.querySelectorAll('.flow-card').forEach((card) => {
      card.classList.toggle('is-active', isActive);
    });
  }

  animateSectionVisualizer(section, isActive) {
    const overlay = document.getElementById('minoots-overlay');
    const themeName = section?.dataset.theme || 'cyan';
    const profile = this.overlayProfiles[themeName] || this.overlayProfiles.cyan;
    const density = isActive ? profile.density + 0.12 : profile.density;
    const scale = isActive ? profile.scale + 0.08 : profile.scale;
    const twist = isActive ? '14deg' : profile.twist;

    if (overlay) {
      overlay.classList.toggle('is-condensing', isActive);
    }

    gsap.to(this.root, {
      '--minoots-density': density.toFixed(3),
      '--minoots-scale': scale.toFixed(3),
      '--minoots-twist': twist,
      duration: isActive ? 1.6 : 0.9,
      ease: 'power2.inOut'
    });

    if (typeof window.pulseVisualizerTwin === 'function') {
      window.pulseVisualizerTwin(isActive ? `${section.dataset.section || 'section'}-lock` : `${section.dataset.section || 'section'}-release`);
    }
  }

  initReactiveButtons() {
    const buttons = gsap.utils.toArray('.btn, .nav-cta');
    buttons.forEach((button) => {
      button.addEventListener('pointermove', (event) => {
        const rect = button.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        button.style.setProperty('--btn-spot-x', `${x}%`);
        button.style.setProperty('--btn-spot-y', `${y}%`);
      });

      button.addEventListener('pointerleave', () => {
        button.style.removeProperty('--btn-spot-x');
        button.style.removeProperty('--btn-spot-y');
      });
    });
  }

  initKineticCopy() {
    const kineticTargets = gsap.utils.toArray('.section-heading h2, .section-heading p, .hero-immersive__subtitle');
    kineticTargets.forEach((node) => {
      node.setAttribute('data-kinetic-text', 'true');
      node.setAttribute('data-kinetic-text-content', node.textContent.trim());
    });
  }

  bindVisualizerBridge() {
    const handleVisualState = (event) => {
      const { detail } = event;
      if (!detail?.state) return;
      const { state } = detail;
      const density = 0.18 + (state.intensity ?? 0.5) * 0.8;
      const scale = 0.85 + (state.speed ?? 0.5) * 0.4 + (detail.context?.scroll ?? 0) * 0.12;
      const twist = ((state.chaos ?? 0.2) * 120).toFixed(2) + 'deg';
      this.root.style.setProperty('--minoots-density', density.toFixed(3));
      this.root.style.setProperty('--minoots-scale', scale.toFixed(3));
      this.root.style.setProperty('--minoots-twist', twist);
    };

    window.addEventListener('visualStateUpdate', handleVisualState);
    this.cleanups.push(() => window.removeEventListener('visualStateUpdate', handleVisualState));
  }

  bindPointerParallax() {
    const root = document.documentElement;
    const updateParallax = (event) => {
      const { innerWidth, innerHeight } = window;
      const x = (event.clientX / innerWidth - 0.5) * 2;
      const y = (event.clientY / innerHeight - 0.5) * 2;
      root.style.setProperty('--parallax-x', x.toFixed(3));
      root.style.setProperty('--parallax-y', y.toFixed(3));
    };

    window.addEventListener('pointermove', updateParallax, { passive: true });
    this.cleanups.push(() => window.removeEventListener('pointermove', updateParallax));
  }
}

const emergentOrchestrator = new EmergentMotionOrchestrator();

const boot = () => emergentOrchestrator.init();

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  if (document.body?.dataset?.visualSystem === 'enhanced') {
    boot();
  } else {
    window.addEventListener('clearSeasEnhancedReady', boot, { once: true });
  }
} else {
  window.addEventListener('clearSeasEnhancedReady', boot, { once: true });
  window.addEventListener('load', () => {
    if (!emergentOrchestrator.isInitialized) boot();
  });
}
