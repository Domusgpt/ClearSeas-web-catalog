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
        this.isInitialized = false;
        this.heroTitleField = null;
        this.heroImmersiveState = {
            isActive: false,
            progress: 0,
            listeners: [],
            flourishTimeout: null,
            resizeObserver: null
        };
        this.heroFlourishSources = [
            'assets/gifs/hero-flourish-01.gif',
            'assets/gifs/hero-flourish-02.gif',
            'assets/gifs/hero-flourish-03.gif',
            'assets/gifs/hero-flourish-04.gif',
            'assets/gifs/hero-flourish-05.gif',
            'assets/gifs/hero-flourish-06.gif',
            'assets/gifs/hero-flourish-07.gif',
            'assets/gifs/hero-flourish-08.gif',
            'assets/gifs/hero-flourish-09.gif',
            'assets/gifs/hero-flourish-10.gif',
            'assets/gifs/hero-flourish-11.gif',
            'assets/gifs/hero-flourish-12.gif',
            'assets/gifs/hero-flourish-13.gif',
            'assets/gifs/hero-flourish-14.gif'
        ];
        this.heroFlourishPreloads = [];
        this.heroLastFlourishIndex = -1;

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
            quantumContainer.style.opacity = '0.45'; // Reduced for less clutter, more elegant
            quantumContainer.style.transition = 'opacity 0.8s ease'; // Smooth transitions
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

            // Initialize Polytopal Field Visualizer (Primary) - ENHANCED AVANT-GARDE
            this.logger.info('✨ Initializing Polytopal Field Visualizer (Avant-Garde Edition)...');
            this.polytopalField = new PolytopalFieldVisualizer(
                this.canvasManager,
                'polytopal-field',
                {
                    baseCount: 55, // Reduced for elegance
                    maxVelocity: 0.22, // Slower, smoother motion
                    connectionDistance: 150, // Slightly tighter network
                    colorScheme: 'cyan-magenta',
                    enablePointerInteraction: true,
                    enableDepthEffect: true,
                    particleGlow: true,
                    flowFieldInfluence: 0.18, // Organic avant-garde motion
                    smoothingFactor: 0.94 // Highly smooth interpolation
                }
            );
            this.polytopalField.initialize();

            this.initializeHeroTitleVisualizer();

            // Initialize Enhanced Quantum Background (Secondary)
            if (bgCanvas) {
                this.logger.info('🌠 Initializing Enhanced Quantum Background...');
                this.quantumBackground = new EnhancedQuantumBackground(
                    this.canvasManager,
                    'quantum-background'
                );
                this.quantumBackground.initialize();
            }

            // Initialize Card Fractal System
            this.logger.info('🔮 Initializing Card Fractal System...');
            this.cardFractalSystem = new CardFractalSystem();

            // Initialize Particle Networks for sections
            this.initializeParticleNetworks();

            // Setup UI interactions
            this.setupInteractions();
            this.setupHeroImmersive();
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
        // Create particle networks for select sections - REFINED & ELEGANT
        const sections = [
            { id: 'capabilities', colorScheme: 'purple', particleCount: 45, connectionDistance: 0.13, opacity: 0.35 },
            { id: 'research', colorScheme: 'blue', particleCount: 45, connectionDistance: 0.14, opacity: 0.35 },
            { id: 'platforms', colorScheme: 'green', particleCount: 45, connectionDistance: 0.13, opacity: 0.35 },
            { id: 'engagement', colorScheme: 'magenta', particleCount: 38, connectionDistance: 0.15, opacity: 0.28 },
            { id: 'legacy', colorScheme: 'orange', particleCount: 38, connectionDistance: 0.14, opacity: 0.28 }
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

    initializeHeroTitleVisualizer() {
        const visualHost = document.querySelector('[data-hero-visual]');
        if (!visualHost) {
            this.logger.info('Hero title visual host not found — immersive intro visual skipped.');
            return;
        }

        if (this.canvasManager.getCanvas('hero-title')) {
            this.logger.warn('Hero title canvas already initialized.');
            return;
        }

        const initialBounds = visualHost.getBoundingClientRect();
        const width = Math.max(Math.round(initialBounds.width), 640);
        const height = Math.max(Math.round(initialBounds.height), 260);

        const heroCanvas = this.canvasManager.createCanvas('hero-title', {
            container: visualHost,
            width,
            height,
            alpha: true,
            antialias: false,
            webgl2: false,
            dpr: Utils.getDevicePixelRatio(1.5)
        });

        if (!heroCanvas) {
            this.logger.warn('Unable to create hero title canvas.');
            return;
        }

        heroCanvas.canvas.style.width = '100%';
        heroCanvas.canvas.style.height = '100%';
        heroCanvas.canvas.style.display = 'block';
        heroCanvas.canvas.classList.add('hero-title-canvas');

        this.heroTitleField = new PolytopalFieldVisualizer(this.canvasManager, 'hero-title', {
            baseCount: 46,
            maxVelocity: 0.18,
            connectionDistance: 140,
            flowFieldInfluence: 0.1,
            smoothingFactor: 0.94,
            enablePointerInteraction: false,
            particleGlow: true,
            colorScheme: 'cyan-magenta'
        });
        this.heroTitleField.initialize();

        const handleResize = (dimensions) => {
            const rect = dimensions || visualHost.getBoundingClientRect();
            const targetWidth = Math.max(Math.round(rect.width || 0), 320);
            const targetHeight = Math.max(Math.round(rect.height || 0), 180);
            if (!targetWidth || !targetHeight) return;

            this.canvasManager.resizeCanvas('hero-title', targetWidth, targetHeight);
            if (this.heroTitleField && typeof this.heroTitleField.setupNodes === 'function') {
                this.heroTitleField.setupNodes();
            }
        };

        if (typeof ResizeObserver !== 'undefined') {
            const observer = new ResizeObserver((entries) => {
                entries.forEach(entry => handleResize(entry.contentRect));
            });
            observer.observe(visualHost);
            this.heroImmersiveState.resizeObserver = observer;
        } else {
            this.registerHeroImmersiveListener(window, 'resize', () => handleResize());
        }

        // Ensure an initial sizing pass once layout settles
        window.setTimeout(() => handleResize(), 32);
    }

    registerHeroImmersiveListener(target, type, handler, options) {
        if (!target || typeof target.addEventListener !== 'function') return;
        target.addEventListener(type, handler, options);
        this.heroImmersiveState.listeners.push({ target, type, handler, options });
    }

    setupHeroLogoFlourish(logoElement) {
        if (!logoElement) return;
        const flourish = logoElement.querySelector('.hero-immersive__flourish');
        if (!flourish) return;

        if (!this.heroFlourishPreloads.length) {
            this.heroFlourishPreloads = this.heroFlourishSources.map((src) => {
                const image = new Image();
                image.src = src;
                return image;
            });
        }

        let lastTriggerTime = 0;

        const pickNextSource = () => {
            if (!this.heroFlourishSources.length) {
                return null;
            }

            if (this.heroFlourishSources.length === 1) {
                this.heroLastFlourishIndex = 0;
                return this.heroFlourishSources[0];
            }

            let candidate = this.heroLastFlourishIndex;
            while (candidate === this.heroLastFlourishIndex) {
                candidate = Math.floor(Math.random() * this.heroFlourishSources.length);
            }
            this.heroLastFlourishIndex = candidate;
            return this.heroFlourishSources[candidate];
        };

        const triggerFlourish = () => {
            const now = performance.now();
            if (now - lastTriggerTime < 160) return;
            lastTriggerTime = now;

            const nextSource = pickNextSource();
            if (!nextSource) return;

            flourish.style.backgroundImage = `url('${nextSource}')`;
            flourish.classList.remove('is-active');
            void flourish.offsetWidth; // force reflow for restart
            flourish.classList.add('is-active');

            if (this.heroImmersiveState.flourishTimeout) {
                clearTimeout(this.heroImmersiveState.flourishTimeout);
            }
            this.heroImmersiveState.flourishTimeout = window.setTimeout(() => {
                flourish.classList.remove('is-active');
            }, 1500);
        };

        this.registerHeroImmersiveListener(logoElement, 'pointerenter', triggerFlourish, { passive: true });
        this.registerHeroImmersiveListener(logoElement, 'pointerdown', triggerFlourish, { passive: true });
        this.registerHeroImmersiveListener(logoElement, 'focus', triggerFlourish);
        this.registerHeroImmersiveListener(logoElement, 'keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                triggerFlourish();
            }
        });
    }

    cleanupHeroImmersive() {
        this.heroImmersiveState.listeners.forEach(({ target, type, handler, options }) => {
            if (!target || typeof target.removeEventListener !== 'function') return;
            target.removeEventListener(type, handler, options);
        });
        this.heroImmersiveState.listeners = [];

        if (this.heroImmersiveState.resizeObserver) {
            try {
                this.heroImmersiveState.resizeObserver.disconnect();
            } catch (error) {
                this.logger.warn('Hero intro resize observer cleanup warning', error);
            }
            this.heroImmersiveState.resizeObserver = null;
        }

        if (this.heroImmersiveState.flourishTimeout) {
            clearTimeout(this.heroImmersiveState.flourishTimeout);
            this.heroImmersiveState.flourishTimeout = null;
        }
    }

    setupHeroImmersive() {
        const heroSection = document.querySelector('[data-hero-section]');
        const heroImmersive = heroSection?.querySelector('[data-hero-immersive]');
        const heroMain = heroSection?.querySelector('[data-hero-main]');

        if (!heroSection || !heroImmersive || !heroMain) {
            this.logger.warn('Immersive hero structure missing.');
            return;
        }

        const prefersReducedMotion = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const targetHash = window.location.hash;
        const shouldSkip = prefersReducedMotion || (targetHash && targetHash !== '#hero') || window.pageYOffset > 160;

        const skipImmersive = () => {
            const progressDisplay = heroSection.querySelector('[data-hero-progress]');
            if (progressDisplay) {
                progressDisplay.setAttribute('aria-valuenow', '100');
                const label = progressDisplay.querySelector('.hero-immersive__scroll-label');
                if (label) {
                    label.textContent = 'Experience ready';
                }
            }

            heroSection.style.setProperty('--hero-immersive-progress', '1');
            heroSection.classList.add('is-main-visible');
            heroImmersive.style.display = 'none';
            heroImmersive.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('hero-immersive-active');
            this.cleanupHeroImmersive();
            if (this.heroTitleField) {
                try {
                    this.canvasManager.destroyCanvas('hero-title');
                } catch (error) {
                    this.logger.warn('Failed to destroy hero title canvas during skip', error);
                }
                this.heroTitleField = null;
            }
            this.heroImmersiveState.isActive = false;
        };

        if (shouldSkip) {
            skipImmersive();
            return;
        }

        document.body.classList.add('hero-immersive-active');
        heroSection.classList.remove('is-main-visible');
        heroImmersive.style.removeProperty('display');
        heroImmersive.removeAttribute('aria-hidden');

        const progressDisplay = heroSection.querySelector('[data-hero-progress]');
        if (progressDisplay) {
            progressDisplay.setAttribute('aria-valuenow', '0');
        }

        this.heroImmersiveState.isActive = true;
        this.heroImmersiveState.progress = 0;
        heroSection.style.setProperty('--hero-immersive-progress', '0');

        const setProgress = (value) => {
            const clamped = Math.min(Math.max(value, 0), 1);
            this.heroImmersiveState.progress = clamped;
            heroSection.style.setProperty('--hero-immersive-progress', clamped.toFixed(3));
            if (progressDisplay) {
                progressDisplay.setAttribute('aria-valuenow', String(Math.round(clamped * 100)));
            }
            return clamped;
        };

        const completeIntro = () => {
            if (!this.heroImmersiveState.isActive) return;
            this.heroImmersiveState.isActive = false;
            setProgress(1);
            heroSection.classList.add('is-main-visible');
            heroImmersive.setAttribute('aria-hidden', 'true');
            heroImmersive.style.pointerEvents = 'none';
            document.body.classList.remove('hero-immersive-active');

            const label = progressDisplay?.querySelector('.hero-immersive__scroll-label');
            if (label) {
                label.textContent = 'Welcome aboard';
            }

            window.setTimeout(() => {
                heroImmersive.style.display = 'none';
                heroImmersive.style.pointerEvents = '';
            }, 1200);

            if (this.heroTitleField) {
                try {
                    this.canvasManager.destroyCanvas('hero-title');
                } catch (error) {
                    this.logger.warn('Unable to gracefully destroy hero title canvas', error);
                }
                this.heroTitleField = null;
            }

            this.cleanupHeroImmersive();

            const focusTarget = heroMain.querySelector('a, button, [href], [tabindex]:not([tabindex="-1"])');
            if (focusTarget) {
                window.requestAnimationFrame(() => {
                    try {
                        focusTarget.focus({ preventScroll: true });
                    } catch (error) {
                        focusTarget.focus();
                    }
                });
            }

            window.dispatchEvent(new CustomEvent('heroImmersiveComplete'));
        };

        const animateProgress = (delta) => {
            if (!this.heroImmersiveState.isActive) return;
            const next = setProgress(this.heroImmersiveState.progress + delta);
            if (next >= 1) {
                completeIntro();
            }
        };

        const handleWheel = (event) => {
            if (!this.heroImmersiveState.isActive) return;
            const normalized = Math.max(-0.45, Math.min(0.6, event.deltaY / 900));
            if (Math.abs(normalized) < 0.01) return;
            event.preventDefault();
            animateProgress(normalized);
        };

        let touchStartY = null;
        const handleTouchStart = (event) => {
            if (!this.heroImmersiveState.isActive) return;
            if (event.touches && event.touches.length > 0) {
                touchStartY = event.touches[0].clientY;
            }
        };

        const handleTouchMove = (event) => {
            if (!this.heroImmersiveState.isActive) return;
            if (!event.touches || !event.touches.length) return;
            if (touchStartY === null) {
                touchStartY = event.touches[0].clientY;
                return;
            }

            const currentY = event.touches[0].clientY;
            const delta = touchStartY - currentY;
            if (Math.abs(delta) < 14) return;
            event.preventDefault();
            const normalized = Math.max(-0.5, Math.min(0.55, delta / 320));
            animateProgress(normalized);
            touchStartY = currentY;
        };

        const handleTouchEnd = () => {
            touchStartY = null;
        };

        const handleKeyDown = (event) => {
            if (!this.heroImmersiveState.isActive) return;
            if (['ArrowDown', 'PageDown'].includes(event.key)) {
                event.preventDefault();
                animateProgress(0.35);
            } else if (event.key === ' ' || event.key === 'Enter') {
                event.preventDefault();
                animateProgress(1);
            } else if (['ArrowUp', 'PageUp'].includes(event.key)) {
                event.preventDefault();
                animateProgress(-0.3);
            }
        };

        this.registerHeroImmersiveListener(window, 'wheel', handleWheel, { passive: false });
        this.registerHeroImmersiveListener(window, 'keydown', handleKeyDown);
        this.registerHeroImmersiveListener(heroImmersive, 'touchstart', handleTouchStart, { passive: true });
        this.registerHeroImmersiveListener(heroImmersive, 'touchmove', handleTouchMove, { passive: false });
        this.registerHeroImmersiveListener(heroImmersive, 'touchend', handleTouchEnd);
        this.registerHeroImmersiveListener(heroImmersive, 'touchcancel', handleTouchEnd);

        const enterButton = heroSection.querySelector('[data-hero-enter]');
        if (enterButton) {
            this.registerHeroImmersiveListener(enterButton, 'click', (event) => {
                event.preventDefault();
                completeIntro();
            });
        }

        const heroLogo = heroSection.querySelector('[data-hero-logo]');
        if (heroLogo) {
            this.setupHeroLogoFlourish(heroLogo);
        }

        // Encourage subtle motion for initial discovery
        window.setTimeout(() => {
            if (this.heroImmersiveState.isActive) {
                animateProgress(0.12);
            }
        }, 700);
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
