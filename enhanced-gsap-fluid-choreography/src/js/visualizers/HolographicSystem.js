/**
 * Holographic System - 5-Layer Audio-Reactive Visualizer
 * Adapted from VIB3+ Engine for ClearSeas-Enhanced
 *
 * A Paul Phillips Manifestation - Paul@clearseassolutions.com
 * "The Revolution Will Not be in a Structured Format" © 2025
 */

import { HolographicVisualizer } from './HolographicVisualizer.js';

export class HolographicSystem {
    constructor(canvasManager, baseCanvasId) {
        this.manager = canvasManager;
        this.baseCanvasId = baseCanvasId;
        this.visualizers = [];
        this.currentVariant = 0;
        this.isActive = false;

        this.params = {
            geometry: 0,
            gridDensity: 15,
            morphFactor: 1.0,
            chaos: 0.2,
            speed: 1.0,
            hue: 320,
            intensity: 0.6,
            saturation: 0.8
        };

        // Listen to orchestrator
        window.addEventListener('visualStateUpdate', (e) => {
            if (this.isActive) {
                this.updateFromOrchestrator(e.detail);
            }
        });
    }

    initialize() {
        console.log('🎨 Initializing Holographic System (5 layers)...');

        // Create 5 layer canvases
        const layers = [
            { id: 'holo-background', role: 'background', reactivity: 0.5, zIndex: 1 },
            { id: 'holo-shadow', role: 'shadow', reactivity: 0.7, zIndex: 2 },
            { id: 'holo-content', role: 'content', reactivity: 0.9, zIndex: 3 },
            { id: 'holo-highlight', role: 'highlight', reactivity: 1.1, zIndex: 4 },
            { id: 'holo-accent', role: 'accent', reactivity: 1.5, zIndex: 5 }
        ];

        const mainCanvas = this.manager.getCanvas(this.baseCanvasId);
        if (!mainCanvas) {
            console.error('❌ Base canvas not found:', this.baseCanvasId);
            return false;
        }

        const mainContainer = mainCanvas.container;

        layers.forEach(layer => {
            // Create container for this layer
            const container = document.createElement('div');
            container.id = `${layer.id}-container`;
            container.style.position = 'absolute';
            container.style.top = '0';
            container.style.left = '0';
            container.style.width = '100%';
            container.style.height = '100%';
            container.style.pointerEvents = 'none';
            container.style.zIndex = String(layer.zIndex);
            container.style.opacity = String(layer.reactivity * 0.6);

            mainContainer.appendChild(container);

            // Create canvas
            const canvasData = this.manager.createCanvas(layer.id, {
                container: container,
                width: mainCanvas.width,
                height: mainCanvas.height,
                alpha: true,
                antialias: false,
                webgl2: true,
                powerPreference: 'high-performance'
            });

            if (canvasData) {
                // Create visualizer
                const visualizer = new HolographicVisualizer(
                    this.manager,
                    layer.id,
                    layer.role,
                    layer.reactivity,
                    this.currentVariant
                );

                if (visualizer.initialize()) {
                    this.visualizers.push(visualizer);
                    console.log(`✅ Created holographic layer: ${layer.role}`);
                } else {
                    console.error(`❌ Failed to initialize visualizer for ${layer.id}`);
                }
            }
        });

        console.log(`✅ Holographic System initialized with ${this.visualizers.length}/5 layers`);
        return this.visualizers.length > 0;
    }

    setActive(active) {
        this.isActive = active;

        // Show/hide layer containers
        const containerIds = [
            'holo-background-container',
            'holo-shadow-container',
            'holo-content-container',
            'holo-highlight-container',
            'holo-accent-container'
        ];

        containerIds.forEach(id => {
            const container = document.getElementById(id);
            if (container) {
                container.style.display = active ? 'block' : 'none';
            }
        });

        // Activate/deactivate canvases
        this.visualizers.forEach((visualizer) => {
            this.manager.setCanvasActive(visualizer.canvasId, active);
        });

        console.log(`🌌 Holographic System ${active ? 'ACTIVATED' : 'DEACTIVATED'}`);
    }

    updateFromOrchestrator(detail) {
        const { state } = detail;

        // Update parameters
        this.params.gridDensity = 10 + state.intensity * 20;
        this.params.chaos = state.chaos;
        this.params.speed = state.speed;
        this.params.hue = state.hue;
        this.params.intensity = state.intensity;

        // Update all visualizers
        this.visualizers.forEach(visualizer => {
            visualizer.updateParameters(this.params);
        });
    }

    updateParameter(param, value) {
        this.params[param] = value;

        this.visualizers.forEach(visualizer => {
            visualizer.updateParameters({ [param]: value });
        });
    }

    dispose() {
        console.log('🧹 Disposing Holographic System...');

        // Dispose all visualizers
        this.visualizers.forEach(visualizer => {
            if (visualizer.dispose) {
                visualizer.dispose();
            }
        });

        // Destroy canvases
        const layerIds = ['holo-background', 'holo-shadow', 'holo-content', 'holo-highlight', 'holo-accent'];
        layerIds.forEach(id => {
            this.manager.destroyCanvas(id);

            // Remove container
            const container = document.getElementById(`${id}-container`);
            if (container && container.parentElement) {
                container.parentElement.removeChild(container);
            }
        });

        this.visualizers = [];
        this.isActive = false;

        console.log('✅ Holographic System disposed');
    }
}

export default HolographicSystem;
