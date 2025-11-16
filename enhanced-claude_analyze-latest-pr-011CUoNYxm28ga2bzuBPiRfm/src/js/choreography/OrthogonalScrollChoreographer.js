/**
 * OrthogonalScrollChoreographer.js
 *
 * Revolutionary scroll choreography system with:
 * - Cards emerging from Z-axis depth (-820px → 0px → 420px)
 * - Timeline-based scroll mapping (every movement matters)
 * - Strategic visualizer revelation through content gaps
 * - Introduction → Existence → Exit phases for all elements
 * - Visualizer parameter orchestration with occlusion
 *
 * Inspired by:
 * - https://domusgpt.github.io/Clear-Seas-Draft/25-orthogonal-depth-progression.html
 * - https://weare-simone.webflow.io/
 *
 * © 2025 Clear Seas Solutions LLC - Paul Phillips
 */

export class OrthogonalScrollChoreographer {
    constructor(quantumVisualizer, options = {}) {
        this.visualizer = quantumVisualizer;
        this.gsap = window.gsap;
        this.ScrollTrigger = window.ScrollTrigger;

        if (!this.gsap || !this.ScrollTrigger) {
            console.error('❌ GSAP/ScrollTrigger not loaded');
            return;
        }

        this.gsap.registerPlugin(this.ScrollTrigger);

        // Configuration
        this.config = {
            // Z-depth stages for card progression
            depths: {
                far: -820,
                approaching: -420,
                focused: 0,
                exiting: 420
            },
            // Scale stages
            scales: {
                far: 0.28,
                approaching: 0.6,
                focused: 1.0,
                exiting: 1.45
            },
            // Opacity stages
            opacities: {
                far: 0.1,
                approaching: 0.45,
                focused: 1.0,
                exiting: 0.28
            },
            // Blur stages for depth perception
            blurs: {
                far: 4,
                approaching: 2,
                focused: 0,
                exiting: 3
            },
            // Timing
            cardTransitionDuration: 0.8,
            cardTransitionEase: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            sectionLockDuration: '300%', // How long each section is pinned
            visualizerRevealDuration: 0.6,
            ...options
        };

        // Section choreography definitions - maps scroll timeline to actions
        this.sections = [
            {
                id: 'hero',
                selector: '#hero',
                cards: '.signal-card',
                visualizerState: {
                    geometry: 2, // SPHERE - welcoming
                    hue: 180,
                    intensity: 0.4, // Start dim
                    chaos: 0.05,
                    speed: 0.7,
                    gridDensity: 15
                },
                scrollTimeline: [
                    { progress: 0.0, action: 'revealVisualizer', intensity: 0.4 },
                    { progress: 0.15, action: 'cardIntroduction', cardIndex: 0 },
                    { progress: 0.35, action: 'cardIntroduction', cardIndex: 1 },
                    { progress: 0.55, action: 'cardIntroduction', cardIndex: 2 },
                    { progress: 0.75, action: 'occludeAndMorph', nextGeometry: 7 },
                    { progress: 0.9, action: 'sectionExit' }
                ]
            },
            {
                id: 'capabilities',
                selector: '#capabilities',
                cards: '.capability-card',
                visualizerState: {
                    geometry: 7, // CRYSTAL - structured complexity
                    hue: 280,
                    intensity: 0.7,
                    chaos: 0.2,
                    speed: 1.0,
                    gridDensity: 30
                },
                scrollTimeline: [
                    { progress: 0.0, action: 'revealVisualizer', intensity: 0.7 },
                    { progress: 0.1, action: 'cardIntroduction', cardIndex: 0 },
                    { progress: 0.25, action: 'cardIntroduction', cardIndex: 1 },
                    { progress: 0.4, action: 'cardIntroduction', cardIndex: 2 },
                    { progress: 0.55, action: 'cardIntroduction', cardIndex: 3 },
                    { progress: 0.7, action: 'occludeAndMorph', nextGeometry: 5 },
                    { progress: 0.85, action: 'sectionExit' }
                ]
            },
            {
                id: 'research',
                selector: '#research',
                cards: '.card, .signal-card',
                visualizerState: {
                    geometry: 5, // FRACTAL - research complexity
                    hue: 200,
                    intensity: 0.9,
                    chaos: 0.4,
                    speed: 1.3,
                    gridDensity: 45
                },
                scrollTimeline: [
                    { progress: 0.0, action: 'revealVisualizer', intensity: 0.9 },
                    { progress: 0.2, action: 'cardIntroduction', cardIndex: 0 },
                    { progress: 0.5, action: 'cardIntroduction', cardIndex: 1 },
                    { progress: 0.7, action: 'occludeAndMorph', nextGeometry: 3 },
                    { progress: 0.9, action: 'sectionExit' }
                ]
            },
            {
                id: 'contact',
                selector: '#contact',
                cards: '.contact-card',
                visualizerState: {
                    geometry: 0, // TETRAHEDRON - foundation/simplicity
                    hue: 240,
                    intensity: 0.5,
                    chaos: 0.1,
                    speed: 0.6,
                    gridDensity: 12
                },
                scrollTimeline: [
                    { progress: 0.0, action: 'revealVisualizer', intensity: 0.5 },
                    { progress: 0.3, action: 'finalFocus' },
                    { progress: 0.7, action: 'fadeToCalm' }
                ]
            }
        ];

        this.triggers = [];
        this.currentSection = 0;

        console.log('🎭 OrthogonalScrollChoreographer initialized with timeline-based choreography');
    }

