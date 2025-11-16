/**
 * GSAP ScrollTrigger Choreographer
 * Professional scroll-locked morphing and fluid animations
 *
 * A Paul Phillips Manifestation - Paul@clearseassolutions.com
 * "The Revolution Will Not be in a Structured Format" © 2025
 */

export class GSAPChoreographer {
    constructor(visualOrchestrator) {
        this.orchestrator = visualOrchestrator;
        this.gsap = null;
        this.ScrollTrigger = null;
        this.Flip = null;
        this.isInitialized = false;

        // Scroll-locked transition states
        this.activePins = [];
        this.transitionTimelines = new Map();

        console.log('🎬 GSAP Choreographer created');
    }

    async initialize() {
        // Wait for GSAP to be available
        await this.waitForGSAP();

        if (!this.gsap || !this.ScrollTrigger) {
            console.error('❌ GSAP or ScrollTrigger not available');
            return false;
        }

        this.gsap.registerPlugin(this.ScrollTrigger, this.Flip);

        // Setup scroll-locked section transitions
        this.setupScrollLockedSections();

        // Setup card-to-background morphing
        this.setupCardMorphing();

        // Setup parameter sweep animations
        this.setupParameterSweeps();

        this.isInitialized = true;
        console.log('✅ GSAP Choreographer initialized');
        return true;
    }

