(function () {
  const root = document.documentElement;
  const body = document.body;
  if (!root || !body) {
    return;
  }

  const CHOREO_READY_EVENT = 'clearseas:choreography:ready';
  const CHOREO_TEARDOWN_EVENT = 'clearseas:choreography:teardown';

  window.__CLEAR_SEAS_SCROLL_CHOREO_VERSION = 'phase1';
  window.__CLEAR_SEAS_SCROLL_CHOREO_READY = Boolean(window.__CLEAR_SEAS_SCROLL_CHOREO_READY);

  let enhancedReady = Boolean(window.__CLEAR_SEAS_SCROLL_CHOREO_READY);

  const createChoreographyEvent = (type, detail) => {
    if (!type) {
      return null;
    }
    if (typeof window.CustomEvent === 'function') {
      return new CustomEvent(type, { detail: detail || {} });
    }
    const legacyEvent = document.createEvent('CustomEvent');
    legacyEvent.initCustomEvent(type, false, false, detail || {});
    return legacyEvent;
  };

  const dispatchChoreographyEvent = (type, detail) => {
    if (!type) {
      return;
    }
    try {
      const event = createChoreographyEvent(type, detail);
      if (event) {
        window.dispatchEvent(event);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('[ClearSeas] Failed to dispatch choreography event', type, error);
    }
  };

  const createStyleController = (target) => {
    const cache = new Map();
    return {
      set(property, value) {
        if (!target || !target.style) {
          return;
        }
        const stringValue = typeof value === 'string' ? value : String(value);
        if (cache.get(property) === stringValue) {
          return;
        }
        target.style.setProperty(property, stringValue);
        cache.set(property, stringValue);
      },
      remove(property) {
        if (!target || !target.style) {
          return;
        }
        target.style.removeProperty(property);
        cache.delete(property);
      },
      clear(properties) {
        properties.forEach((property) => {
          this.remove(property);
        });
      }
    };
  };

  const rootStyle = createStyleController(root);
  const bodyStyle = createStyleController(body);

  const clamp01 = (value) => {
    if (!Number.isFinite(value)) {
      return 0;
    }
    if (value <= 0) {
      return 0;
    }
    if (value >= 1) {
      return 1;
    }
    return value;
  };

  const floatEquals = (a, b, epsilon = 0.0005) => Math.abs(a - b) <= epsilon;

  const createFrameScheduler = () => {
    let rafId = null;
    const tasks = new Set();

    const flush = (time) => {
      rafId = null;
      if (tasks.size === 0) {
        return;
      }

      const pending = Array.from(tasks);
      tasks.clear();

      for (let index = 0; index < pending.length; index += 1) {
        const task = pending[index];
        if (typeof task !== 'function') {
          continue;
        }
        try {
          task(time);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.warn('[ClearSeas] Frame scheduler task failed', error);
        }
      }

      if (tasks.size > 0) {
        rafId = requestAnimationFrame(flush);
      }
    };

    return {
      schedule(task) {
        if (typeof task !== 'function') {
          return;
        }
        tasks.add(task);
        if (!rafId) {
          rafId = requestAnimationFrame(flush);
        }
      },
      cancel(task) {
        if (typeof task !== 'function') {
          return;
        }
        tasks.delete(task);
        if (tasks.size === 0 && rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      },
      clear() {
        tasks.clear();
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      }
    };
  };

  const frameScheduler = createFrameScheduler();

  let detachPolytopalListener = null;
  let teardownHeroBridge = null;
  let heroBridge = null;
  let heroBridgeActive = false;
  let stopLenis = null;
  let releaseSchedulerState = null;
  let heroVisibilityObserver = null;
  let detachDocumentVisibility = null;

  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const handleReduceMotion = () => {
    if (reduceMotionQuery.matches) {
      body.classList.add('scroll-choreo-reduced');
      body.classList.remove('scroll-choreography-active');
      body.classList.remove('scroll-choreography-fallback');
      rootStyle.set('--hero-mask-progress', '1');
      rootStyle.set('--moire-shift', '0px');
      rootStyle.set('--moire-rotation', '0deg');
      rootStyle.set('--moire-scale', '1');
      rootStyle.set('--moire-opacity', '0.2');
      rootStyle.set('--moire-drift-x', '0px');
      rootStyle.set('--moire-drift-y', '0px');
      rootStyle.set('--hero-pointer-tilt-x', '0');
      rootStyle.set('--hero-pointer-tilt-y', '0');
      rootStyle.set('--hero-focus-gain', '0');
      rootStyle.set('--hero-choreo-progress', '0');
      rootStyle.set('--hero-energy', '0');
      rootStyle.set('--hero-instability', '0');
      rootStyle.set('--hero-surge', '0');
      rootStyle.set('--hero-focus-progress', '0');
      rootStyle.set('--hero-pointer-shift', '0px');
      rootStyle.set('--hero-card-depth-lift', '0px');
      rootStyle.set('--texture-hue', '0deg');
      rootStyle.set('--texture-saturation', '1');
      rootStyle.set('--texture-opacity', '0.7');
      bodyStyle.set('--texture-hue', '0deg');
      bodyStyle.set('--texture-saturation', '1');
      bodyStyle.set('--texture-opacity', '0.7');
      delete body.dataset.heroPhase;
      if (typeof stopLenis === 'function') {
        stopLenis();
        stopLenis = null;
      }
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
      if (heroVisibilityObserver) {
        heroVisibilityObserver.disconnect();
        heroVisibilityObserver = null;
      }
      if (typeof detachDocumentVisibility === 'function') {
        detachDocumentVisibility();
        detachDocumentVisibility = null;
      }
      if (typeof releaseSchedulerState === 'function') {
        releaseSchedulerState();
        releaseSchedulerState = null;
      }
      frameScheduler.clear();
      enhancedReady = false;
      window.__CLEAR_SEAS_SCROLL_CHOREO_READY = false;
      dispatchChoreographyEvent(CHOREO_TEARDOWN_EVENT, { reason: 'reduced-motion' });
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

    body.classList.remove('scroll-choreography-fallback');
    if (enhancedReady) {
      dispatchChoreographyEvent(CHOREO_TEARDOWN_EVENT, { reason: 'reinitialise' });
    }
    enhancedReady = false;
    window.__CLEAR_SEAS_SCROLL_CHOREO_READY = false;

    body.classList.add('scroll-choreography-active');
    frameScheduler.clear();
    if (typeof releaseSchedulerState === 'function') {
      releaseSchedulerState();
      releaseSchedulerState = null;
    }

    if (typeof stopLenis === 'function') {
      stopLenis();
      stopLenis = null;
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
    if (heroVisibilityObserver) {
      heroVisibilityObserver.disconnect();
      heroVisibilityObserver = null;
    }
    if (typeof detachDocumentVisibility === 'function') {
      detachDocumentVisibility();
      detachDocumentVisibility = null;
    }

    let lenisInstance = null;
    if (window.Lenis) {
      lenisInstance = new window.Lenis({
        duration: 1.2,
        smoothWheel: true,
        smoothTouch: false,
        gestureOrientation: 'vertical'
      });

      let lenisFrame = null;
      const updateScroll = (time) => {
        lenisInstance.raf(time);
        lenisFrame = requestAnimationFrame(updateScroll);
      };
      lenisFrame = requestAnimationFrame(updateScroll);

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

      const handleLenisScroll = () => ScrollTrigger.update();
      const handleScrollTriggerRefresh = () => {
        if (lenisInstance) {
          lenisInstance.update();
        }
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

      if (typeof lenisInstance.on === 'function') {
        lenisInstance.on('scroll', handleLenisScroll);
      }
      ScrollTrigger.addEventListener('refresh', handleScrollTriggerRefresh);

      stopLenis = () => {
        if (lenisFrame) {
          cancelAnimationFrame(lenisFrame);
          lenisFrame = null;
        }
        if (lenisInstance) {
          if (typeof lenisInstance.off === 'function') {
            lenisInstance.off('scroll', handleLenisScroll);
          }
          if (typeof lenisInstance.destroy === 'function') {
            lenisInstance.destroy();
          }
          lenisInstance = null;
        }
        ScrollTrigger.removeEventListener('refresh', handleScrollTriggerRefresh);
        if (typeof ScrollTrigger.scrollerProxy === 'function') {
          ScrollTrigger.scrollerProxy(document.body, null);
        }
      };
    } else {
      stopLenis = null;
    }

    const heroSection = document.querySelector('[data-scroll-scene="hero"]');
    const heroCards = gsap.utils.toArray('[data-visualizer-card]');
    const heroText = heroSection?.querySelector('.hero-text');
    const moireLayer = document.querySelector('[data-moire-layer]');

    if (!heroSection || heroCards.length === 0) {
      releaseSchedulerState = null;
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

    const morphProxy = { value: 0, lastNotified: NaN };
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
    const moireCommit = {
      active: false,
      last: {
        shift: '',
        rotation: '',
        scale: '',
        opacity: '',
        driftX: '',
        driftY: ''
      }
    };
    const heroFocusProxy = { base: 0, pointer: 0 };
    const heroFocusCommit = { active: false, lastTotal: NaN, lastBase: NaN, lastPointer: NaN };
    const pointerBridgeCache = { focus: NaN, shift: NaN };
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
      getController: () => polytopalController,
      rootStyleController: rootStyle,
      bodyStyleController: bodyStyle
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
        presetHint: 'stable',
        sceneActive: heroSceneActive ? 1 : 0
      });
    } else {
      heroBridgeUpdate = () => {};
      teardownHeroBridge = null;
    }

    const commitHeroFocus = () => {
      heroFocusCommit.active = false;
      const base = clamp01(heroFocusProxy.base);
      const pointer = clamp01(heroFocusProxy.pointer);
      const total = clamp01(base + pointer);
      const totalValue = total.toFixed(3);
      if (heroFocusCommit.lastTotal !== totalValue) {
        rootStyle.set('--hero-focus-gain', totalValue);
        heroFocusCommit.lastTotal = totalValue;
      }
      if (!floatEquals(heroFocusCommit.lastBase, base) || !floatEquals(heroFocusCommit.lastPointer, pointer)) {
        heroBridgeUpdate({ focus: base, pointerFocus: pointer });
        heroFocusCommit.lastBase = base;
        heroFocusCommit.lastPointer = pointer;
      }
    };

    const applyHeroFocus = () => {
      if (!heroFocusCommit.active) {
        heroFocusCommit.active = true;
        frameScheduler.schedule(commitHeroFocus);
      }
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
      rootStyle.set('--hero-mask-progress', clamped.toFixed(4));
      if (polytopalController && typeof polytopalController.setMorphProgress === 'function') {
        polytopalController.setMorphProgress(clamped);
      }
      if (!floatEquals(morphProxy.lastNotified, clamped)) {
        heroBridgeUpdate({ morph: clamped });
        morphProxy.lastNotified = clamped;
      }
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

    const commitMoireState = () => {
      moireCommit.active = false;
      const totalShift = moireProxy.baseShift + moireProxy.pointerShift;
      const shiftValue = `${totalShift.toFixed(2)}px`;
      if (moireCommit.last.shift !== shiftValue) {
        rootStyle.set('--moire-shift', shiftValue);
        moireCommit.last.shift = shiftValue;
      }
      const rotationValue = `${moireProxy.rotation.toFixed(3)}deg`;
      if (moireCommit.last.rotation !== rotationValue) {
        rootStyle.set('--moire-rotation', rotationValue);
        moireCommit.last.rotation = rotationValue;
      }
      const scaleValue = moireProxy.scale.toFixed(4);
      if (moireCommit.last.scale !== scaleValue) {
        rootStyle.set('--moire-scale', scaleValue);
        moireCommit.last.scale = scaleValue;
      }
      const opacityValue = moireProxy.opacity.toFixed(3);
      if (moireCommit.last.opacity !== opacityValue) {
        rootStyle.set('--moire-opacity', opacityValue);
        moireCommit.last.opacity = opacityValue;
      }
      const driftXValue = `${moireProxy.driftX.toFixed(2)}px`;
      if (moireCommit.last.driftX !== driftXValue) {
        rootStyle.set('--moire-drift-x', driftXValue);
        moireCommit.last.driftX = driftXValue;
      }
      const driftYValue = `${moireProxy.driftY.toFixed(2)}px`;
      if (moireCommit.last.driftY !== driftYValue) {
        rootStyle.set('--moire-drift-y', driftYValue);
        moireCommit.last.driftY = driftYValue;
      }
    };

    const applyMoireState = () => {
      if (!moireCommit.active) {
        moireCommit.active = true;
        frameScheduler.schedule(commitMoireState);
      }
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

    const cardPointerCache = new WeakMap();

    let heroSceneActive = false;
    let heroScrollActive = false;
    let heroViewportVisible = true;
    let heroDocumentVisible = !document.hidden;

    const pointerState = {
      active: false,
      shiftX: 0,
      tiltX: 0,
      tiltY: 0,
      focus: 0
    };
    const pointerTarget = { shiftX: 0, tiltX: 0, tiltY: 0, focus: 0 };

    const updatePointerEffects = () => {
      pointerState.active = false;
      pointerState.shiftX += (pointerTarget.shiftX - pointerState.shiftX) * 0.18;
      pointerState.tiltX += (pointerTarget.tiltX - pointerState.tiltX) * 0.2;
      pointerState.tiltY += (pointerTarget.tiltY - pointerState.tiltY) * 0.2;
      pointerState.focus += (pointerTarget.focus - pointerState.focus) * 0.16;

      moireProxy.pointerShift = pointerState.shiftX;
      applyMoireState();

      heroFocusProxy.pointer = pointerState.focus;
      applyHeroFocus();

      if (
        !floatEquals(pointerBridgeCache.focus, pointerState.focus, 0.01) ||
        !floatEquals(pointerBridgeCache.shift, pointerState.shiftX, 0.5)
      ) {
        heroBridgeUpdate({ pointerFocus: pointerState.focus, pointerShift: pointerState.shiftX });
        pointerBridgeCache.focus = pointerState.focus;
        pointerBridgeCache.shift = pointerState.shiftX;
      }

      rootStyle.set('--hero-pointer-tilt-x', pointerState.tiltX.toFixed(3));
      rootStyle.set('--hero-pointer-tilt-y', pointerState.tiltY.toFixed(3));

      heroCards.forEach((card) => {
        const depth = Number(card.getAttribute('data-scroll-card-depth') || 1);
        const tiltMultiplier = Math.min(1.6, depth + 0.25);
        const scaledTiltX = pointerState.tiltX * tiltMultiplier;
        const scaledTiltY = pointerState.tiltY * tiltMultiplier;
        const cache = cardPointerCache.get(card) || { tiltX: '', tiltY: '' };
        const tiltXValue = `${scaledTiltX.toFixed(3)}deg`;
        const tiltYValue = `${scaledTiltY.toFixed(3)}deg`;
        if (cache.tiltX !== tiltXValue) {
          card.style.setProperty('--card-pointer-tilt-x', tiltXValue);
          cache.tiltX = tiltXValue;
        }
        if (cache.tiltY !== tiltYValue) {
          card.style.setProperty('--card-pointer-tilt-y', tiltYValue);
          cache.tiltY = tiltYValue;
        }
        if (!cardPointerCache.has(card)) {
          cardPointerCache.set(card, cache);
        }
      });

      if (
        Math.abs(pointerState.shiftX - pointerTarget.shiftX) > 0.01 ||
        Math.abs(pointerState.tiltX - pointerTarget.tiltX) > 0.01 ||
        Math.abs(pointerState.tiltY - pointerTarget.tiltY) > 0.01 ||
        Math.abs(pointerState.focus - pointerTarget.focus) > 0.01
      ) {
        pointerState.active = true;
        frameScheduler.schedule(updatePointerEffects);
      }
    };

    const queuePointerUpdate = () => {
      if (!pointerState.active) {
        pointerState.active = true;
        frameScheduler.schedule(updatePointerEffects);
      }
    };

    const resetPointer = () => {
      pointerTarget.shiftX = 0;
      pointerTarget.tiltX = 0;
      pointerTarget.tiltY = 0;
      pointerTarget.focus = 0;
      queuePointerUpdate();
      pointerBridgeCache.focus = NaN;
      pointerBridgeCache.shift = NaN;
      heroBridgeUpdate({ pointerFocus: 0, pointerShift: 0 });
    };

    const updateHeroSceneActivation = () => {
      const shouldBeActive = heroScrollActive && heroViewportVisible && heroDocumentVisible;
      if (shouldBeActive === heroSceneActive) {
        return;
      }
      heroSceneActive = shouldBeActive;
      if (!heroSceneActive) {
        resetPointer();
        moireProxy.pointerShift = 0;
        applyMoireState();
      } else {
        queuePointerUpdate();
        applyMoireState();
        applyHeroFocus();
      }
      if (heroBridgeActive) {
        heroBridgeUpdate({ sceneActive: heroSceneActive ? 1 : 0 });
      }
    };

    releaseSchedulerState = () => {
      heroSceneActive = false;
      heroScrollActive = false;
      heroViewportVisible = true;
      heroDocumentVisible = !document.hidden;
      pointerState.active = false;
      heroFocusCommit.active = false;
      moireCommit.active = false;
      pointerTarget.shiftX = 0;
      pointerTarget.tiltX = 0;
      pointerTarget.tiltY = 0;
      pointerTarget.focus = 0;
      pointerBridgeCache.focus = NaN;
      pointerBridgeCache.shift = NaN;
      frameScheduler.cancel(updatePointerEffects);
      frameScheduler.cancel(commitHeroFocus);
      frameScheduler.cancel(commitMoireState);
      if (heroVisibilityObserver) {
        heroVisibilityObserver.disconnect();
        heroVisibilityObserver = null;
      }
      if (typeof detachDocumentVisibility === 'function') {
        detachDocumentVisibility();
        detachDocumentVisibility = null;
      }
      if (heroBridgeActive) {
        heroBridgeUpdate({ sceneActive: 0 });
      }
    };

    const handleMouseOut = (event) => {
      if (!event.relatedTarget || event.relatedTarget.nodeName === 'HTML') {
        resetPointer();
      }
    };

    const updatePointerFromInput = (clientX, clientY) => {
      if (!heroSceneActive) {
        return;
      }
      const viewportWidth = window.innerWidth || 1;
      const viewportHeight = window.innerHeight || 1;
      const normalizedX = clientX / viewportWidth - 0.5;
      const normalizedY = clientY / viewportHeight - 0.5;
      const nextShiftX = gsap.utils.clamp(-180, 180, normalizedX * 260);
      const nextTiltX = gsap.utils.clamp(-6.5, 6.5, normalizedX * 10);
      const nextTiltY = gsap.utils.clamp(-4.5, 4.5, normalizedY * -8);
      const focusFalloff = Math.min(1, Math.sqrt(normalizedX ** 2 + normalizedY ** 2) * 1.2);
      const nextFocus = Math.max(0, 0.65 - focusFalloff * 0.6);
      if (
        floatEquals(pointerTarget.shiftX, nextShiftX, 0.2) &&
        floatEquals(pointerTarget.tiltX, nextTiltX, 0.05) &&
        floatEquals(pointerTarget.tiltY, nextTiltY, 0.05) &&
        floatEquals(pointerTarget.focus, nextFocus, 0.02)
      ) {
        return;
      }
      pointerTarget.shiftX = nextShiftX;
      pointerTarget.tiltX = nextTiltX;
      pointerTarget.tiltY = nextTiltY;
      pointerTarget.focus = nextFocus;
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

    const timelineProgressCache = { progress: NaN };

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
        invalidateOnRefresh: true,
        onToggle(self) {
          heroScrollActive = Boolean(self?.isActive);
          updateHeroSceneActivation();
        }
      }
    });

    heroScrollActive = Boolean(heroTimeline.scrollTrigger?.isActive);
    updateHeroSceneActivation();

    if (heroVisibilityObserver) {
      heroVisibilityObserver.disconnect();
      heroVisibilityObserver = null;
    }
    if ('IntersectionObserver' in window && heroSection) {
      heroVisibilityObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.target !== heroSection) {
              return;
            }
            heroViewportVisible = entry.isIntersecting && entry.intersectionRatio > 0.08;
          });
          updateHeroSceneActivation();
        },
        { threshold: [0, 0.08, 0.2, 0.4] }
      );
      heroVisibilityObserver.observe(heroSection);
    }

    if (typeof detachDocumentVisibility === 'function') {
      detachDocumentVisibility();
      detachDocumentVisibility = null;
    }

    const handleDocumentVisibility = () => {
      heroDocumentVisible = !document.hidden;
      updateHeroSceneActivation();
      if (!heroDocumentVisible) {
        frameScheduler.clear();
      } else if (heroSceneActive) {
        queuePointerUpdate();
        applyMoireState();
        applyHeroFocus();
      }
    };

    document.addEventListener('visibilitychange', handleDocumentVisibility);
    detachDocumentVisibility = () => {
      document.removeEventListener('visibilitychange', handleDocumentVisibility);
      detachDocumentVisibility = null;
    };

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
            rootStyle.set('--hero-parallax-y', `${parallaxProxy.tilt.toFixed(2)}px`);
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
      const progress = heroTimeline.progress();
      if (!floatEquals(timelineProgressCache.progress, progress)) {
        timelineProgressCache.progress = progress;
        heroBridgeUpdate({ progress });
      }
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
        morph: morphProxy.value
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
    enhancedReady = true;
    window.__CLEAR_SEAS_SCROLL_CHOREO_READY = true;
    dispatchChoreographyEvent(CHOREO_READY_EVENT, { version: 'phase1' });
    ScrollTrigger.refresh();
  }

  function createHeroChoreographyBridge({
    root: rootElement,
    body: bodyElement,
    getController,
    rootStyleController,
    bodyStyleController
  }) {
    if (!rootElement) {
      return null;
    }

    const rootController = rootStyleController || createStyleController(rootElement);
    const bodyController = bodyElement
      ? bodyStyleController || createStyleController(bodyElement)
      : null;

    const state = {
      progress: 0,
      morph: 0,
      focus: 0,
      pointerFocus: 0,
      pointerShift: 0,
      presetHint: 'stable',
      sceneActive: 1
    };

    const lastDispatched = {
      progress: NaN,
      morph: NaN,
      focus: NaN,
      pointerFocus: NaN,
      pointerShift: NaN,
      energy: NaN,
      instability: NaN,
      density: NaN,
      stability: NaN,
      zoom: NaN,
      presetHint: '',
      sceneActive: NaN
    };

    const trackedProperties = [
      '--hero-choreo-progress',
      '--hero-energy',
      '--hero-instability',
      '--hero-surge',
      '--hero-focus-progress',
      '--hero-pointer-shift',
      '--hero-card-depth-lift',
      '--hero-scene-active',
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

    let queued = false;
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
      const sceneActive = clamp(state.sceneActive, 0, 1);
      const focusBase = clamp(state.focus) * sceneActive;
      const pointerFocusRaw = clamp(state.pointerFocus);
      const pointerFocus = pointerFocusRaw * sceneActive;
      const pointerShiftBase = Number.isFinite(state.pointerShift) ? state.pointerShift : 0;
      const pointerShift = pointerShiftBase * sceneActive;
      const presetHint = state.presetHint || 'stable';

      const releaseWeight = smoothstep(0.05, 0.32, progress) * sceneActive;
      const surgeWeight = smoothstep(0.18, 0.7, progress) * sceneActive;
      const focusWeight = smoothstep(0.58, 0.98, progress) * sceneActive;

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
      const energy = clamp((energyBase + morph * 0.25 + releaseWeight * 0.08 - focusWeight * 0.12) * sceneActive);
      const instability = clamp((
        lerp(0.18, 0.75, 1 - clamp(stability, 0.3, 1.4) / 1.4) + morph * 0.18
      ) * sceneActive);

      const combinedFocus = clamp(focusBase + pointerFocus);
      const cardLift = clamp((energy * 34 + pointerFocus * 14 + releaseWeight * 6) * sceneActive, 0, 56);

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
        presetHint,
        sceneActive
      };
    };

    const applyDerivedState = () => {
      queued = false;
      if (destroyed) {
        return;
      }

      const derived = computeDerivedState();

      rootController.set('--hero-choreo-progress', derived.progress.toFixed(4));
      rootController.set('--hero-energy', derived.energy.toFixed(4));
      rootController.set('--hero-instability', derived.instability.toFixed(4));
      rootController.set('--hero-surge', derived.surgeWeight.toFixed(4));
      rootController.set('--hero-focus-progress', derived.focusWeight.toFixed(4));
      rootController.set('--hero-pointer-shift', `${derived.pointerShift.toFixed(2)}px`);
      rootController.set('--hero-card-depth-lift', `${derived.cardLift.toFixed(2)}px`);
      rootController.set('--hero-scene-active', derived.sceneActive.toFixed(3));

      const textureOpacity = clamp(0.58 + derived.energy * 0.28 + derived.focusWeight * 0.08, 0.45, 0.95);
      const textureHue = `${(derived.surgeWeight * -18 + derived.focusWeight * 24).toFixed(2)}deg`;
      const textureSaturation = (0.88 + derived.energy * 0.4 + derived.focusWeight * 0.12).toFixed(3);

      rootController.set('--texture-opacity', textureOpacity.toFixed(3));
      rootController.set('--texture-hue', textureHue);
      rootController.set('--texture-saturation', textureSaturation);

      if (bodyController) {
        bodyController.set('--texture-opacity', textureOpacity.toFixed(3));
        bodyController.set('--texture-hue', textureHue);
        bodyController.set('--texture-saturation', textureSaturation);
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

      const shouldDispatch =
        !floatEquals(lastDispatched.progress, derived.progress) ||
        !floatEquals(lastDispatched.morph, derived.morph) ||
        !floatEquals(lastDispatched.focus, derived.focus) ||
        !floatEquals(lastDispatched.pointerFocus, derived.pointerFocus) ||
        !floatEquals(lastDispatched.pointerShift, derived.pointerShift) ||
        !floatEquals(lastDispatched.energy, derived.energy) ||
        !floatEquals(lastDispatched.instability, derived.instability) ||
        !floatEquals(lastDispatched.density, derived.density) ||
        !floatEquals(lastDispatched.stability, derived.stability) ||
        !floatEquals(lastDispatched.zoom, derived.zoom) ||
        !floatEquals(lastDispatched.sceneActive, derived.sceneActive) ||
        lastDispatched.presetHint !== derived.presetHint;

      if (shouldDispatch) {
        lastDispatched.progress = derived.progress;
        lastDispatched.morph = derived.morph;
        lastDispatched.focus = derived.focus;
        lastDispatched.pointerFocus = derived.pointerFocus;
        lastDispatched.pointerShift = derived.pointerShift;
        lastDispatched.energy = derived.energy;
        lastDispatched.instability = derived.instability;
        lastDispatched.density = derived.density;
        lastDispatched.stability = derived.stability;
        lastDispatched.zoom = derived.zoom;
        lastDispatched.sceneActive = derived.sceneActive;
        lastDispatched.presetHint = derived.presetHint;
        dispatchHeroEvent({ state: derived });
      }
    };

    const queueUpdate = () => {
      if (destroyed) {
        return;
      }
      if (!queued) {
        queued = true;
        frameScheduler.schedule(applyDerivedState);
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
        if (queued) {
          frameScheduler.cancel(applyDerivedState);
        }
        queued = false;
        rootController.clear(trackedProperties);
        if (bodyController) {
          bodyController.clear(['--texture-opacity', '--texture-hue', '--texture-saturation']);
        }
      }
    };
  }
})();
