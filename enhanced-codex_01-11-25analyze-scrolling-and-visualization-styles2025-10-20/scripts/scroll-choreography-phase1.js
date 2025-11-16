(function () {
  const root = document.documentElement;
  const body = document.body;
  if (!root || !body) {
    return;
  }

  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const handleReduceMotion = () => {
    if (reduceMotionQuery.matches) {
      body.classList.add('scroll-choreo-reduced');
      body.classList.remove('scroll-choreography-active');
      root.style.setProperty('--hero-mask-progress', '1');
      root.style.setProperty('--moire-shift', '0px');
      root.style.setProperty('--moire-rotation', '0deg');
      root.style.setProperty('--moire-scale', '1');
      root.style.setProperty('--moire-opacity', '0.2');
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
    const moireLayer = document.querySelector('[data-moire-layer]');

    if (!heroSection || heroCards.length === 0) {
      ScrollTrigger.refresh();
      return;
    }

    heroCards.forEach((card, index) => {
      const depth = Number(card.getAttribute('data-scroll-card-depth') || 1);
      card.style.setProperty('--card-depth', depth.toFixed(2));
      card.style.zIndex = String(40 - index);
    });

    const morphProxy = { value: 0 };
    const parallaxProxy = { tilt: 0 };
    const moireProxy = {
      baseShift: 0,
      pointerShift: 0,
      rotation: 0,
      scale: 1,
      opacity: parseFloat(getComputedStyle(root).getPropertyValue('--moire-opacity')) || 0.35
    };
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

    const applyMoireState = () => {
      const totalShift = moireProxy.baseShift + moireProxy.pointerShift;
      root.style.setProperty('--moire-shift', `${totalShift.toFixed(2)}px`);
      root.style.setProperty('--moire-rotation', `${moireProxy.rotation.toFixed(3)}deg`);
      root.style.setProperty('--moire-scale', moireProxy.scale.toFixed(4));
      root.style.setProperty('--moire-opacity', moireProxy.opacity.toFixed(3));
    };

    const resetMoireState = () => {
      moireProxy.baseShift = 0;
      moireProxy.pointerShift = 0;
      moireProxy.rotation = 0;
      moireProxy.scale = 1;
      moireProxy.opacity = 0.35;
      applyMoireState();
    };

    resetMoireState();
    setMorphProgress(0);
    if (polytopalController && typeof polytopalController.setPreset === 'function') {
      polytopalController.setPreset('stable');
    }

    let pointerRaf = null;
    const pointerTarget = { x: 0 };
    const updatePointerShift = () => {
      pointerRaf = null;
      moireProxy.pointerShift = pointerTarget.x;
      applyMoireState();
    };

    if (moireLayer && moireLayer.dataset.pointerBound !== 'true') {
      moireLayer.dataset.pointerBound = 'true';
      const handlePointerMove = (event) => {
        if (body.classList.contains('scroll-choreo-reduced')) {
          return;
        }
        const viewportWidth = window.innerWidth || 1;
        const normalized = (event.clientX / viewportWidth - 0.5) * 120;
        pointerTarget.x = gsap.utils.clamp(-160, 160, normalized);
        if (!pointerRaf) {
          pointerRaf = requestAnimationFrame(updatePointerShift);
        }
      };

      const resetPointer = () => {
        pointerTarget.x = 0;
        if (!pointerRaf) {
          pointerRaf = requestAnimationFrame(updatePointerShift);
        }
      };

      const handleMouseOut = (event) => {
        if (!event.relatedTarget || event.relatedTarget.nodeName === 'HTML') {
          resetPointer();
        }
      };

      window.addEventListener('mousemove', handlePointerMove, { passive: true });
      window.addEventListener('mouseout', handleMouseOut);
      window.addEventListener('touchmove', (event) => {
        if (!event.touches || event.touches.length === 0) {
          return;
        }
        const viewportWidth = window.innerWidth || 1;
        const normalized = (event.touches[0].clientX / viewportWidth - 0.5) * 120;
        pointerTarget.x = gsap.utils.clamp(-120, 120, normalized);
        if (!pointerRaf) {
          pointerRaf = requestAnimationFrame(updatePointerShift);
        }
      }, { passive: true });
      window.addEventListener('touchend', resetPointer, { passive: true });
    }

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
        moireProxy,
        {
          baseShift: 46,
          rotation: 2.25,
          scale: 1.12,
          opacity: 0.42,
          duration: 1.1,
          onUpdate: applyMoireState
        },
        'intro+=0.6'
      )
      .addLabel('phaseTwo', 'intro+=2.35')
      .add(() => transitionToPreset('surge', 1.4), 'phaseTwo-=0.25')
      .to(
        moireProxy,
        {
          baseShift: -64,
          rotation: -3.85,
          scale: 1.24,
          opacity: 0.56,
          duration: 1.35,
          onUpdate: applyMoireState
        },
        'phaseTwo'
      )
      .to(
        heroCards,
        {
          yPercent: (index, target, targets) => (index - (targets.length - 1) / 2) * -4,
          xPercent: (index, target, targets) => (index - (targets.length - 1) / 2) * 18,
          rotation: (index, target, targets) => (index - (targets.length - 1) / 2) * -6,
          scale: 1.08,
          filter: 'brightness(1.08) saturate(1.22) contrast(1.08)',
          duration: 1.35
        },
        'phaseTwo'
      )
      .to(
        morphProxy,
        {
          value: 0.65,
          duration: 1.1,
          onUpdate: () => setMorphProgress(morphProxy.value)
        },
        'phaseTwo'
      )
      .add(() => transitionToPreset('focus', 1.35), 'phaseTwo+=0.45')
      .to(
        moireProxy,
        {
          baseShift: 22,
          rotation: 0,
          scale: 1.08,
          opacity: 0.4,
          duration: 1.05,
          onUpdate: applyMoireState
        },
        'phaseTwo+=0.8'
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

    ScrollTrigger.addEventListener('refreshInit', () => {
      setMorphProgress(morphProxy.value);
      applyMoireState();
    });
    ScrollTrigger.refresh();
  }
})();
