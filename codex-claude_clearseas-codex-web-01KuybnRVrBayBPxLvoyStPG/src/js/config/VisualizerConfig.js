/**
 * Clearseas Codex - Centralized Visualizer Configuration
 * Author: Paul Phillips
 *
 * This configuration system consolidates all magic numbers and tuning parameters
 * for the visual system, making it easy to adjust behavior without hunting through code.
 */

export const VISUALIZER_CONFIG = {
    // ===== POLYTOPAL FIELD VISUALIZER =====
    polytopal: {
        // Particle System
        baseNodeCount: 55,
        nodeCountScaleFactor: 0.00003, // Additional nodes per viewport pixel
        connectionDistance: 150,
        maxConnectionOpacity: 0.6,

        // Motion Parameters
        maxVelocity: 0.22,
        smoothingFactor: 0.94,
        velocityDecay: 0.98,

        // Mouse Interaction
        mouseInfluenceRadius: 200,
        mouseRepulsionForce: 0.3,
        mouseAttractionForce: 0.1,

        // Visual Properties
        nodeMinSize: 1.5,
        nodeMaxSize: 4.5,
        nodeGlowRadius: 15,
        connectionLineWidth: 1,

        // Z-Depth (3D effect)
        zMin: -100,
        zMax: 100,
        zDepthSizeScale: 0.5, // How much Z affects size
        zDepthOpacityScale: 0.3 // How much Z affects opacity
    },

    // ===== QUANTUM BACKGROUND (WebGL) =====
    quantum: {
        // Grid Parameters
        gridDensityMin: 8,
        gridDensityMax: 14,

        // Chaos & Movement
        chaosMin: 0,
        chaosMax: 0.7,
        chaosDampening: 0.7, // Applied to orchestrator chaos for elegance

        // Speed
        speedMin: 0.4,
        speedMax: 0.64,

        // Visual Effects
        rgbOffsetMin: 0.0015,
        rgbOffsetMax: 0.0025,
        moireIntensityMin: 0.04,
        moireIntensityMax: 0.22,
        moireFrequency: 10.0,

        // Rotation (4D)
        rotation4DSpeed: 0.0001,

        // Hue Range
        hueRange: [0, 360]
    },

    // ===== PARTICLE NETWORKS =====
    particles: {
        sectionConfigs: {
            capabilities: {
                count: 45,
                baseColor: '#b399ff',
                connectionDistance: 0.13,
                connectionOpacity: 0.35,
                speed: 0.3
            },
            research: {
                count: 45,
                baseColor: '#99d6ff',
                connectionDistance: 0.14,
                connectionOpacity: 0.35,
                speed: 0.28
            },
            platforms: {
                count: 45,
                baseColor: '#99ffcc',
                connectionDistance: 0.13,
                connectionOpacity: 0.35,
                speed: 0.32
            },
            engagement: {
                count: 38,
                baseColor: '#ff99d6',
                connectionDistance: 0.15,
                connectionOpacity: 0.28,
                speed: 0.35
            },
            legacy: {
                count: 38,
                baseColor: '#ffb366',
                connectionDistance: 0.14,
                connectionOpacity: 0.28,
                speed: 0.3
            }
        }
    },

    // ===== CARD FRACTAL SYSTEM =====
    cardFractals: {
        emergenceDuration: 1200, // ms
        decayDuration: 800, // ms
        fractalDepth: 4,
        fractalScale: 0.7,
        lineWidth: 1.5,
        glowIntensity: 0.4
    },

    // ===== VISUAL ORCHESTRATOR =====
    orchestrator: {
        // Interpolation Speeds (lerp rates)
        lerpSpeeds: {
            intensity: 0.0008, // Slowest - creates smooth waves
            chaos: 0.0012,
            speed: 0.0015,
            hue: 0.002, // Fastest - responsive color shifts
            rgbOffset: 0.001,
            moireIntensity: 0.001
        },

        // User Activity Tracking
        mouseActivityDecay: 0.995, // Per frame decay
        userEnergyDecay: 0.998,
        userEnergyGain: 0.05, // Per interaction

        // Multiplier Ranges
        multipliers: {
            mouseActivity: { min: 0.8, max: 1.5 },
            scrollVelocity: { min: 0.9, max: 1.3 },
            cardHover: { min: 1.0, max: 1.8 },
            timeOfDay: { min: 0.7, max: 1.2 },
            userEnergy: { min: 0.5, max: 1.5 }
        },

        // Section Profiles
        sectionProfiles: {
            hero: {
                preset: 'quantum',
                form: 'lattice',
                intensity: 0.52,
                chaos: 0.12,
                speed: 0.48,
                hue: 200,
                rgbOffset: 0.002,
                moireIntensity: 0.08
            },
            capabilities: {
                preset: 'crystal',
                form: 'crystal',
                intensity: 0.58,
                chaos: 0.16,
                speed: 0.52,
                hue: 270,
                rgbOffset: 0.0022,
                moireIntensity: 0.12
            },
            research: {
                preset: 'cosmic',
                form: 'nebula',
                intensity: 0.62,
                chaos: 0.22,
                speed: 0.58,
                hue: 210,
                rgbOffset: 0.0024,
                moireIntensity: 0.16
            },
            platforms: {
                preset: 'cyber',
                form: 'vortex',
                intensity: 0.68,
                chaos: 0.18,
                speed: 0.64,
                hue: 160,
                rgbOffset: 0.0022,
                moireIntensity: 0.18
            },
            engagement: {
                preset: 'neural',
                form: 'pulse',
                intensity: 0.55,
                chaos: 0.14,
                speed: 0.5,
                hue: 300,
                rgbOffset: 0.002,
                moireIntensity: 0.1
            },
            legacy: {
                preset: 'heritage',
                form: 'strata',
                intensity: 0.6,
                chaos: 0.2,
                speed: 0.42,
                hue: 30,
                rgbOffset: 0.0018,
                moireIntensity: 0.14
            },
            founder: {
                preset: 'aurora',
                form: 'fractal',
                intensity: 0.65,
                chaos: 0.25,
                speed: 0.56,
                hue: 280,
                rgbOffset: 0.0025,
                moireIntensity: 0.2
            },
            contact: {
                preset: 'aurora',
                form: 'fractal',
                intensity: 0.58,
                chaos: 0.15,
                speed: 0.45,
                hue: 180,
                rgbOffset: 0.002,
                moireIntensity: 0.12
            }
        }
    },

    // ===== CANVAS MANAGER =====
    canvasManager: {
        // Performance
        targetFPS: 60,
        fpsThreshold: 30, // Auto-reduce quality below this
        qualityMin: 0.5,
        qualityMax: 1.0,
        qualityStep: 0.1,

        // Quality adjustment
        qualityAdjustDelay: 2000, // ms before adjusting
        fpsHistoryLength: 60, // Frames to average

        // Render priorities
        priorities: {
            background: 0,
            particles: 1,
            polytopal: 2,
            ui: 3
        }
    },

    // ===== PERFORMANCE MONITOR =====
    performanceMonitor: {
        visible: false, // Set to true to show performance UI
        updateInterval: 500, // ms
        historyLength: 100, // Data points to keep
        graphHeight: 60,
        graphWidth: 200
    },

    // ===== ANIMATION TIMINGS =====
    animation: {
        // GIF System
        gifCycleDuration: 4000, // ms between GIF changes on hover
        gifDisplayDuration: 3000, // ms to show GIF on click
        gifAmbientInterval: 15000, // ms between ambient GIF triggers
        gifFadeDuration: 300, // ms fade transition

        // Logo/Title Fade
        logoFadeOpacity: 0.3,
        titleFadeOpacity: 0.15,
        contentFadeOpacity: 0.95,

        // GSAP Scroll
        scrollMorphDuration: 2.5, // Extended morph transitions
        cardHoverDuration: 1.2, // Card emergence duration

        // Section Transitions
        sectionTransitionDuration: 1.5
    },

    // ===== AUDIO-REACTIVE (NEW!) =====
    audio: {
        enabled: false, // User must enable
        fftSize: 2048,
        smoothingTimeConstant: 0.8,

        // Frequency ranges (0-1 normalized)
        bassRange: [0, 0.1],
        midRange: [0.1, 0.5],
        highRange: [0.5, 1.0],

        // Audio influence multipliers
        bassInfluence: {
            intensity: 0.3,
            chaos: 0.2,
            particleSize: 0.4
        },
        midInfluence: {
            speed: 0.3,
            hue: 20 // degrees shift
        },
        highInfluence: {
            rgbOffset: 0.001,
            moireIntensity: 0.15
        },

        // Gain control
        minGain: 0,
        maxGain: 1.5,
        gainSmoothing: 0.9
    },

    // ===== GESTURE CONTROLS (NEW!) =====
    gestures: {
        enabled: true,

        // Pinch zoom
        pinchZoomMin: 0.5,
        pinchZoomMax: 2.0,
        pinchInfluencesConnectionDistance: true,

        // Rotate (two-finger)
        rotationSpeed: 0.01,
        rotationInfluences4D: true,

        // Swipe
        swipeVelocityThreshold: 0.5,
        swipeDistanceThreshold: 50,
        swipeTriggersSection: true
    },

    // ===== INPUT SMOOTHING (NEW!) =====
    inputSmoothing: {
        // Exponential Moving Average
        mousePositionAlpha: 0.15, // Lower = smoother but more lag
        mouseVelocityAlpha: 0.2,
        scrollVelocityAlpha: 0.25,

        // Velocity calculation
        velocityHistoryLength: 5 // Frames to average
    },

    // ===== COLOR HARMONY (NEW!) =====
    colorHarmony: {
        enabled: true,
        mode: 'complementary', // 'complementary', 'analogous', 'triadic', 'split-complementary'

        // Harmony angles (degrees)
        complementaryOffset: 180,
        analogousSpread: 30,
        triadicOffset: 120,
        splitComplementarySpread: 150,

        // Transition smoothing
        harmonyTransitionSpeed: 0.001,

        // Perceptual uniformity (Lab color space)
        useLabSpace: true
    }
};

