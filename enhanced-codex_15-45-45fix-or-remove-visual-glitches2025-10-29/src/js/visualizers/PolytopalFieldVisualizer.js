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

        this.baseSettings = {
            baseCount: this.settings.baseCount,
            maxVelocity: this.settings.maxVelocity,
            connectionDistance: this.settings.connectionDistance
        };

        this.dynamicState = {
            density: 1,
            targetDensity: 1,
            velocity: 1,
            targetVelocity: 1,
            connection: 1,
            targetConnection: 1
        };

        this.orchestratorColor = { h: 190, s: 0.78, v: 0.86 };
        this.heroContext = { focus: 0, pointerShift: 0, energy: 0 };

        this.nodes = [];
        this.pointer = { x: 0, y: 0, active: false };
        this.time = 0;
        this.isInitialized = false;

        this.handleVisualStateUpdate = this.handleVisualStateUpdate.bind(this);
    }

    initialize() {
        if (this.isInitialized) return;

        const canvasData = this.canvasManager.getCanvas(this.canvasId);
        if (!canvasData) {
            console.error('PolytopalFieldVisualizer: Canvas not found:', this.canvasId);
            return;
        }

        this.ctx = canvasData.ctx;
        this.setupNodes();
        this.setupEventListeners();

        window.addEventListener('visualStateUpdate', this.handleVisualStateUpdate);

        // Register render callback
        this.canvasManager.registerRenderCallback(this.canvasId, this.render.bind(this));

        this.isInitialized = true;
        console.log('✨ PolytopalFieldVisualizer initialized');
    }

    setupNodes() {
        const canvasData = this.canvasManager.getCanvas(this.canvasId);
        const width = canvasData.canvas.width / (window.devicePixelRatio || 1);
        const height = canvasData.canvas.height / (window.devicePixelRatio || 1);

        const nodeCount = Math.round(this.settings.baseCount * (width / 1280 + 0.4));
        this.nodes = Array.from({ length: nodeCount }, () => this.createNode(width, height));
    }

    syncNodeCount(targetCount, width, height) {
        if (!Number.isFinite(targetCount) || targetCount <= 0) {
            return;
        }

        const current = this.nodes.length;
        if (current < targetCount) {
            for (let i = current; i < targetCount; i += 1) {
                this.nodes.push(this.createNode(width, height));
            }
        } else if (current > targetCount) {
            this.nodes.length = targetCount;
        }
    }

    applyHeroPointerInfluence(width, height) {
        if (this.pointer.active) {
            return;
        }

        const targetX = width * 0.5 + (Number.isFinite(this.heroContext.pointerShift) ? this.heroContext.pointerShift * 0.6 : 0);
        const targetY = height * (0.48 - this.heroContext.focus * 0.12);
        this.pointer.x += (targetX - this.pointer.x) * 0.06;
        this.pointer.y += (targetY - this.pointer.y) * 0.06;
    }

    createNode(width, height) {
        return {
            x: Math.random() * width,
            y: Math.random() * height,
            z: Math.random() * 100, // Depth dimension for 4D effect
            vx: (Math.random() - 0.5) * this.settings.maxVelocity,
            vy: (Math.random() - 0.5) * this.settings.maxVelocity,
            vz: (Math.random() - 0.5) * 0.1, // Slow z-axis movement
            radius: Math.random() * 1.4 + 0.8,
            phase: Math.random() * Math.PI * 2 // For orbital effects
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
        window.addEventListener('touchend', handleTouchEnd);

        // Store for cleanup
        this._listeners = [
            { type: 'mousemove', handler: handleMouseMove },
            { type: 'mouseleave', handler: handleMouseLeave },
            { type: 'touchmove', handler: handleTouchMove },
            { type: 'touchend', handler: handleTouchEnd }
        ];
    }

    handleVisualStateUpdate(event) {
        const detail = event?.detail;
        if (!detail) return;

        const state = detail.state || {};
        const multipliers = detail.multipliers || {};
        const context = detail.context || {};

        const intensity = Number.isFinite(state.intensity) ? state.intensity : 0.6;
        const chaos = Number.isFinite(state.chaos) ? state.chaos : 0.2;
        const speed = Number.isFinite(state.speed) ? state.speed : 0.5;
        const hue = Number.isFinite(state.hue) ? state.hue : this.orchestratorColor.h;

        const energy = Number.isFinite(context.heroEnergy)
            ? context.heroEnergy
            : (Number.isFinite(context.userEnergy) ? context.userEnergy : this.heroContext.energy);
        const focus = Number.isFinite(context.heroFocus) ? context.heroFocus : this.heroContext.focus;
        const pointerShift = Number.isFinite(context.heroPointerShift)
            ? context.heroPointerShift
            : this.heroContext.pointerShift;
        const scrollVelocity = Number.isFinite(context.scrollVelocity) ? context.scrollVelocity : 0;

        this.dynamicState.targetDensity = this.clamp(0.72 + intensity * 0.9 + focus * 0.3, 0.35, 2.6);
        this.dynamicState.targetVelocity = this.clamp(0.7 + speed * 0.6 + chaos * 0.4 + scrollVelocity * 0.18, 0.35, 2.8);
        this.dynamicState.targetConnection = this.clamp(0.82 + (1 - chaos) * 0.5 + focus * 0.25, 0.5, 2.4);

        this.heroContext = {
            focus: Math.max(0, Math.min(1, focus)),
            pointerShift,
            energy: Math.max(0, Math.min(1, energy))
        };

        const mouseActivity = Number.isFinite(multipliers.mouseActivity) ? multipliers.mouseActivity : 1;
        const saturation = Math.min(1, 0.55 + intensity * 0.35 + energy * 0.25 + (mouseActivity - 1) * 0.1);
        const value = Math.min(1, 0.58 + energy * 0.35 + scrollVelocity * 0.08);

        this.orchestratorColor = { h: hue, s: saturation, v: value };
    }

    updateNodes(deltaTime) {
        const canvasData = this.canvasManager.getCanvas(this.canvasId);
        const width = canvasData.canvas.width / (window.devicePixelRatio || 1);
        const height = canvasData.canvas.height / (window.devicePixelRatio || 1);

        const dt = Number.isFinite(deltaTime) ? deltaTime : 16;
        const smoothing = 1 - Math.exp(-dt / 420);
        this.dynamicState.density += (this.dynamicState.targetDensity - this.dynamicState.density) * smoothing;
        this.dynamicState.velocity += (this.dynamicState.targetVelocity - this.dynamicState.velocity) * smoothing;
        this.dynamicState.connection += (this.dynamicState.targetConnection - this.dynamicState.connection) * smoothing;

        const densityFactor = this.dynamicState.density;
        const velocityScale = this.dynamicState.velocity;
        const connectionScale = this.dynamicState.connection;

        this.settings.maxVelocity = this.baseSettings.maxVelocity * velocityScale;
        this.settings.connectionDistance = this.baseSettings.connectionDistance * connectionScale;

        const targetNodeCount = Math.max(24, Math.round(this.baseSettings.baseCount * densityFactor));
        this.syncNodeCount(targetNodeCount, width, height);

        this.applyHeroPointerInfluence(width, height);

        const heroEnergy = Math.max(0, Math.min(1, this.heroContext.energy));
        const frameFactor = dt / 16;
        const pointerStrength = this.settings.enablePointerInteraction
            ? Math.max(this.pointer.active ? 1 : 0, this.heroContext.focus)
            : 0;

        this.nodes.forEach((node) => {
            // Update position
            node.x += node.vx;
            node.y += node.vy;
            node.z += node.vz;

            // Update phase for orbital effects
            node.phase += 0.01 * velocityScale;

            // Wrap around edges
            if (node.x < -50) node.x = width + 50;
            if (node.x > width + 50) node.x = -50;
            if (node.y < -50) node.y = height + 50;
            if (node.y > height + 50) node.y = -50;
            if (node.z < 0) node.z = 100;
            if (node.z > 100) node.z = 0;

            // Organic drift based on hero energy
            const driftScale = heroEnergy * 0.012 * velocityScale * frameFactor;
            node.vx += (Math.random() - 0.5) * driftScale;
            node.vy += (Math.random() - 0.5) * driftScale;

            // Pointer interaction blending hero focus
            if (pointerStrength > 0) {
                const dx = this.pointer.x - node.x;
                const dy = this.pointer.y - node.y;
                const distSq = dx * dx + dy * dy + 0.001;
                const influence = Math.min(0.45, 1200 / distSq) * pointerStrength * frameFactor;
                node.vx += dx * influence * 0.00035;
                node.vy += dy * influence * 0.00035;
            }

            // Clamp velocities
            node.vx = this.clamp(node.vx, -this.settings.maxVelocity, this.settings.maxVelocity);
            node.vy = this.clamp(node.vy, -this.settings.maxVelocity, this.settings.maxVelocity);
        });
    }

    drawConnections() {
        const canvasData = this.canvasManager.getCanvas(this.canvasId);
        const width = canvasData.canvas.width / (window.devicePixelRatio || 1);
        const maxDistance = this.settings.connectionDistance * (width < 768 ? 0.75 : 1);

        const { primary, secondary } = this.getColors();
        const pointerStrength = this.settings.enablePointerInteraction
            ? Math.max(this.pointer.active ? 1 : 0, this.heroContext.focus)
            : 0;

        for (let i = 0; i < this.nodes.length; i++) {
            const nodeA = this.nodes[i];

            for (let j = i + 1; j < this.nodes.length; j++) {
                const nodeB = this.nodes[j];
                const dx = nodeA.x - nodeB.x;
                const dy = nodeA.y - nodeB.y;
                const dz = (nodeA.z - nodeB.z) * 0.3; // Depth factor
                const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (distance < maxDistance) {
                    const alpha = (1 - distance / maxDistance) * 0.45;
                    const depthFactor = this.settings.enableDepthEffect ?
                        (1 - Math.abs(nodeA.z - 50) / 50) * 0.5 + 0.5 : 1;

                    this.ctx.strokeStyle = `rgba(${primary}, ${alpha * depthFactor})`;
                    this.ctx.lineWidth = 0.8;
                    this.ctx.beginPath();
                    this.ctx.moveTo(nodeA.x, nodeA.y);
                    this.ctx.lineTo(nodeB.x, nodeB.y);
                    this.ctx.stroke();
                }
            }

            // Pointer connections
            if (pointerStrength > 0) {
                const dxPointer = nodeA.x - this.pointer.x;
                const dyPointer = nodeA.y - this.pointer.y;
                const pointerDistance = Math.hypot(dxPointer, dyPointer);
                const pointerThreshold = maxDistance * 1.1;

                if (pointerDistance < pointerThreshold) {
                    const alpha = (1 - pointerDistance / pointerThreshold) * 0.6 * pointerStrength;
                    this.ctx.strokeStyle = `rgba(${secondary}, ${alpha})`;
                    this.ctx.lineWidth = 0.8;
                    this.ctx.beginPath();
                    this.ctx.moveTo(nodeA.x, nodeA.y);
                    this.ctx.lineTo(this.pointer.x, this.pointer.y);
                    this.ctx.stroke();
                }
            }
        }
    }

    drawNodes() {
        const { primary, secondary } = this.getColors();

        this.nodes.forEach((node) => {
            const scale = this.settings.enableDepthEffect ?
                0.5 + (node.z / 100) * 0.5 : 1;
            const radius = node.radius * scale;

            if (this.settings.particleGlow) {
                const gradient = this.ctx.createRadialGradient(
                    node.x, node.y, 0,
                    node.x, node.y, radius * 8
                );
                gradient.addColorStop(0, `rgba(${primary}, 0.55)`);
                gradient.addColorStop(1, `rgba(${primary}, 0)`);
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, radius * 3, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                this.ctx.fillStyle = `rgba(${primary}, 0.8)`;
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });

        // Pointer glow effect
        const pointerStrength = this.settings.enablePointerInteraction
            ? Math.max(this.pointer.active ? 1 : 0, this.heroContext.focus)
            : 0;
        if (pointerStrength > 0.02) {
            const pointerGradient = this.ctx.createRadialGradient(
                this.pointer.x, this.pointer.y, 0,
                this.pointer.x, this.pointer.y, 120
            );
            pointerGradient.addColorStop(0, `rgba(${secondary}, ${0.25 * pointerStrength})`);
            pointerGradient.addColorStop(1, `rgba(${secondary}, 0)`);
            this.ctx.fillStyle = pointerGradient;
            this.ctx.beginPath();
            this.ctx.arc(this.pointer.x, this.pointer.y, 120, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    render(deltaTime) {
        if (!this.isInitialized) return;

        const canvasData = this.canvasManager.getCanvas(this.canvasId);
        const width = canvasData.canvas.width / (window.devicePixelRatio || 1);
        const height = canvasData.canvas.height / (window.devicePixelRatio || 1);

        this.time += deltaTime;

        // Clear canvas
        this.ctx.clearRect(0, 0, width, height);

        // Draw backdrop gradient
        const { primary, secondary } = this.getColors();
        const backdropGradient = this.ctx.createLinearGradient(0, 0, width, height);
        backdropGradient.addColorStop(0, `rgba(${primary}, 0.07)`);
        backdropGradient.addColorStop(1, `rgba(${secondary}, 0.05)`);
        this.ctx.fillStyle = backdropGradient;
        this.ctx.fillRect(0, 0, width, height);

        // Update and draw
        this.updateNodes(deltaTime);
        this.drawConnections();
        this.drawNodes();
    }

    getColors() {
        const paletteOffsets = {
            'cyan-magenta': [0, 130],
            'purple': [30, 180],
            'green': [120, -90],
            'gold': [48, 210]
        };

        const offsets = paletteOffsets[this.settings.colorScheme] || paletteOffsets['cyan-magenta'];
        const baseHue = this.orchestratorColor.h;
        const saturation = this.orchestratorColor.s;
        const value = this.orchestratorColor.v;

        const primaryHue = (baseHue + offsets[0] + 360) % 360;
        const secondaryHue = (baseHue + offsets[1] + 360) % 360;

        const primaryRGB = this.hsvToRgb(primaryHue, saturation, value);
        const secondaryRGB = this.hsvToRgb(secondaryHue, Math.min(1, saturation * 0.9 + 0.1), Math.min(1, value * 0.92 + 0.05));

        return {
            primary: primaryRGB.join(', '),
            secondary: secondaryRGB.join(', ')
        };
    }

    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    hsvToRgb(h, s, v) {
        const hue = ((h % 360) + 360) % 360;
        const sat = Math.min(1, Math.max(0, s));
        const val = Math.min(1, Math.max(0, v));

        const c = val * sat;
        const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
        const m = val - c;

        let r1 = 0;
        let g1 = 0;
        let b1 = 0;

        if (hue < 60) {
            r1 = c; g1 = x; b1 = 0;
        } else if (hue < 120) {
            r1 = x; g1 = c; b1 = 0;
        } else if (hue < 180) {
            r1 = 0; g1 = c; b1 = x;
        } else if (hue < 240) {
            r1 = 0; g1 = x; b1 = c;
        } else if (hue < 300) {
            r1 = x; g1 = 0; b1 = c;
        } else {
            r1 = c; g1 = 0; b1 = x;
        }

        const to255 = (value) => Math.round((value + m) * 255);
        return [to255(r1), to255(g1), to255(b1)];
    }

    dispose() {
        // Remove event listeners
        if (this._listeners) {
            this._listeners.forEach(({ type, handler }) => {
                window.removeEventListener(type, handler);
            });
        }

        window.removeEventListener('visualStateUpdate', this.handleVisualStateUpdate);

        // Clear canvas
        if (this.ctx) {
            const canvasData = this.canvasManager.getCanvas(this.canvasId);
            const width = canvasData.canvas.width / (window.devicePixelRatio || 1);
            const height = canvasData.canvas.height / (window.devicePixelRatio || 1);
            this.ctx.clearRect(0, 0, width, height);
        }

        this.isInitialized = false;
        console.log('PolytopalFieldVisualizer disposed');
    }
}

export default PolytopalFieldVisualizer;
