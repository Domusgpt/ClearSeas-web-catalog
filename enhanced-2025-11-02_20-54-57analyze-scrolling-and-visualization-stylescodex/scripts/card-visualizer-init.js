(function () {
  'use strict';

  if (typeof window === 'undefined') {
    return;
  }

  const documentRef = document;
  const supportCache = { checked: false, value: false };
  const instances = new Map();
  let rafId = null;
  let reduceMotionQuery = null;
  let visibilityListenerAttached = false;
  let resizeListenerAttached = false;
  let motionListenerAttached = false;
  let heroListenerAttached = false;
  let intersectionObserver = null;

  const choreographyState = {
    density: 1,
    stability: 1,
    morph: 0,
    surgeWeight: 0,
    focusWeight: 0,
    releaseWeight: 0,
    energy: 0.35,
    instability: 0,
    zoom: 0,
    pointerFocus: 0
  };

  const hasActiveInstances = () => {
    for (const entry of instances.values()) {
      if (!entry || !entry.visualizer) {
        continue;
      }
      if (typeof entry.visualizer.needsFrame === 'function') {
        if (entry.visualizer.needsFrame()) {
          return true;
        }
      } else if (entry.visible !== false) {
        return true;
      }
    }
    return false;
  };

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const hasWebGLSupport = () => {
    if (supportCache.checked) {
      return supportCache.value;
    }

    supportCache.checked = true;
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      supportCache.value = Boolean(gl);
    } catch (error) {
      supportCache.value = false;
    }
    return supportCache.value;
  };

  const stopRenderLoop = () => {
    if (rafId !== null) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  const renderLoop = () => {
    rafId = null;
    if (documentRef.hidden) {
      return;
    }

    let shouldContinue = false;

    instances.forEach((entry) => {
      const { visualizer } = entry || {};
      if (!visualizer || typeof visualizer.render !== 'function') {
        return;
      }

      const needsFrame = typeof visualizer.needsFrame === 'function'
        ? visualizer.needsFrame()
        : entry && entry.visible !== false;

      if (!needsFrame) {
        return;
      }

      const result = visualizer.render();
      if (result !== false) {
        shouldContinue = true;
      }
    });

    if (shouldContinue && !documentRef.hidden) {
      rafId = window.requestAnimationFrame(renderLoop);
    }
  };

  const startRenderLoop = () => {
    if (rafId === null && hasActiveInstances() && !documentRef.hidden) {
      rafId = window.requestAnimationFrame(renderLoop);
    }
  };

  const applyChoreographyStateToVisualizer = (visualizer) => {
    if (!visualizer || typeof visualizer.setChoreographyState !== 'function') {
      return;
    }
    visualizer.setChoreographyState(choreographyState);
  };

  const broadcastChoreographyState = () => {
    instances.forEach(({ visualizer }) => {
      applyChoreographyStateToVisualizer(visualizer);
    });
  };

  const handleHeroChoreography = (event) => {
    const detail = event && event.detail && event.detail.state;
    if (!detail) {
      return;
    }

    const keys = [
      'density',
      'stability',
      'morph',
      'surgeWeight',
      'focusWeight',
      'releaseWeight',
      'energy',
      'instability',
      'zoom',
      'pointerFocus'
    ];

    let changed = false;
    keys.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(detail, key)) {
        const next = detail[key];
        if (Number.isFinite(next) && choreographyState[key] !== next) {
          choreographyState[key] = next;
          changed = true;
        }
      }
    });

    if (changed) {
      broadcastChoreographyState();
      startRenderLoop();
    }
  };

  const handleVisibilityChange = () => {
    if (documentRef.hidden) {
      stopRenderLoop();
    } else {
      startRenderLoop();
    }
  };

  const handleResize = () => {
    instances.forEach(({ visualizer }) => {
      if (visualizer && typeof visualizer.resize === 'function') {
        visualizer.resize();
      }
    });
  };

  const handleIntersectionEntries = (entries) => {
    if (!Array.isArray(entries)) {
      return;
    }

    let visibilityChanged = false;

    entries.forEach((entry) => {
      const card = entry && entry.target;
      if (!card) {
        return;
      }
      const data = instances.get(card);
      if (!data) {
        return;
      }
      const isVisible = Boolean(entry.isIntersecting && entry.intersectionRatio > 0.06);
      if (data.visible !== isVisible) {
        data.visible = isVisible;
        visibilityChanged = true;
      }
      if (data.visualizer && typeof data.visualizer.setVisibility === 'function') {
        data.visualizer.setVisibility(isVisible);
      }
    });

    if (visibilityChanged) {
      if (hasActiveInstances()) {
        startRenderLoop();
      } else {
        stopRenderLoop();
      }
    }
  };

  const destroyInstance = (card) => {
    const entry = instances.get(card);
    if (!entry) {
      return;
    }

    const { canvas, visualizer, surface, resizeObserver } = entry;

    card.removeEventListener('pointermove', entry.onPointerMove);
    card.removeEventListener('pointerenter', entry.onPointerEnter);
    card.removeEventListener('pointerleave', entry.onPointerLeave);
    card.removeEventListener('focusin', entry.onFocusIn);
    card.removeEventListener('focusout', entry.onFocusOut);

    if (intersectionObserver && typeof intersectionObserver.unobserve === 'function') {
      intersectionObserver.unobserve(card);
    }

    if (resizeObserver && typeof resizeObserver.disconnect === 'function') {
      resizeObserver.disconnect();
    }

    if (visualizer && typeof visualizer.destroy === 'function') {
      visualizer.destroy();
    }

    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }

    if (surface) {
      surface.removeAttribute('data-visualizer-ready');
    }
    card.removeAttribute('data-visualizer-ready');
    card.removeAttribute('data-visualizer-hover');

    instances.delete(card);
  };

  const destroyAll = () => {
    stopRenderLoop();
    Array.from(instances.keys()).forEach((card) => destroyInstance(card));

    if (visibilityListenerAttached) {
      documentRef.removeEventListener('visibilitychange', handleVisibilityChange);
      visibilityListenerAttached = false;
    }

    if (resizeListenerAttached) {
      window.removeEventListener('resize', handleResize);
      resizeListenerAttached = false;
    }

    if (reduceMotionQuery && motionListenerAttached) {
      if (typeof reduceMotionQuery.removeEventListener === 'function') {
        reduceMotionQuery.removeEventListener('change', handleMotionPreferenceChange);
      } else if (typeof reduceMotionQuery.removeListener === 'function') {
        reduceMotionQuery.removeListener(handleMotionPreferenceChange);
      }
      motionListenerAttached = false;
    }

    if (heroListenerAttached) {
      window.removeEventListener('hero:choreography', handleHeroChoreography);
      heroListenerAttached = false;
    }

    if (intersectionObserver && typeof intersectionObserver.disconnect === 'function') {
      intersectionObserver.disconnect();
    }
    intersectionObserver = null;
  };

  function handleMotionPreferenceChange(event) {
    if (event.matches) {
      destroyAll();
      documentRef.documentElement.classList.add('card-visualizer-fallback');
    } else {
      initialise();
    }
  }

  const createInstance = (card, index) => {
    const surface = card.querySelector('[data-card-visualizer]');
    if (!surface) {
      return;
    }

    const CanvasConstructor = window.CardPolytopeVisualizer;
    if (typeof CanvasConstructor !== 'function') {
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.className = 'card-visualizer-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    surface.prepend(canvas);

    const mode = surface.getAttribute('data-visualizer-mode')
      || (index % 2 === 0 ? 'quantum' : 'holographic');

    let visualizer = null;
    try {
      visualizer = new CanvasConstructor(canvas, mode);
    } catch (error) {
      console.warn('Card visualizer failed to initialize', error);
      canvas.remove();
      return;
    }

    if (visualizer && typeof visualizer.resize === 'function') {
      visualizer.resize();
    }

    const handlePointerMove = (event) => {
      if (!visualizer || typeof visualizer.setMousePosition !== 'function') {
        return;
      }
      const rect = card.getBoundingClientRect();
      const relativeX = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      const relativeY = clamp((event.clientY - rect.top) / rect.height, 0, 1);
      visualizer.setMousePosition(relativeX, relativeY);
    };

    const handlePointerEnter = (event) => {
      card.setAttribute('data-visualizer-hover', 'true');
      if (visualizer && typeof visualizer.setFocusBoost === 'function') {
        visualizer.setFocusBoost(0.45);
      }
      handlePointerMove(event);
      startRenderLoop();
    };

    const handlePointerLeave = () => {
      card.removeAttribute('data-visualizer-hover');
      if (visualizer && typeof visualizer.setMousePosition === 'function') {
        visualizer.setMousePosition(0.5, 0.5);
      }
      if (visualizer && typeof visualizer.setFocusBoost === 'function') {
        visualizer.setFocusBoost(0);
      }
      startRenderLoop();
    };

    const handleFocusIn = () => {
      card.setAttribute('data-visualizer-hover', 'true');
      if (visualizer && typeof visualizer.setFocusBoost === 'function') {
        visualizer.setFocusBoost(0.4);
      }
      startRenderLoop();
    };

    const handleFocusOut = () => {
      card.removeAttribute('data-visualizer-hover');
      if (visualizer && typeof visualizer.setFocusBoost === 'function') {
        visualizer.setFocusBoost(0);
      }
      startRenderLoop();
    };

    card.addEventListener('pointermove', handlePointerMove);
    card.addEventListener('pointerenter', handlePointerEnter);
    card.addEventListener('pointerleave', handlePointerLeave);
    card.addEventListener('focusin', handleFocusIn);
    card.addEventListener('focusout', handleFocusOut);

    let resizeObserver = null;
    if ('ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(() => {
        if (visualizer && typeof visualizer.resize === 'function') {
          visualizer.resize();
        }
      });
      resizeObserver.observe(surface);
    }

    surface.setAttribute('data-visualizer-ready', 'true');
    card.setAttribute('data-visualizer-ready', 'true');

    const viewportHeight = window.innerHeight || documentRef.documentElement.clientHeight || 0;
    const rect = card.getBoundingClientRect();
    const initialVisible = rect.bottom > 0 && rect.top < viewportHeight;

    if (visualizer && typeof visualizer.setVisibility === 'function') {
      visualizer.setVisibility(initialVisible);
    }

    applyChoreographyStateToVisualizer(visualizer);

    const instanceData = {
      canvas,
      visualizer,
      surface,
      resizeObserver,
      onPointerMove: handlePointerMove,
      onPointerEnter: handlePointerEnter,
      onPointerLeave: handlePointerLeave,
      onFocusIn: handleFocusIn,
      onFocusOut: handleFocusOut,
      visible: initialVisible
    };

    instances.set(card, instanceData);

    if (intersectionObserver && typeof intersectionObserver.observe === 'function') {
      intersectionObserver.observe(card);
    }

    startRenderLoop();
  };

  const initialise = () => {
    if (instances.size > 0) {
      destroyAll();
    }

    reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduceMotionQuery.matches || !hasWebGLSupport()) {
      documentRef.documentElement.classList.add('card-visualizer-fallback');
      return;
    }

    if (typeof window.CardPolytopeVisualizer !== 'function') {
      console.warn('CardPolytopeVisualizer script is not loaded.');
      documentRef.documentElement.classList.add('card-visualizer-fallback');
      return;
    }

    const cards = Array.from(documentRef.querySelectorAll('[data-visualizer-card]'));
    if (cards.length === 0) {
      return;
    }

    if ('IntersectionObserver' in window) {
      if (intersectionObserver && typeof intersectionObserver.disconnect === 'function') {
        intersectionObserver.disconnect();
      }
      intersectionObserver = new IntersectionObserver(handleIntersectionEntries, {
        threshold: 0.08,
        rootMargin: '0px 0px -10% 0px'
      });
    } else {
      intersectionObserver = null;
    }

    cards.forEach((card, index) => createInstance(card, index));

    if (instances.size === 0) {
      documentRef.documentElement.classList.add('card-visualizer-fallback');
      return;
    }

    documentRef.documentElement.classList.remove('card-visualizer-fallback');

    if (!visibilityListenerAttached) {
      documentRef.addEventListener('visibilitychange', handleVisibilityChange);
      visibilityListenerAttached = true;
    }

    if (!resizeListenerAttached) {
      window.addEventListener('resize', handleResize, { passive: true });
      resizeListenerAttached = true;
    }

    if (reduceMotionQuery && !motionListenerAttached) {
      if (typeof reduceMotionQuery.addEventListener === 'function') {
        reduceMotionQuery.addEventListener('change', handleMotionPreferenceChange);
      } else if (typeof reduceMotionQuery.addListener === 'function') {
        reduceMotionQuery.addListener(handleMotionPreferenceChange);
      }
      motionListenerAttached = true;
    }

    if (!heroListenerAttached) {
      window.addEventListener('hero:choreography', handleHeroChoreography);
      heroListenerAttached = true;
    }

    broadcastChoreographyState();

    startRenderLoop();
  };

  const run = () => {
    try {
      initialise();
    } catch (error) {
      console.warn('Card visualizer initialisation failed', error);
      destroyAll();
      documentRef.documentElement.classList.add('card-visualizer-fallback');
    }
  };

  if (documentRef.readyState === 'loading') {
    documentRef.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }

  window.addEventListener('beforeunload', destroyAll);
})();
