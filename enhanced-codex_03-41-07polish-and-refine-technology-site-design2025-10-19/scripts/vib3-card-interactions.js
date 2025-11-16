/**
 * VIB3+ Card Holographic Float & Tilt System
 * Interactive card bending with dynamic VIB3+ engine visualization
 * © 2025 Clear Seas Solutions
 */

(function() {
  'use strict';

  const cardRegistry = new Map();
  const preparedCards = new WeakSet();
  const cardStates = new WeakMap();
  let activeCard = null;
  let rafId = null;
  let motionEnabled = true;
  let viewportObserver = null;
  const supportsIntersectionObserver = typeof window !== 'undefined' && 'IntersectionObserver' in window;

  // Configuration
  const CONFIG = {
    tiltStrength: 15,        // Max tilt degrees
    floatDistance: 25,       // Max float distance in px
    glowIntensity: 40,       // Glow blur in px
    vib3Opacity: 0.35,       // VIB3+ engine opacity
    transitionSpeed: 200,    // Transition duration in ms
    vib3Scale: 0.48,         // Scale of VIB3+ iframe
    overlayParallax: 22,     // Max px overlay translation for parallax
    frameSize: 1400,         // Size of the iframe viewport for cropping
    frameFocusOffsetX: 50,   // Default percentage offset to center VIB3+ focal point
    frameFocusOffsetY: 54,   // Default percentage offset to center VIB3+ focal point
    prewarmMargin: '160px',  // Root margin for viewport observer prewarm
    prewarmThreshold: 0.15,  // Threshold before hydrating an overlay
  };

  const BASE_ENGINE_URL = 'https://domusgpt.github.io/vib3-plus-engine/';

  const HOLOGRAM_VARIANTS = {
    signals: [
      {
        id: 'signals-quantum-core',
        node: 'quantum',
        geometry: '24-cell',
        hue: 192,
        intensity: 0.86,
        shimmer: 1,
        chroma: 1.2,
        prism: 0.28,
        rot4d: 'quantum',
        orbit: 19,
        pulse: 0.52,
        phase: 24,
        glowColor: '0, 214, 255',
        glowBase: 0.34,
        glowResponse: 0.013,
        saturation: 1.24,
        parallax: 18,
        focus: { x: 49, y: 52, scale: 0.5 },
        hyper: {
          pitch: -6,
          yaw: 11,
          twist: 18,
          axis: [0.32, 0.24, 1],
          angle: 14,
          tiltResponse: 0.35,
          twistResponse: 0.08,
        },
      },
      {
        id: 'signals-quantum-halo',
        node: 'quantum',
        geometry: '16-cell',
        hue: 204,
        intensity: 0.88,
        shimmer: 1,
        chroma: 1.18,
        prism: 0.24,
        rot4d: 'quantum',
        orbit: 21,
        pulse: 0.56,
        phase: 28,
        glowColor: '32, 216, 255',
        glowBase: 0.36,
        glowResponse: 0.014,
        saturation: 1.27,
        parallax: 20,
        focus: { x: 48, y: 54, scale: 0.52 },
        hyper: {
          pitch: -4,
          yaw: 14,
          twist: 22,
          axis: [0.28, 0.3, 1],
          angle: 16,
          tiltResponse: 0.38,
          twistResponse: 0.1,
        },
      },
      {
        id: 'signals-holographic-cascade',
        node: 'holographic',
        geometry: '5-cell',
        hue: 210,
        intensity: 0.9,
        shimmer: 1,
        chroma: 1.22,
        prism: 0.26,
        rot4d: 'holographic',
        orbit: 23,
        pulse: 0.5,
        phase: 32,
        glowColor: '0, 180, 255',
        glowBase: 0.35,
        glowResponse: 0.015,
        saturation: 1.3,
        parallax: 22,
        focus: { x: 47, y: 55, scale: 0.53 },
        hyper: {
          pitch: -8,
          yaw: 9,
          twist: 24,
          axis: [0.4, 0.18, 1],
          angle: 18,
          tiltResponse: 0.36,
          twistResponse: 0.1,
        },
      },
    ],
    capabilities: [
      {
        id: 'capabilities-holographic-orchid',
        node: 'holographic',
        geometry: '600-cell',
        hue: 284,
        intensity: 0.82,
        shimmer: 1,
        chroma: 1.22,
        prism: 0.3,
        rot4d: 'holographic',
        orbit: 18,
        pulse: 0.48,
        phase: 18,
        glowColor: '188, 132, 255',
        glowBase: 0.33,
        glowResponse: 0.013,
        saturation: 1.25,
        parallax: 17,
        focus: { x: 50, y: 54, scale: 0.48 },
        hyper: {
          pitch: -5,
          yaw: 12,
          twist: 20,
          axis: [0.22, 0.46, 1],
          angle: 18,
          tiltResponse: 0.34,
          twistResponse: 0.09,
        },
      },
      {
        id: 'capabilities-quantum-violet',
        node: 'quantum',
        geometry: '120-cell',
        hue: 296,
        intensity: 0.84,
        shimmer: 1,
        chroma: 1.28,
        prism: 0.32,
        rot4d: 'quantum',
        orbit: 20,
        pulse: 0.52,
        phase: 24,
        glowColor: '207, 132, 255',
        glowBase: 0.35,
        glowResponse: 0.014,
        saturation: 1.32,
        parallax: 19,
        focus: { x: 48, y: 55, scale: 0.5 },
        hyper: {
          pitch: -7,
          yaw: 8,
          twist: 26,
          axis: [0.36, 0.36, 1],
          angle: 21,
          tiltResponse: 0.37,
          twistResponse: 0.1,
        },
      },
      {
        id: 'capabilities-holographic-amethyst',
        node: 'holographic',
        geometry: '24-cell',
        hue: 268,
        intensity: 0.8,
        shimmer: 1,
        chroma: 1.16,
        prism: 0.28,
        rot4d: 'holographic',
        orbit: 22,
        pulse: 0.5,
        phase: 30,
        glowColor: '176, 101, 255',
        glowBase: 0.32,
        glowResponse: 0.012,
        saturation: 1.2,
        parallax: 16,
        focus: { x: 51, y: 56, scale: 0.49 },
        hyper: {
          pitch: -3,
          yaw: 10,
          twist: 24,
          axis: [0.18, 0.52, 1],
          angle: 19,
          tiltResponse: 0.33,
          twistResponse: 0.09,
        },
      },
    ],
    platforms: [
      {
        id: 'platforms-quantum-azure',
        node: 'quantum',
        geometry: '24-cell',
        hue: 208,
        intensity: 0.88,
        shimmer: 1,
        chroma: 1.14,
        prism: 0.22,
        rot4d: 'quantum',
        orbit: 24,
        pulse: 0.58,
        phase: 20,
        glowColor: '64, 196, 255',
        glowBase: 0.34,
        glowResponse: 0.012,
        saturation: 1.22,
        parallax: 22,
        focus: { x: 46, y: 52, scale: 0.51 },
        hyper: {
          pitch: -9,
          yaw: 6,
          twist: 20,
          axis: [0.44, 0.18, 1],
          angle: 18,
          tiltResponse: 0.4,
          twistResponse: 0.09,
        },
      },
      {
        id: 'platforms-holographic-cerulean',
        node: 'holographic',
        geometry: '16-cell',
        hue: 222,
        intensity: 0.9,
        shimmer: 1,
        chroma: 1.2,
        prism: 0.24,
        rot4d: 'holographic',
        orbit: 26,
        pulse: 0.6,
        phase: 26,
        glowColor: '38, 184, 255',
        glowBase: 0.35,
        glowResponse: 0.014,
        saturation: 1.26,
        parallax: 23,
        focus: { x: 47, y: 54, scale: 0.52 },
        hyper: {
          pitch: -10,
          yaw: 12,
          twist: 24,
          axis: [0.38, 0.26, 1],
          angle: 21,
          tiltResponse: 0.39,
          twistResponse: 0.1,
        },
      },
      {
        id: 'platforms-quantum-lumen',
        node: 'quantum',
        geometry: '5-cell',
        hue: 198,
        intensity: 0.92,
        shimmer: 1,
        chroma: 1.26,
        prism: 0.2,
        rot4d: 'quantum',
        orbit: 28,
        pulse: 0.62,
        phase: 30,
        glowColor: '52, 204, 255',
        glowBase: 0.36,
        glowResponse: 0.015,
        saturation: 1.3,
        parallax: 24,
        focus: { x: 45, y: 53, scale: 0.54 },
        hyper: {
          pitch: -12,
          yaw: 9,
          twist: 28,
          axis: [0.46, 0.22, 1],
          angle: 22,
          tiltResponse: 0.38,
          twistResponse: 0.11,
        },
      },
    ],
    research: [
      {
        id: 'research-quantum-copper',
        node: 'quantum',
        geometry: '120-cell',
        hue: 32,
        intensity: 0.78,
        shimmer: 1,
        chroma: 1.18,
        prism: 0.28,
        rot4d: 'quantum',
        orbit: 18,
        pulse: 0.46,
        phase: 22,
        glowColor: '255, 176, 102',
        glowBase: 0.32,
        glowResponse: 0.012,
        saturation: 1.18,
        parallax: 16,
        focus: { x: 50, y: 56, scale: 0.48 },
        hyper: {
          pitch: -6,
          yaw: 10,
          twist: 24,
          axis: [0.36, 0.34, 1],
          angle: 16,
          tiltResponse: 0.33,
          twistResponse: 0.08,
        },
      },
      {
        id: 'research-holographic-ember',
        node: 'holographic',
        geometry: '24-cell',
        hue: 18,
        intensity: 0.8,
        shimmer: 1,
        chroma: 1.22,
        prism: 0.26,
        rot4d: 'holographic',
        orbit: 20,
        pulse: 0.48,
        phase: 28,
        glowColor: '255, 148, 82',
        glowBase: 0.33,
        glowResponse: 0.013,
        saturation: 1.24,
        parallax: 18,
        focus: { x: 49, y: 55, scale: 0.49 },
        hyper: {
          pitch: -5,
          yaw: 12,
          twist: 22,
          axis: [0.32, 0.36, 1],
          angle: 18,
          tiltResponse: 0.35,
          twistResponse: 0.09,
        },
      },
      {
        id: 'research-quantum-verdant',
        node: 'quantum',
        geometry: '24-cell',
        hue: 146,
        intensity: 0.82,
        shimmer: 1,
        chroma: 1.16,
        prism: 0.24,
        rot4d: 'quantum',
        orbit: 22,
        pulse: 0.5,
        phase: 32,
        glowColor: '138, 242, 196',
        glowBase: 0.31,
        glowResponse: 0.012,
        saturation: 1.2,
        parallax: 17,
        focus: { x: 48, y: 53, scale: 0.5 },
        hyper: {
          pitch: -7,
          yaw: 9,
          twist: 26,
          axis: [0.28, 0.42, 1],
          angle: 20,
          tiltResponse: 0.34,
          twistResponse: 0.1,
        },
      },
    ],
    roadmap: [
      {
        id: 'roadmap-holographic-aurora',
        node: 'holographic',
        geometry: '24-cell',
        hue: 188,
        intensity: 0.84,
        shimmer: 1,
        chroma: 1.12,
        prism: 0.2,
        rot4d: 'holographic',
        orbit: 22,
        pulse: 0.5,
        phase: 26,
        glowColor: '0, 196, 255',
        glowBase: 0.33,
        glowResponse: 0.012,
        saturation: 1.22,
        parallax: 20,
        focus: { x: 48, y: 56, scale: 0.49 },
        hyper: {
          pitch: -5,
          yaw: 8,
          twist: 24,
          axis: [0.3, 0.26, 1],
          angle: 16,
          tiltResponse: 0.35,
          twistResponse: 0.08,
        },
      },
      {
        id: 'roadmap-quantum-horizon',
        node: 'quantum',
        geometry: '16-cell',
        hue: 204,
        intensity: 0.86,
        shimmer: 1,
        chroma: 1.16,
        prism: 0.22,
        rot4d: 'quantum',
        orbit: 24,
        pulse: 0.54,
        phase: 30,
        glowColor: '24, 196, 255',
        glowBase: 0.35,
        glowResponse: 0.013,
        saturation: 1.26,
        parallax: 21,
        focus: { x: 47, y: 53, scale: 0.51 },
        hyper: {
          pitch: -4,
          yaw: 10,
          twist: 26,
          axis: [0.4, 0.22, 1],
          angle: 18,
          tiltResponse: 0.38,
          twistResponse: 0.09,
        },
      },
      {
        id: 'roadmap-holographic-lagoon',
        node: 'holographic',
        geometry: '5-cell',
        hue: 200,
        intensity: 0.88,
        shimmer: 1,
        chroma: 1.18,
        prism: 0.24,
        rot4d: 'holographic',
        orbit: 26,
        pulse: 0.56,
        phase: 34,
        glowColor: '0, 204, 255',
        glowBase: 0.34,
        glowResponse: 0.013,
        saturation: 1.28,
        parallax: 22,
        focus: { x: 46, y: 54, scale: 0.52 },
        hyper: {
          pitch: -6,
          yaw: 12,
          twist: 28,
          axis: [0.36, 0.24, 1],
          angle: 20,
          tiltResponse: 0.37,
          twistResponse: 0.1,
        },
      },
    ],
    legacy: [
      {
        id: 'legacy-quantum-aqua',
        node: 'quantum',
        geometry: '24-cell',
        hue: 188,
        intensity: 0.82,
        shimmer: 1,
        chroma: 1.08,
        prism: 0.2,
        rot4d: 'quantum',
        orbit: 16,
        pulse: 0.44,
        phase: 20,
        glowColor: '152, 240, 255',
        glowBase: 0.28,
        glowResponse: 0.01,
        saturation: 1.12,
        parallax: 14,
        focus: { x: 49, y: 55, scale: 0.47 },
        hyper: {
          pitch: -4,
          yaw: 7,
          twist: 18,
          axis: [0.26, 0.2, 1],
          angle: 14,
          tiltResponse: 0.3,
          twistResponse: 0.07,
        },
      },
      {
        id: 'legacy-holographic-opal',
        node: 'holographic',
        geometry: '16-cell',
        hue: 172,
        intensity: 0.78,
        shimmer: 1,
        chroma: 1.04,
        prism: 0.18,
        rot4d: 'holographic',
        orbit: 18,
        pulse: 0.46,
        phase: 26,
        glowColor: '128, 232, 255',
        glowBase: 0.3,
        glowResponse: 0.011,
        saturation: 1.14,
        parallax: 15,
        focus: { x: 50, y: 53, scale: 0.46 },
        hyper: {
          pitch: -3,
          yaw: 9,
          twist: 20,
          axis: [0.24, 0.24, 1],
          angle: 16,
          tiltResponse: 0.31,
          twistResponse: 0.08,
        },
      },
      {
        id: 'legacy-quantum-halo',
        node: 'quantum',
        geometry: '5-cell',
        hue: 164,
        intensity: 0.8,
        shimmer: 1,
        chroma: 1.1,
        prism: 0.2,
        rot4d: 'quantum',
        orbit: 20,
        pulse: 0.48,
        phase: 30,
        glowColor: '96, 228, 255',
        glowBase: 0.29,
        glowResponse: 0.012,
        saturation: 1.16,
        parallax: 16,
        focus: { x: 48, y: 57, scale: 0.48 },
        hyper: {
          pitch: -5,
          yaw: 11,
          twist: 22,
          axis: [0.3, 0.26, 1],
          angle: 17,
          tiltResponse: 0.32,
          twistResponse: 0.09,
        },
      },
    ],
  };
  const CARD_GROUPS = [
    {
      selector: '.signal-card.vcodex-neoskeu-card',
      variantKey: 'signals',
    },
    {
      selector: '.capability-card.vcodex-neoskeu-card',
      variantKey: 'capabilities',
    },
    {
      selector: '.platform-card.vcodex-neoskeu-card',
      variantKey: 'platforms',
    },
    {
      selector: '.research-lab.vcodex-neoskeu-card',
      variantKey: 'research',
    },
    {
      selector: '.step.vcodex-neoskeu-card',
      variantKey: 'roadmap',
    },
    {
      selector: '.legacy-signal.vcodex-neoskeu-card',
      variantKey: 'legacy',
    },
  ];

  function getVariant(variantKey, index) {
    const variants = HOLOGRAM_VARIANTS[variantKey];

    if (!variants || variants.length === 0) {
      return null;
    }

    return variants[index % variants.length];
  }

  function cloneVariant(baseVariant) {
    if (!baseVariant) return null;

    const clone = {
      ...baseVariant,
    };

    if (baseVariant.focus) {
      clone.focus = { ...baseVariant.focus };
    }

    if (baseVariant.hyper) {
      clone.hyper = { ...baseVariant.hyper };

      if (baseVariant.hyper.axis) {
        clone.hyper.axis = [...baseVariant.hyper.axis];
      }

      if (baseVariant.hyper.sweep) {
        clone.hyper.sweep = { ...baseVariant.hyper.sweep };
      }
    }

    return clone;
  }

  function deriveVariant(baseVariant, state, cycle) {
    if (!baseVariant) return null;

    const normalizedCycle = cycle != null ? cycle : 0;
    const oscillationSeed = state.seed;
    const cyclePhase = normalizedCycle + oscillationSeed;
    const sinValue = Math.sin(cyclePhase * 0.82);
    const cosValue = Math.cos(cyclePhase * 0.68);

    const variant = cloneVariant(baseVariant);

    if (variant.focus) {
      const baseScale = variant.focus.scale != null ? variant.focus.scale : CONFIG.vib3Scale;
      const baseX = variant.focus.x != null ? variant.focus.x : CONFIG.frameFocusOffsetX;
      const baseY = variant.focus.y != null ? variant.focus.y : CONFIG.frameFocusOffsetY;

      variant.focus.scale = parseFloat((baseScale * (1 + sinValue * 0.045)).toFixed(4));
      variant.focus.x = parseFloat((baseX + cosValue * 1.8).toFixed(3));
      variant.focus.y = parseFloat((baseY + sinValue * 1.5).toFixed(3));
    }

    if (variant.orbit != null) {
      variant.orbit = parseFloat((variant.orbit + sinValue * 1.6).toFixed(3));
    }

    if (variant.pulse != null) {
      variant.pulse = parseFloat((variant.pulse + cosValue * 0.035).toFixed(3));
    }

    if (variant.phase != null) {
      const basePhase = baseVariant.phase != null ? baseVariant.phase : 0;
      const computedPhase = (basePhase + Math.round(((cyclePhase * 11) % 360) + 360)) % 360;
      variant.phase = computedPhase;
    }

    const hyper = variant.hyper || {};
    const baseHyper = baseVariant.hyper || {};

    hyper.pitch = baseHyper.pitch != null ? baseHyper.pitch : hyper.pitch;
    hyper.yaw = baseHyper.yaw != null ? baseHyper.yaw : hyper.yaw;
    hyper.twist = baseHyper.twist != null ? baseHyper.twist : hyper.twist;
    hyper.tiltResponse = baseHyper.tiltResponse != null ? baseHyper.tiltResponse : hyper.tiltResponse;
    hyper.twistResponse = baseHyper.twistResponse != null ? baseHyper.twistResponse : hyper.twistResponse;
    hyper.angle = baseHyper.angle != null ? baseHyper.angle : hyper.angle;
    hyper.axis = baseHyper.axis ? [...baseHyper.axis] : hyper.axis;

    const sweepDefaults = baseHyper.sweep || {};
    hyper.sweep = {
      pitch: sweepDefaults.pitch != null ? sweepDefaults.pitch : 10 + sinValue * 4,
      yaw: sweepDefaults.yaw != null ? sweepDefaults.yaw : -8 + cosValue * 2.5,
      twist: sweepDefaults.twist != null ? sweepDefaults.twist : 22 + sinValue * 5,
      scale: sweepDefaults.scale != null ? sweepDefaults.scale : 0.12 + cosValue * 0.035,
      translate: sweepDefaults.translate != null ? sweepDefaults.translate : 18 + sinValue * 4,
      mask: sweepDefaults.mask != null ? sweepDefaults.mask : 16 + cosValue * 6,
    };

    variant.hyper = hyper;
    variant.variantCycle = normalizedCycle;

    return variant;
  }

  function ensureCardVariant(card, variantKey, index) {
    let state = cardStates.get(card);

    if (state) {
      return state;
    }

    const variants = HOLOGRAM_VARIANTS[variantKey] || [];
    const normalizedIndex = variants.length ? index % variants.length : 0;

    state = {
      variantKey,
      variants,
      cursor: normalizedIndex,
      cycle: 0,
      variant: null,
      occlusion: 1,
      currentTiltX: 0,
      currentTiltY: 0,
      currentParallaxX: 0,
      seed: Math.random() * Math.PI * 2,
      sweepRaf: null,
      occlusionAngle: 0,
    };

    const baseVariant = variants[normalizedIndex] || null;
    state.variant = deriveVariant(baseVariant, state, 0);
    state.occlusionAngle = computeOcclusionAngle(state);

    cardStates.set(card, state);

    return state;
  }

  function computeOcclusionAngle(state) {
    const baseCycle = state.cycle || 0;
    const orientation = baseCycle % 4;
    const baseAngle = orientation * (Math.PI / 2);
    return baseAngle + (state.seed * 0.35);
  }

  function advanceVariant(state) {
    if (!state || !state.variants.length) {
      return state?.variant || null;
    }

    state.cursor = (state.cursor + 1) % state.variants.length;
    state.cycle = (state.cycle + 1) || 1;

    const baseVariant = state.variants[state.cursor];
    state.variant = deriveVariant(baseVariant, state, state.cycle);
    state.occlusionAngle = computeOcclusionAngle(state);

    return state.variant;
  }

  function composeEngineUrl(variant) {
    const params = new URLSearchParams();

    params.set('auto', '1');
    params.set('shimmer', variant?.shimmer != null ? String(variant.shimmer) : '1');

    const geometry = variant?.geometry || '24-cell';
    const hue = variant?.hue != null ? variant.hue : 188;
    const intensity = variant?.intensity != null ? variant.intensity : 0.82;
    const nodeMode = variant?.node || 'quantum';
    const rotationMode = variant?.rot4d || nodeMode;

    params.set('geo', geometry);
    params.set('hue', String(hue));
    params.set('intensity', intensity.toFixed(2));
    params.set('node', nodeMode);
    params.set('rot4d', rotationMode);

    if (variant) {
      const optionalParams = {
        chroma: variant.chroma,
        prism: variant.prism,
        orbit: variant.orbit,
        pulse: variant.pulse,
        phase: variant.phase,
        bloom: variant.bloom,
        gradient: variant.gradient,
        flow: variant.flow,
      };

      Object.entries(optionalParams).forEach(([key, value]) => {
        if (value == null) return;
        params.set(key, String(value));
      });
    }

    return `${BASE_ENGINE_URL}?${params.toString()}`;
  }

  function refreshOverlayTheme(overlay, variant) {
    if (!overlay) return;

    const { container } = overlay;

    if (!variant) {
      delete container.dataset.vib3Variant;
      delete container.dataset.vib3Node;
      container.style.filter = 'blur(0.4px)';
      container.style.background = 'transparent';
      container.style.mixBlendMode = 'screen';
      container.style.removeProperty('--vib3-variant-accent');
      return;
    }

    const accent = variant.glowColor || '0, 212, 255';
    const accentAlpha = variant.overlayAccentAlpha != null ? variant.overlayAccentAlpha : 0.18;

    container.dataset.vib3Variant = variant.id;
    container.dataset.vib3Node = variant.node || 'quantum';
    container.style.filter = `saturate(${variant.saturation || 1.2}) blur(0.35px)`;
    container.style.background = `radial-gradient(circle at 32% 24%, rgba(${accent}, ${accentAlpha}), transparent 68%)`;
    const blendMode = variant.node === 'holographic' ? 'lighter' : 'screen';
    container.style.mixBlendMode = blendMode;
    container.style.setProperty('--vib3-variant-accent', `rgba(${accent}, 0.65)`);
  }

  function updateOverlaySource(overlay, variant, options = {}) {
    if (!overlay) return;

    const { hydrate = true } = options;
    const frame = overlay.frame;
    const src = composeEngineUrl(variant);

    if (frame.dataset.vib3Src !== src) {
      frame.dataset.vib3Src = src;
    }

    if (hydrate) {
      if (frame.src !== src) {
        frame.src = src;
      }
      frame.dataset.vib3Hydrated = '1';
      return;
    }

    if (frame.dataset.vib3Hydrated === '1') {
      frame.dataset.vib3Hydrated = '0';
      frame.src = 'about:blank';
      frame.removeAttribute('src');
    }
  }

  function buildFrameTransform(variant, tiltX = 0, tiltY = 0, parallaxX = 0, occlusion = 1) {
    const focusX = variant?.focus?.x != null ? variant.focus.x : CONFIG.frameFocusOffsetX;
    const focusY = variant?.focus?.y != null ? variant.focus.y : CONFIG.frameFocusOffsetY;
    const focusScale = variant?.focus?.scale != null ? variant.focus.scale : CONFIG.vib3Scale;

    const hyper = variant?.hyper || {};
    const tiltResponse = hyper.tiltResponse != null ? hyper.tiltResponse : 0.4;
    const twistResponse = hyper.twistResponse != null ? hyper.twistResponse : 0.1;
    const pitchOffset = hyper.pitch != null ? hyper.pitch : 0;
    const yawOffset = hyper.yaw != null ? hyper.yaw : 0;
    const twistOffset = hyper.twist != null ? hyper.twist : 0;
    const sweep = hyper.sweep || {};
    const sweepProgress = 1 - Math.min(Math.max(occlusion, 0), 1);

    const sweepPitch = sweep.pitch != null ? sweep.pitch : 10;
    const sweepYaw = sweep.yaw != null ? sweep.yaw : -6;
    const sweepTwist = sweep.twist != null ? sweep.twist : 18;
    const sweepScale = sweep.scale != null ? sweep.scale : 0.12;
    const sweepTranslate = sweep.translate != null ? sweep.translate : 16;

    const segments = [
      `translate(-${focusX}%, -${focusY}%)`,
      `scale(${focusScale * (1 + sweepProgress * sweepScale)})`,
      `translate3d(0, 0, ${sweepTranslate * sweepProgress}px)`,
      `rotateX(${pitchOffset + (-tiltX * tiltResponse) + (sweepProgress * sweepPitch)}deg)`,
      `rotateY(${yawOffset + (tiltY * tiltResponse) + (sweepProgress * sweepYaw)}deg)`,
      `rotateZ(${twistOffset + (parallaxX * twistResponse) + (sweepProgress * sweepTwist)}deg)`,
    ];

    if (hyper.axis && hyper.axis.length === 3 && hyper.angle != null) {
      const [ax, ay, az] = hyper.axis;
      segments.push(`rotate3d(${ax}, ${ay}, ${az}, ${hyper.angle}deg)`);
    }

    return segments.join(' ');
  }

  /**
   * Create / cache a VIB3+ overlay inside the provided card
   */
  function ensureCardOverlay(card, state, options = {}) {
    const { hydrate = false } = options;
    const variant = state?.variant;
    let overlay = cardRegistry.get(card);

    if (overlay) {
      refreshOverlayTheme(overlay, variant);
      updateOverlaySource(overlay, variant, { hydrate });
      overlay.frame.style.transform = buildFrameTransform(variant, 0, 0, 0, state?.occlusion ?? 1);
      applyOcclusion(overlay, state, state?.occlusion ?? 1);
      return overlay;
    }

    const computedStyle = window.getComputedStyle(card);
    const cardPosition = computedStyle.position;

    if (cardPosition === 'static') {
      card.style.position = 'relative';
    }

    const container = document.createElement('div');
    container.className = 'vib3-dynamic-viz';
    container.style.cssText = `
      position: absolute;
      inset: 0;
      pointer-events: none;
      overflow: hidden;
      border-radius: ${computedStyle.borderRadius || '24px'};
      opacity: 0;
      transition: none;
      mix-blend-mode: screen;
      filter: blur(0.4px);
      z-index: 0;
    `;
    container.style.clipPath = 'circle(0% at 50% 50%)';
    container.style.maskImage = 'radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 1) 45%, rgba(0, 0, 0, 0) 100%)';
    container.style.setProperty('--vib3-occlusion', '1');

    const frame = document.createElement('iframe');
    frame.src = '';
    frame.setAttribute('tabindex', '-1');
    frame.setAttribute('aria-hidden', 'true');
    frame.setAttribute('loading', 'lazy');
    frame.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: ${CONFIG.frameSize}px;
      height: ${CONFIG.frameSize}px;
      transform: translate(-${CONFIG.frameFocusOffsetX}%, -${CONFIG.frameFocusOffsetY}%) scale(${CONFIG.vib3Scale});
      transform-origin: 50% 50%;
      border: none;
      background: transparent;
      pointer-events: none;
    `;
    frame.style.visibility = 'hidden';

    container.appendChild(frame);
    card.insertBefore(container, card.firstChild);

    overlay = { container, frame };
    cardRegistry.set(card, overlay);

    refreshOverlayTheme(overlay, variant);
    updateOverlaySource(overlay, variant, { hydrate });
    frame.style.transform = buildFrameTransform(variant, 0, 0, 0, state?.occlusion ?? 1);
    applyOcclusion(overlay, state, state?.occlusion ?? 1);

    state.overlay = overlay;

    return overlay;
  }

  function easeInOutCubic(t) {
    if (t < 0.5) {
      return 4 * t * t * t;
    }

    return 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function applyOcclusion(overlay, state, value) {
    if (!overlay || !state) {
      return 1;
    }

    const clamped = Math.min(Math.max(value, 0), 1);
    const angle = state.occlusionAngle || 0;
    const radius = Math.max(0, (1 - clamped) * 96);
    const centerX = 50 + Math.cos(angle) * 18;
    const centerY = 52 + Math.sin(angle) * 14;
    const maskRadius = Math.max(0, (1 - clamped) * (state.variant?.hyper?.sweep?.mask || 22));

    if (radius <= 0.25) {
      overlay.container.style.clipPath = 'circle(0% at 50% 50%)';
    } else {
      overlay.container.style.clipPath = `circle(${radius.toFixed(2)}% at ${centerX.toFixed(2)}% ${centerY.toFixed(2)}%)`;
    }

    overlay.container.style.setProperty('--vib3-occlusion', clamped.toFixed(4));
    overlay.container.style.maskImage = `radial-gradient(circle at ${centerX.toFixed(2)}% ${centerY.toFixed(2)}%, rgba(0, 0, 0, 1) ${(45 + maskRadius).toFixed(2)}%, rgba(0, 0, 0, 0) 100%)`;

    const variant = state.variant;
    const baseOpacity = variant?.opacity != null ? variant.opacity : CONFIG.vib3Opacity;
    overlay.container.style.opacity = (baseOpacity * (1 - clamped)).toFixed(3);

    return clamped;
  }

  function transitionOcclusion(card, state, overlay, target, options = {}) {
    if (!overlay || !state) {
      return Promise.resolve();
    }

    const toValue = Math.min(Math.max(target, 0), 1);
    const startValue = state.occlusion != null ? state.occlusion : 1;

    if (!motionEnabled || options.instant || startValue === toValue) {
      const clamped = applyOcclusion(overlay, state, toValue);
      state.occlusion = clamped;

      if (clamped === 0 && typeof options.afterVisible === 'function') {
        options.afterVisible();
      }

      if (clamped === 1 && typeof options.afterHidden === 'function') {
        options.afterHidden();
      }

      return Promise.resolve();
    }

    if (state.sweepRaf) {
      cancelAnimationFrame(state.sweepRaf);
      state.sweepRaf = null;
    }

    const duration = options.duration != null ? options.duration : 620;
    const easing = typeof options.easing === 'function' ? options.easing : easeInOutCubic;
    const tiltX = state.currentTiltX || 0;
    const tiltY = state.currentTiltY || 0;
    const parallaxX = state.currentParallaxX || 0;

    return new Promise((resolve) => {
      let startTime = null;

      function step(timestamp) {
        if (startTime == null) {
          startTime = timestamp;
        }

        const elapsed = timestamp - startTime;
        const rawProgress = Math.min(elapsed / duration, 1);
        const eased = easing(rawProgress);
        const interpolated = startValue + (toValue - startValue) * eased;
        const clamped = applyOcclusion(overlay, state, interpolated);

        overlay.frame.style.transform = buildFrameTransform(state.variant, tiltX, tiltY, parallaxX, clamped);
        state.occlusion = clamped;

        if (rawProgress < 1) {
          state.sweepRaf = requestAnimationFrame(step);
          return;
        }

        state.sweepRaf = null;

        if (clamped === 0 && typeof options.afterVisible === 'function') {
          options.afterVisible();
        }

        if (clamped === 1 && typeof options.afterHidden === 'function') {
          options.afterHidden();
        }

        resolve();
      }

      state.sweepRaf = requestAnimationFrame(step);
    });
  }

  function prepareNextVariant(card, state) {
    if (!state) return;

    const overlay = cardRegistry.get(card);
    const variant = advanceVariant(state);

    if (!variant || !overlay) {
      return;
    }

    refreshOverlayTheme(overlay, variant);
    updateOverlaySource(overlay, variant, { hydrate: true });
    overlay.frame.style.transform = buildFrameTransform(variant, 0, 0, 0, state.occlusion ?? 1);
    overlay.frame.style.visibility = 'hidden';
    applyOcclusion(overlay, state, state.occlusion ?? 1);
  }

  function handleCardVisibility(entries) {
    if (!motionEnabled) return;

    entries.forEach((entry) => {
      const card = entry.target;
      const state = cardStates.get(card);

      if (!state) return;

      if (entry.isIntersecting) {
        const overlay = ensureCardOverlay(card, state, { hydrate: true });
        applyOcclusion(overlay, state, state.occlusion ?? 1);
        overlay.container.style.transform = 'translate3d(0, 0, 0)';
        overlay.container.style.willChange = 'opacity, clip-path, mask-image';
        overlay.frame.style.visibility = state.occlusion === 0 ? 'visible' : 'hidden';
        return;
      }

      if (activeCard === card) {
        return;
      }

      const overlay = cardRegistry.get(card);

      if (!overlay) {
        return;
      }

      transitionOcclusion(card, state, overlay, 1, { instant: true }).then(() => {
        overlay.container.style.transform = 'translate3d(0, 0, 0)';
        overlay.container.style.willChange = 'auto';
        overlay.frame.style.visibility = 'hidden';
        updateOverlaySource(overlay, state.variant, { hydrate: false });
      });
    });
  }

  function getViewportObserver() {
    if (!supportsIntersectionObserver) {
      return null;
    }

    if (!viewportObserver) {
      viewportObserver = new IntersectionObserver(handleCardVisibility, {
        rootMargin: CONFIG.prewarmMargin,
        threshold: CONFIG.prewarmThreshold,
      });
    }

    return viewportObserver;
  }

  /**
   * Calculate card tilt based on mouse position
   */
  function calculateTilt(card, e) {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const deltaX = x - centerX;
    const deltaY = y - centerY;

    const tiltX = -(deltaY / centerY) * CONFIG.tiltStrength;
    const tiltY = (deltaX / centerX) * CONFIG.tiltStrength;

    return { tiltX, tiltY, deltaX, deltaY, centerX, centerY };
  }

  /**
   * Apply holographic float and tilt to card
   */
  function applyCardTransform(card, tilt) {
    const { tiltX, tiltY } = tilt;
    const scale = 1.05;
    const translateZ = CONFIG.floatDistance;

    card.style.transform = `
      perspective(1000px)
      translateY(-${translateZ}px)
      translateZ(${translateZ}px)
      rotateX(${tiltX}deg)
      rotateY(${tiltY}deg)
      scale(${scale})
    `;

    const glowStrength = Math.abs(tiltX) + Math.abs(tiltY);
    const state = cardStates.get(card);
    const variant = state?.variant;
    const glowColor = variant?.glowColor || (card.classList.contains('signal-card') || card.classList.contains('platform-card')
      ? '0, 212, 255'
      : '192, 132, 252');
    const glowBase = variant?.glowBase != null ? variant.glowBase : 0.3;
    const glowResponse = variant?.glowResponse != null ? variant.glowResponse : 0.01;
    const glowAlpha = glowBase + (glowStrength * glowResponse);

    card.style.boxShadow = `
      0 ${CONFIG.floatDistance * 1.5}px ${CONFIG.glowIntensity + glowStrength}px rgba(0, 0, 0, 0.4),
      0 0 ${CONFIG.glowIntensity}px rgba(${glowColor}, ${Math.min(glowAlpha, 0.6)})
    `;
  }

  /**
   * Position VIB3+ visualization behind card
   */
  function positionVib3Visual(card, tilt) {
    const overlay = cardRegistry.get(card);

    if (!overlay) return;

    const { tiltX, tiltY, deltaX, deltaY, centerX, centerY } = tilt;
    const { container } = overlay;
    const state = cardStates.get(card);
    const variant = state?.variant;
    const parallaxScale = variant?.parallax != null ? variant.parallax : CONFIG.overlayParallax;

    const parallaxX = (deltaX / centerX) * parallaxScale;
    const parallaxY = (deltaY / centerY) * parallaxScale;

    container.style.transform = `translate3d(${parallaxX}px, ${parallaxY}px, 0)`;
    if (state) {
      state.currentTiltX = tiltX;
      state.currentTiltY = tiltY;
      state.currentParallaxX = parallaxX;
      const occlusion = state.occlusion != null ? state.occlusion : 1;
      overlay.frame.style.transform = buildFrameTransform(variant, tiltX, tiltY, parallaxX, occlusion);
      const targetOpacity = variant?.opacity != null ? variant.opacity : CONFIG.vib3Opacity;
      container.style.opacity = (targetOpacity * (1 - occlusion)).toFixed(3);
    } else {
      overlay.frame.style.transform = buildFrameTransform(variant, tiltX, tiltY, parallaxX);
    }
  }

  /**
   * Handle card mouse enter
   */
  function handleCardEnter(card, event) {
    if (!motionEnabled) return;

    if (event && event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') {
      return;
    }

    activeCard = card;
    card.style.transition = `transform ${CONFIG.transitionSpeed}ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow ${CONFIG.transitionSpeed}ms ease`;
    card.style.transformStyle = 'preserve-3d';
    card.style.willChange = 'transform, box-shadow';

    const state = cardStates.get(card);

    if (!state) return;

    const overlay = ensureCardOverlay(card, state, { hydrate: true });
    const variant = state.variant;

    refreshOverlayTheme(overlay, variant);
    updateOverlaySource(overlay, variant, { hydrate: true });

    state.currentTiltX = 0;
    state.currentTiltY = 0;
    state.currentParallaxX = 0;
    overlay.frame.style.transform = buildFrameTransform(variant, 0, 0, 0, state.occlusion ?? 1);

    overlay.container.style.transform = 'translate3d(0, 0, 0)';
    overlay.container.style.willChange = 'opacity, clip-path, mask-image, transform';
    overlay.frame.style.visibility = 'visible';

    transitionOcclusion(card, state, overlay, 0, { duration: 680 });
  }

  /**
   * Handle card mouse move
   */
  function handleCardMove(card, e) {
    if (!motionEnabled) return;
    if (activeCard !== card) return;

    if (e && e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') {
      return;
    }

    if (rafId) {
      cancelAnimationFrame(rafId);
    }

    rafId = requestAnimationFrame(() => {
      const tilt = calculateTilt(card, e);
      applyCardTransform(card, tilt);
      positionVib3Visual(card, tilt);
    });
  }

  /**
   * Handle card mouse leave
   */
  function handleCardLeave(card) {
    if (activeCard !== card) return;

    activeCard = null;

    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    card.style.transform = '';
    card.style.boxShadow = '';
    card.style.willChange = 'auto';

    const state = cardStates.get(card);
    const overlay = cardRegistry.get(card);

    if (overlay && state) {
      transitionOcclusion(card, state, overlay, 1, {
        duration: 560,
        afterHidden: () => {
          overlay.container.style.willChange = 'auto';
          overlay.frame.style.visibility = 'hidden';

          if (!supportsIntersectionObserver) {
            updateOverlaySource(overlay, state.variant, { hydrate: false });
          }

          prepareNextVariant(card, state);
        },
      });
    }
  }

  /**
   * Attach listeners to all interactive cards
   */
  function attachCardListeners() {
    CARD_GROUPS.forEach(({ selector, variantKey }) => {
      const cards = document.querySelectorAll(selector);

      cards.forEach((card, index) => {
        const state = ensureCardVariant(card, variantKey, index);

        if (!supportsIntersectionObserver) {
          ensureCardOverlay(card, state);
        } else {
          const observer = getViewportObserver();

          if (observer) {
            observer.observe(card);
          } else {
            ensureCardOverlay(card, state);
          }
        }

        if (preparedCards.has(card)) return;

        card.addEventListener('pointerenter', (event) => handleCardEnter(card, event));
        card.addEventListener('pointermove', (event) => handleCardMove(card, event), { passive: true });
        card.addEventListener('pointerleave', () => handleCardLeave(card));
        card.addEventListener('pointercancel', () => handleCardLeave(card));

        preparedCards.add(card);
      });
    });
  }

  /**
   * Initialize on DOM ready
   */
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attachCardListeners);
    } else {
      attachCardListeners();
    }
  }

  /**
   * Respect reduced motion preference
   */
  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (!reduceMotionQuery.matches) {
    motionEnabled = true;
    init();
  } else {
    motionEnabled = false;
  }

  function teardownOverlays() {
    if (viewportObserver) {
      viewportObserver.disconnect();
      viewportObserver = null;
    }

    cardRegistry.forEach(({ container }) => {
      if (container.parentElement) {
        container.parentElement.removeChild(container);
      }
    });
    cardRegistry.clear();
  }

  // Listen for changes in motion preference
  reduceMotionQuery.addEventListener('change', (e) => {
    motionEnabled = !e.matches;

    if (motionEnabled) {
      init();
      return;
    }

    activeCard = null;

    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    teardownOverlays();
  });

})();

/**
 * © 2025 Clear Seas Solutions LLC
 * "The Revolution Will Not be in a Structured Format"
 */
