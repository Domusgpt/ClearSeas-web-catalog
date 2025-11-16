/**
 * FocusLockChoreographer.js
 *
 * Scroll choreography with focus-lock moments:
 * - Elements lock in center while rest parallax scrolls
 * - Visualizer animates parameters during locks
 * - Smooth pacing with proper timing
 *
 * © 2025 Clear Seas Solutions LLC - Paul Phillips
 */

export class FocusLockChoreographer {
    constructor(visualizer) {
        this.visualizer = visualizer;
        this.gsap = window.gsap;
        this.ScrollTrigger = window.ScrollTrigger;

        if (!this.gsap || !this.ScrollTrigger) {
            console.error('❌ GSAP/ScrollTrigger not loaded');
            return;
        }

        this.gsap.registerPlugin(this.ScrollTrigger);
        console.log('🔒 FocusLockChoreographer initialized');
    }

    initialize() {
        // 1. Logo + Company intro with visualizer
        this.setupLogoIntro();

        // 2. Hero section with cards
        this.setupHeroSection();

        // 3. Capabilities with card transitions
        this.setupCapabilitiesSection();

        // 4. Research section
        this.setupResearchSection();

        console.log('✅ Focus-lock choreography active');
    }

    /**
     * Logo + Company Name intro
     * - Visualizer behind text initially
     * - Logo/name locked while visualizer animates
     * - Text scrolls away, visualizer bleeds to background
     * - Logo then scrolls away
     */
    setupLogoIntro() {
        const header = document.querySelector('.site-header');
        const logo = document.querySelector('.brand-logo');
        const companyName = document.querySelector('.brand-name');

        if (!header || !logo || !companyName) return;

        // Create intro section BEFORE hero
        const introSection = document.createElement('section');
        introSection.id = 'intro';
        introSection.className = 'intro-section';
        introSection.innerHTML = `
            <div class="intro-content">
                <img src="assets/images/css-logo.png" alt="Clear Seas Solutions" class="intro-logo">
                <h1 class="intro-company-name">CLEAR SEAS SOLUTIONS</h1>
            </div>
        `;

        const hero = document.getElementById('hero');
        hero.parentNode.insertBefore(introSection, hero);

        const introLogo = introSection.querySelector('.intro-logo');
        const introName = introSection.querySelector('.intro-company-name');

        // Phase 1: Logo + Name locked, visualizer animates (0-40%)
        this.gsap.timeline({
            scrollTrigger: {
                trigger: introSection,
                start: 'top top',
                end: '+=150%',
                pin: true,
                scrub: 1,
                onUpdate: (self) => {
                    const progress = self.progress;

                    if (progress < 0.4) {
                        // Logo locked, animate visualizer
                        this.animateVisualizerIntro(progress / 0.4);
                    } else if (progress < 0.7) {
                        // Fade out intro name, logo stays
                        const fadeProgress = (progress - 0.4) / 0.3;
                        this.gsap.set(introName, {
                            opacity: 1 - fadeProgress,
                            y: -fadeProgress * 100
                        });

                        // Visualizer bleeds into background
                        this.bleedVisualizerToBackground(fadeProgress);
                    } else {
                        // Logo scrolls away
                        const logoProgress = (progress - 0.7) / 0.3;
                        this.gsap.set(introLogo, {
                            opacity: 1 - logoProgress,
                            scale: 1 + logoProgress * 0.5,
                            y: -logoProgress * 150
                        });
                    }
                }
            }
        });
    }

    /**
     * Animate visualizer parameters during logo lock
     */
    animateVisualizerIntro(progress) {
        if (!this.visualizer || !this.visualizer.params) return;

        const params = this.visualizer.params;

        // Start with SPHERE, gradually increase complexity
        params.geometry = 2; // SPHERE
        params.hue = 180 + progress * 60; // Cyan to cyan-green
        params.intensity = 0.3 + progress * 0.3;
        params.chaos = progress * 0.15;
        params.gridDensity = 10 + progress * 15;

        // Continuous 4D rotation
        params.rot4dXW += 0.002;
        params.rot4dYW += 0.0015;
        params.rot4dZW += 0.001;
    }

    /**
     * Visualizer bleeds into background
     */
    bleedVisualizerToBackground(progress) {
        if (!this.visualizer || !this.visualizer.params) return;

        const params = this.visualizer.params;

        // Increase intensity and spread
        params.intensity = 0.6 + progress * 0.3;
        params.chaos = 0.15 + progress * 0.1;
        params.gridDensity = 25 + progress * 15;

        // Morph toward next geometry
        params.morphFactor = progress;

        // Faster rotation
        params.rot4dXW += 0.003 * progress;
        params.rot4dYW += 0.002 * progress;
    }

