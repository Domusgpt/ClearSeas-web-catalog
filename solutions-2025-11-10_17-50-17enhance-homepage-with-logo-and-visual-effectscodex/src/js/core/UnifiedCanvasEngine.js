/**
 * Unified Canvas Engine - Performance-Optimized Single Canvas System
 * A Paul Phillips Manifestation
 *
 * Replaces multiple canvas instances with a single managed canvas
 * Implements resource pooling, lazy loading, and adaptive quality
 */

export class UnifiedCanvasEngine {
    constructor(options = {}) {
        this.canvas = null;
        this.ctx = null;
        this.gl = null;
        this.isWebGL = options.useWebGL ?? true;
        this.width = 0;
        this.height = 0;
        this.dpr = Math.min(window.devicePixelRatio || 1, options.maxDPR || 2);

        // Layer system
        this.layers = new Map();
        this.activeLayer = null;

        // Performance tracking
        this.frameTime = 0;
        this.fps = 60;
        this.lastFrameTime = performance.now();
        this.frameCount = 0;

        // Resource pooling
        this.bufferPool = [];
        this.texturePool = [];

        // Adaptive quality
        this.qualityLevel = 'high'; // high, medium, low
        this.targetFPS = 60;
        this.fpsHistory = [];

        // Animation state
        this.isRunning = false;
        this.rafId = null;

        this.initialize();
    }

    initialize() {
        // Create or reuse canvas
        this.canvas = document.getElementById('unified-canvas');
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'unified-canvas';
            this.canvas.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 1;
            `;
            document.body.insertBefore(this.canvas, document.body.firstChild);
        }

        this.resize();

        // Initialize context
        if (this.isWebGL) {
            this.initWebGL();
        } else {
            this.ctx = this.canvas.getContext('2d', { alpha: true });
        }

        // Setup resize listener
        window.addEventListener('resize', () => this.resize(), { passive: true });

        // Setup performance monitoring
        this.startPerformanceMonitoring();
    }

    initWebGL() {
        const options = {
            alpha: true,
            antialias: false,
            depth: false,
            stencil: false,
            powerPreference: 'high-performance',
            preserveDrawingBuffer: false
        };

        this.gl = this.canvas.getContext('webgl2', options)
               || this.canvas.getContext('webgl', options);

        if (!this.gl) {
            console.warn('WebGL not available, falling back to 2D');
            this.isWebGL = false;
            this.ctx = this.canvas.getContext('2d', { alpha: true });
            return;
        }

        // WebGL settings
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.clearColor(0, 0, 0, 0);
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.canvas.width = this.width * this.dpr;
        this.canvas.height = this.height * this.dpr;
        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;

        if (this.ctx) {
            this.ctx.scale(this.dpr, this.dpr);
        }

        if (this.gl) {
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }

        // Notify layers
        this.layers.forEach(layer => {
            if (layer.onResize) {
                layer.onResize(this.width, this.height);
            }
        });
    }

    registerLayer(name, layer) {
        this.layers.set(name, {
            instance: layer,
            visible: true,
            priority: layer.priority || 0,
            needsUpdate: true
        });
    }

    unregisterLayer(name) {
        const layer = this.layers.get(name);
        if (layer && layer.instance.dispose) {
            layer.instance.dispose();
        }
        this.layers.delete(name);
    }

    setLayerVisibility(name, visible) {
        const layer = this.layers.get(name);
        if (layer) {
            layer.visible = visible;
        }
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.animate();
    }

    stop() {
        this.isRunning = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    animate() {
        if (!this.isRunning) return;

        const now = performance.now();
        const deltaTime = (now - this.lastFrameTime) / 1000;
        this.lastFrameTime = now;

        this.frameTime = deltaTime;
        this.fps = 1 / deltaTime;

        // Clear canvas
        if (this.gl) {
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        } else if (this.ctx) {
            this.ctx.clearRect(0, 0, this.width, this.height);
        }

        // Render layers in priority order
        const sortedLayers = Array.from(this.layers.entries())
            .filter(([_, layer]) => layer.visible)
            .sort((a, b) => a[1].priority - b[1].priority);

        for (const [name, layer] of sortedLayers) {
            if (layer.instance.render) {
                layer.instance.render({
                    deltaTime,
                    ctx: this.ctx,
                    gl: this.gl,
                    width: this.width,
                    height: this.height,
                    qualityLevel: this.qualityLevel
                });
            }
        }

        this.frameCount++;

        // Adaptive quality adjustment
        if (this.frameCount % 60 === 0) {
            this.adjustQuality();
        }

        this.rafId = requestAnimationFrame(() => this.animate());
    }

    startPerformanceMonitoring() {
        setInterval(() => {
            this.fpsHistory.push(this.fps);
            if (this.fpsHistory.length > 10) {
                this.fpsHistory.shift();
            }
        }, 1000);
    }

    adjustQuality() {
        const avgFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;

        if (avgFPS < 30 && this.qualityLevel !== 'low') {
            this.qualityLevel = 'low';
            this.dpr = 1;
            console.log('🔧 Quality reduced to LOW');
            this.resize();
        } else if (avgFPS < 50 && this.qualityLevel === 'high') {
            this.qualityLevel = 'medium';
            this.dpr = 1.5;
            console.log('🔧 Quality reduced to MEDIUM');
            this.resize();
        } else if (avgFPS > 55 && this.qualityLevel === 'low') {
            this.qualityLevel = 'medium';
            this.dpr = 1.5;
            console.log('🔧 Quality increased to MEDIUM');
            this.resize();
        } else if (avgFPS > 58 && this.qualityLevel === 'medium') {
            this.qualityLevel = 'high';
            this.dpr = 2;
            console.log('🔧 Quality increased to HIGH');
            this.resize();
        }
    }

    getBuffer(size) {
        // Simple buffer pooling
        return this.bufferPool.pop() || new Float32Array(size);
    }

    releaseBuffer(buffer) {
        if (this.bufferPool.length < 10) {
            this.bufferPool.push(buffer);
        }
    }

    dispose() {
        this.stop();

        this.layers.forEach(layer => {
            if (layer.instance.dispose) {
                layer.instance.dispose();
            }
        });

        this.layers.clear();

        if (this.gl) {
            const loseContext = this.gl.getExtension('WEBGL_lose_context');
            if (loseContext) {
                loseContext.loseContext();
            }
        }

        this.bufferPool = [];
        this.texturePool = [];

        window.removeEventListener('resize', this.resize);
    }
}