    /**
     * Initialize all scroll choreography
     */
    initialize() {
        console.log('🎬 Creating orthogonal depth progression system...');

        // Setup 3D perspective on body
        this.setup3DPerspective();

        // Setup visualizer to be behind everything but visible through gaps
        this.setupVisualizerLayering();

        // Create choreography for each section
        this.sections.forEach((section, index) => {
            this.choreographSection(section, index);
        });

        // Setup wheel listener for micro-adjustments
        this.setupWheelResponsiveness();

        console.log('✅ Orthogonal scroll choreography active');
    }

    /**
     * Setup 3D perspective for card depth progression
     */
    setup3DPerspective() {
        // Add perspective to body
        document.body.style.perspective = '1200px';
        document.body.style.perspectiveOrigin = 'center center';

        // Ensure all sections can contain 3D transforms
        this.sections.forEach(section => {
            const element = document.querySelector(section.selector);
            if (element) {
                element.style.transformStyle = 'preserve-3d';
            }
        });

        console.log('🔮 3D perspective enabled (1200px)');
    }

    /**
     * Setup visualizer layering - behind content but visible through gaps
     */
    setupVisualizerLayering() {
        const canvas = document.getElementById('quantum-background');
        if (!canvas) return;

        // Set visualizer behind everything
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.zIndex = '-1'; // Behind all content
        canvas.style.pointerEvents = 'none';
        canvas.style.opacity = '0'; // Start hidden, reveal strategically

        console.log('🌌 Visualizer positioned behind all content');
    }

    /**
     * Choreograph a section with timeline-based scroll mapping
     */
    choreographSection(section, sectionIndex) {
        const element = document.querySelector(section.selector);
        if (!element) {
            console.warn(`Section ${section.id} not found`);
            return;
        }

        const cards = Array.from(element.querySelectorAll(section.cards));

        // Prepare cards for Z-depth animation
        this.prepareCardsForDepth(cards);

        // Create main section timeline
        const mainTimeline = this.gsap.timeline({
            scrollTrigger: {
                trigger: element,
                start: 'top top',
                end: `+=${this.config.sectionLockDuration}`,
                pin: true,
                scrub: 1,
                onUpdate: (self) => this.onSectionScroll(section, self.progress, cards),
                onEnter: () => this.onSectionEnter(section, sectionIndex),
                onLeave: () => this.onSectionLeave(section, sectionIndex),
                markers: false
            }
        });

        // Apply scroll timeline actions
        section.scrollTimeline.forEach(timelinePoint => {
            const position = timelinePoint.progress;

            switch (timelinePoint.action) {
                case 'revealVisualizer':
                    mainTimeline.to('#quantum-background', {
                        opacity: timelinePoint.intensity,
                        duration: this.config.visualizerRevealDuration,
                        ease: 'power2.out'
                    }, position);
                    break;

                case 'cardIntroduction':
                    if (cards[timelinePoint.cardIndex]) {
                        this.addCardIntroduction(mainTimeline, cards[timelinePoint.cardIndex], position);
                    }
                    break;

                case 'occludeAndMorph':
                    this.addOcclusionAndMorph(mainTimeline, section, timelinePoint.nextGeometry, position);
                    break;

                case 'sectionExit':
                    this.addSectionExit(mainTimeline, cards, position);
                    break;

                case 'finalFocus':
                    this.addFinalFocus(mainTimeline, element, position);
                    break;

                case 'fadeToCalm':
                    this.addFadeToCalm(mainTimeline, position);
                    break;
            }
        });

        this.triggers.push(mainTimeline.scrollTrigger);
        console.log(`📜 Choreographed section: ${section.id} with ${cards.length} cards`);
    }

