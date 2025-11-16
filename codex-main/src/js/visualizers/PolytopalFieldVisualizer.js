/**
 * PolytopalFieldVisualizer - Avant-garde particle network with orchestrated evolution
 * Elegant, smooth motion with sophisticated visual choreography
 *
 * A Paul Phillips Manifestation - Paul@clearseassolutions.com
 * "The Revolution Will Not be in a Structured Format" © 2025
 */

export class PolytopalFieldVisualizer {
    constructor(canvasManager, canvasId, options = {}) {
        this.canvasManager = canvasManager;
        this.canvasId = canvasId;

        this.settings = {
            baseCount: options.baseCount || 60, // Reduced for less clutter
            maxVelocity: options.maxVelocity || 0.25, // Slower, more elegant motion
            connectionDistance: options.connectionDistance || 160,
            colorScheme: options.colorScheme || 'cyan-magenta',
            enablePointerInteraction: options.enablePointerInteraction !== false,
            enableDepthEffect: options.enableDepthEffect !== false,
            particleGlow: options.particleGlow !== false,
            flowFieldInfluence: options.flowFieldInfluence || 0.15, // NEW: Organic flow field
            smoothingFactor: options.smoothingFactor || 0.92 // NEW: Motion smoothing
        };

        this.nodes = [];
        this.pointer = { x: 0, y: 0, active: false };
        this.time = 0;
        this.isInitialized = false;

        // NEW: Orchestrator state integration
        this.orchestratorState = {
            intensity: 0.5,
            chaos: 0.2,
            speed: 0.6,
            hue: 180,
            rgbOffset: 0.002,
            userEnergy: 0.5
        };

        // Listen to orchestrator
        window.addEventListener('visualStateUpdate', (e) => {
            if (e.detail?.state) {
                this.orchestratorState = { ...e.detail.state };
            }
        });
    }

