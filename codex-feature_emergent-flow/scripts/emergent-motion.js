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
      contact: 180
    };
    this.sectionBlueprints = {
      capabilities: (tl, section) => this.animateCapabilityGrid(tl, section),
      research: (tl, section) => this.animateResearchAssets(tl, section),
      founder: (tl, section) => this.animateFounderNarrative(tl, section),
      platforms: (tl, section) => this.animatePlatformDeck(tl, section),
      contact: (tl, section) => this.animateContactCTA(tl, section)
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
      while (section.firstChild) {
        stage.appendChild(section.firstChild);
      }
      section.appendChild(stage);

      section.style.setProperty('--section-focus', '0');
      section.style.setProperty('--section-hue', this.palette[section.dataset.section] ?? 210);
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
          this.updateActiveSection(isActive ? 'hero' : this.currentSection);
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

  initSectionTimelines() {
    const mm = ScrollTrigger.matchMedia();

    mm.add('(min-width: 1024px)', () => {
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
            end: '+=170%',
            scrub: 1.15,
            pin: true,
            pinSpacing: index !== this.sections.length - 1,
            anticipatePin: 1,
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
            },
            onUpdate: (self) => {
              const value = self.progress.toFixed(3);
              section.style.setProperty('--section-focus', value);
              portal?.style.setProperty('--portal-progress', value);
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
    });

    mm.add('(max-width: 1023px)', () => {
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
    });

    this.cleanups.push(() => mm.revert());
  }

  updateActiveSection(sectionId = 'hero', sectionEl) {
    const hue = this.palette[sectionId] ?? 210;
    this.root.style.setProperty('--active-section-hue', hue);
    this.root.style.setProperty('--minoots-hue', `${hue}deg`);
    document.body.dataset.activeSection = sectionId;
    if (sectionEl) {
      const portal = sectionEl.querySelector('.section-portal');
      portal?.style.setProperty('--section-hue', hue);
    }
    window.dispatchEvent(new CustomEvent('sectionFlowShift', {
      detail: { section: sectionId, hue }
    }));
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
  }

  animateCapabilityGrid(timeline, section) {
    const heading = section.querySelector('.section-heading');
    const listItems = section.querySelectorAll('.capability-card li');
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
    timeline.fromTo(
      links,
      { opacity: 0, letterSpacing: '0.1em' },
      { opacity: 1, letterSpacing: '0.3em', duration: 0.8, stagger: 0.05 },
      0.2
    );
  }

  animateFounderNarrative(timeline, section) {
    const paragraphs = section.querySelectorAll('.section-heading p');
    timeline.fromTo(
      paragraphs,
      { opacity: 0, y: 18, skewY: 3 },
      { opacity: 1, y: 0, skewY: 0, duration: 0.9, stagger: 0.1 },
      0
    );
  }

  animatePlatformDeck(timeline, section) {
    const cards = section.querySelectorAll('.platform-card');
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
    timeline.fromTo(
      ctas,
      { opacity: 0, scale: 0.9 },
      { opacity: 1, scale: 1, duration: 0.6, stagger: 0.1, ease: 'back.out(1.4)' },
      0.15
    );
  }

  initCardInteractions() {
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
      });

      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--card-tilt-x', '0deg');
        card.style.setProperty('--card-tilt-y', '0deg');
        card.style.removeProperty('--card-spot-x');
        card.style.removeProperty('--card-spot-y');
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
    });
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
