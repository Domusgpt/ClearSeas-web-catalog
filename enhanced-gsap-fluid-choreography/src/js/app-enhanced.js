/**
 * Clear Seas Solutions - Enhanced Application
 * Combines Polytopal Field visualization with advanced quantum visualizers
 *
 * A Paul Phillips Manifestation - Paul@clearseassolutions.com
 * "The Revolution Will Not be in a Structured Format" © 2025
 */

import { CanvasManager } from './managers/CanvasManager.js';
import { VisualOrchestrator } from './managers/VisualOrchestrator.js';
import { GSAPChoreographer } from './managers/GSAPChoreographer.js';
import { EnhancedQuantumBackground } from './visualizers/EnhancedQuantumBackground.js';
import { HolographicSystem } from './visualizers/HolographicSystem.js';
import { FacetedSystem } from './visualizers/FacetedSystem.js';
import { ParticleNetworkSystem } from './visualizers/ParticleNetwork.js';
import { PolytopalFieldVisualizer } from './visualizers/PolytopalFieldVisualizer.js';
import { CardFractalSystem } from './visualizers/CardFractalSystem.js';
import { Utils, Logger } from './utils/Utils.js';

class ClearSeasEnhancedApplication {
    constructor() {
        this.logger = new Logger('ClearSeasEnhanced', 'info');
        this.canvasManager = null;
        this.orchestrator = null;
        this.gsapChoreographer = null;
        this.polytopalField = null;
        this.quantumBackground = null;
        this.particleNetworks = new Map();
        this.cardFractalSystem = null;
        this.isInitialized = false;

        this.logger.info('🌊 Clear Seas Solutions - Enhanced Combined System');
    }

    async initialize() {
        if (this.isInitialized) {
            this.logger.warn('Already initialized');
            return;
        }

        if (!Utils.isWebGLSupported()) {
            this.showFallback('WebGL is not supported on your device');
            return;
        }

        try {
            // Initialize Canvas Manager
            this.logger.info('Initializing Canvas Manager...');
            this.canvasManager = new CanvasManager();
            this.canvasManager.setAdaptiveQuality(true);

            // Create Polytopal Field Canvas (Main Background)
            this.logger.info('🔮 Creating Polytopal Field Canvas...');
            const polytopalCanvas = this.canvasManager.createCanvas('polytopal-field', {
                container: document.getElementById('polytopal-field'),
                width: window.innerWidth,
                height: window.innerHeight,
                alpha: true,
                antialias: false,
                webgl2: false, // Use 2D canvas for polytopal field
                dpr: Utils.getDevicePixelRatio(2)
            });

            if (!polytopalCanvas) {
                throw new Error('Failed to create polytopal field canvas');
            }

            polytopalCanvas.options.autoResize = true;

            // Create Quantum Background Canvas (Secondary Layer)
            this.logger.info('🌌 Creating Quantum Background Canvas...');
            const quantumContainer = document.createElement('div');
            quantumContainer.id = 'quantum-background';
            quantumContainer.style.position = 'fixed';
            quantumContainer.style.top = '0';
            quantumContainer.style.left = '0';
            quantumContainer.style.width = '100%';
            quantumContainer.style.height = '100%';
            quantumContainer.style.pointerEvents = 'none';
            quantumContainer.style.zIndex = '0';
            quantumContainer.style.opacity = '0.6';
            document.body.insertBefore(quantumContainer, document.body.firstChild);

            const bgCanvas = this.canvasManager.createCanvas('quantum-background', {
                container: quantumContainer,
                width: window.innerWidth,
                height: window.innerHeight,
                alpha: false,
                antialias: false,
                webgl2: true,
                powerPreference: 'high-performance',
                dpr: Utils.getDevicePixelRatio(2)
            });

            if (bgCanvas) {
                bgCanvas.options.autoResize = true;
            }

            // Initialize Polytopal Field Visualizer (Primary - Always Active)
            this.logger.info('✨ Initializing Polytopal Field Visualizer...');
            this.polytopalField = new PolytopalFieldVisualizer(
                this.canvasManager,
                'polytopal-field',
                {
                    baseCount: 80,
                    maxVelocity: 0.35,
                    connectionDistance: 180,
                    colorScheme: 'cyan-magenta',
                    enablePointerInteraction: true,
                    enableDepthEffect: true,
                    particleGlow: true
                }
            );
            this.polytopalField.initialize();

            // Initialize THREE VISUALIZER SYSTEMS (switched by VisualOrchestrator)

            // 1. Quantum System (Enhanced Quantum Background)
            if (bgCanvas) {
                this.logger.info('🌌 Initializing Quantum System...');
                this.quantumSystem = new EnhancedQuantumBackground(
                    this.canvasManager,
                    'quantum-background'
                );
                this.quantumSystem.initialize();
            }

            // 2. Holographic System (5-layer audio-reactive)
            this.logger.info('🎨 Initializing Holographic System...');
            this.holographicSystem = new HolographicSystem(
                this.canvasManager,
                'quantum-background' // Reuses quantum-background container
            );
            this.holographicSystem.initialize();
            this.holographicSystem.setActive(false); // Start inactive

            // 3. Faceted System (2D patterns with 4D rotation)
            this.logger.info('🔷 Initializing Faceted System...');
            this.facetedSystem = new FacetedSystem(
                this.canvasManager,
                'quantum-background' // Reuses quantum-background canvas
            );
            this.facetedSystem.initialize();
            this.facetedSystem.setActive(false); // Start inactive

            // Initialize ORCHESTRATOR with visualizer systems
            this.logger.info('🎭 Initializing Visual Orchestrator...');
            this.orchestrator = new VisualOrchestrator(this.canvasManager, {
                quantum: this.quantumSystem,
                holographic: this.holographicSystem,
                faceted: this.facetedSystem
            });

            // Initialize GSAP Choreographer (async - waits for GSAP to load)
            this.logger.info('🎬 Initializing GSAP Choreographer...');
            this.gsapChoreographer = new GSAPChoreographer(this.orchestrator);
            // Initialize async after everything else is ready
            setTimeout(() => {
                this.gsapChoreographer.initialize().then(success => {
                    if (success) {
                        this.logger.info('✅ GSAP Choreographer ready - scroll-locked morphing active');
                    } else {
                        this.logger.warn('⚠️ GSAP Choreographer initialization incomplete');
                    }
                });
            }, 1000);

            // Initialize Card Fractal System
            this.logger.info('🔮 Initializing Card Fractal System...');
            this.cardFractalSystem = new CardFractalSystem();

            // Initialize Particle Networks for sections
            this.initializeParticleNetworks();

            // Setup UI interactions
            this.setupInteractions();
            this.setupSectionBindings();

            // Start rendering
            this.canvasManager.start();
            document.body.dataset.visualSystem = 'enhanced';

            this.isInitialized = true;

            this.logger.info('✅ Clear Seas Enhanced initialized successfully');

            window.dispatchEvent(new CustomEvent('clearSeasEnhancedReady', {
                detail: { app: this }
            }));

        } catch (error) {
            this.logger.error('Initialization failed:', error);
            this.showFallback('Failed to initialize visualization system');
        }
    }

