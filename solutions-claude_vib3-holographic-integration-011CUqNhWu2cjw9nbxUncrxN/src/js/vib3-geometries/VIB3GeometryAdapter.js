/**
 * VIB3 Geometry Adapter
 * Lightweight adapter bringing VIB3+ geometry types to Clear Seas visualizers
 * Integrates 8 geometric types with our existing CanvasManager & VisualOrchestrator
 *
 * HOLOGRAPHIC VERSION: Audio-reactive shimmer with distance-based intensity
 *
 * A Paul Phillips Manifestation - Paul@clearseassolutions.com
 * "The Revolution Will Not be in a Structured Format" © 2025
 */

import { GeometryLibrary } from './GeometryLibrary.js';

export class VIB3GeometryAdapter {
    constructor() {
        this.geometries = {
            TETRAHEDRON: 0,
            HYPERCUBE: 1,
            SPHERE: 2,
            TORUS: 3,
            KLEIN_BOTTLE: 4,
            FRACTAL: 5,
            WAVE: 6,
            CRYSTAL: 7
        };

        this.currentGeometry = 0;
    }

    /**
     * Get geometry name by index
     */
    getGeometryName(index) {
        return GeometryLibrary.getGeometryName(index);
    }

    /**
     * Get all geometry names
     */
    getAllGeometries() {
        return GeometryLibrary.getGeometryNames();
    }

    /**
     * Get optimized parameters for specific geometry and section
     * HOLOGRAPHIC VERSION: Tuned for audio-reactive shimmer effects
     */
    getGeometryParameters(geometryIndex, section) {
        const baseParams = GeometryLibrary.getVariationParameters(geometryIndex, 0);

        // Section-specific refinements for holographic aesthetic
        const sectionMultipliers = {
            hero: { intensity: 0.85, chaos: 0.75, speed: 0.9, shimmer: 1.0 },
            capabilities: { intensity: 0.95, chaos: 0.6, speed: 0.8, shimmer: 0.8 },
            research: { intensity: 1.05, chaos: 1.1, speed: 1.0, shimmer: 1.2 },
            platforms: { intensity: 0.95, chaos: 0.85, speed: 1.05, shimmer: 1.1 },
            engagement: { intensity: 1.0, chaos: 1.0, speed: 1.0, shimmer: 1.3 },
            legacy: { intensity: 0.9, chaos: 0.7, speed: 0.85, shimmer: 0.9 },
            contact: { intensity: 0.85, chaos: 0.75, speed: 0.9, shimmer: 1.0 },
            founder: { intensity: 0.9, chaos: 0.8, speed: 0.9, shimmer: 1.1 }
        };

        const multiplier = sectionMultipliers[section] || { intensity: 1.0, chaos: 1.0, speed: 1.0, shimmer: 1.0 };

        return {
            geometryType: geometryIndex,
            gridDensity: baseParams.gridDensity * 0.75, // Slightly denser for holographic effect
            morphFactor: baseParams.morphFactor * 0.85, // More fluid morphing
            chaos: baseParams.chaos * multiplier.chaos * 0.65, // Controlled but present
            speed: baseParams.speed * multiplier.speed * 0.75, // Smooth motion
            hue: baseParams.hue,
            intensity: 0.5 * multiplier.intensity, // Base intensity
            saturation: 0.88, // Slightly more saturated for shimmer
            shimmerIntensity: 0.3 * multiplier.shimmer, // NEW: Holographic shimmer
            audioReactivity: 0.5 * multiplier.shimmer, // NEW: Audio response strength
            distanceEffect: 0.7 // NEW: Distance-based intensity
        };
    }

    /**
     * Get section-to-geometry mapping
     * Each section gets a unique geometry that reflects its character
     */
    getSectionGeometry(section) {
        const mappings = {
            hero: this.geometries.HYPERCUBE,          // 4D signature, cutting-edge
            capabilities: this.geometries.CRYSTAL,    // Structured, precise, multifaceted
            research: this.geometries.FRACTAL,        // Complex, self-similar, exploratory
            platforms: this.geometries.TORUS,         // Continuous flow, cyclical
            engagement: this.geometries.WAVE,         // Dynamic, responsive, flowing
            legacy: this.geometries.SPHERE,           // Complete, timeless, foundational
            contact: this.geometries.TETRAHEDRON,     // Simple, direct, clear
            founder: this.geometries.KLEIN_BOTTLE     // Sophisticated, non-orientable, unique
        };

        return mappings[section] ?? this.geometries.HYPERCUBE;
    }

    /**
     * Apply geometry parameters to an existing visualizer
     * Works with EnhancedQuantumBackground or similar WebGL visualizers
     */
    applyGeometryToVisualizer(visualizer, geometryIndex, section) {
        if (!visualizer || !visualizer.params) return;

        const params = this.getGeometryParameters(geometryIndex, section);

        // Update visualizer parameters
        Object.keys(params).forEach(key => {
            if (visualizer.params.hasOwnProperty(key)) {
                visualizer.params[key] = params[key];
            }
        });

        console.log(`🌈 Applied ${this.getGeometryName(geometryIndex)} holographic geometry to ${section} section`);
    }

    /**
     * Create enhanced shader uniforms for geometry rendering
     * Returns uniforms object compatible with our existing shaders
     */
    getGeometryUniforms(geometryIndex, section) {
        const params = this.getGeometryParameters(geometryIndex, section);

        return {
            u_geometry: params.geometryType,
            u_gridDensity: params.gridDensity,
            u_morphFactor: params.morphFactor,
            u_chaos: params.chaos,
            u_speed: params.speed,
            u_hue: params.hue,
            u_intensity: params.intensity,
            u_saturation: params.saturation,
            u_shimmerIntensity: params.shimmerIntensity, // NEW
            u_audioReactivity: params.audioReactivity, // NEW
            u_distanceEffect: params.distanceEffect // NEW
        };
    }
}

export default VIB3GeometryAdapter;
