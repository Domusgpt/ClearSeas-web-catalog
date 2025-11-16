(function () {
  const header = document.querySelector('.site-header');
  const navToggle = document.querySelector('.nav-toggle');
  const navigation = document.getElementById('primary-navigation');

  const updateHeaderState = () => {
    if (!header) return;
    if (window.scrollY > 12) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  };

  updateHeaderState();
  window.addEventListener('scroll', updateHeaderState, { passive: true });

  if (navToggle && navigation) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      navigation.classList.toggle('is-open', !expanded);
    });

    navigation.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navToggle.setAttribute('aria-expanded', 'false');
        navigation.classList.remove('is-open');
      });
    });
  }

  const revealables = document.querySelectorAll('[data-animate="reveal"]');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.2,
        rootMargin: '0px 0px -60px 0px'
      }
    );

    revealables.forEach((element) => observer.observe(element));
  } else {
    revealables.forEach((element) => element.classList.add('is-visible'));
  }

  const canvas = document.getElementById('polytopal-field');
  if (!window.__CLEAR_SEAS_POLYTOPAL) {
    window.__CLEAR_SEAS_POLYTOPAL = null;
  }
  if (canvas && canvas.getContext) {
    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let teardownPolytopal = null;
    let staticResizeHandler = null;
    let polytopalController = null;

    const createPolytopalEvent = (type, detail) => {
      const eventDetail = {
        controller: polytopalController,
        ...detail
      };

      if (typeof window.CustomEvent === 'function') {
        return new CustomEvent(type, { detail: eventDetail });
      }

      const legacyEvent = document.createEvent('CustomEvent');
      legacyEvent.initCustomEvent(type, false, false, eventDetail);
      return legacyEvent;
    };

    const dispatchPolytopalEvent = (type, detail) => {
      try {
        window.dispatchEvent(createPolytopalEvent(type, detail));
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('[ClearSeas] Failed to dispatch polytopal event', type, error);
      }
    };

    const setPolytopalController = (controller) => {
      if (controller && typeof controller === 'object') {
        polytopalController = controller;
      } else {
        polytopalController = null;
      }
      window.__CLEAR_SEAS_POLYTOPAL = polytopalController;
      dispatchPolytopalEvent('polytopal:controller', { controller: polytopalController });
      if (polytopalController) {
        dispatchPolytopalEvent('polytopal:ready', { controller: polytopalController });
      }
    };

    const applyPolytopalResult = (result) => {
      if (typeof teardownPolytopal === 'function') {
        teardownPolytopal();
      }

      teardownPolytopal = null;

      if (result && typeof result === 'object') {
        if (typeof result.teardown === 'function') {
          teardownPolytopal = result.teardown;
        }
        setPolytopalController(result.controller);
      } else if (typeof result === 'function') {
        teardownPolytopal = result;
        setPolytopalController(null);
      } else {
        setPolytopalController(null);
      }
    };

    const drawStaticGradient = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, 'rgba(0, 212, 255, 0.08)');
      gradient.addColorStop(1, 'rgba(255, 0, 110, 0.05)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    };

    const enableStaticGradient = () => {
      drawStaticGradient();
      if (!staticResizeHandler) {
        staticResizeHandler = throttle(drawStaticGradient, 200);
        window.addEventListener('resize', staticResizeHandler, { passive: true });
      }
      setPolytopalController(null);
    };

    const disableStaticGradient = () => {
      if (staticResizeHandler) {
        window.removeEventListener('resize', staticResizeHandler);
        staticResizeHandler = null;
      }
    };

    if (!reduceMotionQuery.matches) {
      disableStaticGradient();
      const result = initPolytopalField(canvas);
      applyPolytopalResult(result);
    } else {
      applyPolytopalResult(null);
      enableStaticGradient();
    }

    const handleReduceMotionChange = (event) => {
      if (event.matches) {
        applyPolytopalResult(null);
        enableStaticGradient();
      } else if (!teardownPolytopal) {
        disableStaticGradient();
        const result = initPolytopalField(canvas);
        applyPolytopalResult(result);
      }
    };

    if (reduceMotionQuery.addEventListener) {
      reduceMotionQuery.addEventListener('change', handleReduceMotionChange);
    } else if (reduceMotionQuery.addListener) {
      reduceMotionQuery.addListener(handleReduceMotionChange);
    }
  }

  const yearElement = document.getElementById('current-year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
})();

