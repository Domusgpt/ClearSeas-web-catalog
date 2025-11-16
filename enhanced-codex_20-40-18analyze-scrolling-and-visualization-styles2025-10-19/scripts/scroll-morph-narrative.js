/**
 * Scroll Morph Narrative
 * Sticky morphing choreography that synchronizes copy, visualizer parameters,
 * and the background orchestrator while scrolling.
 *
 * © 2025 Clear Seas Solutions — Inspired by Simone choreography
 */

(function() {
  'use strict';

  class ScrollMorphNarrative {
    constructor(section) {
      this.section = section;
      this.card = section.querySelector('.scroll-morph-card');
      if (!this.card) return;

      this.headingParts = {
        line1: this.card.querySelector('[data-line="1"]'),
        line2: this.card.querySelector('[data-line="2"]'),
        line3: this.card.querySelector('[data-line="3"]')
      };
      this.body = this.card.querySelector('.scroll-morph-body');
      this.steps = Array.from(section.querySelectorAll('.scroll-morph-step'));

      this.activeStep = null;
      this.velocity = 0;
      this.morphMeta = { intensity: 0.6, chaos: 0.2 };
      this.ticking = false;

      this.setupObserver();
      this.bindEvents();

      if (this.steps.length) {
        this.updateActiveStep(this.steps[0]);
      }
    }

    setupObserver() {
      if (!this.steps.length) return;

      const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.updateActiveStep(entry.target, entry.intersectionRatio);
          }
        });
      }, {
        rootMargin: '-35% 0px -35% 0px',
        threshold: thresholds
      });

      this.steps.forEach(step => this.observer.observe(step));
    }

    bindEvents() {
      window.addEventListener('smoothscroll', (event) => {
        this.velocity = event.detail.velocity;
        this.requestTick();
      });

      window.addEventListener('scroll', () => this.requestTick(), { passive: true });
      window.addEventListener('resize', () => this.requestTick());
    }

    requestTick() {
      if (this.ticking) return;
      this.ticking = true;
      requestAnimationFrame(() => {
        this.ticking = false;
        this.updateProgress();
      });
    }

    updateActiveStep(step) {
      if (!step || this.activeStep === step) {
        this.requestTick();
        return;
      }

      this.activeStep = step;
      this.steps.forEach(item => {
        item.dataset.active = item === step ? 'true' : 'false';
      });

      const state = step.dataset.state || 'orb';
      this.card.setAttribute('data-morph-state', state);

      this.applyText(step);

      const intensity = parseFloat(step.dataset.intensity);
      const chaos = parseFloat(step.dataset.chaos);
      this.morphMeta.intensity = Number.isFinite(intensity) ? intensity : this.morphMeta.intensity;
      this.morphMeta.chaos = Number.isFinite(chaos) ? chaos : this.morphMeta.chaos;

      this.requestTick();
    }

    applyText(step) {
      this.setLine(this.headingParts.line1, step.dataset.line1);
      this.setLine(this.headingParts.line2, step.dataset.line2);
      this.setLine(this.headingParts.line3, step.dataset.line3);

      if (this.body) {
        const body = (step.dataset.body || '').trim();
        this.body.textContent = body;
        this.body.classList.toggle('is-empty', body.length === 0);
      }
    }

    setLine(element, value) {
      if (!element) return;
      const text = (value || '').trim();
      element.textContent = text;
      element.classList.toggle('is-empty', text.length === 0);
    }

    updateProgress() {
      if (!this.activeStep) return;

      const rect = this.activeStep.getBoundingClientRect();
      const viewport = Math.max(1, window.innerHeight || 1);
      const centerOffset = (rect.top + rect.height / 2) - viewport / 2;
      const normalized = 1 - Math.min(1, Math.abs(centerOffset) / (viewport * 0.5));
      const progress = this.easeInOutCubic(Math.max(0, normalized));

      this.card.style.setProperty('--morph-progress', progress.toFixed(3));

      const state = this.card.getAttribute('data-morph-state') || 'orb';
      window.dispatchEvent(new CustomEvent('immersiveMorphState', {
        detail: {
          state,
          progress,
          metadata: {
            intensity: this.morphMeta.intensity,
            chaos: this.morphMeta.chaos,
            velocity: this.velocity
          }
        }
      }));
    }

    easeInOutCubic(t) {
      return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
  }

  function init() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const section = document.querySelector('.scroll-morph-section');
    if (!section) return;

    new ScrollMorphNarrative(section);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
