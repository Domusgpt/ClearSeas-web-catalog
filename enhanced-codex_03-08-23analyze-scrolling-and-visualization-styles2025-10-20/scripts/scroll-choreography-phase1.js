(function () {
  const root = document.documentElement;
  const body = document.body;
  if (!root || !body) {
    return;
  }

  let detachPolytopalListener = null;
  let teardownHeroBridge = null;
  let heroBridge = null;
  let heroBridgeActive = false;

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
      root.style.setProperty('--moire-drift-x', '0px');
      root.style.setProperty('--moire-drift-y', '0px');
      root.style.setProperty('--hero-pointer-tilt-x', '0');
      root.style.setProperty('--hero-pointer-tilt-y', '0');
      root.style.setProperty('--hero-focus-gain', '0');
      root.style.setProperty('--hero-choreo-progress', '0');
      root.style.setProperty('--hero-energy', '0');
      root.style.setProperty('--hero-instability', '0');
      root.style.setProperty('--hero-surge', '0');
      root.style.setProperty('--hero-focus-progress', '0');
      root.style.setProperty('--hero-pointer-shift', '0px');
      root.style.setProperty('--hero-card-depth-lift', '0px');
      root.style.setProperty('--texture-hue', '0deg');
      root.style.setProperty('--texture-saturation', '1');
      root.style.setProperty('--texture-opacity', '0.7');
      delete body.dataset.heroPhase;
      if (window.ScrollTrigger && typeof window.ScrollTrigger.getAll === 'function') {
        window.ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      }
      if (typeof detachPolytopalListener === 'function') {
        detachPolytopalListener();
        detachPolytopalListener = null;
      }
      if (typeof teardownHeroBridge === 'function') {
        teardownHeroBridge();
        teardownHeroBridge = null;
      }
      heroBridge = null;
      heroBridgeActive = false;
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

    if (typeof detachPolytopalListener === 'function') {
      detachPolytopalListener();
      detachPolytopalListener = null;
    }
    if (typeof teardownHeroBridge === 'function') {
      teardownHeroBridge();
      teardownHeroBridge = null;
    }
    heroBridge = null;
    heroBridgeActive = false;

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
      card.style.setProperty('--card-pointer-tilt-x', '0deg');
      card.style.setProperty('--card-pointer-tilt-y', '0deg');
      card.style.zIndex = String(40 - index);
    });

    const morphProxy = { value: 0 };
    const parallaxProxy = { tilt: 0 };
    const moireProxy = {
      baseShift: 0,
      pointerShift: 0,
      rotation: 0,
      scale: 1,
      opacity: parseFloat(getComputedStyle(root).getPropertyValue('--moire-opacity')) || 0.35,
      driftX: 0,
      driftY: 0
    };
    const heroFocusProxy = { base: 0, pointer: 0 };
    let polytopalController = window.__CLEAR_SEAS_POLYTOPAL || null;
    let heroBridgeUpdate = () => {};

    const assignPolytopalController = (controller) => {
      if (controller && typeof controller === 'object') {
        polytopalController = controller;
      } else {
        polytopalController = null;
      }
    };

    const handlePolytopalControllerChange = (event) => {
      assignPolytopalController(event?.detail?.controller || null);
      heroBridgeUpdate({});
    };

    window.addEventListener('polytopal:controller', handlePolytopalControllerChange);
    detachPolytopalListener = () => {
      window.removeEventListener('polytopal:controller', handlePolytopalControllerChange);
    };

    heroBridge = createHeroChoreographyBridge({
      root,
      body,
      getController: () => polytopalController
    });
    heroBridgeActive = Boolean(heroBridge && typeof heroBridge.update === 'function');
    if (heroBridgeActive) {
      heroBridgeUpdate = (payload) => {
        if (heroBridge && typeof heroBridge.update === 'function') {
          heroBridge.update(payload);
        }
      };
      teardownHeroBridge = () => {
        heroBridgeActive = false;
        if (heroBridge && typeof heroBridge.destroy === 'function') {
          heroBridge.destroy();
        }
        heroBridge = null;
      };
      heroBridgeUpdate({
        progress: 0,
        morph: 0,
        focus: 0,
        pointerFocus: 0,
        pointerShift: 0,
        presetHint: 'stable'
      });
    } else {
      heroBridgeUpdate = () => {};
      teardownHeroBridge = null;
    }

    const applyHeroFocus = () => {
      const total = Math.max(0, Math.min(1, heroFocusProxy.base + heroFocusProxy.pointer));
      root.style.setProperty('--hero-focus-gain', total.toFixed(3));
      heroBridgeUpdate({ focus: heroFocusProxy.base, pointerFocus: heroFocusProxy.pointer });
    };

    const setHeroPhase = (phase) => {
      if (!phase) {
        delete body.dataset.heroPhase;
        return;
      }
      body.dataset.heroPhase = phase;
      if (heroBridgeActive) {
        const phasePresetMap = {
          intro: 'stable',
          surge: 'surge',
          focus: 'focus'
        };
        const hinted = phasePresetMap[phase];
        if (hinted) {
          heroBridgeUpdate({ presetHint: hinted });
        }
      }
    };

    const setMorphProgress = (value) => {
      const clamped = Math.max(0, Math.min(1, value));
      root.style.setProperty('--hero-mask-progress', clamped.toFixed(4));
      if (polytopalController && typeof polytopalController.setMorphProgress === 'function') {
        polytopalController.setMorphProgress(clamped);
      }
      heroBridgeUpdate({ morph: clamped });
    };

    const transitionToPreset = (presetName, duration) => {
      heroBridgeUpdate({ presetHint: presetName });
      if (heroBridgeActive) {
        return;
      }
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
      root.style.setProperty('--moire-drift-x', `${moireProxy.driftX.toFixed(2)}px`);
      root.style.setProperty('--moire-drift-y', `${moireProxy.driftY.toFixed(2)}px`);
    };

    const resetMoireState = () => {
      moireProxy.baseShift = 0;
      moireProxy.pointerShift = 0;
      moireProxy.rotation = 0;
      moireProxy.scale = 1;
      moireProxy.opacity = 0.35;
      moireProxy.driftX = 0;
      moireProxy.driftY = 0;
      heroFocusProxy.base = 0;
      heroFocusProxy.pointer = 0;
      applyMoireState();
      applyHeroFocus();
    };

    setHeroPhase('intro');
    resetMoireState();
    setMorphProgress(0);
    if (polytopalController && typeof polytopalController.setPreset === 'function') {
      polytopalController.setPreset('stable');
    }

    const pointerState = {
      raf: null,
      shiftX: 0,
      tiltX: 0,
      tiltY: 0,
      focus: 0
    };
    const pointerTarget = { shiftX: 0, tiltX: 0, tiltY: 0, focus: 0 };

    const updatePointerEffects = () => {
      pointerState.raf = null;
      pointerState.shiftX += (pointerTarget.shiftX - pointerState.shiftX) * 0.18;
      pointerState.tiltX += (pointerTarget.tiltX - pointerState.tiltX) * 0.2;
      pointerState.tiltY += (pointerTarget.tiltY - pointerState.tiltY) * 0.2;
      pointerState.focus += (pointerTarget.focus - pointerState.focus) * 0.16;

      moireProxy.pointerShift = pointerState.shiftX;
      applyMoireState();

      heroFocusProxy.pointer = pointerState.focus;
      applyHeroFocus();

      heroBridgeUpdate({ pointerFocus: pointerState.focus, pointerShift: pointerState.shiftX });

      root.style.setProperty('--hero-pointer-tilt-x', pointerState.tiltX.toFixed(3));
      root.style.setProperty('--hero-pointer-tilt-y', pointerState.tiltY.toFixed(3));

      heroCards.forEach((card) => {
        const depth = Number(card.getAttribute('data-scroll-card-depth') || 1);
        const tiltMultiplier = Math.min(1.6, depth + 0.25);
        const scaledTiltX = pointerState.tiltX * tiltMultiplier;
        const scaledTiltY = pointerState.tiltY * tiltMultiplier;
        card.style.setProperty('--card-pointer-tilt-x', `${scaledTiltX.toFixed(3)}deg`);
        card.style.setProperty('--card-pointer-tilt-y', `${scaledTiltY.toFixed(3)}deg`);
      });

      if (
        Math.abs(pointerState.shiftX - pointerTarget.shiftX) > 0.01 ||
        Math.abs(pointerState.tiltX - pointerTarget.tiltX) > 0.01 ||
        Math.abs(pointerState.tiltY - pointerTarget.tiltY) > 0.01 ||
        Math.abs(pointerState.focus - pointerTarget.focus) > 0.01
      ) {
        pointerState.raf = requestAnimationFrame(updatePointerEffects);
      }
    };

    const queuePointerUpdate = () => {
      if (!pointerState.raf) {
        pointerState.raf = requestAnimationFrame(updatePointerEffects);
      }
    };

    const resetPointer = () => {
      pointerTarget.shiftX = 0;
      pointerTarget.tiltX = 0;
      pointerTarget.tiltY = 0;
      pointerTarget.focus = 0;
      queuePointerUpdate();
      heroBridgeUpdate({ pointerFocus: 0, pointerShift: 0 });
    };

    const handleMouseOut = (event) => {
      if (!event.relatedTarget || event.relatedTarget.nodeName === 'HTML') {
        resetPointer();
      }
    };

    const updatePointerFromInput = (clientX, clientY) => {
      const viewportWidth = window.innerWidth || 1;
      const viewportHeight = window.innerHeight || 1;
      const normalizedX = clientX / viewportWidth - 0.5;
      const normalizedY = clientY / viewportHeight - 0.5;
      pointerTarget.shiftX = gsap.utils.clamp(-180, 180, normalizedX * 260);
      pointerTarget.tiltX = gsap.utils.clamp(-6.5, 6.5, normalizedX * 10);
      pointerTarget.tiltY = gsap.utils.clamp(-4.5, 4.5, normalizedY * -8);
      const focusFalloff = Math.min(1, Math.sqrt(normalizedX ** 2 + normalizedY ** 2) * 1.2);
      pointerTarget.focus = Math.max(0, 0.65 - focusFalloff * 0.6);
      queuePointerUpdate();
    };

    if (moireLayer && moireLayer.dataset.pointerBound !== 'true') {
      moireLayer.dataset.pointerBound = 'true';
      const handlePointerMove = (event) => {
        if (body.classList.contains('scroll-choreo-reduced')) {
          return;
        }
        updatePointerFromInput(event.clientX, event.clientY);
      };

      window.addEventListener('mousemove', handlePointerMove, { passive: true });
      window.addEventListener('mouseout', handleMouseOut);
      window.addEventListener(
        'touchmove',
        (event) => {
          if (!event.touches || event.touches.length === 0) {
            return;
          }
          updatePointerFromInput(event.touches[0].clientX, event.touches[0].clientY);
        },
        { passive: true }
      );
      window.addEventListener('touchend', resetPointer, { passive: true });
    }

    resetPointer();

    heroBridgeUpdate({
      progress: 0,
      morph: morphProxy.value,
      focus: heroFocusProxy.base,
      pointerFocus: heroFocusProxy.pointer,
      pointerShift: 0
    });

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
      .add(() => setHeroPhase('intro'), 'intro')
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
        heroFocusProxy,
        {
          base: 0.22,
          duration: 0.9,
          onUpdate: applyHeroFocus
        },
        'intro+=0.35'
      )
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
          driftX: 18,
          driftY: -14,
          duration: 1.1,
          onUpdate: applyMoireState
        },
        'intro+=0.6'
      )
      .addLabel('phaseTwo', 'intro+=2.35')
      .add(() => transitionToPreset('surge', 1.4), 'phaseTwo-=0.25')
      .add(() => setHeroPhase('surge'), 'phaseTwo-=0.1')
      .to(
        heroFocusProxy,
        {
          base: 0.46,
          duration: 1.1,
          onUpdate: applyHeroFocus
        },
        'phaseTwo-=0.05'
      )
      .to(
        moireProxy,
        {
          baseShift: -64,
          rotation: -3.85,
          scale: 1.24,
          opacity: 0.56,
          driftX: -32,
          driftY: 24,
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
          driftX: 8,
          driftY: -10,
          duration: 1.05,
          onUpdate: applyMoireState
        },
        'phaseTwo+=0.8'
      )
      .to(
        heroFocusProxy,
        {
          base: 0.3,
          duration: 0.85,
          onUpdate: applyHeroFocus
        },
        'phaseTwo+=0.7'
      )
      .add(() => setHeroPhase('focus'), 'phaseTwo+=0.82');

    heroTimeline.eventCallback('onUpdate', () => {
      heroBridgeUpdate({
        progress: heroTimeline.progress(),
        focus: heroFocusProxy.base,
        pointerFocus: heroFocusProxy.pointer
      });
    });

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
      applyHeroFocus();
      queuePointerUpdate();
      heroBridgeUpdate({
        progress: heroTimeline.progress(),
        morph: morphProxy.value,
        focus: heroFocusProxy.base,
        pointerFocus: heroFocusProxy.pointer
      });
      const progress = heroTimeline.progress();
      if (progress >= 0.78) {
        setHeroPhase('focus');
      } else if (progress >= 0.42) {
        setHeroPhase('surge');
      } else {
        setHeroPhase('intro');
      }
    });
    ScrollTrigger.refresh();
  }

  function createHeroChoreographyBridge({ root: rootElement, body: bodyElement, getController }) {
    if (!rootElement) {
      return null;
    }

    const state = {
      progress: 0,
      morph: 0,
      focus: 0,
      pointerFocus: 0,
      pointerShift: 0,
      presetHint: 'stable'
    };

    const trackedProperties = [
      '--hero-choreo-progress',
      '--hero-energy',
      '--hero-instability',
      '--hero-surge',
      '--hero-focus-progress',
      '--hero-pointer-shift',
      '--hero-card-depth-lift',
      '--texture-opacity',
      '--texture-hue',
      '--texture-saturation'
    ];

    const presetTargets = {
      stable: { density: 1, stability: 1.2, zoom: -0.05 },
      unstable: { density: 1.35, stability: 0.55, zoom: 0.4 },
      disperse: { density: 0.75, stability: 0.8, zoom: 0.85 },
      surge: { density: 1.6, stability: 0.68, zoom: 1.05 },
      focus: { density: 0.92, stability: 1.35, zoom: 0.18 }
    };

    let animationFrame = null;
    let destroyed = false;
    const lastPolytopalState = { density: NaN, stability: NaN, zoom: NaN };

    const clamp = (value, min = 0, max = 1) => {
      if (!Number.isFinite(value)) {
        return min;
      }
      return Math.min(Math.max(value, min), max);
    };

    const lerp = (a, b, t) => a + (b - a) * clamp(t, 0, 1);

    const smoothstep = (edge0, edge1, x) => {
      if (edge0 === edge1) {
        return x >= edge1 ? 1 : 0;
      }
      const t = clamp((x - edge0) / (edge1 - edge0));
      return t * t * (3 - 2 * t);
    };

    const dispatchHeroEvent = (detail) => {
      try {
        if (typeof window.CustomEvent === 'function') {
          window.dispatchEvent(new CustomEvent('hero:choreography', { detail }));
        } else if (typeof window.document?.createEvent === 'function') {
          const evt = window.document.createEvent('CustomEvent');
          evt.initCustomEvent('hero:choreography', false, false, detail);
          window.dispatchEvent(evt);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('[ClearSeas] Failed to dispatch hero choreography event', error);
      }
    };

    const computeDerivedState = () => {
      const progress = clamp(state.progress);
      const morph = clamp(state.morph);
      const focusBase = clamp(state.focus);
      const pointerFocus = clamp(state.pointerFocus);
      const pointerShift = Number.isFinite(state.pointerShift) ? state.pointerShift : 0;
      const presetHint = state.presetHint || 'stable';

      const releaseWeight = smoothstep(0.05, 0.32, progress);
      const surgeWeight = smoothstep(0.18, 0.7, progress);
      const focusWeight = smoothstep(0.58, 0.98, progress);

      let density = lerp(0.64, 1.52, surgeWeight);
      let stability = lerp(1.28, 0.64, surgeWeight);
      let zoom = lerp(-0.14, 0.36, surgeWeight);

      density = lerp(density, 0.84, focusWeight);
      stability = lerp(stability, 1.36, focusWeight);
      zoom = lerp(zoom, -0.08, focusWeight);

      const hintTarget = presetTargets[presetHint];
      if (hintTarget) {
        density = lerp(density, hintTarget.density, 0.22);
        stability = lerp(stability, hintTarget.stability, 0.22);
        zoom = lerp(zoom, hintTarget.zoom, 0.22);
      }

      const energyBase = lerp(0.16, 0.92, surgeWeight);
      const energy = clamp(energyBase + morph * 0.25 + releaseWeight * 0.08 - focusWeight * 0.12);
      const instability = clamp(lerp(0.18, 0.75, 1 - clamp(stability, 0.3, 1.4) / 1.4) + morph * 0.18);

      const combinedFocus = clamp(focusBase + pointerFocus);
      const cardLift = clamp(energy * 34 + pointerFocus * 14 + releaseWeight * 6, 0, 56);

      return {
        progress,
        morph,
        focus: combinedFocus,
        baseFocus: focusBase,
        pointerFocus,
        pointerShift,
        releaseWeight,
        surgeWeight,
        focusWeight,
        energy,
        instability,
        density,
        stability,
        zoom,
        cardLift,
        presetHint
      };
    };

    const applyDerivedState = () => {
      animationFrame = null;
      if (destroyed) {
        return;
      }

      const derived = computeDerivedState();

      rootElement.style.setProperty('--hero-choreo-progress', derived.progress.toFixed(4));
      rootElement.style.setProperty('--hero-energy', derived.energy.toFixed(4));
      rootElement.style.setProperty('--hero-instability', derived.instability.toFixed(4));
      rootElement.style.setProperty('--hero-surge', derived.surgeWeight.toFixed(4));
      rootElement.style.setProperty('--hero-focus-progress', derived.focusWeight.toFixed(4));
      rootElement.style.setProperty('--hero-pointer-shift', `${derived.pointerShift.toFixed(2)}px`);
      rootElement.style.setProperty('--hero-card-depth-lift', `${derived.cardLift.toFixed(2)}px`);

      const textureOpacity = clamp(0.58 + derived.energy * 0.28 + derived.focusWeight * 0.08, 0.45, 0.95);
      const textureHue = `${(derived.surgeWeight * -18 + derived.focusWeight * 24).toFixed(2)}deg`;
      const textureSaturation = (0.88 + derived.energy * 0.4 + derived.focusWeight * 0.12).toFixed(3);

      rootElement.style.setProperty('--texture-opacity', textureOpacity.toFixed(3));
      rootElement.style.setProperty('--texture-hue', textureHue);
      rootElement.style.setProperty('--texture-saturation', textureSaturation);

      if (bodyElement && bodyElement.style) {
        bodyElement.style.setProperty('--texture-opacity', textureOpacity.toFixed(3));
        bodyElement.style.setProperty('--texture-hue', textureHue);
        bodyElement.style.setProperty('--texture-saturation', textureSaturation);
      }

      const controller = typeof getController === 'function' ? getController() : null;
      if (controller && typeof controller.setState === 'function') {
        const deltaDensity = Math.abs((lastPolytopalState.density ?? derived.density) - derived.density);
        const deltaStability = Math.abs((lastPolytopalState.stability ?? derived.stability) - derived.stability);
        const deltaZoom = Math.abs((lastPolytopalState.zoom ?? derived.zoom) - derived.zoom);

        if (deltaDensity > 0.01 || deltaStability > 0.01 || deltaZoom > 0.01) {
          controller.setState({
            density: derived.density,
            stability: derived.stability,
            zoom: derived.zoom
          });
          lastPolytopalState.density = derived.density;
          lastPolytopalState.stability = derived.stability;
          lastPolytopalState.zoom = derived.zoom;
        }
      }

      dispatchHeroEvent({ state: derived });
    };

    const queueUpdate = () => {
      if (destroyed) {
        return;
      }
      if (!animationFrame) {
        animationFrame = window.requestAnimationFrame(applyDerivedState);
      }
    };

    return {
      update(partial) {
        if (!partial || destroyed) {
          return;
        }
        Object.assign(state, partial);
        queueUpdate();
      },
      destroy() {
        destroyed = true;
        if (animationFrame) {
          window.cancelAnimationFrame(animationFrame);
        }
        animationFrame = null;
        trackedProperties.forEach((prop) => {
          if (rootElement?.style) {
            rootElement.style.removeProperty(prop);
          }
          if (bodyElement?.style) {
            bodyElement.style.removeProperty(prop);
          }
        });
      }
    };
  }
})();
