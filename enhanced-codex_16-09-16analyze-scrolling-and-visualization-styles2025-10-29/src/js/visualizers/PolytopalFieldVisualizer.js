/**
 * PolytopalFieldVisualizer - Enhanced particle network with 4D-inspired connections
 * Combines the best of polytopal field visualization with modern canvas management
 *
 * A Paul Phillips Manifestation - Paul@clearseassolutions.com
 * "The Revolution Will Not be in a Structured Format" © 2025
 */

export class PolytopalFieldVisualizer {
    constructor(canvasManager, canvasId, options = {}) {
        this.canvasManager = canvasManager;
        this.canvasId = canvasId;

        this.settings = {
            baseCount: options.baseCount || 80,
            maxVelocity: options.maxVelocity || 0.35,
            connectionDistance: options.connectionDistance || 180,
            colorScheme: options.colorScheme || 'cyan-magenta',
            enablePointerInteraction: options.enablePointerInteraction !== false,
            enableDepthEffect: options.enableDepthEffect !== false,
            particleGlow: options.particleGlow !== false
        };

        this.performanceProfile = this.computePerformanceProfile(options.performanceProfile);
        this.runtime = {
            velocityLimit: this.settings.maxVelocity * this.performanceProfile.velocityMultiplier,
            pointerInfluence: this.performanceProfile.pointerInfluence,
            friction: this.performanceProfile.friction,
            glowStrength: this.performanceProfile.glowStrength,
            pointerRadius: this.performanceProfile.pointerRadius,
            pointerGlowAlpha: this.performanceProfile.pointerGlowAlpha
        };

        this.nodes = [];
        this.pointer = { x: 0, y: 0, active: false };
        this.time = 0;
        this.isInitialized = false;
        this.canvasData = null;
        this.connectionAccumulator = 0;
        this.hasRenderedConnections = false;
        this.backdropGradient = null;
        this.backdropColorKey = '';
        this.backdropSize = { width: 0, height: 0 };
    }

    initialize() {
        if (this.isInitialized) return;

        const canvasData = this.canvasManager.getCanvas(this.canvasId);
        if (!canvasData) {
            console.error('PolytopalFieldVisualizer: Canvas not found:', this.canvasId);
            return;
        }

        this.canvasData = canvasData;
        this.ctx = canvasData.ctx;
        this.setupNodes();
        this.setupEventListeners();

        if (typeof this.canvasManager.registerRenderer === 'function') {
            this.canvasManager.registerRenderer(this.canvasId, (context) => this.render(context), 10);
        } else if (typeof this.canvasManager.registerRenderCallback === 'function') {
            this.canvasManager.registerRenderCallback(this.canvasId, (context) => this.render(context));
        } else {
            console.warn('PolytopalFieldVisualizer: Canvas manager lacks a renderer registration method');
        }

        this.isInitialized = true;
        console.log('✨ PolytopalFieldVisualizer initialized');
    }

    setupNodes() {
        const canvasData = this.canvasData || this.canvasManager.getCanvas(this.canvasId);
        if (!canvasData) {
            return;
        }

        const dpr = canvasData.dpr || window.devicePixelRatio || 1;
        const width = canvasData.canvas.width / dpr;
        const height = canvasData.canvas.height / dpr;
        const scaleFactor = width / 1280 + 0.4;
        const qualityMultiplier = this.performanceProfile.nodeMultiplier;
        const nodeCount = Math.max(24, Math.round(this.settings.baseCount * scaleFactor * qualityMultiplier));

        this.nodes = Array.from({ length: nodeCount }, () => this.createNode(width, height));
        this.connectionAccumulator = this.performanceProfile.connectionInterval;
        this.hasRenderedConnections = false;
        this.backdropGradient = null;
        this.backdropColorKey = '';
        this.backdropSize.width = 0;
        this.backdropSize.height = 0;
    }

    createNode(width, height) {
        const velocitySeed = this.runtime.velocityLimit * 0.6;
        return {
            x: Math.random() * width,
            y: Math.random() * height,
            z: Math.random() * 100,
            vx: (Math.random() - 0.5) * velocitySeed,
            vy: (Math.random() - 0.5) * velocitySeed,
            vz: (Math.random() - 0.5) * 0.08,
            radius: Math.random() * 1.4 + 0.8,
            phase: Math.random() * Math.PI * 2
        };
    }

