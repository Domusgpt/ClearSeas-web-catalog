/**
 * ClearSeas Revolutionary Redesign
 * Unified Application Controller
 *
 * Brings together all the new systems:
 * - UnifiedScrollOrchestrator
 * - HorizontalCardCarousel
 * - CinematicTransitions
 * - ParticleText
 * - PolytopReactor
 *
 * @author Clear Seas Solutions
 * @version 2.0 - Revolutionary
 */

import { createOrchestrator, getOrchestrator } from './core/UnifiedScrollOrchestrator.js';
import { HorizontalCardCarousel } from './components/HorizontalCardCarousel.js';
import { CinematicTransitions } from './effects/CinematicTransitions.js';
import { initializeParticleText } from './effects/ParticleText.js';
import { PolytopReactor } from './visualizers/PolytopReactor.js';

class ClearSeasApp {
    constructor() {
        this.orchestrator = null;
        this.carousel = null;
        this.cinematic = null;
        this.particleTexts = [];
        this.polytope = null;

        this.isInitialized = false;
        this.isMobile = window.innerWidth <= 768px;

        console.log('🚀 ClearSeas Revolutionary Redesign');
        console.log(`📱 Device: ${this.isMobile ? 'Mobile' : 'Desktop'}`);
    }

    /**
     * Initialize all systems
     */
    async init() {
        if (this.isInitialized) {
            console.warn('App already initialized');
            return;
        }

        console.log('⚡ Initializing revolutionary systems...');

        try {
            // 1. Initialize polytope background first
            await this.initPolytope();

            // 2. Initialize scroll orchestrator (master controller)
            this.initOrchestrator();

            // 3. Initialize horizontal hero carousel
            this.initHeroCarousel();

            // 4. Initialize cinematic section transitions
            this.initCinematicTransitions();

            // 5. Initialize particle text effects
            this.initParticleText();

            // 6. Connect polytope to scroll
            this.connectPolytopeToScroll();

            // 7. Setup global event listeners
            this.setupEventListeners();

            // 8. Initialize smooth scroll for links
            this.initSmoothScrollLinks();

            this.isInitialized = true;

            console.log('✅ All systems operational');
            console.log('━'.repeat(50));

        } catch (error) {
            console.error('❌ Initialization error:', error);
        }
    }

    /**
     * Initialize polytope visualizer
     */
    async initPolytope() {
        const canvas = document.querySelector('#polytope-canvas');

        if (!canvas) {
            console.warn('Polytope canvas not found, skipping');
            return;
        }

        this.polytope = new PolytopReactor(canvas, {
            particleCount: this.isMobile ? 50 : 100,
            connectionDistance: this.isMobile ? 100 : 150,
            reactivity: 0.5
        });

        console.log('✅ Polytope reactor initialized');
    }

    /**
     * Initialize scroll orchestrator
     */
    initOrchestrator() {
        this.orchestrator = createOrchestrator({
            smoothScroll: !this.isMobile, // Native on mobile
            smoothScrollDuration: 1.2,
            parallaxIntensity: 0.3,
            debug: false // Set to true for debugging
        });

        console.log('✅ Scroll orchestrator initialized');
    }

    /**
     * Initialize hero carousel
     */
    initHeroCarousel() {
        const carouselContainer = document.querySelector('#hero-carousel');

        if (!carouselContainer) {
            console.warn('Hero carousel container not found, skipping');
            return;
        }

        this.carousel = new HorizontalCardCarousel(carouselContainer, {
            spacing: 100,
            cardScale: 0.85,
            animationDuration: 1.5,
            mobile: this.isMobile
        });

        // Listen to card changes
        carouselContainer.addEventListener('cardchange', (e) => {
            console.log(`🎠 Card changed to: ${e.detail.index}`);
            // You can trigger other effects based on card changes
        });

        console.log('✅ Hero carousel initialized');
    }

    /**
     * Initialize cinematic transitions
     */
    initCinematicTransitions() {
        this.cinematic = new CinematicTransitions({
            letterboxHeight: '15%',
            parallaxLayers: !this.isMobile, // Disable parallax on mobile
            fadeInDuration: 0.8
        });

        console.log('✅ Cinematic transitions initialized');
    }