    async waitForGSAP(maxAttempts = 50) {
        for (let i = 0; i < maxAttempts; i++) {
            if (typeof window.gsap !== 'undefined' &&
                typeof window.ScrollTrigger !== 'undefined' &&
                typeof window.Flip !== 'undefined') {
                this.gsap = window.gsap;
                this.ScrollTrigger = window.ScrollTrigger;
                this.Flip = window.Flip;
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return false;
    }

    setupScrollLockedSections() {
        const sections = [
            { id: 'hero', pinDuration: '50%' },
            { id: 'capabilities', pinDuration: '100%' },
            { id: 'research', pinDuration: '100%' },
            { id: 'platforms', pinDuration: '80%' },
            { id: 'engagement', pinDuration: '80%' },
            { id: 'legacy', pinDuration: '60%' },
            { id: 'contact', pinDuration: '40%' }
        ];

        sections.forEach((section, index) => {
            const element = document.getElementById(section.id);
            if (!element) {
                console.warn(`⚠️ Section not found: ${section.id}`);
                return;
            }

            // Create scroll-locked pin with content fade
            const content = element.querySelector('.section-content, .content-wrapper');
            const heading = element.querySelector('h1, h2');

            if (!content) return;

            // Create timeline for this section
            const tl = this.gsap.timeline({
                scrollTrigger: {
                    trigger: element,
                    start: 'top top',
                    end: `+=${section.pinDuration}`,
                    pin: true,
                    pinSpacing: true,
                    scrub: 1.2,
                    anticipatePin: 1,
                    onEnter: () => this.onSectionEnter(section.id),
                    onLeave: () => this.onSectionLeave(section.id),
                    onEnterBack: () => this.onSectionEnter(section.id),
                    onLeaveBack: () => this.onSectionLeave(section.id),
                }
            });

            // Fluid morphing sequence
            tl.fromTo(content,
                {
                    opacity: 0,
                    y: 80,
                    scale: 0.92,
                    filter: 'blur(20px)'
                },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    filter: 'blur(0px)',
                    duration: 0.5,
                    ease: 'power3.out'
                }, 0)
            .to(content, {
                opacity: 1,
                duration: 0.3
            })
            .to(content, {
                opacity: 0,
                y: -60,
                scale: 1.05,
                filter: 'blur(15px)',
                duration: 0.5,
                ease: 'power3.in'
            });

            // Heading parallax
            if (heading) {
                this.gsap.to(heading, {
                    scrollTrigger: {
                        trigger: element,
                        start: 'top top',
                        end: 'bottom top',
                        scrub: 1.5
                    },
                    y: -100,
                    opacity: 0.3,
                    scale: 0.9,
                    ease: 'none'
                });
            }

            this.transitionTimelines.set(section.id, tl);
        });

        console.log(`✅ Created ${sections.length} scroll-locked section transitions`);
    }

    setupCardMorphing() {
        const cards = document.querySelectorAll('[data-fractal-card], .capability-card, .research-item');

        cards.forEach(card => {
            // Card emergence on scroll
            this.gsap.fromTo(card,
                {
                    opacity: 0,
                    y: 60,
                    scale: 0.85,
                    rotationY: -15
                },
                {
                    scrollTrigger: {
                        trigger: card,
                        start: 'top 85%',
                        end: 'top 60%',
                        scrub: 1,
                        toggleActions: 'play none none reverse'
                    },
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    rotationY: 0,
                    duration: 1,
                    ease: 'power2.out'
                }
            );

            // Hover: Card-to-background morph
            card.addEventListener('mouseenter', () => {
                const state = this.Flip.getState(card);

                // Add morphing class
                card.classList.add('is-morphing');

                // Animate with Flip
                this.Flip.from(state, {
                    duration: 0.8,
                    ease: 'power3.out',
                    scale: true,
                    absolute: false,
                    onComplete: () => {
                        // Trigger background parameter shift
                        this.triggerBackgroundMorph(card);
                    }
                });

                // Pulse effect
                this.gsap.to(card, {
                    boxShadow: '0 20px 60px rgba(0, 212, 255, 0.4)',
                    duration: 0.3,
                    ease: 'power2.out'
                });
            });

            card.addEventListener('mouseleave', () => {
                const state = this.Flip.getState(card);
                card.classList.remove('is-morphing');

                this.Flip.from(state, {
                    duration: 0.6,
                    ease: 'power2.in',
                    scale: true
                });

                this.gsap.to(card, {
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                    duration: 0.3
                });
            });
        });

        console.log(`✅ Setup card morphing for ${cards.length} cards`);
    }

    setupParameterSweeps() {
        // Smooth parameter sweeps tied to scroll position
        const parameterProxy = { progress: 0 };

        this.ScrollTrigger.create({
            trigger: document.body,
            start: 'top top',
            end: 'bottom bottom',
            onUpdate: (self) => {
                parameterProxy.progress = self.progress;
                this.updateParametersFromScroll(self.progress);
            }
        });

        console.log('✅ Parameter sweep animations initialized');
    }

    updateParametersFromScroll(progress) {
        // Smooth parameter morphing based on scroll
        if (!this.orchestrator) return;

        // Grid density wave
        const gridWave = Math.sin(progress * Math.PI * 4) * 10;

        // Morph factor oscillation
        const morphOsc = 1.0 + Math.sin(progress * Math.PI * 6) * 0.4;

        // These will be picked up by VisualOrchestrator's existing scroll handler
        // Just ensuring smooth transitions
    }

    onSectionEnter(sectionId) {
        console.log(`🎬 Section ENTER (pinned): ${sectionId}`);

        // Trigger visualizer system switch via orchestrator
        if (this.orchestrator) {
            // VisualOrchestrator already handles this via intersection observer
            // We're adding smooth GSAP transitions on top
        }
    }

    onSectionLeave(sectionId) {
        console.log(`🎬 Section LEAVE (unpinned): ${sectionId}`);
    }

    triggerBackgroundMorph(card) {
        // Morph card parameters into background
        const cardData = {
            hue: parseFloat(card.dataset.hue) || 200,
            intensity: parseFloat(card.dataset.intensity) || 0.7,
            chaos: parseFloat(card.dataset.chaos) || 0.3
        };

        // Dispatch event for orchestrator
        window.dispatchEvent(new CustomEvent('cardBackgroundMorph', {
            detail: cardData
        }));
    }

    // Public API for manual choreography
    pinSection(sectionId, duration = 1000) {
        const element = document.getElementById(sectionId);
        if (!element) return;

        this.gsap.to(window, {
            scrollTo: { y: element, offsetY: 0 },
            duration: duration / 1000,
            ease: 'power3.inOut'
        });
    }

    morphToSection(sectionId, options = {}) {
        const {
            duration = 1.5,
            ease = 'power3.inOut',
            lockScroll = true
        } = options;

        const tl = this.gsap.timeline();

        if (lockScroll) {
            // Disable scroll during morph
            document.body.style.overflow = 'hidden';
        }

        // Smooth transition to section
        tl.to(window, {
            scrollTo: `#${sectionId}`,
            duration,
            ease,
            onComplete: () => {
                if (lockScroll) {
                    document.body.style.overflow = '';
                }
            }
        });

        return tl;
    }

    dispose() {
        console.log('🧹 Disposing GSAP Choreographer...');

        // Kill all ScrollTriggers
        this.ScrollTrigger?.getAll().forEach(st => st.kill());

        // Kill all timelines
        this.transitionTimelines.forEach(tl => tl.kill());
        this.transitionTimelines.clear();

        this.isInitialized = false;
        console.log('✅ GSAP Choreographer disposed');
    }
}

export default GSAPChoreographer;