function initPolytopalField(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let animationFrameId = null;
  let nodes = [];

  const pointer = { x: 0, y: 0, active: false };

  const settings = {
    baseCount: 70,
    maxVelocity: 0.35,
    connectionDistance: 180
  };

  const baseSettings = {
    baseCount: settings.baseCount,
    maxVelocity: settings.maxVelocity,
    connectionDistance: settings.connectionDistance
  };

  const parameterState = {
    density: 1,
    stability: 1,
    zoom: 0,
    morphProgress: 0
  };

  const parameterPresets = {
    stable: { density: 1, stability: 1.2, zoom: -0.05 },
    unstable: { density: 1.35, stability: 0.55, zoom: 0.4 },
    disperse: { density: 0.75, stability: 0.8, zoom: 0.85 },
    surge: { density: 1.6, stability: 0.68, zoom: 1.05 },
    focus: { density: 0.92, stability: 1.35, zoom: 0.18 }
  };

  let parameterAnimationId = null;

  const createNode = () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * settings.maxVelocity,
    vy: (Math.random() - 0.5) * settings.maxVelocity,
    radius: Math.random() * 1.4 + 0.8
  });

  const computeTargetNodeCount = () => {
    const ratio = width / 1280 + 0.4;
    return Math.max(24, Math.round(settings.baseCount * ratio));
  };

  const rebuildNodes = (targetCount) => {
    if (!Number.isFinite(targetCount) || targetCount <= 0) {
      nodes = [];
      return;
    }

    if (nodes.length === 0) {
      nodes = Array.from({ length: targetCount }, createNode);
      return;
    }

    if (targetCount > nodes.length) {
      const additional = targetCount - nodes.length;
      for (let i = 0; i < additional; i += 1) {
        nodes.push(createNode());
      }
    } else if (targetCount < nodes.length) {
      nodes.length = targetCount;
    }
  };

  const applyParameterState = () => {
    const densityFactor = clamp(parameterState.density, 0.35, 1.85);
    const stabilityFactor = clamp(parameterState.stability, 0.35, 1.4);
    const zoomFactor = clamp(parameterState.zoom, -0.3, 1.2);
    const morphFactor = clamp(parameterState.morphProgress, 0, 1);

    settings.baseCount = Math.round(baseSettings.baseCount * densityFactor);
    settings.maxVelocity = baseSettings.maxVelocity * (1.05 + (1 - stabilityFactor) * 0.85 + zoomFactor * 0.3);
    settings.connectionDistance = baseSettings.connectionDistance * (0.9 + stabilityFactor * 0.35 + zoomFactor * 0.25 + morphFactor * 0.12);

    rebuildNodes(computeTargetNodeCount());
  };

  const setParameterState = (nextState) => {
    if (!nextState || typeof nextState !== 'object') {
      return { ...parameterState };
    }

    if (typeof nextState.density === 'number') {
      parameterState.density = nextState.density;
    }
    if (typeof nextState.stability === 'number') {
      parameterState.stability = nextState.stability;
    }
    if (typeof nextState.zoom === 'number') {
      parameterState.zoom = nextState.zoom;
    }

    applyParameterState();
    return { ...parameterState };
  };

  const stopParameterAnimation = () => {
    if (parameterAnimationId) {
      window.cancelAnimationFrame(parameterAnimationId);
      parameterAnimationId = null;
    }
  };

  const easeInOut = (t) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  };

  const lerp = (a, b, t) => a + (b - a) * t;

  const animateParameterState = (targetState, options = {}) => {
    if (!targetState) {
      return;
    }

    const duration = Math.max(0.25, Number(options.duration) || 1);
    const startState = { ...parameterState };
    const resolvedTarget = {
      density: typeof targetState.density === 'number' ? targetState.density : startState.density,
      stability: typeof targetState.stability === 'number' ? targetState.stability : startState.stability,
      zoom: typeof targetState.zoom === 'number' ? targetState.zoom : startState.zoom
    };

    stopParameterAnimation();

    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / (duration * 1000));
      const eased = easeInOut(progress);

      parameterState.density = lerp(startState.density, resolvedTarget.density, eased);
      parameterState.stability = lerp(startState.stability, resolvedTarget.stability, eased);
      parameterState.zoom = lerp(startState.zoom, resolvedTarget.zoom, eased);

      applyParameterState();

      if (progress < 1) {
        parameterAnimationId = window.requestAnimationFrame(animate);
      } else {
        parameterAnimationId = null;
      }
    };

    parameterAnimationId = window.requestAnimationFrame(animate);
  };

  const setPreset = (name) => {
    const preset = parameterPresets[name];
    if (!preset) {
      return;
    }
    stopParameterAnimation();
    setParameterState(preset);
  };

  const transitionToPreset = (name, options = {}) => {
    const preset = parameterPresets[name];
    if (!preset) {
      return;
    }
    animateParameterState(preset, options);
  };

  const setMorphProgress = (value) => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return;
    }
    parameterState.morphProgress = clamp(value, 0, 1);
    applyParameterState();
  };

  const resizeCanvas = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    const deviceRatio = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = width * deviceRatio;
    canvas.height = height * deviceRatio;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(deviceRatio, deviceRatio);
    applyParameterState();
  };

  const updateNodes = () => {
    const stabilityFactor = clamp(parameterState.stability, 0.35, 1.4);
    const instability = Math.max(0, 1.2 - stabilityFactor);
    const zoomFactor = clamp(parameterState.zoom, -0.3, 1.2);
    const damping = 0.99 - Math.min(stabilityFactor, 1.2) * 0.015;

    nodes.forEach((node) => {
      node.vx += (Math.random() - 0.5) * instability * 0.02;
      node.vy += (Math.random() - 0.5) * instability * 0.02;

      node.x += node.vx;
      node.y += node.vy;

      if (node.x < -50) node.x = width + 50;
      if (node.x > width + 50) node.x = -50;
      if (node.y < -50) node.y = height + 50;
      if (node.y > height + 50) node.y = -50;

      if (pointer.active) {
        const dx = pointer.x - node.x;
        const dy = pointer.y - node.y;
        const distSq = dx * dx + dy * dy + 0.001;
        const influence = Math.min(0.45 + zoomFactor * 0.1, 1200 / distSq);
        node.vx += dx * influence * 0.00035;
        node.vy += dy * influence * 0.00035;
      }

      node.vx *= damping;
      node.vy *= damping;

      node.vx = clamp(node.vx, -settings.maxVelocity, settings.maxVelocity);
      node.vy = clamp(node.vy, -settings.maxVelocity, settings.maxVelocity);
    });
  };

  const drawConnections = () => {
    const maxDistance = settings.connectionDistance * (width < 768 ? 0.75 : 1);
    const morphFactor = clamp(parameterState.morphProgress, 0, 1);

    const connectionColor = (alpha) => {
      const r = Math.round(lerp(0, 255, morphFactor));
      const g = Math.round(lerp(212, 32, morphFactor));
      const b = Math.round(lerp(255, 180, morphFactor));
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    for (let i = 0; i < nodes.length; i += 1) {
      const nodeA = nodes[i];

      for (let j = i + 1; j < nodes.length; j += 1) {
        const nodeB = nodes[j];
        const dx = nodeA.x - nodeB.x;
        const dy = nodeA.y - nodeB.y;
        const distance = Math.hypot(dx, dy);

        if (distance < maxDistance) {
          const alpha = (1 - distance / maxDistance) * 0.45;
          ctx.strokeStyle = connectionColor(alpha);
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(nodeA.x, nodeA.y);
          ctx.lineTo(nodeB.x, nodeB.y);
          ctx.stroke();
        }
      }

      if (pointer.active) {
        const dxPointer = nodeA.x - pointer.x;
        const dyPointer = nodeA.y - pointer.y;
        const pointerDistance = Math.hypot(dxPointer, dyPointer);
        const pointerThreshold = maxDistance * 1.1;

        if (pointerDistance < pointerThreshold) {
          const alpha = (1 - pointerDistance / pointerThreshold) * 0.6;
          ctx.strokeStyle = `rgba(${Math.round(lerp(255, 120, morphFactor))}, ${Math.round(lerp(0, 64, morphFactor))}, ${Math.round(lerp(110, 220, morphFactor))}, ${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(nodeA.x, nodeA.y);
          ctx.lineTo(pointer.x, pointer.y);
          ctx.stroke();
        }
      }
    }
  };

  const drawNodes = () => {
    const zoomScale = 1 + clamp(parameterState.zoom, -0.3, 1.2) * 0.45;
    const stabilityFactor = clamp(parameterState.stability, 0.35, 1.4);
    const morphFactor = clamp(parameterState.morphProgress, 0, 1);
    const innerAlpha = 0.45 + Math.max(0, 1.1 - stabilityFactor) * 0.2 + morphFactor * 0.15;
    const chromaInfluence = clamp(
      0.18 + Math.max(0, 1.2 - stabilityFactor) * 0.55 + morphFactor * 0.4 + Math.max(0, parameterState.zoom) * 0.3,
      0.18,
      1.15
    );
    const chromaSpread = 12 + morphFactor * 36 + Math.max(0, 1 - stabilityFactor) * 22 + Math.max(0, parameterState.zoom) * 30;

    nodes.forEach((node) => {
      const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.radius * 8 * zoomScale);
      const innerColor = `rgba(${Math.round(lerp(0, 255, morphFactor))}, ${Math.round(lerp(212, 64, morphFactor))}, ${Math.round(lerp(255, 210, morphFactor))}, ${innerAlpha})`;
      gradient.addColorStop(0, innerColor);
      gradient.addColorStop(1, 'rgba(0, 212, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius * 3 * zoomScale, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const channelOpacity = 0.08 + chromaInfluence * 0.18;
      const channelRadius = node.radius * (2.6 + chromaInfluence * 1.4);
      const offsets = [
        {
          dx: -chromaSpread * 0.24,
          dy: -chromaSpread * 0.12,
          color: `rgba(255, 64, 110, ${channelOpacity})`
        },
        {
          dx: chromaSpread * 0.18,
          dy: chromaSpread * 0.14,
          color: `rgba(0, 214, 255, ${channelOpacity * 0.85})`
        },
        {
          dx: chromaSpread * 0.32,
          dy: -chromaSpread * 0.2,
          color: `rgba(120, 92, 255, ${channelOpacity * 0.75})`
        }
      ];

      offsets.forEach((offset) => {
        ctx.fillStyle = offset.color;
        ctx.beginPath();
        ctx.arc(node.x + offset.dx, node.y + offset.dy, channelRadius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    });

    if (pointer.active) {
      const pointerGradient = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 120);
      const pointerStart = `rgba(${Math.round(lerp(255, 120, morphFactor))}, ${Math.round(lerp(0, 54, morphFactor))}, ${Math.round(lerp(110, 220, morphFactor))}, ${0.25 + morphFactor * 0.15})`;
      pointerGradient.addColorStop(0, pointerStart);
      pointerGradient.addColorStop(1, 'rgba(255, 0, 110, 0)');
      ctx.fillStyle = pointerGradient;
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, 120, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawChromaticVeil = () => {
    const morphFactor = clamp(parameterState.morphProgress, 0, 1);
    const stabilityFactor = clamp(parameterState.stability, 0.35, 1.4);
    const zoomFactor = clamp(parameterState.zoom, -0.3, 1.2);
    const intensity = clamp(0.035 + morphFactor * 0.06 + Math.max(0, 1.1 - stabilityFactor) * 0.05 + Math.max(0, zoomFactor) * 0.04, 0.02, 0.16);
    const bandSpacing = 54 - morphFactor * 18 + Math.max(0, zoomFactor) * 26;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = intensity;

    const offset = (performance.now() / 45) % bandSpacing;
    for (let y = -bandSpacing; y < height + bandSpacing; y += bandSpacing) {
      ctx.fillStyle = 'rgba(255, 64, 110, 0.55)';
      ctx.fillRect(-bandSpacing, y + offset, width + bandSpacing * 2, 1.4);

      ctx.fillStyle = 'rgba(0, 214, 255, 0.42)';
      ctx.fillRect(-bandSpacing, y + offset + bandSpacing * 0.33, width + bandSpacing * 2, 1);

      ctx.fillStyle = 'rgba(120, 92, 255, 0.38)';
      ctx.fillRect(-bandSpacing, y + offset + bandSpacing * 0.66, width + bandSpacing * 2, 1.2);
    }

    ctx.restore();
  };

  const renderFrame = () => {
    ctx.clearRect(0, 0, width, height);

    const backdropGradient = ctx.createLinearGradient(0, 0, width, height);
    backdropGradient.addColorStop(0, 'rgba(0, 212, 255, 0.07)');
    backdropGradient.addColorStop(1, 'rgba(255, 0, 110, 0.05)');
    ctx.fillStyle = backdropGradient;
    ctx.fillRect(0, 0, width, height);

    updateNodes();
    drawConnections();
    drawNodes();
    drawChromaticVeil();

    animationFrameId = window.requestAnimationFrame(renderFrame);
  };

  const throttledResize = throttle(resizeCanvas, 250);
  window.addEventListener('resize', throttledResize, { passive: true });

  const handleMouseMove = (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
  };

  const handleMouseLeave = () => {
    pointer.active = false;
  };

  const handleTouchMove = (event) => {
    if (event.touches && event.touches.length > 0) {
      pointer.x = event.touches[0].clientX;
      pointer.y = event.touches[0].clientY;
      pointer.active = true;
    }
  };

  const handleTouchEnd = () => {
    pointer.active = false;
  };

  window.addEventListener('mousemove', handleMouseMove, { passive: true });
  window.addEventListener('mouseleave', handleMouseLeave);
  window.addEventListener('touchmove', handleTouchMove, { passive: true });
  window.addEventListener('touchend', handleTouchEnd);

  resizeCanvas();
  renderFrame();

  const teardown = () => {
    if (animationFrameId) {
      window.cancelAnimationFrame(animationFrameId);
    }

    window.removeEventListener('resize', throttledResize);
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseleave', handleMouseLeave);
    window.removeEventListener('touchmove', handleTouchMove);
    window.removeEventListener('touchend', handleTouchEnd);

    stopParameterAnimation();
    ctx.clearRect(0, 0, width, height);

    dispatchPolytopalEvent('polytopal:teardown', { reason: 'teardown' });
  };

  const controller = {
    getState: () => ({ ...parameterState }),
    setState: (next) => setParameterState(next),
    setPreset: (name) => setPreset(name),
    transitionTo: (preset, options) => {
      if (typeof preset === 'string') {
        transitionToPreset(preset, options);
      } else {
        animateParameterState(preset, options);
      }
    },
    transitionToState: (state, options) => animateParameterState(state, options),
    setMorphProgress: (value) => setMorphProgress(value)
  };

  return { teardown, controller };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function throttle(callback, wait) {
  let ticking = false;
  let lastArgs;

  const invoke = () => {
    ticking = false;
    if (lastArgs) {
      callback.apply(null, lastArgs);
      lastArgs = null;
    } else {
      callback();
    }
  };

  return function throttledFunction(...args) {
    lastArgs = args;
    if (!ticking) {
      ticking = true;
      window.setTimeout(invoke, wait);
    }
  };
}
