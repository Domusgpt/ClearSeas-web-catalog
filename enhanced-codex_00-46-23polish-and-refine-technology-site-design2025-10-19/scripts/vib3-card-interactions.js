/**
 * VIB3+ Card Holographic Float & Tilt System
 * Interactive card bending with dynamic VIB3+ engine visualization
 * © 2025 Clear Seas Solutions
 */

(function() {
  'use strict';

  // Card level registry so every tile owns its own overlay
  const cardRegistry = new Map();
  const preparedCards = new WeakSet();
  let activeCard = null;
  let rafId = null;
  let motionEnabled = true;

  // Configuration
  const CONFIG = {
    tiltStrength: 15,        // Max tilt degrees
    floatDistance: 25,       // Max float distance in px
    glowIntensity: 40,       // Glow blur in px
    vib3Opacity: 0.35,       // VIB3+ engine opacity
    transitionSpeed: 200,    // Transition duration in ms
    transitionCurve: 'cubic-bezier(0.23, 1, 0.32, 1)',
    vib3Scale: 0.48,         // Scale of VIB3+ iframe
    overlayParallax: 22,     // Max px overlay translation for parallax
    frameSize: 1400,         // Size of the iframe viewport for cropping
    frameFocusOffsetX: 50,   // Percentage offset to center VIB3+ focal point
    frameFocusOffsetY: 54,   // Percentage offset to center VIB3+ focal point
  };

  const ENGINE_ORIGIN = 'https://domusgpt.github.io/vib3-plus-engine/';

  const profileAssignments = new WeakMap();

  const DEFAULT_PROFILE = {
    id: 'default',
    geometry: 'tesseract',
    hue: 210,
    intensity: 0.76,
    shimmer: 1,
    overlayOpacity: CONFIG.vib3Opacity,
    overlayFilter: 'blur(0.4px)',
    overlayTransition: 'opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
    blend: 'screen',
    parallax: CONFIG.overlayParallax,
    parallaxX: undefined,
    parallaxY: undefined,
    scale: CONFIG.vib3Scale,
    frameSize: CONFIG.frameSize,
    focus: {
      x: CONFIG.frameFocusOffsetX,
      y: CONFIG.frameFocusOffsetY,
    },
    rotateDampen: {
      x: 0.4,
      y: 0.4,
      z: 0.12,
    },
    floatDistance: CONFIG.floatDistance,
    cardScale: 1.05,
    tiltStrength: CONFIG.tiltStrength,
    glow: '192, 132, 252',
    glowIntensity: CONFIG.glowIntensity,
    glowBase: 0.3,
    shadowOpacity: 0.4,
    transitionSpeed: CONFIG.transitionSpeed,
    transitionCurve: CONFIG.transitionCurve,
    engine: {
      spin4d: '0.35',
      rot4d: '0.24,0.18,0.32,0.12',
      phase: '0.52',
      trail: '0.46',
      bloom: '0.64',
      depth: '0.4',
    },
  };

  const CARD_PROFILE_BANK = {
    signal: [
      {
        id: 'signal-atlas',
        geometry: '24-cell',
        hue: 196,
        intensity: 0.84,
        shimmer: 1.12,
        overlayOpacity: 0.36,
        overlayFilter: 'blur(0.45px) saturate(120%)',
        parallax: 16,
        scale: 0.47,
        focus: { x: 48, y: 54 },
        rotateDampen: { x: 0.35, y: 0.3, z: 0.12 },
        glow: '74, 228, 255',
        glowIntensity: 38,
        engine: {
          spin4d: '0.44',
          rot4d: '0.32,0.18,0.42,0.21',
          phase: '0.65',
          trail: '0.46',
          bloom: '0.68',
          depth: '0.45',
        },
      },
      {
        id: 'signal-sentinel',
        geometry: '5-cell',
        hue: 202,
        intensity: 0.78,
        shimmer: 1.08,
        overlayOpacity: 0.33,
        overlayFilter: 'blur(0.45px) saturate(115%)',
        parallax: 14,
        scale: 0.48,
        focus: { x: 51, y: 53 },
        rotateDampen: { x: 0.32, y: 0.3, z: 0.12 },
        glow: '96, 236, 255',
        glowIntensity: 36,
        engine: {
          spin4d: '0.39',
          rot4d: '0.28,0.22,0.34,0.17',
          phase: '0.62',
          trail: '0.52',
          bloom: '0.62',
          depth: '0.42',
        },
      },
      {
        id: 'signal-maritime',
        geometry: '16-cell',
        hue: 210,
        intensity: 0.82,
        shimmer: 1.16,
        overlayOpacity: 0.38,
        overlayFilter: 'blur(0.5px) saturate(130%)',
        parallax: 18,
        scale: 0.5,
        focus: { x: 53, y: 51 },
        rotateDampen: { x: 0.36, y: 0.34, z: 0.16 },
        glow: '0, 212, 255',
        glowIntensity: 40,
        engine: {
          spin4d: '0.48',
          rot4d: '0.34,0.24,0.38,0.2',
          phase: '0.7',
          trail: '0.58',
          bloom: '0.72',
          depth: '0.48',
        },
      },
    ],
    capability: [
      {
        id: 'capability-seer',
        geometry: '600-cell',
        hue: 204,
        intensity: 0.9,
        shimmer: 1.22,
        overlayOpacity: 0.42,
        overlayFilter: 'blur(0.55px) saturate(125%)',
        parallax: 21,
        scale: 0.52,
        focus: { x: 47, y: 55 },
        rotateDampen: { x: 0.36, y: 0.33, z: 0.14 },
        floatDistance: 30,
        cardScale: 1.07,
        tiltStrength: 18,
        glow: '88, 230, 255',
        glowIntensity: 42,
        engine: {
          spin4d: '0.52',
          rot4d: '0.36,0.28,0.42,0.22',
          phase: '0.72',
          trail: '0.58',
          bloom: '0.8',
          depth: '0.52',
        },
      },
      {
        id: 'capability-strata',
        geometry: '24-cell',
        hue: 200,
        intensity: 0.86,
        shimmer: 1.15,
        overlayOpacity: 0.37,
        overlayFilter: 'blur(0.5px) saturate(120%)',
        parallax: 17,
        scale: 0.5,
        focus: { x: 49, y: 56 },
        rotateDampen: { x: 0.34, y: 0.32, z: 0.14 },
        floatDistance: 27,
        cardScale: 1.06,
        glow: '84, 224, 255',
        glowIntensity: 40,
        engine: {
          spin4d: '0.47',
          rot4d: '0.3,0.24,0.4,0.2',
          phase: '0.66',
          trail: '0.54',
          bloom: '0.74',
          depth: '0.46',
        },
      },
      {
        id: 'capability-clarity',
        geometry: '120-cell',
        hue: 208,
        intensity: 0.92,
        shimmer: 1.26,
        overlayOpacity: 0.44,
        overlayFilter: 'blur(0.6px) saturate(128%)',
        parallax: 22,
        scale: 0.53,
        focus: { x: 46, y: 52 },
        rotateDampen: { x: 0.38, y: 0.34, z: 0.16 },
        floatDistance: 32,
        cardScale: 1.08,
        tiltStrength: 19,
        glow: '102, 236, 255',
        glowIntensity: 44,
        engine: {
          spin4d: '0.55',
          rot4d: '0.38,0.26,0.44,0.24',
          phase: '0.78',
          trail: '0.6',
          bloom: '0.86',
          depth: '0.56',
        },
      },
    ],
    platform: [
      {
        id: 'platform-reposiologist',
        geometry: '120-cell',
        hue: 284,
        intensity: 0.82,
        shimmer: 1.18,
        overlayOpacity: 0.32,
        overlayFilter: 'blur(0.55px) saturate(135%)',
        parallax: 22,
        scale: 0.5,
        focus: { x: 46, y: 52 },
        rotateDampen: { x: 0.32, y: 0.36, z: 0.24 },
        floatDistance: 26,
        cardScale: 1.06,
        glow: '164, 132, 255',
        glowIntensity: 44,
        engine: {
          spin4d: '0.58',
          rot4d: '0.34,0.3,0.46,0.28',
          phase: '0.62',
          trail: '0.57',
          bloom: '0.82',
          depth: '0.48',
        },
      },
      {
        id: 'platform-parserator',
        geometry: '24-cell',
        hue: 288,
        intensity: 0.86,
        shimmer: 1.2,
        overlayOpacity: 0.34,
        overlayFilter: 'blur(0.6px) saturate(140%)',
        parallax: 20,
        scale: 0.51,
        focus: { x: 48, y: 55 },
        rotateDampen: { x: 0.34, y: 0.35, z: 0.22 },
        floatDistance: 28,
        cardScale: 1.07,
        glow: '176, 140, 255',
        glowIntensity: 46,
        engine: {
          spin4d: '0.6',
          rot4d: '0.36,0.32,0.48,0.3',
          phase: '0.68',
          trail: '0.6',
          bloom: '0.86',
          depth: '0.52',
        },
      },
      {
        id: 'platform-nimbus',
        geometry: '600-cell',
        hue: 292,
        intensity: 0.88,
        shimmer: 1.24,
        overlayOpacity: 0.36,
        overlayFilter: 'blur(0.62px) saturate(138%)',
        parallax: 23,
        scale: 0.52,
        focus: { x: 45, y: 53 },
        rotateDampen: { x: 0.33, y: 0.37, z: 0.24 },
        floatDistance: 30,
        cardScale: 1.08,
        glow: '188, 148, 255',
        glowIntensity: 48,
        engine: {
          spin4d: '0.62',
          rot4d: '0.38,0.34,0.5,0.32',
          phase: '0.74',
          trail: '0.64',
          bloom: '0.9',
          depth: '0.55',
        },
      },
      {
        id: 'platform-visualizer',
        geometry: '16-cell',
        hue: 280,
        intensity: 0.8,
        shimmer: 1.14,
        overlayOpacity: 0.31,
        overlayFilter: 'blur(0.52px) saturate(130%)',
        parallax: 19,
        scale: 0.49,
        focus: { x: 47, y: 51 },
        rotateDampen: { x: 0.31, y: 0.34, z: 0.2 },
        floatDistance: 24,
        cardScale: 1.05,
        glow: '156, 128, 252',
        glowIntensity: 42,
        engine: {
          spin4d: '0.54',
          rot4d: '0.32,0.28,0.44,0.26',
          phase: '0.6',
          trail: '0.52',
          bloom: '0.78',
          depth: '0.44',
        },
      },
      {
        id: 'platform-dataset',
        geometry: '5-cell',
        hue: 286,
        intensity: 0.84,
        shimmer: 1.18,
        overlayOpacity: 0.33,
        overlayFilter: 'blur(0.58px) saturate(132%)',
        parallax: 18,
        scale: 0.5,
        focus: { x: 50, y: 56 },
        rotateDampen: { x: 0.33, y: 0.35, z: 0.21 },
        floatDistance: 25,
        cardScale: 1.06,
        glow: '170, 136, 254',
        glowIntensity: 43,
        engine: {
          spin4d: '0.57',
          rot4d: '0.34,0.3,0.46,0.28',
          phase: '0.66',
          trail: '0.55',
          bloom: '0.82',
          depth: '0.47',
        },
      },
      {
        id: 'platform-lattice',
        geometry: '24-cell',
        hue: 300,
        intensity: 0.9,
        shimmer: 1.28,
        overlayOpacity: 0.37,
        overlayFilter: 'blur(0.65px) saturate(142%)',
        parallax: 24,
        scale: 0.53,
        focus: { x: 44, y: 52 },
        rotateDampen: { x: 0.34, y: 0.38, z: 0.26 },
        floatDistance: 31,
        cardScale: 1.09,
        glow: '198, 156, 255',
        glowIntensity: 49,
        engine: {
          spin4d: '0.64',
          rot4d: '0.4,0.34,0.52,0.34',
          phase: '0.78',
          trail: '0.68',
          bloom: '0.96',
          depth: '0.58',
        },
      },
    ],
    research: [
      {
        id: 'research-synthesis',
        geometry: '24-cell',
        hue: 320,
        intensity: 0.86,
        shimmer: 1.24,
        overlayOpacity: 0.4,
        overlayFilter: 'blur(0.6px) saturate(138%)',
        parallax: 18,
        scale: 0.49,
        focus: { x: 50, y: 52 },
        rotateDampen: { x: 0.34, y: 0.32, z: 0.22 },
        floatDistance: 27,
        cardScale: 1.06,
        glow: '241, 115, 255',
        glowIntensity: 40,
        engine: {
          spin4d: '0.5',
          rot4d: '0.38,0.26,0.44,0.3',
          phase: '0.7',
          trail: '0.6',
          bloom: '0.78',
          depth: '0.5',
        },
      },
      {
        id: 'research-holo',
        geometry: '600-cell',
        hue: 328,
        intensity: 0.9,
        shimmer: 1.28,
        overlayOpacity: 0.43,
        overlayFilter: 'blur(0.68px) saturate(140%)',
        parallax: 20,
        scale: 0.5,
        focus: { x: 48, y: 55 },
        rotateDampen: { x: 0.36, y: 0.34, z: 0.24 },
        floatDistance: 29,
        cardScale: 1.07,
        glow: '248, 132, 255',
        glowIntensity: 44,
        engine: {
          spin4d: '0.56',
          rot4d: '0.4,0.3,0.5,0.32',
          phase: '0.78',
          trail: '0.66',
          bloom: '0.86',
          depth: '0.54',
        },
      },
      {
        id: 'research-entropic',
        geometry: '120-cell',
        hue: 336,
        intensity: 0.94,
        shimmer: 1.32,
        overlayOpacity: 0.46,
        overlayFilter: 'blur(0.72px) saturate(145%)',
        parallax: 22,
        scale: 0.52,
        focus: { x: 46, y: 51 },
        rotateDampen: { x: 0.38, y: 0.36, z: 0.26 },
        floatDistance: 32,
        cardScale: 1.09,
        glow: '255, 148, 255',
        glowIntensity: 48,
        engine: {
          spin4d: '0.6',
          rot4d: '0.42,0.32,0.52,0.34',
          phase: '0.82',
          trail: '0.7',
          bloom: '0.94',
          depth: '0.6',
        },
      },
    ],
    step: [
      {
        id: 'step-scout',
        geometry: '16-cell',
        hue: 40,
        intensity: 0.8,
        shimmer: 1.14,
        overlayOpacity: 0.34,
        overlayFilter: 'blur(0.48px) saturate(120%)',
        parallax: 14,
        scale: 0.46,
        focus: { x: 52, y: 53 },
        rotateDampen: { x: 0.28, y: 0.3, z: 0.1 },
        floatDistance: 22,
        cardScale: 1.04,
        glow: '255, 164, 0',
        glowIntensity: 36,
        engine: {
          spin4d: '0.42',
          rot4d: '0.3,0.18,0.38,0.22',
          phase: '0.58',
          trail: '0.52',
          bloom: '0.64',
          depth: '0.38',
        },
      },
      {
        id: 'step-strategy',
        geometry: '5-cell',
        hue: 32,
        intensity: 0.78,
        shimmer: 1.1,
        overlayOpacity: 0.32,
        overlayFilter: 'blur(0.46px) saturate(118%)',
        parallax: 13,
        scale: 0.45,
        focus: { x: 49, y: 55 },
        rotateDampen: { x: 0.27, y: 0.29, z: 0.1 },
        floatDistance: 21,
        cardScale: 1.03,
        glow: '255, 152, 28',
        glowIntensity: 34,
        engine: {
          spin4d: '0.4',
          rot4d: '0.28,0.2,0.36,0.2',
          phase: '0.54',
          trail: '0.5',
          bloom: '0.6',
          depth: '0.36',
        },
      },
      {
        id: 'step-sustain',
        geometry: '24-cell',
        hue: 48,
        intensity: 0.82,
        shimmer: 1.18,
        overlayOpacity: 0.36,
        overlayFilter: 'blur(0.5px) saturate(122%)',
        parallax: 15,
        scale: 0.47,
        focus: { x: 47, y: 52 },
        rotateDampen: { x: 0.29, y: 0.31, z: 0.12 },
        floatDistance: 23,
        cardScale: 1.05,
        glow: '255, 172, 54',
        glowIntensity: 38,
        engine: {
          spin4d: '0.44',
          rot4d: '0.32,0.22,0.4,0.24',
          phase: '0.62',
          trail: '0.56',
          bloom: '0.68',
          depth: '0.4',
        },
      },
    ],
    legacy: [
      {
        id: 'legacy-signal',
        geometry: '5-cell',
        hue: 186,
        intensity: 0.78,
        shimmer: 1.06,
        overlayOpacity: 0.31,
        overlayFilter: 'blur(0.42px) saturate(112%)',
        parallax: 12,
        scale: 0.45,
        focus: { x: 49, y: 55 },
        rotateDampen: { x: 0.3, y: 0.28, z: 0.1 },
        floatDistance: 20,
        cardScale: 1.03,
        glow: '124, 214, 255',
        glowIntensity: 32,
        engine: {
          spin4d: '0.38',
          rot4d: '0.26,0.18,0.32,0.2',
          phase: '0.52',
          trail: '0.46',
          bloom: '0.6',
          depth: '0.36',
        },
      },
    ],
  };

  const CARD_SELECTOR_GROUPS = [
    { selector: '.signal-card.vcodex-neoskeu-card', key: 'signal' },
    { selector: '.capability-card.vcodex-neoskeu-card', key: 'capability' },
    { selector: '.platform-card.vcodex-neoskeu-card', key: 'platform' },
    { selector: '.research-lab.vcodex-neoskeu-card', key: 'research' },
    { selector: '.step.vcodex-neoskeu-card', key: 'step' },
    { selector: '.legacy-signal.vcodex-neoskeu-card', key: 'legacy' },
  ];

  function createProfile(template = {}, key = 'default', index = 0) {
    const profile = {
      ...DEFAULT_PROFILE,
      ...template,
      key,
      index,
    };

    profile.focus = {
      ...DEFAULT_PROFILE.focus,
      ...(template.focus || {}),
    };

    profile.rotateDampen = {
      ...DEFAULT_PROFILE.rotateDampen,
      ...(template.rotateDampen || {}),
    };

    profile.engine = {
      ...DEFAULT_PROFILE.engine,
      ...(template.engine || {}),
    };

    profile.scale = template.scale ?? DEFAULT_PROFILE.scale;
    profile.frameSize = template.frameSize ?? DEFAULT_PROFILE.frameSize;
    profile.overlayOpacity = template.overlayOpacity ?? DEFAULT_PROFILE.overlayOpacity;
    profile.overlayFilter = template.overlayFilter ?? DEFAULT_PROFILE.overlayFilter;
    profile.overlayTransition = template.overlayTransition ?? DEFAULT_PROFILE.overlayTransition;
    profile.blend = template.blend ?? DEFAULT_PROFILE.blend;
    profile.parallax = template.parallax ?? DEFAULT_PROFILE.parallax;
    profile.parallaxX = template.parallaxX ?? template.parallax ?? DEFAULT_PROFILE.parallax;
    profile.parallaxY = template.parallaxY ?? template.parallax ?? DEFAULT_PROFILE.parallax;
    profile.floatDistance = template.floatDistance ?? DEFAULT_PROFILE.floatDistance;
    profile.cardScale = template.cardScale ?? DEFAULT_PROFILE.cardScale;
    profile.tiltStrength = template.tiltStrength ?? DEFAULT_PROFILE.tiltStrength;
    profile.glow = template.glow ?? DEFAULT_PROFILE.glow;
    profile.glowIntensity = template.glowIntensity ?? DEFAULT_PROFILE.glowIntensity;
    profile.glowBase = template.glowBase ?? DEFAULT_PROFILE.glowBase;
    profile.shadowOpacity = template.shadowOpacity ?? DEFAULT_PROFILE.shadowOpacity;
    profile.transitionSpeed = template.transitionSpeed ?? DEFAULT_PROFILE.transitionSpeed;
    profile.transitionCurve = template.transitionCurve ?? DEFAULT_PROFILE.transitionCurve;
    profile.shimmer = template.shimmer ?? DEFAULT_PROFILE.shimmer;
    profile.id = template.id || `${key}-${index}`;

    return profile;
  }

  function assignProfile(card, key, index) {
    const bank = CARD_PROFILE_BANK[key] || [DEFAULT_PROFILE];
    const template = bank[index % bank.length] || DEFAULT_PROFILE;
    const profile = createProfile(template, key, index);
    profileAssignments.set(card, profile);

    if (card?.dataset) {
      card.dataset.vib3Profile = profile.id;
      card.dataset.vib3Geo = profile.geometry || '';
      card.dataset.vib3Hue = String(profile.hue ?? '');
      if (profile.engine) {
        if (profile.engine.spin4d !== undefined) {
          card.dataset.vib3Spin4d = String(profile.engine.spin4d);
        }
        if (profile.engine.rot4d !== undefined) {
          card.dataset.vib3Rot4d = String(profile.engine.rot4d);
        }
      }
    }

    return profile;
  }

  function getProfile(card) {
    return profileAssignments.get(card) || DEFAULT_PROFILE;
  }

  function buildEngineUrl(profile) {
    const params = new URLSearchParams();
    const resolved = profile || DEFAULT_PROFILE;

    params.set('geo', resolved.geometry || DEFAULT_PROFILE.geometry);

    if (resolved.hue !== undefined) {
      params.set('hue', String(resolved.hue));
    }

    if (resolved.intensity !== undefined) {
      params.set('intensity', String(resolved.intensity));
    }

    params.set('auto', '1');

    const shimmerValue = resolved.shimmer ?? DEFAULT_PROFILE.shimmer;
    if (shimmerValue !== undefined) {
      params.set('shimmer', String(shimmerValue));
    }

    const engine = resolved.engine || {};
    Object.entries(engine).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      params.set(key, String(value));
    });

    if (resolved.background) {
      params.set('bg', resolved.background);
    }

    if (Array.isArray(resolved.layers) && resolved.layers.length) {
      params.set('layers', resolved.layers.join(','));
    }

    if (resolved.texture) {
      params.set('texture', resolved.texture);
    }

    if (!params.has('shimmer')) {
      params.set('shimmer', '1');
    }

    return `${ENGINE_ORIGIN}?${params.toString()}`;
  }

  /**
   * Create / cache a VIB3+ overlay inside the provided card
   */
  function ensureCardOverlay(card) {
    const profile = getProfile(card);
    let overlay = cardRegistry.get(card);
    const computedStyle = window.getComputedStyle(card);

    if (computedStyle.position === 'static') {
      card.style.position = 'relative';
    }

    if (!overlay) {
      const container = document.createElement('div');
      container.className = 'vib3-dynamic-viz';
      container.style.position = 'absolute';
      container.style.inset = '0';
      container.style.pointerEvents = 'none';
      container.style.overflow = 'hidden';
      container.style.zIndex = '0';

      const frame = document.createElement('iframe');
      frame.src = '';
      frame.setAttribute('tabindex', '-1');
      frame.setAttribute('aria-hidden', 'true');
      frame.setAttribute('loading', 'lazy');
      frame.style.position = 'absolute';
      frame.style.top = '50%';
      frame.style.left = '50%';
      frame.style.transformOrigin = '50% 50%';
      frame.style.border = 'none';
      frame.style.background = 'transparent';
      frame.style.pointerEvents = 'none';

      container.appendChild(frame);
      card.insertBefore(container, card.firstChild);

      overlay = {
        container,
        frame,
        profileId: profile.id,
        baseTransform: '',
        focusX: profile.focus.x,
        focusY: profile.focus.y,
        scale: profile.scale,
      };

      cardRegistry.set(card, overlay);
    }

    const { container, frame } = overlay;

    container.style.borderRadius = computedStyle.borderRadius || '24px';
    container.style.opacity = '0';
    container.style.transform = 'translate3d(0, 0, 0)';
    container.style.mixBlendMode = profile.blend || 'screen';
    container.style.filter = profile.overlayFilter || 'blur(0.4px)';
    container.style.transition = profile.overlayTransition || DEFAULT_PROFILE.overlayTransition;

    const frameSize = profile.frameSize || CONFIG.frameSize;
    frame.style.width = `${frameSize}px`;
    frame.style.height = `${frameSize}px`;

    overlay.profileId = profile.id;
    overlay.focusX = profile.focus.x;
    overlay.focusY = profile.focus.y;
    overlay.scale = profile.scale;
    overlay.baseTransform = `translate(-${profile.focus.x}%, -${profile.focus.y}%) scale(${profile.scale})`;

    frame.style.transform = overlay.baseTransform;
    frame.dataset.vib3Profile = profile.id;
    frame.dataset.vib3Url = frame.dataset.vib3Url || '';

    return overlay;
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

    const profile = getProfile(card);
    const tiltStrength = profile.tiltStrength ?? CONFIG.tiltStrength;

    const tiltX = -(deltaY / centerY) * tiltStrength;
    const tiltY = (deltaX / centerX) * tiltStrength;

    return { tiltX, tiltY, deltaX, deltaY, centerX, centerY };
  }

  /**
   * Apply holographic float and tilt to card
   */
  function applyCardTransform(card, tilt) {
    const profile = getProfile(card);
    const { tiltX, tiltY } = tilt;
    const translateZ = profile.floatDistance ?? CONFIG.floatDistance;
    const scale = profile.cardScale ?? 1.05;

    card.style.transform = `
      perspective(1000px)
      translateY(-${translateZ}px)
      translateZ(${translateZ}px)
      rotateX(${tiltX}deg)
      rotateY(${tiltY}deg)
      scale(${scale})
    `;

    // Add glow based on tilt intensity
    const glowStrength = Math.abs(tiltX) + Math.abs(tiltY);
    const glowColor = profile.glow || '192, 132, 252';
    const glowIntensity = profile.glowIntensity ?? CONFIG.glowIntensity;
    const glowBase = profile.glowBase ?? 0.3;
    const shadowOpacity = profile.shadowOpacity ?? 0.4;

    const glowAlpha = Math.min(0.95, glowBase + (glowStrength / 120));

    card.style.boxShadow = `
      0 ${translateZ * 1.5}px ${glowIntensity + glowStrength}px rgba(0, 0, 0, ${shadowOpacity}),
      0 0 ${glowIntensity}px rgba(${glowColor}, ${glowAlpha})
    `;
  }

  /**
   * Position VIB3+ visualization behind card
   */
  function positionVib3Visual(card, tilt) {
    const overlay = cardRegistry.get(card);

    if (!overlay) return;

    const profile = getProfile(card);
    const { tiltX, tiltY, deltaX, deltaY, centerX, centerY } = tilt;
    const { container, frame } = overlay;

    const parallaxX = (deltaX / centerX) * (profile.parallaxX ?? profile.parallax ?? CONFIG.overlayParallax);
    const parallaxY = (deltaY / centerY) * (profile.parallaxY ?? profile.parallax ?? CONFIG.overlayParallax);

    container.style.transform = `translate3d(${parallaxX}px, ${parallaxY}px, 0)`;
    container.style.opacity = profile.overlayOpacity ?? CONFIG.vib3Opacity;

    const rotateDampen = profile.rotateDampen || DEFAULT_PROFILE.rotateDampen;
    const baseTransform = overlay.baseTransform || `translate(-${profile.focus.x}%, -${profile.focus.y}%) scale(${profile.scale})`;

    const transforms = [
      baseTransform,
      `rotateX(${-tiltX * (rotateDampen.x ?? 0.4)}deg)`,
      `rotateY(${tiltY * (rotateDampen.y ?? 0.4)}deg)`
    ];

    if (rotateDampen.z) {
      transforms.push(`rotateZ(${tiltY * rotateDampen.z}deg)`);
    }

    frame.style.transform = transforms.join(' ');
  }

  /**
   * Handle card mouse enter
   */
  function handleCardEnter(card) {
    if (!motionEnabled) return;

    const profile = getProfile(card);
    activeCard = card;
    const transitionSpeed = profile.transitionSpeed ?? CONFIG.transitionSpeed;
    const transitionCurve = profile.transitionCurve || CONFIG.transitionCurve || 'cubic-bezier(0.23, 1, 0.32, 1)';
    card.style.transition = `transform ${transitionSpeed}ms ${transitionCurve}, box-shadow ${transitionSpeed}ms ease`;
    card.style.transformStyle = 'preserve-3d';
    card.style.willChange = 'transform, box-shadow';

    const overlay = ensureCardOverlay(card);

    const baseTransform = `translate(-${profile.focus.x}%, -${profile.focus.y}%) scale(${profile.scale})`;
    overlay.baseTransform = baseTransform;
    overlay.focusX = profile.focus.x;
    overlay.focusY = profile.focus.y;
    overlay.scale = profile.scale;
    overlay.profileId = profile.id;

    overlay.container.style.opacity = profile.overlayOpacity ?? CONFIG.vib3Opacity;
    overlay.container.style.filter = profile.overlayFilter || 'blur(0.4px)';
    overlay.container.style.mixBlendMode = profile.blend || 'screen';
    overlay.container.style.transition = profile.overlayTransition || DEFAULT_PROFILE.overlayTransition;
    overlay.container.style.transform = 'translate3d(0, 0, 0)';

    overlay.frame.style.width = `${profile.frameSize || CONFIG.frameSize}px`;
    overlay.frame.style.height = `${profile.frameSize || CONFIG.frameSize}px`;
    overlay.frame.style.transform = baseTransform;
    overlay.frame.dataset.vib3Profile = profile.id;

    const engineUrl = buildEngineUrl(profile);

    if (overlay.frame.dataset.vib3Url !== engineUrl) {
      overlay.frame.src = engineUrl;
      overlay.frame.dataset.vib3Url = engineUrl;
    }
  }

  /**
   * Handle card mouse move
   */
  function handleCardMove(card, e) {
    if (activeCard !== card) return;

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

    const overlay = cardRegistry.get(card);

    if (overlay) {
      overlay.container.style.opacity = '0';
      overlay.container.style.transform = 'translate3d(0, 0, 0)';
      const profile = getProfile(card);
      const baseTransform = overlay.baseTransform || `translate(-${profile.focus.x}%, -${profile.focus.y}%) scale(${profile.scale})`;
      overlay.frame.style.transform = baseTransform;
    }
  }

  /**
   * Attach listeners to all interactive cards
   */
  function attachCardListeners() {
    CARD_SELECTOR_GROUPS.forEach(({ selector, key }) => {
      const cards = document.querySelectorAll(selector);

      cards.forEach((card, index) => {
        const profile = profileAssignments.has(card)
          ? profileAssignments.get(card)
          : assignProfile(card, key, index);

        const overlay = ensureCardOverlay(card);

        if (overlay && profile) {
          overlay.baseTransform = `translate(-${profile.focus.x}%, -${profile.focus.y}%) scale(${profile.scale})`;
          overlay.focusX = profile.focus.x;
          overlay.focusY = profile.focus.y;
          overlay.scale = profile.scale;
          overlay.profileId = profile.id;
          overlay.frame.style.width = `${profile.frameSize || CONFIG.frameSize}px`;
          overlay.frame.style.height = `${profile.frameSize || CONFIG.frameSize}px`;
          overlay.frame.style.transform = overlay.baseTransform;
        }

        if (preparedCards.has(card)) return;

        card.addEventListener('mouseenter', () => handleCardEnter(card));
        card.addEventListener('mousemove', (e) => handleCardMove(card, e));
        card.addEventListener('mouseleave', () => handleCardLeave(card));

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