    initializeParticleNetworks() {
        // Create particle networks for select sections
        const sections = [
            { id: 'capabilities', colorScheme: 'purple', particleCount: 60, connectionDistance: 0.14 },
            { id: 'research', colorScheme: 'blue', particleCount: 60, connectionDistance: 0.16 },
            { id: 'platforms', colorScheme: 'green', particleCount: 60, connectionDistance: 0.15 },
            { id: 'engagement', colorScheme: 'magenta', particleCount: 48, connectionDistance: 0.18, opacity: 0.35 },
            { id: 'legacy', colorScheme: 'orange', particleCount: 48, connectionDistance: 0.17, opacity: 0.32 }
        ];

        sections.forEach(section => {
            const element = document.getElementById(section.id);
            if (!element) return;

            // Create container for particle canvas
            const container = document.createElement('div');
            container.id = `particle-${section.id}`;
            container.style.position = 'absolute';
            container.style.top = '0';
            container.style.left = '0';
            container.style.width = '100%';
            container.style.height = '100%';
            container.style.pointerEvents = 'none';
            container.style.zIndex = '1';
            container.style.opacity = String(section.opacity ?? 0.4);

            if (window.getComputedStyle(element).position === 'static') {
                element.style.position = 'relative';
            }
            element.insertBefore(container, element.firstChild);

            // Create canvas
            const canvas = this.canvasManager.createCanvas(`particle-${section.id}`, {
                container: container,
                width: element.offsetWidth,
                height: element.offsetHeight,
                alpha: true,
                antialias: true,
                autoResize: true
            });

            if (canvas) {
                // Initialize particle network
                const network = new ParticleNetworkSystem(
                    this.canvasManager,
                    `particle-${section.id}`,
                    {
                        particleCount: section.particleCount,
                        colorScheme: section.colorScheme,
                        connectionDistance: section.connectionDistance ?? 0.15,
                        speed: 0.2
                    }
                );

                network.initialize();
                this.particleNetworks.set(section.id, network);

                // Setup intersection observer for performance
                this.observeSection(section.id, canvas);
            }
        });

        this.logger.info(`Created ${this.particleNetworks.size} particle networks`);
    }

