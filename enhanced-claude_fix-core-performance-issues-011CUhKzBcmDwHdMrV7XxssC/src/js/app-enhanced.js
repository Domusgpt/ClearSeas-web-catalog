/**
 * Clear Seas Solutions - Enhanced Application
 * Combines Polytopal Field visualization with advanced quantum visualizers
 *
 * A Paul Phillips Manifestation - Paul@clearseassolutions.com
 * "The Revolution Will Not be in a Structured Format" © 2025
 */

import { CanvasManager } from './managers/CanvasManager.js';
import { VisualOrchestrator } from './managers/VisualOrchestrator.js';
import { EnhancedQuantumBackground } from './visualizers/EnhancedQuantumBackground.js';
import { ParticleNetworkSystem } from './visualizers/ParticleNetwork.js';
import { PolytopalFieldVisualizer } from './visualizers/PolytopalFieldVisualizer.js';
import { ElementVisualizerManager } from './visualizers/ElementVisualizer.js';
import { EmergentInteractionSystem } from './effects/GeometryMorpher.js';
import { CardFractalSystem } from './visualizers/CardFractalSystem.js';
import { Utils, Logger } from './utils/Utils.js';

class ClearSeasEnhancedApplication {
    constructor() {
        this.logger = new Logger('ClearSeasEnhanced', 'info');
        this.canvasManager = null;
        this.orchestrator = null;
        this.polytopalField = null;
        this.quantumBackground = null;
        this.particleNetworks = new Map();
        this.cardFractalSystem = null;
        this.elementVisualizerManager = null;
        this.emergentInteractionSystem = null;
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

            // Initialize ORCHESTRATOR
            this.logger.info('🎭 Initializing Visual Orchestrator...');
            this.orchestrator = new VisualOrchestrator(this.canvasManager);

            // Initialize Polytopal Field Visualizer (Primary)
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

            // Initialize Enhanced Quantum Background (Secondary)
            if (bgCanvas) {
                this.logger.info('🌠 Initializing Enhanced Quantum Background...');
                this.quantumBackground = new EnhancedQuantumBackground(
                    this.canvasManager,
                    'quantum-background'
                );
                this.quantumBackground.initialize();

                // Connect choreographer for scroll-responsive geometry transitions
                this.quantumBackground.setChoreographer(this.orchestrator.getChoreographer());
                this.logger.info('📜 ScrollChoreographer connected to quantum background');
            }

            // Initialize Card Fractal System
            this.logger.info('🔮 Initializing Card Fractal System...');
            this.cardFractalSystem = new CardFractalSystem();

            // Initialize Element Visualizer Manager
            this.logger.info('🎨 Initializing Element Visualizer Manager...');
            this.elementVisualizerManager = new ElementVisualizerManager(this.orchestrator);

            // Apply visualizers to cards with bleeding effect
            this.elementVisualizerManager.addToSelector('.card, .signal-card', {
                role: 'accent',
                depth: 0.7,
                reactivity: 1.2,
                bleedIntensity: 0.4,
                bleedRadius: 60,
                autoGeometry: true,
                hoverBoost: true
            });

            // Apply visualizers to CTA buttons
            this.elementVisualizerManager.addToSelector('.cta-button, .primary-button', {
                role: 'highlight',
                depth: 0.8,
                reactivity: 1.5,
                bleedIntensity: 0.5,
                bleedRadius: 40,
                autoGeometry: true,
                hoverBoost: true
            });

            // Auto-link adjacent cards for bleeding effect
            this.elementVisualizerManager.autoLinkAdjacent('.card, .signal-card', 200);

            // Start coordinated updates
            this.elementVisualizerManager.startCoordination();

            this.logger.info('✨ Element visualizers applied with bleeding effects');

            // Initialize Emergent Interaction System
            this.logger.info('🌀 Initializing Emergent Interaction System...');
            this.emergentInteractionSystem = new EmergentInteractionSystem(
                this.elementVisualizerManager,
                {
                    couplingStrength: 0.3,
                    propagationSpeed: 0.5,
                    rippleDecay: 0.95,
                    synchronizationThreshold: 0.7
                }
            );

            // Enable morphing on all element visualizers
            this.emergentInteractionSystem.enableMorphing();

            // Start emergent update loop
            const updateEmergent = () => {
                this.emergentInteractionSystem.update();
                this.emergentInteractionSystem.updateMorphers();
                requestAnimationFrame(updateEmergent);
            };
            requestAnimationFrame(updateEmergent);

            // Trigger ripples on card clicks
            document.querySelectorAll('.card, .signal-card').forEach(card => {
                card.addEventListener('click', () => {
                    this.emergentInteractionSystem.triggerRipple(card, 1.0);
                });
            });

            this.logger.info('🌊 Emergent interaction system active with ripple effects');

            // Initialize Particle Networks for sections
            this.initializeParticleNetworks();

            // Setup UI interactions
            this.setupInteractions();

            // Start rendering
            this.canvasManager.start();

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
            { id: 'capabilities', colorScheme: 'purple', particleCount: 60 },
            { id: 'research', colorScheme: 'cyan', particleCount: 60 },
            { id: 'platforms', colorScheme: 'green', particleCount: 60 }
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
            container.style.opacity = '0.4';

            element.style.position = 'relative';
            element.insertBefore(container, element.firstChild);

            // Create canvas
            const canvas = this.canvasManager.createCanvas(`particle-${section.id}`, {
                container: container,
                width: element.offsetWidth,
                height: element.offsetHeight,
                alpha: true,
                antialias: true
            });

            if (canvas) {
                // Initialize particle network
                const network = new ParticleNetworkSystem(
                    this.canvasManager,
                    `particle-${section.id}`,
                    {
                        particleCount: section.particleCount,
                        colorScheme: section.colorScheme,
                        connectionDistance: 0.15,
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
            // Draw static gradient fallback
            const canvas = container.querySelector('canvas');
            if (canvas) {
                const ctx = canvas.getContext('2d');
                const width = window.innerWidth;
                const height = window.innerHeight;
                canvas.width = width;
                canvas.height = height;
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

        if (this.cardFractalSystem) {
            this.cardFractalSystem.dispose();
        }

        if (this.polytopalField) {
            this.polytopalField.dispose();
        }

        if (this.quantumBackground) {
            this.quantumBackground.dispose();
        }

        this.particleNetworks.forEach(network => network.dispose());
        this.particleNetworks.clear();

        if (this.canvasManager) {
            this.canvasManager.dispose();
        }

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