    /**
     * Prepare cards for 3D depth animation
     */
    prepareCardsForDepth(cards) {
        cards.forEach(card => {
            // Set initial state - far in Z-space
            card.style.transformStyle = 'preserve-3d';
            card.style.transform = `translate(-50%, -50%) translateZ(${this.config.depths.far}px)`;
            card.style.opacity = this.config.opacities.far;
            card.style.filter = `blur(${this.config.blurs.far}px)`;
            card.style.position = 'absolute';
            card.style.left = '50%';
            card.style.top = '50%';
            card.style.transition = `transform ${this.config.cardTransitionDuration}s ${this.config.cardTransitionEase},
                                     opacity ${this.config.cardTransitionDuration}s ${this.config.cardTransitionEase},
                                     filter ${this.config.cardTransitionDuration}s ${this.config.cardTransitionEase}`;
        });
    }

    /**
     * Add card introduction animation - emerge from Z-depth
     */
    addCardIntroduction(timeline, card, position) {
        // Phase 1: Approaching (far → approaching)
        timeline.to(card, {
            z: this.config.depths.approaching,
            scale: this.config.scales.approaching,
            opacity: this.config.opacities.approaching,
            filter: `blur(${this.config.blurs.approaching}px)`,
            duration: 0.3,
            ease: 'power2.out'
        }, position);

        // Phase 2: Focused (approaching → focused)
        timeline.to(card, {
            z: this.config.depths.focused,
            scale: this.config.scales.focused,
            opacity: this.config.opacities.focused,
            filter: `blur(${this.config.blurs.focused}px)`,
            duration: 0.3,
            ease: 'power2.inOut'
        }, position + 0.05);

        // Phase 3: Existence - card stays in focus, add subtle rotation
        timeline.to(card, {
            rotationY: '+=5',
            duration: 0.2,
            yoyo: true,
            repeat: 1,
            ease: 'sine.inOut'
        }, position + 0.1);
    }

    /**
     * Add occlusion and morph - visualizer changes during occlusion
     */
    addOcclusionAndMorph(timeline, section, nextGeometry, position) {
        if (!this.visualizer || !this.visualizer.params) return;

        const params = this.visualizer.params;

        // Dim visualizer (occluded by content)
        timeline.to('#quantum-background', {
            opacity: 0.2,
            duration: 0.3,
            ease: 'power2.in'
        }, position);

        // During occlusion, morph geometry
        timeline.to(params, {
            geometry: nextGeometry,
            morphFactor: 1.0,
            chaos: Math.min(1, params.chaos + 0.2),
            duration: 0.4,
            ease: 'power2.inOut',
            onUpdate: () => {
                // Boost density during morph for dramatic effect
                params.gridDensity = section.visualizerState.gridDensity * (1 + params.morphFactor * 0.5);
            }
        }, position + 0.1);

        // Reveal morphed visualizer
        timeline.to('#quantum-background', {
            opacity: 0.7,
            duration: 0.3,
            ease: 'power2.out'
        }, position + 0.5);
    }

    /**
     * Add section exit - cards exit to Z-depth
     */
    addSectionExit(timeline, cards, position) {
        cards.forEach((card, i) => {
            timeline.to(card, {
                z: this.config.depths.exiting,
                scale: this.config.scales.exiting,
                opacity: this.config.opacities.exiting,
                filter: `blur(${this.config.blurs.exiting}px)`,
                duration: 0.4,
                ease: 'power2.in'
            }, position + (i * 0.05));
        });
    }

    /**
     * Add final focus for contact section
     */
    addFinalFocus(timeline, element, position) {
        timeline.to(element, {
            scale: 1.05,
            duration: 0.5,
            ease: 'power2.out'
        }, position);
    }

