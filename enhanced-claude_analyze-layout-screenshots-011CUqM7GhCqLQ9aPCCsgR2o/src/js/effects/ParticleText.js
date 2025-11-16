/**
 * ParticleText
 *
 * Dissolves text into particles and reforms on scroll
 * Uses Canvas for performance, falls back to CSS on mobile
 *
 * @author Clear Seas Solutions
 * @version 2.0
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export class ParticleText {
    constructor(element, options = {}) {
        this.element = typeof element === 'string'
            ? document.querySelector(element)
            : element;

        if (!this.element) {
            console.error('ParticleText: Element not found');
            return;
        }

        this.options = {
            particleCount: 200,
            particleSize: 2,
            particleColor: '#00d4ff',
            formSpeed: 1.5,
            dissolveSpeed: 1,
            disperseDistance: 300,
            mouseMagnetism: 100,
            mobile: window.innerWidth <= 768,
            fallbackOnMobile: true, // Use CSS instead of canvas on mobile
            ...options
        };

        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.originalText = this.element.textContent;
        this.isFormed = false;
        this.animationFrame = null;

        this.init();
    }

    init() {
        // Use CSS fallback on mobile for performance
        if (this.options.mobile && this.options.fallbackOnMobile) {
            this.setupCSSFallback();
            return;
        }

        this.setupCanvas();
        this.createParticles();
        this.setupScrollTrigger();
        this.setupMouseInteraction();
        this.animate();

        console.log('✨ ParticleText initialized');
    }

    /**
     * Setup canvas for particle rendering
     */
    setupCanvas() {
        // Hide original text
        this.element.style.opacity = '0';

        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        `;

        const rect = this.element.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;

        this.ctx = this.canvas.getContext('2d');

        // Wrap element in container
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        this.element.parentNode.insertBefore(wrapper, this.element);
        wrapper.appendChild(this.element);
        wrapper.appendChild(this.canvas);

        this.wrapper = wrapper;
    }

    /**
     * Create particles from text
     */
    createParticles() {
        const rect = this.element.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Create particles in formation (forming the text shape)
        for (let i = 0; i < this.options.particleCount; i++) {
            const angle = (Math.PI * 2 * i) / this.options.particleCount;
            const radius = Math.random() * 50 + 30;

            const formX = centerX + Math.cos(angle) * radius;
            const formY = centerY + Math.sin(angle) * radius;

            // Start dispersed
            const disperseAngle = Math.random() * Math.PI * 2;
            const disperseDist = Math.random() * this.options.disperseDistance;

            this.particles.push({
                // Current position
                x: centerX + Math.cos(disperseAngle) * disperseDist,
                y: centerY + Math.sin(disperseAngle) * disperseDist,

                // Formation position (where it should be when "formed")
                formX,
                formY,

                // Velocity
                vx: 0,
                vy: 0,

                // Properties
                size: Math.random() * this.options.particleSize + 1,
                alpha: 0,
                color: this.options.particleColor
            });
        }
    }

    /**
     * Setup scroll trigger to form/dissolve particles
     */
    setupScrollTrigger() {
        ScrollTrigger.create({
            trigger: this.wrapper,
            start: 'top 70%',
            end: 'top 30%',
            onEnter: () => this.formText(),
            onLeaveBack: () => this.dissolveText(),
            onLeave: () => this.dissolveText(),
            onEnterBack: () => this.formText()
        });
    }

    /**
     * Form particles into text shape
     */
    formText() {
        if (this.isFormed) return;
        this.isFormed = true;

        this.particles.forEach((particle, i) => {
            gsap.to(particle, {
                x: particle.formX,
                y: particle.formY,
                alpha: 1,
                duration: this.options.formSpeed,
                delay: i * 0.002,
                ease: 'power2.out'
            });
        });
    }

    /**
     * Dissolve particles away from text
     */
    dissolveText() {
        if (!this.isFormed) return;
        this.isFormed = false;

        this.particles.forEach((particle, i) => {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * this.options.disperseDistance;

            gsap.to(particle, {
                x: particle.formX + Math.cos(angle) * distance,
                y: particle.formY + Math.sin(angle) * distance,
                alpha: 0,
                duration: this.options.dissolveSpeed,
                delay: i * 0.001,
                ease: 'power2.in'
            });
        });
    }

    /**
     * Setup mouse magnetism effect
     */
    setupMouseInteraction() {
        if (this.options.mobile) return;

        this.wrapper.addEventListener('mousemove', (e) => {
            const rect = this.wrapper.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            this.particles.forEach(particle => {
                const dx = mouseX - particle.x;
                const dy = mouseY - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.options.mouseMagnetism) {
                    const force = (this.options.mouseMagnetism - distance) / this.options.mouseMagnetism;
                    particle.vx += (dx / distance) * force * 0.5;
                    particle.vy += (dy / distance) * force * 0.5;
                }
            });
        });
    }

    /**
     * Animation loop
     */
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles.forEach(particle => {
            // Apply velocity
            particle.x += particle.vx;
            particle.y += particle.vy;

            // Damping
            particle.vx *= 0.95;
            particle.vy *= 0.95;

            // Draw particle
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });

        this.ctx.globalAlpha = 1;

        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    /**
     * CSS fallback for mobile
     */
    setupCSSFallback() {
        this.element.style.opacity = '1';

        gsap.from(this.element, {
            opacity: 0,
            y: 30,
            duration: 1,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: this.element,
                start: 'top 80%',
                once: true
            }
        });

        console.log('✨ ParticleText: Using CSS fallback (mobile)');
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }

        if (this.canvas) {
            this.canvas.remove();
        }

        ScrollTrigger.getAll().forEach(st => {
            if (st.trigger === this.wrapper) {
                st.kill();
            }
        });

        console.log('🗑️  ParticleText destroyed');
    }
}

/**
 * Initialize particle text for all elements with data-particle-text
 */
export function initializeParticleText() {
    const elements = document.querySelectorAll('[data-particle-text]');
    const instances = [];

    elements.forEach(element => {
        const options = {
            particleColor: element.dataset.particleColor || '#00d4ff',
            particleCount: parseInt(element.dataset.particleCount) || 200
        };

        instances.push(new ParticleText(element, options));
    });

    return instances;
}

export default ParticleText;