    setupEventListeners() {
        if (!this.settings.enablePointerInteraction) return;

        const handleMouseMove = (event) => {
            this.pointer.x = event.clientX;
            this.pointer.y = event.clientY;
            this.pointer.active = true;
        };

        const handleMouseLeave = () => {
            this.pointer.active = false;
        };

        const handleTouchMove = (event) => {
            if (event.touches && event.touches.length > 0) {
                this.pointer.x = event.touches[0].clientX;
                this.pointer.y = event.touches[0].clientY;
                this.pointer.active = true;
            }
        };

        const handleTouchEnd = () => {
            this.pointer.active = false;
        };

        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        window.addEventListener('mouseleave', handleMouseLeave);
        window.addEventListener('touchmove', handleTouchMove, { passive: true });
        window.addEventListener('touchend', handleTouchEnd, { passive: true });

        this._listeners = [
            { type: 'mousemove', handler: handleMouseMove },
            { type: 'mouseleave', handler: handleMouseLeave },
            { type: 'touchmove', handler: handleTouchMove },
            { type: 'touchend', handler: handleTouchEnd }
        ];
    }

    updateNodes(deltaFactor = 1) {
        const canvasData = this.canvasData || this.canvasManager.getCanvas(this.canvasId);
        if (!canvasData) {
            return;
        }

        const dpr = canvasData.dpr || window.devicePixelRatio || 1;
        const width = canvasData.canvas.width / dpr;
        const height = canvasData.canvas.height / dpr;
        const velocityLimit = this.runtime.velocityLimit;
        const friction = Math.pow(this.runtime.friction, deltaFactor);
        const pointerActive = this.pointer.active && this.settings.enablePointerInteraction;
        const pointerStrength = this.runtime.pointerInfluence * Math.min(deltaFactor, 3);

        const pointerX = this.pointer.x;
        const pointerY = this.pointer.y;

        this.nodes.forEach((node) => {
            node.x += node.vx * deltaFactor;
            node.y += node.vy * deltaFactor;
            node.z += node.vz * deltaFactor * 0.6;
            node.phase += 0.012 * deltaFactor;

            if (node.x < -50) node.x = width + 50;
            if (node.x > width + 50) node.x = -50;
            if (node.y < -50) node.y = height + 50;
            if (node.y > height + 50) node.y = -50;
            if (node.z < 0) node.z = 100;
            if (node.z > 100) node.z = 0;

            if (pointerActive) {
                const dx = pointerX - node.x;
                const dy = pointerY - node.y;
                const distSq = dx * dx + dy * dy + 1;
                const influence = Math.min(0.45, 1400 / distSq);
                node.vx += dx * influence * pointerStrength;
                node.vy += dy * influence * pointerStrength;
            }

            node.vx = this.clamp(node.vx, -velocityLimit, velocityLimit);
            node.vy = this.clamp(node.vy, -velocityLimit, velocityLimit);
            node.vx *= friction;
            node.vy *= friction;
            node.vz *= 0.995;
        });
    }

