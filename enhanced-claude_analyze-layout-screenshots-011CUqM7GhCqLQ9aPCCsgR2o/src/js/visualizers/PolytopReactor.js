/**
 * PolytopReactor
 *
 * Simplified polytope visualizer that reacts to scroll
 * Single background system, no conflicts
 *
 * @author Clear Seas Solutions
 * @version 2.0
 */

export class PolytopReactor {
    constructor(canvas, options = {}) {
        this.canvas = typeof canvas === 'string'
            ? document.querySelector(canvas)
            : canvas;

        if (!this.canvas) {
            console.error('PolytopReactor: Canvas not found');
            return;
        }

        this.options = {
            particleCount: 100,
            connectionDistance: 150,
            baseColor: { r: 0, g: 212, b: 255 },
            secondaryColor: { r: 255, g: 0, b: 110 },
            rotationSpeed: 0.0005,
            reactivity: 0.5, // How much it reacts to scroll
            mobile: window.innerWidth <= 768,
            ...options
        };

        // Reduce particles on mobile
        if (this.options.mobile) {
            this.options.particleCount = Math.floor(this.options.particleCount / 2);
            this.options.connectionDistance = this.options.connectionDistance / 1.5;
        }

        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.scrollState = {
            progress: 0,
            velocity: 0,
            section: null
        };

        this.animationFrame = null;
        this.isRunning = false;

        this.init();
    }

    init() {
        this.resize();
        this.createParticles();
        this.start();

        window.addEventListener('resize', () => this.resize());

        console.log('🌀 PolytopReactor initialized');
    }

    /**
     * Resize canvas to window
     */
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    /**
     * Create particle system
     */
    createParticles() {
        this.particles = [];

        for (let i = 0; i < this.options.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                z: Math.random() * 1000 - 500, // 3D depth

                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                vz: (Math.random() - 0.5) * 0.5,

                size: Math.random() * 2 + 1,
                alpha: Math.random() * 0.5 + 0.5
            });
        }
    }

    /**
     * Update scroll state from orchestrator
     */
    updateScrollState(state) {
        this.scrollState = { ...state };

        // React to scroll velocity
        const velocityInfluence = Math.min(Math.abs(state.velocity) / 1000, 2);

        this.particles.forEach(particle => {
            particle.vz += velocityInfluence * (state.direction === 'down' ? 1 : -1);
        });
    }

    /**
     * Update particles
     */
    update() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        this.particles.forEach(particle => {
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.z += particle.vz;

            // Wrap around edges
            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
            if (particle.y > this.canvas.height) particle.y = 0;

            // Wrap Z
            if (particle.z < -500) particle.z = 500;
            if (particle.z > 500) particle.z = -500;

            // Apply rotation based on scroll progress
            const rotation = this.scrollState.progress * Math.PI * 2;
            const dx = particle.x - centerX;
            const dy = particle.y - centerY;

            const newX = dx * Math.cos(rotation * this.options.rotationSpeed) -
                        dy * Math.sin(rotation * this.options.rotationSpeed);
            const newY = dx * Math.sin(rotation * this.options.rotationSpeed) +
                        dy * Math.cos(rotation * this.options.rotationSpeed);

            particle.vx += (newX - dx) * 0.001 * this.options.reactivity;
            particle.vy += (newY - dy) * 0.001 * this.options.reactivity;

            // Damping
            particle.vx *= 0.99;
            particle.vy *= 0.99;
            particle.vz *= 0.98;
        });
    }

    /**
     * Render particles and connections
     */
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw connections first
        this.drawConnections();

        // Draw particles
        this.particles.forEach(particle => {
            // Perspective calculation
            const scale = 500 / (500 + particle.z);
            const x = particle.x;
            const y = particle.y;
            const size = particle.size * scale;

            // Color based on depth and scroll
            const colorMix = (particle.z + 500) / 1000; // 0 to 1
            const r = Math.floor(this.options.baseColor.r * (1 - colorMix) +
                                this.options.secondaryColor.r * colorMix);
            const g = Math.floor(this.options.baseColor.g * (1 - colorMix) +
                                this.options.secondaryColor.g * colorMix);
            const b = Math.floor(this.options.baseColor.b * (1 - colorMix) +
                                this.options.secondaryColor.b * colorMix);

            this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${particle.alpha * scale})`;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    /**
     * Draw connections between nearby particles
     */
    drawConnections() {
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const p1 = this.particles[i];
                const p2 = this.particles[j];

                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.options.connectionDistance) {
                    const alpha = (1 - distance / this.options.connectionDistance) * 0.2;

                    this.ctx.strokeStyle = `rgba(0, 212, 255, ${alpha})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.stroke();
                }
            }
        }
    }

    /**
     * Animation loop
     */
    animate() {
        if (!this.isRunning) return;

        this.update();
        this.render();

        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    /**
     * Start animation
     */
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.animate();
    }

    /**
     * Stop animation
     */
    stop() {
        this.isRunning = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }

    /**
     * Cleanup
     */
    destroy() {
        this.stop();
        console.log('🗑️  PolytopReactor destroyed');
    }
}

export default PolytopReactor;
