/**
 * VISUAL ORCHESTRATOR
 * The brain of the entire visual system - choreographs all effects based on context
 * NO MANUAL CONTROLS - pure emergent behavior
 */

export class VisualOrchestrator {
    constructor(canvasManager, visualizerSystems = {}) {
        this.manager = canvasManager;

        // Visualizer systems (quantum, holographic, faceted)
        this.systems = visualizerSystems;
        this.activeSystem = 'quantum'; // Default

        // State tracking
        this.state = {
            scroll: 0,
            scrollVelocity: 0,
            mousePos: { x: 0.5, y: 0.5 },
            mouseVelocity: { x: 0, y: 0 },
            mouseActivity: 0, // 0-1, decays over time
            currentSection: 'hero',
            sectionDepth: 0,
            hoveredCards: new Set(),
            timeOfDay: this.getTimeOfDay(),
            userEnergy: 0.5, // How active the user is
            sessionTime: 0,
            dominantColor: { h: 180, s: 0.8, v: 0.9 }
        };
        
        // Visual targets (what we're transitioning toward)
        this.visualTarget = {
            preset: 'quantum',
            intensity: 0.5,
            chaos: 0.2,
            speed: 0.6,
            hue: 180,
            rgbOffset: 0.0,
            moireIntensity: 0.0,
            fractalDecay: 0.0,
            // NEW: Scroll-based parameter sweeps
            gridDensity: 15,
            morphFactor: 1.0,
            // NEW: 4D rotation orbital effects
            rot4dXW: 0.0,
            rot4dYW: 0.0,
            rot4dZW: 0.0
        };
        
        // Current visual state (smooth interpolation)
        this.visualState = { ...this.visualTarget };
        this.activeSectionElement = null;
        
        // Section-based visual profiles WITH SYSTEM ASSIGNMENT
        this.sectionProfiles = {
            hero: {
                system: 'quantum',         // Use Quantum System
                preset: 'quantum',
                form: 'lattice',           // Quantum 4D lattice structure
                intensity: 0.6,
                chaos: 0.15,
                speed: 0.5,
                hue: 180,
                rgbOffset: 0.002,
                moireIntensity: 0.1,
                formMix: 1.0
            },
            capabilities: {
                system: 'holographic',     // Use Holographic System (5 layers)
                preset: 'crystal',
                form: 'crystal',           // Sharp crystalline structures
                intensity: 0.65,
                chaos: 0.1,
                speed: 0.4,
                hue: 200,
                rgbOffset: 0.001,
                moireIntensity: 0.05,
                formMix: 1.0
            },
            research: {
                system: 'faceted',         // Use Faceted System (2D with 4D rotation)
                preset: 'cosmic',
                form: 'nebula',            // Organic nebula clouds
                intensity: 0.7,
                chaos: 0.3,
                speed: 0.6,
                hue: 240,
                rgbOffset: 0.003,
                moireIntensity: 0.2,
                formMix: 1.0
            },
            platforms: {
                system: 'quantum',         // Use Quantum System
                preset: 'cyber',
                form: 'vortex',            // Swirling vortex/spiral
                intensity: 0.8,
                chaos: 0.25,
                speed: 0.7,
                hue: 160,
                rgbOffset: 0.004,
                moireIntensity: 0.25,
                formMix: 1.0
            },
            engagement: {
                system: 'holographic',     // Use Holographic System
                preset: 'neural',
                form: 'pulse',             // Engagement wave choreography
                intensity: 0.75,
                chaos: 0.4,
                speed: 0.7,
                hue: 300,
                rgbOffset: 0.003,
                moireIntensity: 0.3,
                formMix: 1.0
            },
            legacy: {
                system: 'faceted',         // Use Faceted System
                preset: 'heritage',
                form: 'strata',            // Layered maritime memory
                intensity: 0.6,
                chaos: 0.18,
                speed: 0.45,
                hue: 210,
                rgbOffset: 0.002,
                moireIntensity: 0.12,
                formMix: 1.0
            },
            contact: {
                system: 'quantum',         // Use Quantum System
                preset: 'aurora',
                form: 'fractal',           // Fractal branching patterns
                intensity: 0.55,
                chaos: 0.2,
                speed: 0.5,
                hue: 200,
                rgbOffset: 0.002,
                moireIntensity: 0.15,
                formMix: 1.0
            }
        };
        
        // Interaction multipliers
        this.multipliers = {
            mouseActivity: 1.0,
            scrollVelocity: 1.0,
            cardHover: 1.0,
            timeOfDay: 1.0,
            userEnergy: 1.0
        };
        
        this.lastUpdateTime = performance.now();
        this.lastScrollY = window.pageYOffset;
        this.lastMousePos = { x: 0.5, y: 0.5 };
        
        this.init();
    }
    