    drawConnections(colors, width) {
        const { primary, secondary } = colors;
        const baseDistance = this.settings.connectionDistance * this.performanceProfile.connectionMultiplier;
        const maxDistance = baseDistance * (width < 768 ? 0.75 : 1);
        const pointerThreshold = maxDistance * 1.08;
        const maxConnections = this.performanceProfile.maxConnections;

        for (let i = 0; i < this.nodes.length; i += 1) {
            const nodeA = this.nodes[i];
            let connections = 0;

            for (let j = i + 1; j < this.nodes.length; j += 1) {
                const nodeB = this.nodes[j];
                const dx = nodeA.x - nodeB.x;
                const dy = nodeA.y - nodeB.y;
                const dz = (nodeA.z - nodeB.z) * 0.3;
                const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (distance < maxDistance) {
                    const alpha = (1 - distance / maxDistance) * 0.45;
                    const depthFactor = this.settings.enableDepthEffect
                        ? (1 - Math.abs(nodeA.z - 50) / 50) * 0.5 + 0.5
                        : 1;
                    const connectionAlpha = Math.max(0, Math.min(1, alpha * depthFactor));
                    this.ctx.strokeStyle = `rgba(${primary}, ${connectionAlpha})`;
                    this.ctx.lineWidth = 0.8;
                    this.ctx.beginPath();
                    this.ctx.moveTo(nodeA.x, nodeA.y);
                    this.ctx.lineTo(nodeB.x, nodeB.y);
                    this.ctx.stroke();
                    connections += 1;
                    if (connections >= maxConnections) {
                        break;
                    }
                }
            }

            if (pointerThreshold > 0 && this.pointer.active && this.settings.enablePointerInteraction) {
                const dxPointer = nodeA.x - this.pointer.x;
                const dyPointer = nodeA.y - this.pointer.y;
                const pointerDistance = Math.hypot(dxPointer, dyPointer);
                if (pointerDistance < pointerThreshold) {
                    const alpha = (1 - pointerDistance / pointerThreshold) * 0.55 * this.performanceProfile.quality;
                    if (alpha > 0.015) {
                        this.ctx.strokeStyle = `rgba(${secondary}, ${Math.min(0.85, alpha)})`;
                        this.ctx.lineWidth = 0.8;
                        this.ctx.beginPath();
                        this.ctx.moveTo(nodeA.x, nodeA.y);
                        this.ctx.lineTo(this.pointer.x, this.pointer.y);
                        this.ctx.stroke();
                    }
                }
            }
        }
    }

