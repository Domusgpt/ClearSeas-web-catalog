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

    instances.forEach(({ visualizer }) => {
      if (visualizer && typeof visualizer.render === 'function') {
        visualizer.render();
      }
    });

    rafId = window.requestAnimationFrame(renderLoop);
  };

  const startRenderLoop = () => {
    if (rafId === null && instances.size > 0 && !documentRef.hidden) {
      rafId = window.requestAnimationFrame(renderLoop);
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
      handlePointerMove(event);
    };

    const handlePointerLeave = () => {
      card.removeAttribute('data-visualizer-hover');
      if (visualizer && typeof visualizer.setMousePosition === 'function') {
        visualizer.setMousePosition(0.5, 0.5);
      }
    };

    const handleFocusIn = () => {
      card.setAttribute('data-visualizer-hover', 'true');
    };

    const handleFocusOut = () => {
      card.removeAttribute('data-visualizer-hover');
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

    instances.set(card, {
      canvas,
      visualizer,
      surface,
      resizeObserver,
      onPointerMove: handlePointerMove,
      onPointerEnter: handlePointerEnter,
      onPointerLeave: handlePointerLeave,
      onFocusIn: handleFocusIn,
      onFocusOut: handleFocusOut
    });
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
