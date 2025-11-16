/**
 * Optimized Particle Layer - Single unified particle system
 * Uses instance rendering and LOD for performance
 * A Paul Phillips Manifestation
 */

export class OptimizedParticleLayer {
    constructor(options = {}) {
        this.priority = options.priority || 10;
        this.particles = [];
        this.maxParticles = 120; // Total budget
        this.activeCount = 0;

        // Color schemes
        this.colorSchemes = {
            cyan: { r: 0, g: 212, b: 255 },
            magenta: { r: 255, g: 0, b: 110 },
            purple: { r: 168, g: 85, b: 247 },
            blue: { r: 59, g: 130, b: 246 }
        };

        this.currentScheme = 'cyan';
        this.initialized = false;
    }

    initialize(width, height) {
        this.width = width;
        this.height = height;

        // Initialize particle pool
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                active: i < 80, // Start with fewer particles
                alpha: 0.6,
                size: Math.random() * 2 + 1
            });
        }

        this.initialized = true;
    }

    render({ ctx, deltaTime, width, height, qualityLevel }) {
        if (!this.initialized) {
            this.initialize(width, height);
        }

        if (!ctx) return;

        // Adjust particle count based on quality
        const targetCount = qualityLevel === 'high' ? 80 : qualityLevel === 'medium' ? 50 : 30;
        this.adjustParticleCount(targetCount);

        // Update and render particles
        const color = this.colorSchemes[this.currentScheme];

        ctx.save();

        this.activeCount = 0;
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            if (!p.active) continue;

            // Update position
            p.x += p.vx * 60 * deltaTime;
            p.y += p.vy * 60 * deltaTime;

            // Wrap around screen
            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;

            // Render particle
            ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${p.alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();

            // Draw connections (only in high quality)
            if (qualityLevel === 'high' && i < 40) {
                this.drawConnections(ctx, p, i, color);
            }

            this.activeCount++;
        }

        ctx.restore();
    }

    drawConnections(ctx, particle, index, color) {
        const maxDistance = 150;

        for (let j = index + 1; j < Math.min(this.particles.length, index + 20); j++) {
            const other = this.particles[j];
            if (!other.active) continue;

            const dx = particle.x - other.x;
            const dy = particle.y - other.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < maxDistance) {
                const alpha = (1 - distance / maxDistance) * 0.3;
                ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(particle.x, particle.y);
                ctx.lineTo(other.x, other.y);
                ctx.stroke();
            }
        }
    }

    adjustParticleCount(target) {
        if (this.activeCount < target) {
            // Activate more particles
            for (let i = 0; i < this.particles.length && this.activeCount < target; i++) {
                if (!this.particles[i].active) {
                    this.particles[i].active = true;
                    this.activeCount++;
                }
            }
        } else if (this.activeCount > target) {
            // Deactivate excess particles
            for (let i = this.particles.length - 1; i >= 0 && this.activeCount > target; i--) {
                if (this.particles[i].active) {
                    this.particles[i].active = false;
                    this.activeCount--;
                }
            }
        }
    }

    setColorScheme(scheme) {
        if (this.colorSchemes[scheme]) {
            this.currentScheme = scheme;
        }
    }

    onResize(width, height) {
        this.width = width;
        this.height = height;

        // Reposition particles proportionally
        this.particles.forEach(p => {
            p.x = (p.x / this.width) * width;
            p.y = (p.y / this.height) * height;
        });
    }

    dispose() {
        this.particles = [];
        this.initialized = false;
    }
}
