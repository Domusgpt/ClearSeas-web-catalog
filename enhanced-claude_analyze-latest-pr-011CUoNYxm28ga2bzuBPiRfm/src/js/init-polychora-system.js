/**
 * Enhanced Polychora System Initialization
 * Integrates the advanced 4D polytope visualizer with glassmorphic and holographic effects
 */

import { EnhancedPolychoraVisualizer } from './visualizers/EnhancedPolychoraVisualizer.js';

export class PolychoraSystemManager {
    constructor() {
        this.visualizers = [];
        this.isInitialized = false;
        this.animationId = null;
        this.currentPolytope = 0;

        // Auto-rotation parameters
        this.autoRotate = true;
        this.rotationSpeed = 0.001;
        this.rotationAngles = {
            XW: 0,
            YW: 0,
            ZW: 0,
            XY: 0,
            XZ: 0,
            YZ: 0
        };
    }

    async init() {
        console.log('🔮 Initializing Enhanced Polychora System');

        // Create main canvas if it doesn't exist
        if (!document.getElementById('polytope-canvas')) {
            const canvas = document.createElement('canvas');
            canvas.id = 'polytope-canvas';
            canvas.setAttribute('aria-hidden', 'true');
            document.body.prepend(canvas);
        }

        // Initialize visualizer
        let visualizer;
        try {
            visualizer = new EnhancedPolychoraVisualizer('polytope-canvas', 'content', {
                polytope: this.currentPolytope,
                holographicIntensity: 0.4,
                chromaticAberration: 0.15,
                glassRefraction: 1.6,
                edgeThickness: 2.5,
                hue: 180, // Cyan/teal to match theme
                intensity: 0.6,
                speed: 1.0
            });
        } catch (error) {
            console.error('❌ Error creating visualizer:', error);
            return false;
        }

        if (visualizer && visualizer.gl) {
            this.visualizers.push(visualizer);
            this.isInitialized = true;
            this.startRenderLoop();
            this.setupInteractions();
            this.setupPolytopeRotation();

            console.log('✅ Enhanced Polychora System initialized successfully');
            return true;
        } else {
            console.warn('⚠️  WebGL not available - Enhanced Polychora System will not render');
            console.warn('   This is normal in some environments (headless browsers, older devices)');
            // Still return true so the page doesn't break
            return true;
        }
    }

    startRenderLoop() {
        const render = () => {
            if (!this.isInitialized) return;

            // Update auto-rotation
            if (this.autoRotate) {
                this.rotationAngles.XW += this.rotationSpeed;
                this.rotationAngles.YW += this.rotationSpeed * 0.7;
                this.rotationAngles.ZW += this.rotationSpeed * 0.5;
                this.rotationAngles.XY += this.rotationSpeed * 0.3;
                this.rotationAngles.XZ += this.rotationSpeed * 0.4;
                this.rotationAngles.YZ += this.rotationSpeed * 0.6;

                // Apply rotation to all visualizers
                this.visualizers.forEach(visualizer => {
                    visualizer.updateParameters(this.rotationAngles);
                });
            }

            // Render all visualizers
            this.visualizers.forEach(visualizer => visualizer.render());

            this.animationId = requestAnimationFrame(render);
        };

        render();
    }

    setupInteractions() {
        // Mouse interaction
        let mouseX = 0.5;
        let mouseY = 0.5;
        let mouseIntensity = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX / window.innerWidth;
            mouseY = e.clientY / window.innerHeight;
            mouseIntensity = 0.5;

            this.visualizers.forEach(visualizer => {
                visualizer.updateInteraction(mouseX, mouseY, mouseIntensity);
            });
        });

        // Scroll-based polytope switching
        let lastScrollY = window.scrollY;
        let polytopeChangeThreshold = 500;
        let accumulatedScroll = 0;

        window.addEventListener('scroll', () => {
            const scrollDelta = window.scrollY - lastScrollY;
            accumulatedScroll += Math.abs(scrollDelta);

            if (accumulatedScroll >= polytopeChangeThreshold) {
                this.nextPolytope();
                accumulatedScroll = 0;
            }

            lastScrollY = window.scrollY;
        });
    }

    setupPolytopeRotation() {
        // Cycle through polytopes every 15 seconds
        setInterval(() => {
            this.nextPolytope();
        }, 15000);
    }

    nextPolytope() {
        this.currentPolytope = (this.currentPolytope + 1) % 6;

        this.visualizers.forEach(visualizer => {
            visualizer.updateParameters({ polytope: this.currentPolytope });
        });

        console.log(`🔮 Switched to polytope: ${this.visualizers[0]?.polytopeNames[this.currentPolytope] || this.currentPolytope}`);
    }

    setPolytope(index) {
        if (index >= 0 && index < 6) {
            this.currentPolytope = index;
            this.visualizers.forEach(visualizer => {
                visualizer.updateParameters({ polytope: this.currentPolytope });
            });
        }
    }

    setAutoRotate(enabled) {
        this.autoRotate = enabled;
    }

    setRotationSpeed(speed) {
        this.rotationSpeed = speed;
    }

    updateParams(params) {
        this.visualizers.forEach(visualizer => {
            visualizer.updateParameters(params);
        });
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        this.visualizers.forEach(visualizer => visualizer.destroy());
        this.visualizers = [];
        this.isInitialized = false;

        console.log('🔮 Enhanced Polychora System destroyed');
    }
}

// Initialize on page load
let polychoraSystem = null;

document.addEventListener('DOMContentLoaded', async () => {
    polychoraSystem = new PolychoraSystemManager();
    await polychoraSystem.init();

    // Expose to window for debugging/control
    window.polychoraSystem = polychoraSystem;
});

export default PolychoraSystemManager;
