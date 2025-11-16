(function () {
  const root = document.documentElement;
  const body = document.body;
  if (!root || !body) {
    return;
  }

  let pointerTeardown = null;

  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const handleReduceMotion = () => {
    if (reduceMotionQuery.matches) {
      body.classList.add('scroll-choreo-reduced');
      body.classList.remove('scroll-choreography-active');
      root.style.setProperty('--hero-mask-progress', '1');
      root.style.setProperty('--hero-chromatic-strength', '0');
      root.style.setProperty('--hero-chromatic-shift-x', '0px');
      root.style.setProperty('--hero-chromatic-shift-y', '0px');
      document.querySelectorAll('[data-visualizer-card]').forEach((card) => {
        card.style.setProperty('--moire-intensity', '0');
        card.style.setProperty('--moire-shift-x', '0px');
        card.style.setProperty('--moire-shift-y', '0px');
        card.style.setProperty('--moire-pointer-shift-x', '0px');
        card.style.setProperty('--moire-pointer-shift-y', '0px');
      });
      if (typeof pointerTeardown === 'function') {
        pointerTeardown();
        pointerTeardown = null;
      }
      if (window.ScrollTrigger && typeof window.ScrollTrigger.getAll === 'function') {
        window.ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      }
    } else {
      body.classList.remove('scroll-choreo-reduced');
      if (!body.classList.contains('scroll-choreography-active')) {
        initialiseChoreography();
      }
    }
  };

  if (reduceMotionQuery.addEventListener) {
    reduceMotionQuery.addEventListener('change', handleReduceMotion);
  } else if (reduceMotionQuery.addListener) {
    reduceMotionQuery.addListener(handleReduceMotion);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', handleReduceMotion, { once: true });
  } else {
    handleReduceMotion();
  }

  function initialiseChoreography() {
    if (reduceMotionQuery.matches) {
      return;
    }

    if (!window.gsap || !window.ScrollTrigger) {
      return;
    }

    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    gsap.registerPlugin(ScrollTrigger);

    if (typeof pointerTeardown === 'function') {
      pointerTeardown();
      pointerTeardown = null;
    }

    body.classList.add('scroll-choreography-active');

    let lenisInstance = null;
    if (window.Lenis) {
      lenisInstance = new window.Lenis({
        duration: 1.2,
        smoothWheel: true,
        smoothTouch: false,
        gestureOrientation: 'vertical'
      });

      const updateScroll = (time) => {
        lenisInstance.raf(time);
        requestAnimationFrame(updateScroll);
      };
      requestAnimationFrame(updateScroll);

      const getLenisScroll = () => {
        const scroll = lenisInstance?.scroll;
        if (scroll && typeof scroll === 'object') {
          if (typeof scroll.instance === 'object' && typeof scroll.instance.scroll === 'number') {
            return scroll.instance.scroll;
          }
          if (typeof scroll.value === 'number') {
            return scroll.value;
          }
        }
        return window.scrollY || 0;
      };

      ScrollTrigger.scrollerProxy(document.body, {
        scrollTop(value) {
          if (arguments.length) {
            lenisInstance.scrollTo(value, { immediate: true });
          }
          return getLenisScroll();
        },
        getBoundingClientRect() {
          return {
            top: 0,
            left: 0,
            width: window.innerWidth,
            height: window.innerHeight
          };
        },
        pinType: document.body.style.transform ? 'transform' : 'fixed'
      });

      lenisInstance.on('scroll', () => ScrollTrigger.update());
      ScrollTrigger.addEventListener('refresh', () => lenisInstance.update());
    }

    const heroSection = document.querySelector('[data-scroll-scene="hero"]');
    const heroCards = gsap.utils.toArray('[data-visualizer-card]');
    const heroText = heroSection?.querySelector('.hero-text');

    if (!heroSection || heroCards.length === 0) {
      ScrollTrigger.refresh();
      return;
    }

    const cardMoiréStates = heroCards.map(() => ({
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      pointerStrength: 0
    }));

    const pointerState = { x: 0, y: 0, active: false };
    let pointerAnimationFrame = null;

    heroCards.forEach((card, index) => {
      const depth = Number(card.getAttribute('data-scroll-card-depth') || 1);
      card.style.setProperty('--card-depth', depth.toFixed(2));
      card.style.zIndex = String(40 - index);
      card.style.setProperty('--moire-intensity', '0');
      card.style.setProperty('--moire-shift-x', '0px');
      card.style.setProperty('--moire-shift-y', '0px');
      card.style.setProperty('--moire-pointer-shift-x', '0px');
      card.style.setProperty('--moire-pointer-shift-y', '0px');
      card.style.setProperty('--moire-rotation', '0deg');
      card.style.setProperty('--moire-pointer-strength', '0');
    });

    const morphProxy = { value: 0 };
    const parallaxProxy = { tilt: 0 };
    const polytopalController = window.__CLEAR_SEAS_POLYTOPAL || null;

    const setMorphProgress = (value) => {
      const clamped = Math.max(0, Math.min(1, value));
      root.style.setProperty('--hero-mask-progress', clamped.toFixed(4));
      if (polytopalController && typeof polytopalController.setMorphProgress === 'function') {
        polytopalController.setMorphProgress(clamped);
      }
    };

    const transitionToPreset = (presetName, duration) => {
      if (!polytopalController) {
        return;
      }
      if (typeof polytopalController.transitionTo === 'function') {
        polytopalController.transitionTo(presetName, { duration });
      } else if (typeof polytopalController.setPreset === 'function') {
        polytopalController.setPreset(presetName);
      }
    };

    setMorphProgress(0);
    if (polytopalController && typeof polytopalController.setPreset === 'function') {
      polytopalController.setPreset('stable');
    }

    const updatePointerDrift = () => {
      const pointerEnabled = body.classList.contains('scroll-choreography-active') && !reduceMotionQuery.matches;

      heroCards.forEach((card, index) => {
        const state = cardMoiréStates[index];
        if (!state) {
          return;
        }

        if (pointerEnabled && pointerState.active) {
          const rect = card.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const dx = pointerState.x - centerX;
          const dy = pointerState.y - centerY;
          const distance = Math.max(24, Math.hypot(dx, dy));
          const depth = Number(card.getAttribute('data-scroll-card-depth') || 1);
          const influence = Math.min(1, (260 * depth) / distance);
          const multiplier = 0.04 * depth;
          state.targetX = dx * multiplier * influence;
          state.targetY = dy * multiplier * influence;
          state.pointerStrength = influence;
        } else {
          state.targetX = 0;
          state.targetY = 0;
          state.pointerStrength = 0;
        }

        state.x += (state.targetX - state.x) * 0.12;
        state.y += (state.targetY - state.y) * 0.12;

        card.style.setProperty('--moire-pointer-shift-x', `${state.x.toFixed(2)}px`);
        card.style.setProperty('--moire-pointer-shift-y', `${state.y.toFixed(2)}px`);
        card.style.setProperty('--moire-pointer-strength', state.pointerStrength.toFixed(3));
      });

      const chromaticShiftMultiplier = pointerEnabled && pointerState.active ? 1 : 0;
      const shiftX = chromaticShiftMultiplier
        ? (pointerState.x / window.innerWidth - 0.5) * 28
        : 0;
      const shiftY = chromaticShiftMultiplier
        ? (pointerState.y / window.innerHeight - 0.5) * 20
        : 0;
      root.style.setProperty('--hero-chromatic-shift-x', `${shiftX.toFixed(2)}px`);
      root.style.setProperty('--hero-chromatic-shift-y', `${shiftY.toFixed(2)}px`);

      pointerAnimationFrame = window.requestAnimationFrame(updatePointerDrift);
    };

    pointerAnimationFrame = window.requestAnimationFrame(updatePointerDrift);

    const handlePointerMove = (event) => {
      pointerState.x = event.clientX;
      pointerState.y = event.clientY;
      pointerState.active = true;
    };

    const handlePointerLeave = () => {
      pointerState.active = false;
    };

    const handleTouchMove = (event) => {
      if (event.touches && event.touches.length > 0) {
        pointerState.x = event.touches[0].clientX;
        pointerState.y = event.touches[0].clientY;
        pointerState.active = true;
      }
    };

    const handleTouchEnd = () => {
      pointerState.active = false;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    pointerTeardown = () => {
      if (pointerAnimationFrame) {
        window.cancelAnimationFrame(pointerAnimationFrame);
        pointerAnimationFrame = null;
      }
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      pointerState.active = false;
      pointerState.x = 0;
      pointerState.y = 0;
      heroCards.forEach((card, index) => {
        const state = cardMoiréStates[index];
        if (state) {
          state.x = 0;
          state.y = 0;
          state.targetX = 0;
          state.targetY = 0;
          state.pointerStrength = 0;
        }
        card.style.setProperty('--moire-pointer-shift-x', '0px');
        card.style.setProperty('--moire-pointer-shift-y', '0px');
        card.style.setProperty('--moire-pointer-strength', '0');
      });
      root.style.setProperty('--hero-chromatic-shift-x', '0px');
      root.style.setProperty('--hero-chromatic-shift-y', '0px');
    };

    const heroTimeline = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      scrollTrigger: {
        trigger: heroSection,
        start: 'top top',
        end: '+=220%',
        scrub: true,
        pin: true,
        anticipatePin: 1,
        pinSpacing: true,
        invalidateOnRefresh: true
      }
    });

    heroTimeline
      .addLabel('intro', 0)
      .fromTo(
        heroCards,
        {
          yPercent: (index) => 18 + index * 6,
          xPercent: (index, target, targets) => (index - (targets.length - 1) / 2) * -4,
          rotation: (index, target, targets) => (index - (targets.length - 1) / 2) * -4,
          scale: 0.9,
          filter: 'brightness(0.9)'
        },
        {
          yPercent: (index, target, targets) => (index - (targets.length - 1) / 2) * -14,
          xPercent: (index, target, targets) => (index - (targets.length - 1) / 2) * 12,
          rotation: (index, target, targets) => (index - (targets.length - 1) / 2) * 6,
          scale: 1.05,
          filter: 'brightness(1) saturate(1.05)',
          duration: 1.15
        },
        'intro'
      )
      .fromTo(
        heroText,
        { autoAlpha: 1, yPercent: 0 },
        { autoAlpha: 0.65, yPercent: -6, duration: 0.8 },
        'intro+=0.1'
      )
      .to(
        heroCards,
        {
          duration: 0.85,
          '--moire-intensity': (index) => 0.35 + index * 0.08,
          '--moire-shift-x': (index, target, targets) => {
            const offset = index - (targets.length - 1) / 2;
            return `${(offset * 10).toFixed(2)}px`;
          },
          '--moire-shift-y': (index) => `${(-index * 6).toFixed(2)}px`,
          '--moire-rotation': (index, target, targets) => {
            const offset = index - (targets.length - 1) / 2;
            return `${(offset * 6).toFixed(2)}deg`;
          }
        },
        'intro+=0.12'
      )
      .add(() => transitionToPreset('unstable', 1.4), 'intro+=0.25')
      .to(
        morphProxy,
        {
          value: 0.45,
          duration: 0.8,
          onUpdate: () => setMorphProgress(morphProxy.value)
        },
        'intro+=0.25'
      )
      .to(
        root,
        {
          duration: 0.95,
          '--hero-chromatic-strength': 0.85,
          ease: 'sine.inOut'
        },
        'intro+=0.32'
      )
      .to(
        heroCards,
        {
          duration: 1.1,
          '--moire-intensity': (index, target, targets) => {
            const offset = Math.abs(index - (targets.length - 1) / 2);
            return 0.68 + offset * 0.08;
          },
          '--moire-shift-x': (index, target, targets) => {
            const offset = index - (targets.length - 1) / 2;
            return `${(offset * 28).toFixed(2)}px`;
          },
          '--moire-shift-y': (index) => `${(index * 18).toFixed(2)}px`,
          '--moire-rotation': (index, target, targets) => {
            const offset = index - (targets.length - 1) / 2;
            return `${(offset * 16).toFixed(2)}deg`;
          },
          ease: 'sine.inOut'
        },
        'intro+=0.82'
      )
      .to(
        heroCards,
        {
          yPercent: (index, target, targets) => 16 + index * 10,
          xPercent: (index, target, targets) => (index - (targets.length - 1) / 2) * 22,
          rotation: (index, target, targets) => (index - (targets.length - 1) / 2) * 12,
          scale: 1.16,
          filter: 'brightness(1.1) saturate(1.15)',
          duration: 1.1
        },
        'intro+=0.85'
      )
      .to(
        heroText,
        { autoAlpha: 0, yPercent: -28, duration: 0.9, ease: 'power1.inOut' },
        'intro+=0.9'
      )
      .add(() => transitionToPreset('stable', 1.2), 'intro+=1.45')
      .to(
        morphProxy,
        {
          value: 1,
          duration: 1.1,
          onUpdate: () => setMorphProgress(morphProxy.value)
        },
        'intro+=1.2'
      )
      .add(() => transitionToPreset('disperse', 1.6), 'intro+=1.9')
      .to(
        parallaxProxy,
        {
          tilt: 18,
          duration: 1.25,
          onUpdate: () => {
            root.style.setProperty('--hero-parallax-y', `${parallaxProxy.tilt.toFixed(2)}px`);
          }
        },
        'intro+=0.85'
      )
      .to(
        root,
        {
          duration: 0.9,
          '--hero-chromatic-strength': 0.55,
          ease: 'sine.inOut'
        },
        'intro+=1.6'
      )
      .to(
        heroCards,
        {
          duration: 0.9,
          '--moire-intensity': (index) => 0.42 + index * 0.05,
          '--moire-shift-x': (index, target, targets) => {
            const offset = index - (targets.length - 1) / 2;
            return `${(offset * 18).toFixed(2)}px`;
          },
          '--moire-shift-y': (index) => `${(-index * 4).toFixed(2)}px`,
          '--moire-rotation': (index, target, targets) => {
            const offset = index - (targets.length - 1) / 2;
            return `${(offset * 10).toFixed(2)}deg`;
          }
        },
        'intro+=1.65'
      );

    const sceneSections = gsap.utils.toArray('[data-scroll-scene]:not([data-scroll-scene="hero"])');
    sceneSections.forEach((section) => {
      section.classList.add('scroll-scene-fade-in');
      gsap.from(section, {
        opacity: 0,
        y: 80,
        duration: 1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 80%',
          end: 'top 45%',
          scrub: true,
          toggleActions: 'play none none reverse'
        }
      });
    });

    ScrollTrigger.addEventListener('refreshInit', () => setMorphProgress(morphProxy.value));
    ScrollTrigger.refresh();
  }
})();