    drawNodes(colors) {
        const { primary, secondary } = colors;
        const glowStrength = this.runtime.glowStrength;
        const coreAlpha = Math.min(0.9, 0.6 + this.performanceProfile.quality * 0.25);
        const pointerRadius = this.runtime.pointerRadius;
        const pointerAlpha = Math.min(0.45, this.runtime.pointerGlowAlpha);

        this.nodes.forEach((node) => {
            const scale = this.settings.enableDepthEffect ? 0.5 + (node.z / 100) * 0.5 : 1;
            const radius = node.radius * scale;

            if (this.settings.particleGlow) {
                const gradient = this.ctx.createRadialGradient(
                    node.x, node.y, 0,
                    node.x, node.y, radius * (6 + glowStrength * 4)
                );
                gradient.addColorStop(0, `rgba(${primary}, ${0.25 + glowStrength * 0.45})`);
                gradient.addColorStop(1, `rgba(${primary}, 0)`);
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, radius * 3, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                this.ctx.fillStyle = `rgba(${primary}, ${coreAlpha})`;
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });

        if (this.pointer.active && this.settings.enablePointerInteraction) {
            const pointerGradient = this.ctx.createRadialGradient(
                this.pointer.x, this.pointer.y, 0,
                this.pointer.x, this.pointer.y, pointerRadius
            );
            pointerGradient.addColorStop(0, `rgba(${secondary}, ${pointerAlpha})`);
            pointerGradient.addColorStop(1, `rgba(${secondary}, 0)`);
            this.ctx.fillStyle = pointerGradient;
            this.ctx.beginPath();
            this.ctx.arc(this.pointer.x, this.pointer.y, pointerRadius, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    ensureBackdropGradient(colors, width, height) {
        if (!this.ctx) {
            return;
        }
        const key = `${colors.primary}|${colors.secondary}`;
        if (
            this.backdropGradient &&
            this.backdropColorKey === key &&
            this.backdropSize.width === width &&
            this.backdropSize.height === height
        ) {
            return;
        }
        const startAlpha = 0.04 + this.runtime.glowStrength * 0.28;
        const endAlpha = 0.02 + this.runtime.glowStrength * 0.18;
        const gradient = this.ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, `rgba(${colors.primary}, ${startAlpha})`);
        gradient.addColorStop(1, `rgba(${colors.secondary}, ${endAlpha})`);
        this.backdropGradient = gradient;
        this.backdropColorKey = key;
        this.backdropSize.width = width;
        this.backdropSize.height = height;
    }

    render(context = {}) {
        if (!this.isInitialized) return;

        const canvasData = this.canvasData || this.canvasManager.getCanvas(this.canvasId);
        if (!canvasData) {
            return;
        }

        const dpr = canvasData.dpr || window.devicePixelRatio || 1;
        const width = canvasData.canvas.width / dpr;
        const height = canvasData.canvas.height / dpr;

        const deltaTime = typeof context === 'number'
            ? context
            : typeof context.deltaTime === 'number'
                ? context.deltaTime
                : 16.67;
        const safeDelta = Math.max(1, Math.min(48, deltaTime));
        const deltaFactor = safeDelta / 16.67;

        this.time += safeDelta;

        this.ctx.clearRect(0, 0, width, height);

        const colors = this.getColors();
        this.ensureBackdropGradient(colors, width, height);
        if (this.backdropGradient) {
            this.ctx.fillStyle = this.backdropGradient;
            this.ctx.fillRect(0, 0, width, height);
        }

        this.updateNodes(deltaFactor);

        let shouldDrawConnections = true;
        if (this.performanceProfile.connectionInterval > 0) {
            this.connectionAccumulator += safeDelta;
            if (this.connectionAccumulator >= this.performanceProfile.connectionInterval) {
                shouldDrawConnections = true;
                this.connectionAccumulator = 0;
            } else if (!this.hasRenderedConnections) {
                shouldDrawConnections = true;
                this.connectionAccumulator = 0;
            } else {
                shouldDrawConnections = false;
            }
        }

        if (shouldDrawConnections) {
            this.drawConnections(colors, width);
            this.hasRenderedConnections = true;
        }

        this.drawNodes(colors);
    }

    getColors() {
        const schemes = {
            'cyan-magenta': {
                primary: '0, 212, 255',
                secondary: '255, 0, 110'
            },
            'purple': {
                primary: '138, 43, 226',
                secondary: '255, 20, 147'
            },
            'green': {
                primary: '0, 255, 127',
                secondary: '50, 205, 50'
            },
            'gold': {
                primary: '255, 215, 0',
                secondary: '255, 140, 0'
            }
        };

        return schemes[this.settings.colorScheme] || schemes['cyan-magenta'];
    }

    computePerformanceProfile(overrides = {}) {
        const navigatorRef = typeof navigator !== 'undefined' ? navigator : {};
        const deviceMemory = Math.min(Math.max(navigatorRef.deviceMemory || 4, 1), 16);
        const hardwareConcurrency = Math.min(Math.max(navigatorRef.hardwareConcurrency || 4, 1), 16);
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 3);

        const memoryScore = deviceMemory / 16;
        const coreScore = hardwareConcurrency / 16;
        const pixelScore = 1 / pixelRatio;
        const baseQuality = Math.max(0.55, Math.min(1, memoryScore * 0.5 + coreScore * 0.3 + pixelScore * 0.2));
        const quality = typeof overrides?.quality === 'number'
            ? Math.max(0.45, Math.min(1.2, overrides.quality))
            : baseQuality;

        return {
            quality,
            nodeMultiplier: overrides?.nodeMultiplier ?? (0.75 + quality * 0.5),
            connectionMultiplier: overrides?.connectionMultiplier ?? (0.7 + quality * 0.5),
            maxConnections: overrides?.maxConnections ?? Math.round(6 + quality * 8),
            pointerInfluence: overrides?.pointerInfluence ?? (0.0002 + quality * 0.00015),
            friction: overrides?.friction ?? Math.min(0.985, 0.92 + quality * 0.05),
            velocityMultiplier: overrides?.velocityMultiplier ?? (0.8 + quality * 0.35),
            glowStrength: overrides?.glowStrength ?? (0.3 + quality * 0.5),
            pointerRadius: overrides?.pointerRadius ?? (120 + quality * 80),
            pointerGlowAlpha: overrides?.pointerGlowAlpha ?? (0.18 + quality * 0.2),
            connectionInterval: overrides?.connectionInterval ?? (quality >= 0.85 ? 16 : quality >= 0.7 ? 24 : 32)
        };
    }

    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    dispose() {
        if (this._listeners) {
            this._listeners.forEach(({ type, handler }) => {
                window.removeEventListener(type, handler);
            });
        }

        if (this.ctx && this.canvasData) {
            const dpr = this.canvasData.dpr || window.devicePixelRatio || 1;
            const width = this.canvasData.canvas.width / dpr;
            const height = this.canvasData.canvas.height / dpr;
            this.ctx.clearRect(0, 0, width, height);
        }

        this.nodes = [];
        this.canvasData = null;
        this.backdropGradient = null;
        this.hasRenderedConnections = false;
        this.isInitialized = false;
        console.log('PolytopalFieldVisualizer disposed');
    }
}

export default PolytopalFieldVisualizer;
