/**
 * SimpleFluidChoreographer.js
 *
 * Simple, fluid scroll choreography based on weare-simone.webflow.io
 * - Text splits into lines, slides up with fade
 * - Cards animate in smoothly when they reach viewport center
 * - Visualizer parameters change gradually during scroll
 * - No complex pinning or Z-axis transforms
 * - Just smooth, natural animations
 *
 * © 2025 Clear Seas Solutions LLC - Paul Phillips
 */

export class SimpleFluidChoreographer {
    constructor(visualizer) {
        this.visualizer = visualizer;
        this.gsap = window.gsap;
        this.ScrollTrigger = window.ScrollTrigger;
        this.SplitType = window.SplitType;

        if (!this.gsap || !this.ScrollTrigger) {
            console.error('❌ GSAP/ScrollTrigger not loaded');
            return;
        }

        this.gsap.registerPlugin(this.ScrollTrigger);

        // Visualizer states for each section
        this.sectionStates = {
            hero: {
                geometry: 2, // SPHERE
                hue: 180,
                intensity: 0.5,
                chaos: 0.1,
                gridDensity: 20
            },
            capabilities: {
                geometry: 7, // CRYSTAL
                hue: 280,
                intensity: 0.6,
                chaos: 0.2,
                gridDensity: 30
            },
            research: {
                geometry: 5, // FRACTAL
                hue: 200,
                intensity: 0.7,
                chaos: 0.35,
                gridDensity: 40
            },
            contact: {
                geometry: 0, // TETRAHEDRON
                hue: 240,
                intensity: 0.4,
                chaos: 0.05,
                gridDensity: 15
            }
        };

        console.log('💧 SimpleFluidChoreographer initialized');
    }

    initialize() {
        // Make visualizer visible
        const canvas = document.getElementById('quantum-background');
        if (canvas) {
            canvas.style.opacity = '0.8';
        }
        // 1. Setup text animations (like Simone)
        this.setupTextAnimations();

        // 2. Setup card animations
        this.setupCardAnimations();

        // 3. Setup visualizer transitions
        this.setupVisualizerTransitions();

        // 4. Setup continuous scroll parameter updates
        this.setupContinuousUpdates();

        console.log('✅ Simple fluid choreography active');
    }

    /**
     * Text animations - split into lines, slide up with fade
     * Based on Simone's approach
     */
    setupTextAnimations() {
        // Find all animated text elements
        const textElements = document.querySelectorAll('h1, h2, .hero-lede, .eyebrow, p');

        textElements.forEach(element => {
            // Skip if inside cards (cards have their own animation)
            if (element.closest('.signal-card, .card, .capability-card')) {
                return;
            }

            // Simple animation: fade up
            this.gsap.from(element, {
                y: 50,
                opacity: 0,
                duration: 0.8,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: element,
                    start: 'top 80%', // When element is 80% down viewport
                    end: 'top 50%',
                    scrub: 1
                }
            });
        });

        console.log('📝 Text animations configured');
    }

    /**
     * Card animations - simple fade/scale in
     */
    setupCardAnimations() {
        const cards = document.querySelectorAll('.signal-card, .card, .capability-card');

        cards.forEach((card, index) => {
            this.gsap.from(card, {
                opacity: 0,
                scale: 0.95,
                y: 30,
                duration: 0.6,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: card,
                    start: 'top 75%',
                    end: 'top 50%',
                    scrub: 1
                }
            });
        });

        console.log('🎴 Card animations configured');
    }

    /**
     * Visualizer transitions between sections
     */
    setupVisualizerTransitions() {
        const sections = [
            { id: 'hero', state: this.sectionStates.hero },
            { id: 'capabilities', state: this.sectionStates.capabilities },
            { id: 'research', state: this.sectionStates.research },
            { id: 'contact', state: this.sectionStates.contact }
        ];

        sections.forEach(section => {
            const element = document.getElementById(section.id);
            if (!element) return;

            this.ScrollTrigger.create({
                trigger: element,
                start: 'top 50%',
                end: 'bottom 50%',
                onEnter: () => this.transitionToState(section.state, 1.5),
                onEnterBack: () => this.transitionToState(section.state, 1.5)
            });
        });

        console.log('🌈 Visualizer transitions configured');
    }

    /**
     * Transition visualizer to new state smoothly
     */
    transitionToState(targetState, duration) {
        if (!this.visualizer || !this.visualizer.params) return;

        const params = this.visualizer.params;

        // Smooth GSAP transition
        this.gsap.to(params, {
            geometry: targetState.geometry,
            hue: targetState.hue,
            intensity: targetState.intensity,
            chaos: targetState.chaos,
            gridDensity: targetState.gridDensity,
            duration: duration,
            ease: 'power2.inOut'
        });
    }

    /**
     * Continuous updates during scroll
     * Subtle parameter changes for fluid feeling
     */
    setupContinuousUpdates() {
        let lastScrollY = window.scrollY;

        window.addEventListener('scroll', () => {
            if (!this.visualizer || !this.visualizer.params) return;

            const scrollY = window.scrollY;
            const scrollDelta = scrollY - lastScrollY;
            lastScrollY = scrollY;

            const params = this.visualizer.params;

            // Subtle continuous rotation
            params.rot4dXW += 0.001;
            params.rot4dYW += 0.0007;
            params.rot4dZW += 0.0005;

            // Respond to scroll direction
            if (Math.abs(scrollDelta) > 1) {
                // Boost chaos momentarily on scroll
                const scrollIntensity = Math.min(Math.abs(scrollDelta) / 100, 0.3);
                params.chaos = Math.min(1, params.chaos + scrollIntensity * 0.1);

                // Decay back to base
                setTimeout(() => {
                    this.gsap.to(params, {
                        chaos: this.getCurrentSectionState().chaos,
                        duration: 0.5,
                        ease: 'power2.out'
                    });
                }, 100);
            }
        }, { passive: true });

        console.log('🌊 Continuous scroll updates enabled');
    }

    /**
     * Get current section's visualizer state based on scroll position
     */
    getCurrentSectionState() {
        const sections = ['hero', 'capabilities', 'research', 'contact'];
        const viewportCenter = window.scrollY + window.innerHeight / 2;

        for (const sectionId of sections) {
            const element = document.getElementById(sectionId);
            if (!element) continue;

            const rect = element.getBoundingClientRect();
            const elementTop = window.scrollY + rect.top;
            const elementBottom = elementTop + rect.height;

            if (viewportCenter >= elementTop && viewportCenter <= elementBottom) {
                return this.sectionStates[sectionId];
            }
        }

        return this.sectionStates.hero; // Default
    }
}

/**
 * A Paul Phillips Manifestation
 * © 2025 Clear Seas Solutions LLC
 */