    /**
     * Hero section - cards lock in center with parallax
     */
    setupHeroSection() {
        const hero = document.getElementById('hero');
        if (!hero) return;

        const cards = Array.from(hero.querySelectorAll('.signal-card'));
        const heroText = hero.querySelector('.hero-text');

        // Pin hero section
        const heroTimeline = this.gsap.timeline({
            scrollTrigger: {
                trigger: hero,
                start: 'top top',
                end: '+=400%',
                pin: true,
                scrub: 1,
                onUpdate: (self) => this.onHeroScroll(self.progress, cards, heroText)
            }
        });

        // Hero text scrolls away first (0-20%)
        heroTimeline.to(heroText, {
            opacity: 0,
            y: -100,
            duration: 0.2,
            ease: 'power2.in'
        }, 0);

        // Cards appear one by one, each locks in center
        cards.forEach((card, i) => {
            const startProgress = 0.2 + (i * 0.2);

            // Card entrance (locked in center)
            heroTimeline.fromTo(card, {
                opacity: 0,
                scale: 0.8,
                filter: 'blur(8px)'
            }, {
                opacity: 1,
                scale: 1,
                filter: 'blur(0px)',
                duration: 0.15,
                ease: 'power2.out'
            }, startProgress);

            // Card locked while visualizer animates
            // (no transforms, just visualizer changes)

            // Card exit
            heroTimeline.to(card, {
                opacity: 0,
                scale: 1.2,
                filter: 'blur(6px)',
                duration: 0.1,
                ease: 'power2.in'
            }, startProgress + 0.15);
        });
    }

    /**
     * Hero scroll handler - animate visualizer with card focus
     */
    onHeroScroll(progress, cards, heroText) {
        if (!this.visualizer || !this.visualizer.params) return;

        const params = this.visualizer.params;

        // Which card is in focus?
        const cardIndex = Math.floor((progress - 0.2) / 0.2);

        // Morph geometry based on card
        if (cardIndex >= 0 && cardIndex < 3) {
            const cardProgress = ((progress - 0.2) % 0.2) / 0.2;

            // Each card has different visualizer state
            const geometries = [2, 3, 7]; // SPHERE, TORUS, CRYSTAL
            const hues = [180, 220, 280];

            params.geometry = geometries[cardIndex];
            params.hue = hues[cardIndex];
            params.intensity = 0.6 + cardProgress * 0.2;
            params.chaos = 0.1 + cardProgress * 0.15;
            params.gridDensity = 20 + cardProgress * 15;

            // Continuous rotation
            params.rot4dXW += 0.002;
            params.rot4dYW += 0.0015;
        }

        // Transition to next section
        if (progress > 0.8) {
            const transProgress = (progress - 0.8) / 0.2;
            params.geometry = 7 + transProgress * 0; // Stay CRYSTAL
            params.morphFactor = transProgress;
        }
    }

    /**
     * Capabilities section - similar focus-lock pattern
     */
    setupCapabilitiesSection() {
        const capabilities = document.getElementById('capabilities');
        if (!capabilities) return;

        const cards = Array.from(capabilities.querySelectorAll('.capability-card'));

        this.gsap.timeline({
            scrollTrigger: {
                trigger: capabilities,
                start: 'top top',
                end: '+=500%',
                pin: true,
                scrub: 1,
                onUpdate: (self) => this.onCapabilitiesScroll(self.progress, cards)
            }
        });

        // Similar pattern: each card locks, visualizer animates, card exits
        cards.forEach((card, i) => {
            const startProgress = i * 0.22;

            this.gsap.timeline({
                scrollTrigger: {
                    trigger: capabilities,
                    start: 'top top',
                    end: '+=500%',
                    scrub: 1
                }
            })
            .fromTo(card, {
                opacity: 0,
                scale: 0.85,
                filter: 'blur(6px)'
            }, {
                opacity: 1,
                scale: 1,
                filter: 'blur(0px)',
                duration: 0.1
            }, startProgress)
            .to(card, {
                opacity: 0,
                scale: 1.15,
                filter: 'blur(5px)',
                duration: 0.08
            }, startProgress + 0.18);
        });
    }

    /**
     * Capabilities scroll handler
     */
    onCapabilitiesScroll(progress, cards) {
        if (!this.visualizer || !this.visualizer.params) return;

        const params = this.visualizer.params;

        // CRYSTAL to FRACTAL transition
        params.geometry = 7; // CRYSTAL
        params.hue = 280 - progress * 80; // Purple to blue
        params.intensity = 0.7 + Math.sin(progress * Math.PI * 3) * 0.2;
        params.chaos = 0.2 + progress * 0.2;
        params.gridDensity = 30 + Math.sin(progress * Math.PI * 2) * 10;

        // Variable rotation speed
        params.rot4dXW += 0.001 + progress * 0.002;
        params.rot4dYW += 0.0015;
        params.rot4dZW += 0.0008;
    }

    /**
     * Research section
     */
    setupResearchSection() {
        const research = document.getElementById('research');
        if (!research) return;

        this.gsap.timeline({
            scrollTrigger: {
                trigger: research,
                start: 'top top',
                end: '+=300%',
                pin: true,
                scrub: 1,
                onUpdate: (self) => {
                    if (!this.visualizer || !this.visualizer.params) return;

                    const params = this.visualizer.params;
                    const progress = self.progress;

                    // FRACTAL - maximum complexity
                    params.geometry = 5;
                    params.hue = 200;
                    params.intensity = 0.8 + Math.sin(progress * Math.PI) * 0.2;
                    params.chaos = 0.4 + progress * 0.1;
                    params.gridDensity = 40 + Math.sin(progress * Math.PI * 4) * 15;

                    params.rot4dXW += 0.003;
                    params.rot4dYW += 0.002;
                    params.rot4dZW += 0.0015;
                }
            }
        });
    }
}

/**
 * A Paul Phillips Manifestation
 * © 2025 Clear Seas Solutions LLC
 */