    /**
     * Initialize particle text effects
     */
    initParticleText() {
        // Initialize all elements with data-particle-text attribute
        this.particleTexts = initializeParticleText();

        console.log(`✅ Particle text initialized (${this.particleTexts.length} instances)`);
    }

    /**
     * Connect polytope to scroll state
     */
    connectPolytopeToScroll() {
        if (!this.polytope || !this.orchestrator) return;

        // Update polytope based on scroll
        this.orchestrator.onScrollUpdate = (scrollState) => {
            this.polytope.updateScrollState(scrollState);
        };

        // Change polytope color based on section
        this.orchestrator.onSectionChange = (sectionName, index) => {
            // You can customize colors per section
            const sectionColors = {
                hero: { r: 0, g: 212, b: 255 },
                capabilities: { r: 138, g: 43, b: 226 },
                products: { r: 255, g: 0, b: 110 },
                research: { r: 0, g: 255, b: 200 },
                engagement: { r: 255, g: 100, b: 0 },
                contact: { r: 0, g: 200, b: 255 }
            };

            if (sectionColors[sectionName] && this.polytope) {
                this.polytope.options.baseColor = sectionColors[sectionName];
            }
        };

        console.log('✅ Polytope connected to scroll');
    }

    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        // Handle resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        });

        // Handle visibility change (pause animations when tab hidden)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });

        // Setup header scroll behavior
        this.setupHeaderScroll();

        console.log('✅ Event listeners setup');
    }

    /**
     * Setup header scroll behavior
     */
    setupHeaderScroll() {
        const header = document.querySelector('.site-header');
        if (!header) return;

        let lastScroll = 0;

        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;

            // Add scrolled class
            if (currentScroll > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }

            // Hide header on scroll down, show on scroll up
            if (currentScroll > lastScroll && currentScroll > 500) {
                header.style.transform = 'translateY(-100%)';
            } else {
                header.style.transform = 'translateY(0)';
            }

            lastScroll = currentScroll;
        });
    }

    /**
     * Initialize smooth scroll for anchor links
     */
    initSmoothScrollLinks() {
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href === '#') return;

                e.preventDefault();

                const target = document.querySelector(href);
                if (target && this.orchestrator) {
                    // Use orchestrator to scroll to section
                    const sectionName = target.dataset.section;
                    if (sectionName) {
                        this.orchestrator.scrollToSection(sectionName);
                    } else {
                        // Fallback to native scroll
                        target.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            });
        });

        console.log('✅ Smooth scroll links initialized');
    }

    /**
     * Handle window resize
     */
    handleResize() {
        const newIsMobile = window.innerWidth <= 768;

        // If device type changed (desktop <-> mobile)
        if (newIsMobile !== this.isMobile) {
            console.log(`📱 Device changed to: ${newIsMobile ? 'Mobile' : 'Desktop'}`);
            this.isMobile = newIsMobile;

            // Reinitialize components that need it
            if (this.carousel) {
                this.carousel.destroy();
                this.initHeroCarousel();
            }
        }

        // Refresh scroll triggers
        if (this.orchestrator) {
            this.orchestrator.refresh();
        }

        if (this.carousel) {
            this.carousel.refresh();
        }
    }

    /**
     * Pause all animations
     */
    pause() {
        if (this.polytope) {
            this.polytope.stop();
        }
        console.log('⏸️  Animations paused');
    }

    /**
     * Resume all animations
     */
    resume() {
        if (this.polytope) {
            this.polytope.start();
        }
        console.log('▶️  Animations resumed');
    }

    /**
     * Destroy app and cleanup
     */
    destroy() {
        if (this.orchestrator) {
            this.orchestrator.destroy();
        }

        if (this.carousel) {
            this.carousel.destroy();
        }

        if (this.cinematic) {
            this.cinematic.destroy();
        }

        this.particleTexts.forEach(pt => pt.destroy());

        if (this.polytope) {
            this.polytope.destroy();
        }

        this.isInitialized = false;

        console.log('🗑️  App destroyed');
    }
}

// Create and export app instance
const app = new ClearSeasApp();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}

// Export for external access
window.ClearSeasApp = app;

export default app;