    /**
     * Add fade to calm for ending
     */
    addFadeToCalm(timeline, position) {
        if (!this.visualizer || !this.visualizer.params) return;

        const params = this.visualizer.params;

        timeline.to(params, {
            intensity: 0.3,
            chaos: 0.05,
            speed: 0.4,
            duration: 0.8,
            ease: 'power2.inOut'
        }, position);

        timeline.to('#quantum-background', {
            opacity: 0.3,
            duration: 0.8,
            ease: 'power2.inOut'
        }, position);
    }

    /**
     * Called continuously during section scroll - every movement matters
     */
    onSectionScroll(section, progress, cards) {
        if (!this.visualizer || !this.visualizer.params) return;

        const params = this.visualizer.params;

        // Continuous 4D rotation based on scroll
        params.rot4dXW += progress * 0.001;
        params.rot4dYW += progress * 0.0007;
        params.rot4dZW += progress * 0.0005;

        // Use density for depth perception
        const depthFactor = Math.sin(progress * Math.PI);
        params.gridDensity = section.visualizerState.gridDensity * (1 + depthFactor * 0.3);

        // Chaos pulses with scroll
        params.chaos = section.visualizerState.chaos + (Math.sin(progress * Math.PI * 4) * 0.1);

        // Cards in focus get subtle parallax
        cards.forEach((card, i) => {
            const cardFocus = this.getCardFocus(progress, i, cards.length);
            if (cardFocus > 0.5) {
                const parallax = (progress - 0.5) * 20;
                card.style.transform += ` translateX(${parallax}px)`;
            }
        });
    }

    /**
     * Calculate if card should be in focus based on scroll progress
     */
    getCardFocus(progress, cardIndex, totalCards) {
        const cardProgress = cardIndex / totalCards;
        const distance = Math.abs(progress - cardProgress);
        return Math.max(0, 1 - (distance * 5));
    }

    /**
     * Called when entering a section
     */
    onSectionEnter(section, sectionIndex) {
        this.currentSection = sectionIndex;
        console.log(`📍 Entering section: ${section.id}`);

        // Apply visualizer state
        if (this.visualizer && this.visualizer.params) {
            Object.assign(this.visualizer.params, section.visualizerState);
        }

        // Reveal visualizer
        this.gsap.to('#quantum-background', {
            opacity: section.visualizerState.intensity,
            duration: 0.6,
            ease: 'power2.out'
        });
    }

    /**
     * Called when leaving a section
     */
    onSectionLeave(section, sectionIndex) {
        console.log(`👋 Leaving section: ${section.id}`);

        // Dim visualizer during transition
        this.gsap.to('#quantum-background', {
            opacity: 0.2,
            duration: 0.4,
            ease: 'power2.in'
        });
    }

    /**
     * Setup wheel listener for micro-adjustments - every movement matters
     */
    setupWheelResponsiveness() {
        let wheelTimeout;

        window.addEventListener('wheel', (e) => {
            if (!this.visualizer || !this.visualizer.params) return;

            const params = this.visualizer.params;
            const intensity = Math.abs(e.deltaY) / 1000;

            // Immediate response to wheel movement
            params.rot4dXW += e.deltaY * 0.00005;
            params.rot4dYW += e.deltaY * 0.00003;

            // Boost chaos momentarily
            const currentChaos = params.chaos;
            params.chaos = Math.min(1, params.chaos + intensity * 0.1);

            // Decay back to section's base chaos
            clearTimeout(wheelTimeout);
            wheelTimeout = setTimeout(() => {
                const section = this.sections[this.currentSection];
                if (section) {
                    this.gsap.to(params, {
                        chaos: section.visualizerState.chaos,
                        duration: 0.5,
                        ease: 'power2.out'
                    });
                }
            }, 150);
        }, { passive: true });

        console.log('🖱️ Wheel responsiveness enabled - every movement counts');
    }

    /**
     * Cleanup
     */
    dispose() {
        this.triggers.forEach(trigger => trigger.kill());
        this.triggers = [];
    }
}

/**
 * A Paul Phillips Manifestation
 * "The Revolution Will Not be in a Structured Format"
 * © 2025 Clear Seas Solutions LLC
 */