    observeSection(sectionId, canvasData) {
        const element = document.getElementById(sectionId);
        if (!element) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const isVisible = entry.isIntersecting && entry.intersectionRatio > 0.1;
                this.canvasManager.setCanvasActive(`particle-${sectionId}`, isVisible);
            });
        }, {
            threshold: [0, 0.1, 0.5, 1.0]
        });

        observer.observe(element);
    }

    setupInteractions() {
        // Header scroll behavior
        const header = document.querySelector('.site-header');
        if (header) {
            let lastScroll = 0;
            const scrollThrottle = this.throttle(() => {
                const currentScroll = window.pageYOffset;

                if (currentScroll > 12) {
                    header.classList.add('is-scrolled');
                } else {
                    header.classList.remove('is-scrolled');
                }

                // Hide header on scroll down, show on scroll up (only after scrolling past 100px)
                if (currentScroll > lastScroll && currentScroll > 100) {
                    header.style.transform = 'translateY(-100%)';
                } else {
                    header.style.transform = 'translateY(0)';
                }

                lastScroll = currentScroll;
            }, 100);

            window.addEventListener('scroll', scrollThrottle, { passive: true });
        }

        // Mobile menu
        const navToggle = document.querySelector('.nav-toggle');
        const navigation = document.getElementById('primary-navigation');

        if (navToggle && navigation) {
            navToggle.addEventListener('click', () => {
                const expanded = navToggle.getAttribute('aria-expanded') === 'true';
                navToggle.setAttribute('aria-expanded', String(!expanded));
                navigation.classList.toggle('is-open', !expanded);
            });

            // Close menu on link click
            navigation.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    navToggle.setAttribute('aria-expanded', 'false');
                    navigation.classList.remove('is-open');
                });
            });

            // Close menu on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && navigation.classList.contains('is-open')) {
                    navToggle.setAttribute('aria-expanded', 'false');
                    navigation.classList.remove('is-open');
                }
            });
        }

        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                if (href === '#') return;

                e.preventDefault();
                const target = document.querySelector(href);

                if (target) {
                    const headerOffset = 80;
                    const elementPosition = target.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });

        // Section observer for animations
        this.setupSectionObserver();

        // Year in footer
        const yearElement = document.getElementById('current-year');
        if (yearElement) {
            yearElement.textContent = new Date().getFullYear();
        }
    }

    setupSectionBindings() {
        const navLinks = Array.from(document.querySelectorAll('.primary-navigation a'));
        if (!navLinks.length) return;

        const markActive = (section) => {
            if (!section) return;

            navLinks.forEach(link => {
                const href = link.getAttribute('href');
                if (!href || !href.startsWith('#')) return;

                const targetSection = href.slice(1);
                const isActive = targetSection === section;
                link.classList.toggle('is-active', isActive);
                if (isActive) {
                    link.setAttribute('aria-current', 'page');
                } else {
                    link.removeAttribute('aria-current');
                }
            });
        };

        window.addEventListener('sectionTransition', ({ detail }) => {
            markActive(detail?.section);
        });

        markActive(document.body.dataset.activeSection || 'hero');
    }

    setupSectionObserver() {
        const revealables = document.querySelectorAll('[data-animate="reveal"]');

        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.2,
                rootMargin: '0px 0px -60px 0px'
            });

            revealables.forEach((element) => observer.observe(element));
        } else {
            revealables.forEach((element) => element.classList.add('is-visible'));
        }
    }

    throttle(callback, wait) {
        let ticking = false;
        return function(...args) {
            if (!ticking) {
                ticking = true;
                setTimeout(() => {
                    callback.apply(this, args);
                    ticking = false;
                }, wait);
            }
        };
    }

    showFallback(message) {
        this.logger.error(message);

        const container = document.getElementById('polytopal-field');
        if (container) {
            // Create a fallback canvas
            let canvas = container.querySelector('canvas');
            if (!canvas) {
                canvas = document.createElement('canvas');
                container.appendChild(canvas);
            }

            const ctx = canvas.getContext('2d');
            if (ctx) {
                const width = window.innerWidth;
                const height = window.innerHeight;
                canvas.width = width;
                canvas.height = height;
                canvas.style.width = `${width}px`;
                canvas.style.height = `${height}px`;

                const gradient = ctx.createLinearGradient(0, 0, width, height);
                gradient.addColorStop(0, 'rgba(0, 212, 255, 0.08)');
                gradient.addColorStop(1, 'rgba(255, 0, 110, 0.05)');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);
            }
        }
    }

    dispose() {
        this.logger.info('Disposing application...');

        if (this.gsapChoreographer) {
            this.gsapChoreographer.dispose();
        }

        if (this.cardFractalSystem) {
            this.cardFractalSystem.dispose();
        }

        if (this.polytopalField) {
            this.polytopalField.dispose();
        }

        // Dispose all three visualizer systems
        if (this.quantumSystem) {
            this.quantumSystem.dispose();
        }

        if (this.holographicSystem) {
            this.holographicSystem.dispose();
        }

        if (this.facetedSystem) {
            this.facetedSystem.dispose();
        }

        this.particleNetworks.forEach(network => network.dispose());
        this.particleNetworks.clear();

        if (this.canvasManager) {
            this.canvasManager.dispose();
        }

        if (document.body) {
            document.body.removeAttribute('data-visual-system');
            document.body.removeAttribute('data-active-section');
            document.body.removeAttribute('data-section-form');
            document.body.removeAttribute('data-section-preset');
        }

        document.querySelectorAll('.primary-navigation a.is-active').forEach(link => {
            link.classList.remove('is-active');
            link.removeAttribute('aria-current');
        });

        this.isInitialized = false;
        this.logger.info('Application disposed');
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.clearSeasApp = new ClearSeasEnhancedApplication();
        window.clearSeasApp.initialize();
    });
} else {
    window.clearSeasApp = new ClearSeasEnhancedApplication();
    window.clearSeasApp.initialize();
}

export default ClearSeasEnhancedApplication;