    initialize() {
        if (this.isInitialized) return;

        const canvasData = this.canvasManager.getCanvas(this.canvasId);
        if (!canvasData) {
            console.error('PolytopalFieldVisualizer: Canvas not found:', this.canvasId);
            return;
        }

        // Get 2D context from CanvasManager
        this.ctx = canvasData.ctx;
        if (!this.ctx) {
            console.error('PolytopalFieldVisualizer: Canvas does not have 2D context');
            return;
        }

        this.setupNodes();
        this.setupEventListeners();

        // Register render callback (correct method name is registerRenderer)
        this.canvasManager.registerRenderer(this.canvasId, this.render.bind(this));

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

    createNode(width, height) {
        return {
            x: Math.random() * width,
            y: Math.random() * height,
            z: Math.random() * 100, // Depth dimension for 4D effect
            vx: (Math.random() - 0.5) * this.settings.maxVelocity,
            vy: (Math.random() - 0.5) * this.settings.maxVelocity,
            vz: (Math.random() - 0.5) * 0.1, // Slow z-axis movement
            radius: Math.random() * 1.2 + 0.6, // Smaller, more refined particles
            phase: Math.random() * Math.PI * 2, // For orbital effects
            targetVx: 0, // NEW: Smooth velocity targets
            targetVy: 0,
            energy: Math.random() // NEW: Individual particle energy
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

    updateNodes(deltaTime) {
        const canvasData = this.canvasManager.getCanvas(this.canvasId);
        const width = canvasData.canvas.width / (window.devicePixelRatio || 1);
        const height = canvasData.canvas.height / (window.devicePixelRatio || 1);

        // Dynamic parameters from orchestrator
        const speedMultiplier = this.orchestratorState.speed || 0.6;
        const chaosLevel = this.orchestratorState.chaos || 0.2;
        const energyLevel = this.orchestratorState.userEnergy || 0.5;

        this.nodes.forEach((node, index) => {
            // NEW: Organic flow field (avant-garde motion)
            const flowX = Math.sin(node.x * 0.01 + this.time * 0.0001 + node.phase) * this.settings.flowFieldInfluence;
            const flowY = Math.cos(node.y * 0.01 + this.time * 0.0001 + node.phase) * this.settings.flowFieldInfluence;

            // Apply flow field as target velocity
            node.targetVx = flowX * speedMultiplier * (1 + chaosLevel);
            node.targetVy = flowY * speedMultiplier * (1 + chaosLevel);

            // NEW: Smooth velocity interpolation for elegant motion
            node.vx += (node.targetVx - node.vx) * (1 - this.settings.smoothingFactor);
            node.vy += (node.targetVy - node.vy) * (1 - this.settings.smoothingFactor);

            // Update position
            node.x += node.vx * speedMultiplier;
            node.y += node.vy * speedMultiplier;
            node.z += node.vz * speedMultiplier;

            // Update phase for orbital effects (influenced by energy)
            node.phase += 0.008 * (1 + energyLevel * 0.5);

            // Update particle energy (breathing effect)
            node.energy = 0.5 + Math.sin(this.time * 0.001 + node.phase) * 0.3 + energyLevel * 0.2;

            // Smooth edge wrapping (no harsh teleports)
            const margin = 80;
            if (node.x < -margin) {
                node.x = width + margin;
                node.vx *= 0.5; // Dampen velocity on wrap
            }
            if (node.x > width + margin) {
                node.x = -margin;
                node.vx *= 0.5;
            }
            if (node.y < -margin) {
                node.y = height + margin;
                node.vy *= 0.5;
            }
            if (node.y > height + margin) {
                node.y = -margin;
                node.vy *= 0.5;
            }
            if (node.z < 0) node.z = 100;
            if (node.z > 100) node.z = 0;

            // Pointer interaction (refined and smoother)
            if (this.pointer.active && this.settings.enablePointerInteraction) {
                const dx = this.pointer.x - node.x;
                const dy = this.pointer.y - node.y;
                const distSq = dx * dx + dy * dy + 0.001;
                const influence = Math.min(0.3, 800 / distSq); // Reduced influence for elegance
                node.targetVx += dx * influence * 0.0002 * energyLevel;
                node.targetVy += dy * influence * 0.0002 * energyLevel;
            }

            // Clamp velocities for stability
            node.vx = this.clamp(node.vx, -this.settings.maxVelocity, this.settings.maxVelocity);
            node.vy = this.clamp(node.vy, -this.settings.maxVelocity, this.settings.maxVelocity);
        });
    }

    drawConnections() {
        const canvasData = this.canvasManager.getCanvas(this.canvasId);
        const width = canvasData.canvas.width / (window.devicePixelRatio || 1);
        const maxDistance = this.settings.connectionDistance * (width < 768 ? 0.7 : 1);

        const { primary, secondary } = this.getColors();
        const intensityMult = this.orchestratorState.intensity || 0.5;
        const energyLevel = this.orchestratorState.userEnergy || 0.5;

        // NEW: Limit connections per node for less clutter
        const maxConnectionsPerNode = Math.floor(4 + energyLevel * 3);

        for (let i = 0; i < this.nodes.length; i++) {
            const nodeA = this.nodes[i];
            let connectionCount = 0;

            for (let j = i + 1; j < this.nodes.length; j++) {
                if (connectionCount >= maxConnectionsPerNode) break; // Less cluttered

                const nodeB = this.nodes[j];
                const dx = nodeA.x - nodeB.x;
                const dy = nodeA.y - nodeB.y;
                const dz = (nodeA.z - nodeB.z) * 0.3; // Depth factor
                const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (distance < maxDistance) {
                    connectionCount++;

                    // NEW: More elegant alpha curve with energy consideration
                    const distanceRatio = distance / maxDistance;
                    const alpha = Math.pow(1 - distanceRatio, 2) * 0.35 * intensityMult;

                    // NEW: Depth creates more sophisticated layering
                    const depthFactor = this.settings.enableDepthEffect ?
                        (1 - Math.abs(nodeA.z - 50) / 50) * 0.4 + 0.6 : 1;

                    // NEW: Energy-based color mixing
                    const energyColor = nodeA.energy * nodeB.energy;
                    const finalAlpha = alpha * depthFactor * (0.8 + energyColor * 0.2);

                    this.ctx.strokeStyle = `rgba(${primary}, ${finalAlpha})`;
                    this.ctx.lineWidth = 0.6 + energyColor * 0.3; // Thinner, more elegant lines
                    this.ctx.beginPath();
                    this.ctx.moveTo(nodeA.x, nodeA.y);
                    this.ctx.lineTo(nodeB.x, nodeB.y);
                    this.ctx.stroke();
                }
            }

            // Pointer connections (more refined)
            if (this.pointer.active && this.settings.enablePointerInteraction) {
                const dxPointer = nodeA.x - this.pointer.x;
                const dyPointer = nodeA.y - this.pointer.y;
                const pointerDistance = Math.hypot(dxPointer, dyPointer);
                const pointerThreshold = maxDistance * 1.2;

                if (pointerDistance < pointerThreshold) {
                    const distRatio = pointerDistance / pointerThreshold;
                    const alpha = Math.pow(1 - distRatio, 2) * 0.45 * energyLevel;
                    this.ctx.strokeStyle = `rgba(${secondary}, ${alpha})`;
                    this.ctx.lineWidth = 0.8 + energyLevel * 0.4;
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
        const intensityMult = this.orchestratorState.intensity || 0.5;
        const energyLevel = this.orchestratorState.userEnergy || 0.5;

        this.nodes.forEach((node) => {
            // NEW: Scale influenced by depth AND particle energy
            const baseScale = this.settings.enableDepthEffect ?
                0.5 + (node.z / 100) * 0.5 : 1;
            const energyScale = 0.85 + node.energy * 0.3;
            const radius = node.radius * baseScale * energyScale;

            if (this.settings.particleGlow) {
                // NEW: Sophisticated multi-layer glow
                const glowRadius = radius * 6 * (0.8 + energyLevel * 0.4);
                const gradient = this.ctx.createRadialGradient(
                    node.x, node.y, 0,
                    node.x, node.y, glowRadius
                );

                // Inner bright core
                gradient.addColorStop(0, `rgba(${primary}, ${0.6 * intensityMult * node.energy})`);
                gradient.addColorStop(0.3, `rgba(${primary}, ${0.35 * intensityMult})`);
                gradient.addColorStop(0.6, `rgba(${primary}, ${0.12 * intensityMult})`);
                gradient.addColorStop(1, `rgba(${primary}, 0)`);

                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
                this.ctx.fill();

                // Core particle (sharp center)
                this.ctx.fillStyle = `rgba(${primary}, ${0.9 * node.energy})`;
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, radius * 0.4, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                // Solid style (minimal)
                this.ctx.fillStyle = `rgba(${primary}, ${0.75 * intensityMult})`;
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });

        // Pointer glow effect (more elegant and responsive)
        if (this.pointer.active && this.settings.enablePointerInteraction) {
            const pointerRadius = 100 * (1 + energyLevel * 0.5);
            const pointerGradient = this.ctx.createRadialGradient(
                this.pointer.x, this.pointer.y, 0,
                this.pointer.x, this.pointer.y, pointerRadius
            );
            pointerGradient.addColorStop(0, `rgba(${secondary}, ${0.3 * energyLevel})`);
            pointerGradient.addColorStop(0.5, `rgba(${secondary}, ${0.15 * energyLevel})`);
            pointerGradient.addColorStop(1, `rgba(${secondary}, 0)`);
            this.ctx.fillStyle = pointerGradient;
            this.ctx.beginPath();
            this.ctx.arc(this.pointer.x, this.pointer.y, pointerRadius, 0, Math.PI * 2);
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

        // NEW: Sophisticated multi-gradient backdrop with orchestrator influence
        const { primary, secondary } = this.getColors();
        const intensityMult = this.orchestratorState.intensity || 0.5;
        const chaosLevel = this.orchestratorState.chaos || 0.2;

        // Primary diagonal gradient
        const backdropGradient = this.ctx.createLinearGradient(0, 0, width, height);
        backdropGradient.addColorStop(0, `rgba(${primary}, ${0.05 * intensityMult})`);
        backdropGradient.addColorStop(0.5, `rgba(${primary}, ${0.02 * intensityMult})`);
        backdropGradient.addColorStop(1, `rgba(${secondary}, ${0.04 * intensityMult})`);
        this.ctx.fillStyle = backdropGradient;
        this.ctx.fillRect(0, 0, width, height);

        // NEW: Secondary radial gradient for depth (subtle)
        if (chaosLevel > 0.3) {
            const centerX = width * 0.5;
            const centerY = height * 0.5;
            const radialGradient = this.ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, Math.max(width, height) * 0.7
            );
            radialGradient.addColorStop(0, `rgba(${secondary}, ${0.03 * chaosLevel})`);
            radialGradient.addColorStop(1, `rgba(${secondary}, 0)`);
            this.ctx.fillStyle = radialGradient;
            this.ctx.fillRect(0, 0, width, height);
        }

        // Update and draw (order matters for layering)
        this.updateNodes(deltaTime);
        this.drawConnections();
        this.drawNodes();
    }

    getColors() {
        const schemes = {
            'cyan-magenta': {
                primary: '0, 212, 255',     // Cyan
                secondary: '255, 0, 110'     // Magenta
            },
            'purple': {
                primary: '138, 43, 226',     // Blue Violet
                secondary: '255, 20, 147'    // Deep Pink
            },
            'green': {
                primary: '0, 255, 127',      // Spring Green
                secondary: '50, 205, 50'     // Lime Green
            },
            'gold': {
                primary: '255, 215, 0',      // Gold
                secondary: '255, 140, 0'     // Dark Orange
            }
        };

        return schemes[this.settings.colorScheme] || schemes['cyan-magenta'];
    }

    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    dispose() {
        // Remove event listeners
        if (this._listeners) {
            this._listeners.forEach(({ type, handler }) => {
                window.removeEventListener(type, handler);
            });
        }

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
