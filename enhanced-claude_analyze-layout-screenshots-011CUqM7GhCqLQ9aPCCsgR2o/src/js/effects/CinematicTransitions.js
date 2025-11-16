/**
 * CinematicTransitions
 *
 * Letterbox reveals and parallax depth for sections
 * Creates film-quality transitions between content
 *
 * @author Clear Seas Solutions
 * @version 2.0
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export class CinematicTransitions {
    constructor(options = {}) {
        this.options = {
            letterboxHeight: '15%', // Black bars top/bottom
            parallaxLayers: true,
            fadeInDuration: 0.8,
            letterboxDuration: 1.2,
            ...options
        };

        this.sections = [];
        this.init();
    }

    init() {
        this.setupLetterboxSections();
        this.setupParallaxDepth();
        this.setupFadeInAnimations();

        console.log('🎥 CinematicTransitions initialized');
    }

    /**
     * Setup letterbox reveal for sections
     */
    setupLetterboxSections() {
        const sections = document.querySelectorAll('[data-cinematic]');

        sections.forEach((section, index) => {
            // Add letterbox bars
            const topBar = this.createLetterboxBar('top');
            const bottomBar = this.createLetterboxBar('bottom');

            section.style.position = 'relative';
            section.style.overflow = 'hidden';
            section.appendChild(topBar);
            section.appendChild(bottomBar);

            // Animate bars sliding away
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: section,
                    start: 'top 80%',
                    end: 'top 20%',
                    scrub: 1,
                    once: false
                }
            });

            tl.to(topBar, {
                yPercent: -100,
                duration: 1,
                ease: 'power2.inOut'
            }, 0)
            .to(bottomBar, {
                yPercent: 100,
                duration: 1,
                ease: 'power2.inOut'
            }, 0);

            this.sections.push({ element: section, timeline: tl });
        });
    }

    /**
     * Create letterbox bar element
     */
    createLetterboxBar(position) {
        const bar = document.createElement('div');
        bar.className = `letterbox-bar letterbox-bar-${position}`;

        bar.style.cssText = `
            position: absolute;
            left: 0;
            width: 100%;
            height: ${this.options.letterboxHeight};
            background: #000;
            z-index: 10;
            pointer-events: none;
            ${position}: 0;
        `;

        return bar;
    }

    /**
     * Setup parallax depth for layered elements
     */
    setupParallaxDepth() {
        if (!this.options.parallaxLayers) return;

        const layers = document.querySelectorAll('[data-depth]');

        layers.forEach(layer => {
            const depth = parseFloat(layer.dataset.depth) || 0.5;

            gsap.to(layer, {
                yPercent: depth * 50,
                ease: 'none',
                scrollTrigger: {
                    trigger: layer.closest('section'),
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true
                }
            });
        });
    }

    /**
     * Setup fade-in animations for content
     */
    setupFadeInAnimations() {
        const fadeElements = document.querySelectorAll('[data-fade-in]');

        fadeElements.forEach(element => {
            const delay = parseFloat(element.dataset.fadeDelay) || 0;

            gsap.from(element, {
                opacity: 0,
                y: 50,
                duration: this.options.fadeInDuration,
                delay,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: element,
                    start: 'top 85%',
                    once: true
                }
            });
        });
    }

    /**
     * Apply cinematic transition to specific section
     */
    applyToSection(selector) {
        const section = document.querySelector(selector);
        if (!section) return;

        section.dataset.cinematic = 'true';
        this.setupLetterboxSections();
    }

    /**
     * Cleanup
     */
    destroy() {
        this.sections.forEach(section => {
            if (section.timeline) {
                section.timeline.kill();
            }
        });

        document.querySelectorAll('.letterbox-bar').forEach(bar => bar.remove());

        console.log('🗑️  CinematicTransitions destroyed');
    }
}

export default CinematicTransitions;
