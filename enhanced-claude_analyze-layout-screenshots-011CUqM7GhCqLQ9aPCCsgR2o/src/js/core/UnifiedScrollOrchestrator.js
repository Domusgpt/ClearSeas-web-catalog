/**
 * UnifiedScrollOrchestrator
 *
 * Master controller for all scroll-based interactions
 * Replaces conflicting choreographers with unified GSAP system
 *
 * @author Clear Seas Solutions
 * @version 2.0 - Revolutionary Redesign
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export class UnifiedScrollOrchestrator {
    constructor(options = {}) {
        this.options = {
            smoothScroll: true,
            smoothScrollDuration: 1.2,
            parallaxIntensity: 0.3,
            debug: false,
            ...options
        };

        this.sections = [];
        this.triggers = [];
        this.currentSection = 0;
        this.isScrolling = false;

        // Reactive state for visualizer
        this.scrollState = {
            progress: 0,
            velocity: 0,
            section: null,
            direction: 'down'
        };

        // Callbacks
        this.onScrollUpdate = null;
        this.onSectionChange = null;

        this.init();
    }

    init() {
        this.setupSmoothScroll();
        this.setupSectionTracking();
        this.setupScrollProgress();
        this.setupParallax();

        if (this.options.debug) {
            this.enableDebugMode();
        }

        console.log('🎬 UnifiedScrollOrchestrator initialized');
    }

    /**
     * Setup smooth scrolling with GSAP
     */
    setupSmoothScroll() {
        if (!this.options.smoothScroll) return;

        // Use native smooth scroll on mobile for better performance
        if (window.innerWidth <= 768) {
            document.documentElement.style.scrollBehavior = 'smooth';
            return;
        }

        // Desktop: GSAP smooth scroll
        gsap.registerPlugin(ScrollTrigger);

        // Optional: Add locomotive scroll or custom implementation
        // For now, using native with enhanced easing
        gsap.to(window, {
            scrollTo: { y: 0, autoKill: true },
            duration: this.options.smoothScrollDuration,
            ease: 'power2.inOut'
        });
    }

    /**
     * Track sections and trigger callbacks
     */
    setupSectionTracking() {
        const sections = document.querySelectorAll('[data-section]');

        sections.forEach((section, index) => {
            const sectionName = section.dataset.section;

            const trigger = ScrollTrigger.create({
                trigger: section,
                start: 'top center',
                end: 'bottom center',
                onEnter: () => this.handleSectionEnter(sectionName, index),
                onEnterBack: () => this.handleSectionEnter(sectionName, index),
                onLeave: () => this.handleSectionLeave(sectionName, index),
                onLeaveBack: () => this.handleSectionLeave(sectionName, index),
                markers: this.options.debug
            });

            this.sections.push({ element: section, name: sectionName, trigger });
        });
    }

    /**
     * Setup scroll progress tracking
     */
    setupScrollProgress() {
        ScrollTrigger.create({
            start: 'top top',
            end: 'bottom bottom',
            onUpdate: (self) => {
                this.scrollState.progress = self.progress;
                this.scrollState.velocity = self.getVelocity();
                this.scrollState.direction = self.direction > 0 ? 'down' : 'up';

                if (this.onScrollUpdate) {
                    this.onScrollUpdate(this.scrollState);
                }
            }
        });
    }

    /**
     * Setup parallax effects for elements
     */
    setupParallax() {
        const parallaxElements = document.querySelectorAll('[data-parallax]');

        parallaxElements.forEach(element => {
            const speed = parseFloat(element.dataset.parallax) || this.options.parallaxIntensity;

            gsap.to(element, {
                yPercent: speed * 100,
                ease: 'none',
                scrollTrigger: {
                    trigger: element,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true,
                    markers: this.options.debug
                }
            });
        });
    }

    /**
     * Handle section enter
     */
    handleSectionEnter(sectionName, index) {
        this.currentSection = index;
        this.scrollState.section = sectionName;

        if (this.onSectionChange) {
            this.onSectionChange(sectionName, index);
        }

        // Update body class for section-specific styling
        document.body.dataset.currentSection = sectionName;

        console.log(`📍 Entered section: ${sectionName}`);
    }

    /**
     * Handle section leave
     */
    handleSectionLeave(sectionName, index) {
        console.log(`👋 Left section: ${sectionName}`);
    }

    /**
     * Scroll to specific section
     */
    scrollToSection(indexOrName) {
        const section = typeof indexOrName === 'number'
            ? this.sections[indexOrName]
            : this.sections.find(s => s.name === indexOrName);

        if (!section) {
            console.warn(`Section not found: ${indexOrName}`);
            return;
        }

        gsap.to(window, {
            scrollTo: { y: section.element, offsetY: 0 },
            duration: this.options.smoothScrollDuration,
            ease: 'power2.inOut'
        });
    }

    /**
     * Enable debug mode
     */
    enableDebugMode() {
        // Add scroll position indicator
        const indicator = document.createElement('div');
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: #0ff;
            padding: 10px;
            font-family: monospace;
            font-size: 12px;
            z-index: 10000;
            border-radius: 4px;
        `;
        document.body.appendChild(indicator);

        this.onScrollUpdate = (state) => {
            indicator.innerHTML = `
                Progress: ${(state.progress * 100).toFixed(1)}%<br>
                Velocity: ${state.velocity.toFixed(0)}<br>
                Section: ${state.section || 'none'}<br>
                Direction: ${state.direction}
            `;
        };
    }

    /**
     * Cleanup
     */
    destroy() {
        this.triggers.forEach(trigger => trigger.kill());
        ScrollTrigger.getAll().forEach(st => st.kill());
        this.sections = [];
        this.triggers = [];

        console.log('🗑️  UnifiedScrollOrchestrator destroyed');
    }

    /**
     * Refresh ScrollTrigger (call after DOM changes)
     */
    refresh() {
        ScrollTrigger.refresh();
        console.log('🔄 ScrollTrigger refreshed');
    }
}

// Export singleton instance
let orchestratorInstance = null;

export function createOrchestrator(options = {}) {
    if (orchestratorInstance) {
        orchestratorInstance.destroy();
    }

    orchestratorInstance = new UnifiedScrollOrchestrator(options);
    return orchestratorInstance;
}

export function getOrchestrator() {
    return orchestratorInstance;
}