// ===== UTILITY FUNCTIONS =====
export const CONFIG_UTILS = {
    /**
     * Get a nested config value safely
     * @param {string} path - Dot-notation path (e.g., 'polytopal.baseNodeCount')
     * @returns {*} The config value or undefined
     */
    get(path) {
        return path.split('.').reduce((obj, key) => obj?.[key], VISUALIZER_CONFIG);
    },

    /**
     * Validate configuration integrity
     * @returns {Object} { valid: boolean, errors: string[] }
     */
    validate() {
        const errors = [];

        // Check critical values
        if (VISUALIZER_CONFIG.polytopal.baseNodeCount < 1) {
            errors.push('polytopal.baseNodeCount must be >= 1');
        }

        if (VISUALIZER_CONFIG.canvasManager.targetFPS < 1) {
            errors.push('canvasManager.targetFPS must be >= 1');
        }

        // Check multiplier ranges
        const mult = VISUALIZER_CONFIG.orchestrator.multipliers;
        Object.entries(mult).forEach(([key, range]) => {
            if (range.min >= range.max) {
                errors.push(`orchestrator.multipliers.${key} min must be < max`);
            }
        });

        return {
            valid: errors.length === 0,
            errors
        };
    },

    /**
     * Get adaptive node count based on viewport
     * @param {number} width - Viewport width
     * @param {number} height - Viewport height
     * @returns {number} Calculated node count
     */
    getAdaptiveNodeCount(width, height) {
        const { baseNodeCount, nodeCountScaleFactor } = VISUALIZER_CONFIG.polytopal;
        const pixels = width * height;
        return Math.floor(baseNodeCount + pixels * nodeCountScaleFactor);
    },

    /**
     * Get time-of-day multiplier
     * @returns {number} Multiplier based on current hour (0.7 - 1.2)
     */
    getTimeOfDayMultiplier() {
        const hour = new Date().getHours();
        const { min, max } = VISUALIZER_CONFIG.orchestrator.multipliers.timeOfDay;

        // Morning (6-11): rising energy
        if (hour >= 6 && hour < 12) {
            return min + (max - min) * ((hour - 6) / 6);
        }
        // Afternoon (12-17): peak energy
        else if (hour >= 12 && hour < 18) {
            return max;
        }
        // Evening (18-23): declining energy
        else if (hour >= 18 && hour < 24) {
            return max - (max - min) * ((hour - 18) / 6);
        }
        // Night (0-5): low energy
        else {
            return min;
        }
    }
};

// Validate configuration on load
const validation = CONFIG_UTILS.validate();
if (!validation.valid) {
    console.warn('⚠️ Configuration validation failed:', validation.errors);
}

// Export default for convenience
export default VISUALIZER_CONFIG;