    init() {
        this.setupListeners();
        const initialProfile = this.sectionProfiles[this.state.currentSection] || this.sectionProfiles.hero;
        this.updateSectionCss(this.state.currentSection, initialProfile);
        this.startOrchestration();
        console.log('🎭 Visual Orchestrator initialized - pure choreography mode');
    }
    
    setupListeners() {
        // Mouse tracking with velocity
        let mouseTimeout;
        document.addEventListener('mousemove', (e) => {
            const x = e.clientX / window.innerWidth;
            const y = e.clientY / window.innerHeight;
            
            this.state.mouseVelocity.x = Math.abs(x - this.lastMousePos.x);
            this.state.mouseVelocity.y = Math.abs(y - this.lastMousePos.y);
            this.state.mousePos.x = x;
            this.state.mousePos.y = y;
            
            // Increase activity
            this.state.mouseActivity = Math.min(1.0, this.state.mouseActivity + 0.1);
            this.state.userEnergy = Math.min(1.0, this.state.userEnergy + 0.05);
            
            this.lastMousePos = { x, y };
            
            clearTimeout(mouseTimeout);
            mouseTimeout = setTimeout(() => {
                this.state.mouseActivity *= 0.95;
            }, 100);
        }, { passive: true });
        
        // Scroll tracking with velocity
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            
            this.state.scrollVelocity = Math.abs(currentScroll - this.lastScrollY) / 100;
            this.state.scroll = maxScroll > 0 ? currentScroll / maxScroll : 0;
            this.lastScrollY = currentScroll;
            
            // Increase energy during scroll
            this.state.userEnergy = Math.min(1.0, this.state.userEnergy + 0.08);
            
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.state.scrollVelocity *= 0.9;
            }, 100);
        }, { passive: true });
        
        // Card hover detection
        const cardSelectors = [
            '.card',
            '.signal-card',
            '.capability-card',
            '.platform-card',
            '.engagement-steps .step',
            '.legacy-signal',
            '.contact-card',
            '[data-fractal-card]'
        ];
        const cards = new Set();
        cardSelectors.forEach((selector) => {
            document.querySelectorAll(selector).forEach((card) => cards.add(card));
        });

        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                this.state.hoveredCards.add(card);
                this.onCardHover(card, true);
            });
            
            card.addEventListener('mouseleave', () => {
                this.state.hoveredCards.delete(card);
                this.onCardHover(card, false);
            });
        });
        
        // Section observation
        this.observeSections();
        
        // Time of day updates
        setInterval(() => {
            this.state.timeOfDay = this.getTimeOfDay();
        }, 60000); // Every minute
    }
    
    observeSections() {
        const observedSections = new Set(document.querySelectorAll('[data-section]'));

        if (!observedSections.size) {
            document.querySelectorAll('section[id]').forEach((section) => {
                if (!section.dataset.section) {
                    section.dataset.section = section.id;
                }
                observedSections.add(section);
            });
        }

        if (!observedSections.size) {
            console.warn('VisualOrchestrator: no sections found to observe');
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
                    const sectionId = entry.target.dataset.section;
                    if (this.state.currentSection !== sectionId) {
                        this.transitionToSection(sectionId);
                    }
                }
            });
        }, { threshold: [0, 0.25, 0.5, 0.75, 1.0] });

        observedSections.forEach(section => {
            if (!section.dataset.section && section.id) {
                section.dataset.section = section.id;
            }
            observer.observe(section);
        });
    }
    
    transitionToSection(sectionId) {
        console.log(`🎬 Transitioning to section: ${sectionId}`);
        const previousSection = this.state.currentSection;
        this.state.currentSection = sectionId;

        const profile = this.sectionProfiles[sectionId] || this.sectionProfiles.hero;

        // Switch visualizer system if needed
        if (profile.system && profile.system !== this.activeSystem) {
            this.switchVisualizerSystem(profile.system);
        }

        // Set new visual target
        Object.assign(this.visualTarget, profile);
        this.updateSectionCss(sectionId, profile);

        // Manage visualizer lifecycle
        this.manageVisualizerLifecycle(sectionId, previousSection);

        // Dispatch event for other systems
        window.dispatchEvent(new CustomEvent('sectionTransition', {
            detail: { section: sectionId, profile, previousSection }
        }));
    }

    /**
     * Switch between Quantum, Holographic, and Faceted visualizer systems
     */
    switchVisualizerSystem(newSystem) {
        if (!this.systems[newSystem]) {
            console.warn(`⚠️ Visualizer system not found: ${newSystem}`);
            return;
        }

        console.log(`🔄 Switching from ${this.activeSystem} → ${newSystem}`);

        // Deactivate current system
        if (this.systems[this.activeSystem] && this.systems[this.activeSystem].setActive) {
            this.systems[this.activeSystem].setActive(false);
        }

        // Activate new system
        if (this.systems[newSystem] && this.systems[newSystem].setActive) {
            this.systems[newSystem].setActive(true);
        }

        this.activeSystem = newSystem;

        console.log(`✅ System switched to: ${newSystem}`);
    }

    manageVisualizerLifecycle(currentSection, previousSection) {
        // Get CanvasManager reference from window if available
        const canvasManager = window.clearSeasApp?.canvasManager;
        if (!canvasManager) return;

        // Core visualizers always active (polytopal-field, quantum-background)
        const coreCanvases = ['polytopal-field', 'quantum-background'];

        // Section-specific particle networks
        const sectionCanvases = {
            'capabilities': 'particle-capabilities',
            'research': 'particle-research',
            'platforms': 'particle-platforms',
            'engagement': 'particle-engagement',
            'legacy': 'particle-legacy'
        };

        // Deactivate previous section's particles
        if (previousSection && sectionCanvases[previousSection]) {
            const canvasId = sectionCanvases[previousSection];
            canvasManager.setCanvasActive(canvasId, false);
            console.log(`⏸️ Paused: ${canvasId}`);
        }

        // Activate current section's particles
        if (sectionCanvases[currentSection]) {
            const canvasId = sectionCanvases[currentSection];
            canvasManager.setCanvasActive(canvasId, true);
            console.log(`▶️ Activated: ${canvasId}`);
        }
    }
    
    updateSectionCss(sectionId, profile) {
        const body = document.body;
        const root = document.documentElement;
        const sectionEl = document.querySelector(`[data-section="${sectionId}"]`);

        if (this.activeSectionElement && this.activeSectionElement !== sectionEl) {
            this.activeSectionElement.removeAttribute('data-section-active');
            this.activeSectionElement.classList.remove('is-active');
        }

        if (sectionEl) {
            sectionEl.setAttribute('data-section-active', 'true');
            sectionEl.classList.add('is-active');
            this.activeSectionElement = sectionEl;
        }

        if (body) {
            body.dataset.activeSection = sectionId;
            body.dataset.sectionForm = profile.form || 'default';
            body.dataset.sectionPreset = profile.preset || 'default';
        }

        if (root) {
            if (typeof profile.hue === 'number') {
                root.style.setProperty('--section-hue-target', `${profile.hue.toFixed(2)}deg`);
            }
            if (typeof profile.intensity === 'number') {
                root.style.setProperty('--section-intensity-target', profile.intensity.toFixed(4));
            }
        }
    }
    
    onCardHover(card, isEntering) {
        if (isEntering) {
            // Card is being hovered - increase effects
            this.visualTarget.chaos = Math.min(1.0, this.visualTarget.chaos + 0.15);
            this.visualTarget.rgbOffset = Math.min(0.01, this.visualTarget.rgbOffset + 0.003);
            this.visualTarget.moireIntensity = Math.min(1.0, this.visualTarget.moireIntensity + 0.2);
            
            // Trigger card emergence effect
            this.triggerCardEmergence(card);
        } else {
            // Card hover ended - trigger decay
            this.triggerCardDecay(card);
        }
    }
    
    triggerCardEmergence(card) {
        // Dispatch event for card-specific effects
        card.dispatchEvent(new CustomEvent('cardEmerge', {
            detail: {
                intensity: this.state.userEnergy,
                color: this.state.dominantColor
            }
        }));
    }
    
    triggerCardDecay(card) {
        // Dispatch event for card decay effect
        card.dispatchEvent(new CustomEvent('cardDecay', {
            detail: {
                fractalDepth: 3 + Math.floor(this.state.userEnergy * 3),
                color: this.state.dominantColor
            }
        }));
    }
    
    startOrchestration() {
        const update = (timestamp) => {
            const deltaTime = timestamp - this.lastUpdateTime;
            this.lastUpdateTime = timestamp;
            
            // Update session time
            this.state.sessionTime += deltaTime / 1000;
            
            // Calculate multipliers based on current state
            this.calculateMultipliers();
            
            // Apply multipliers to target
            this.applyMultipliers();
            
            // Smooth interpolation toward target
            this.interpolateVisualState(deltaTime);
            
            // Decay user energy over time
            this.state.userEnergy *= 0.998;
            this.state.mouseActivity *= 0.995;
            
            // Broadcast current visual state
            this.broadcastState();
            
            requestAnimationFrame(update);
        };
        
        requestAnimationFrame(update);
    }
    
    calculateMultipliers() {
        // Mouse activity multiplier (0.8 - 1.5)
        this.multipliers.mouseActivity = 0.8 + (this.state.mouseActivity * 0.7);
        
        // Scroll velocity multiplier (0.9 - 1.3)
        this.multipliers.scrollVelocity = 0.9 + (Math.min(this.state.scrollVelocity, 1.0) * 0.4);
        
        // Card hover multiplier (1.0 - 1.8)
        this.multipliers.cardHover = 1.0 + (this.state.hoveredCards.size * 0.4);
        
        // Time of day multiplier (0.7 - 1.2)
        // Morning: calm, Evening: energetic, Night: mysterious
        const tod = this.state.timeOfDay;
        if (tod === 'morning') {
            this.multipliers.timeOfDay = 0.8;
        } else if (tod === 'afternoon') {
            this.multipliers.timeOfDay = 1.0;
        } else if (tod === 'evening') {
            this.multipliers.timeOfDay = 1.2;
        } else {
            this.multipliers.timeOfDay = 0.9;
        }
        
        // User energy multiplier (0.5 - 1.5)
        this.multipliers.userEnergy = 0.5 + (this.state.userEnergy * 1.0);
    }
    
    applyMultipliers() {
        const profile = this.sectionProfiles[this.state.currentSection];
        if (!profile) return;

        // Apply multipliers to create dynamic target
        const avgMultiplier = (
            this.multipliers.mouseActivity +
            this.multipliers.scrollVelocity +
            this.multipliers.cardHover +
            this.multipliers.timeOfDay +
            this.multipliers.userEnergy
        ) / 5;

        // Modulate intensity
        this.visualTarget.intensity = profile.intensity * avgMultiplier;

        // Modulate chaos based on activity + scroll velocity
        this.visualTarget.chaos = profile.chaos * this.multipliers.userEnergy + (this.state.scrollVelocity * 0.2);

        // Modulate speed with micro-reactions to mouse velocity
        const mouseVelMag = Math.sqrt(
            this.state.mouseVelocity.x ** 2 +
            this.state.mouseVelocity.y ** 2
        );
        this.visualTarget.speed = profile.speed * this.multipliers.mouseActivity + (mouseVelMag * 2.5);

        // RGB offset increases with mouse velocity (chromatic aberration sweep)
        this.visualTarget.rgbOffset = profile.rgbOffset + (mouseVelMag * 0.008);

        // Moiré increases with scroll velocity
        this.visualTarget.moireIntensity = profile.moireIntensity + (this.state.scrollVelocity * 0.4);

        // Hue shifts based on mouse position (horizontal sweep)
        const hueShift = (this.state.mousePos.x - 0.5) * 60;
        this.visualTarget.hue = (profile.hue + hueShift + 360) % 360;

        // **NEW: SCROLL-BASED PARAMETER SWEEPS**
        // GridDensity increases with scroll progress (denser as you scroll down)
        this.visualTarget.gridDensity = 10 + (this.state.scroll * 15) + (this.state.userEnergy * 5);

        // MorphFactor oscillates with scroll position and mouse activity
        const scrollOscillation = Math.sin(this.state.scroll * Math.PI * 2) * 0.3;
        this.visualTarget.morphFactor = 1.0 + scrollOscillation + (mouseVelMag * 0.5);

        // **NEW: 4D ROTATION ORBITAL EFFECTS FROM MOUSE**
        // Convert mouse position to orbital rotation (gyroscope-like effect)
        const mouseDeltaX = this.state.mousePos.x - 0.5; // -0.5 to 0.5
        const mouseDeltaY = this.state.mousePos.y - 0.5;

        // XW rotation: horizontal mouse movement creates orbital tilt
        this.visualTarget.rot4dXW = mouseDeltaX * Math.PI * 0.5;

        // YW rotation: vertical mouse movement creates vertical orbital spin
        this.visualTarget.rot4dYW = mouseDeltaY * Math.PI * 0.5;

        // ZW rotation: combined mouse position creates depth rotation
        const mouseDistance = Math.sqrt(mouseDeltaX ** 2 + mouseDeltaY ** 2);
        this.visualTarget.rot4dZW = mouseDistance * Math.PI * 0.3;

        // **NEW: BOUNDARY MORPHING WITH CARD HOVER**
        if (this.state.hoveredCards.size > 0) {
            // Cards hovered: spawn more density, increase morph
            this.visualTarget.gridDensity += this.state.hoveredCards.size * 8;
            this.visualTarget.morphFactor += this.state.hoveredCards.size * 0.3;
            this.visualTarget.chaos += this.state.hoveredCards.size * 0.15;
        }

        this.state.dominantColor = {
            h: this.visualTarget.hue,
            s: 0.8 + (mouseVelMag * 0.15), // Saturation increases with movement
            v: 0.9
        };

        // Clamp all values
        this.visualTarget.intensity = Math.min(1.0, this.visualTarget.intensity);
        this.visualTarget.chaos = Math.min(1.0, this.visualTarget.chaos);
        this.visualTarget.speed = Math.min(3.0, this.visualTarget.speed);
        this.visualTarget.rgbOffset = Math.min(0.02, this.visualTarget.rgbOffset);
        this.visualTarget.moireIntensity = Math.min(1.0, this.visualTarget.moireIntensity);
        this.visualTarget.gridDensity = Math.min(50, Math.max(5, this.visualTarget.gridDensity));
        this.visualTarget.morphFactor = Math.min(2.5, Math.max(0.5, this.visualTarget.morphFactor));

        // Clamp 4D rotations
        this.visualTarget.rot4dXW = Math.max(-Math.PI, Math.min(Math.PI, this.visualTarget.rot4dXW));
        this.visualTarget.rot4dYW = Math.max(-Math.PI, Math.min(Math.PI, this.visualTarget.rot4dYW));
        this.visualTarget.rot4dZW = Math.max(-Math.PI, Math.min(Math.PI, this.visualTarget.rot4dZW));
    }
    
    interpolateVisualState(deltaTime) {
        // Smooth interpolation speed (slower = smoother)
        const lerpSpeed = 0.001 * deltaTime;
        
        Object.keys(this.visualTarget).forEach(key => {
            if (typeof this.visualTarget[key] === 'number') {
                const current = this.visualState[key];
                const target = this.visualTarget[key];
                this.visualState[key] = current + (target - current) * lerpSpeed;
            }
        });
    }
    
    broadcastState() {
        const root = document.documentElement;
        if (root) {
            root.style.setProperty('--visual-intensity', this.visualState.intensity.toFixed(4));
            root.style.setProperty('--visual-chaos', this.visualState.chaos.toFixed(4));
            root.style.setProperty('--visual-speed', this.visualState.speed.toFixed(4));
            root.style.setProperty('--visual-hue', `${this.visualState.hue.toFixed(2)}deg`);
            root.style.setProperty('--visual-rgb-offset', this.visualState.rgbOffset.toFixed(4));
            root.style.setProperty('--visual-moire', this.visualState.moireIntensity.toFixed(4));
            root.style.setProperty('--visual-energy', this.state.userEnergy.toFixed(4));
            root.style.setProperty('--scroll-velocity', this.state.scrollVelocity.toFixed(4));

            // NEW: Scroll-based parameter sweeps
            root.style.setProperty('--visual-grid-density', this.visualState.gridDensity.toFixed(2));
            root.style.setProperty('--visual-morph-factor', this.visualState.morphFactor.toFixed(4));

            // NEW: 4D rotation orbital effects
            root.style.setProperty('--visual-rot4d-xw', this.visualState.rot4dXW.toFixed(4));
            root.style.setProperty('--visual-rot4d-yw', this.visualState.rot4dYW.toFixed(4));
            root.style.setProperty('--visual-rot4d-zw', this.visualState.rot4dZW.toFixed(4));
        }

        // Dispatch event with current visual state (visualizers listen to this)
        window.dispatchEvent(new CustomEvent('visualStateUpdate', {
            detail: {
                state: {
                    ...this.visualState,
                    // Include active system info
                    activeSystem: this.activeSystem
                },
                multipliers: { ...this.multipliers },
                context: {
                    section: this.state.currentSection,
                    scroll: this.state.scroll,
                    userEnergy: this.state.userEnergy,
                    mouseActivity: this.state.mouseActivity,
                    mousePos: this.state.mousePos,
                    scrollVelocity: this.state.scrollVelocity
                }
            }
        }));

        // Send parameters directly to active visualizer system
        if (this.systems[this.activeSystem] && this.systems[this.activeSystem].updateParameter) {
            const params = {
                gridDensity: this.visualState.gridDensity,
                morphFactor: this.visualState.morphFactor,
                chaos: this.visualState.chaos,
                speed: this.visualState.speed,
                hue: this.visualState.hue,
                intensity: this.visualState.intensity,
                rot4dXW: this.visualState.rot4dXW,
                rot4dYW: this.visualState.rot4dYW,
                rot4dZW: this.visualState.rot4dZW,
                rgbOffset: this.visualState.rgbOffset,
                moireIntensity: this.visualState.moireIntensity
            };

            // Send all parameters to active system
            Object.entries(params).forEach(([param, value]) => {
                this.systems[this.activeSystem].updateParameter(param, value);
            });
        }
    }
    
    getTimeOfDay() {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 17) return 'afternoon';
        if (hour >= 17 && hour < 21) return 'evening';
        return 'night';
    }
    
    // Public API for manual influence (rare cases)
    pulse(intensity = 0.3) {
        this.state.userEnergy = Math.min(1.0, this.state.userEnergy + intensity);
    }
    
    getState() {
        return {
            visual: { ...this.visualState },
            user: { ...this.state },
            multipliers: { ...this.multipliers }
        };
    }
}
