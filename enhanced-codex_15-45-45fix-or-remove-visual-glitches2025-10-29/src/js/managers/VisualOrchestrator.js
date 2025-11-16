/**
 * VISUAL ORCHESTRATOR
 * The brain of the entire visual system - choreographs all effects based on context
 * NO MANUAL CONTROLS - pure emergent behavior
 */

export class VisualOrchestrator {
    constructor(canvasManager) {
        this.manager = canvasManager;
        
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
        
        this.heroState = {
            progress: 0,
            focus: 0,
            baseFocus: 0,
            pointerFocus: 0,
            pointerShift: 0,
            energy: 0,
            instability: 0,
            density: 1,
            stability: 1,
            zoom: 0,
            presetHint: 'stable'
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
            fractalDecay: 0.0
        };
        
        // Current visual state (smooth interpolation)
        this.visualState = { ...this.visualTarget };

        this.restingState = {
            energy: 0.18,
            mouseActivity: 0.02
        };

        // Smoothed interaction dynamics for calmer transitions
        this.dynamics = {
            mouseVelocity: 0,
            scrollVelocity: 0,
            hover: 0,
            energy: this.state.userEnergy,
            rgbOffset: this.visualTarget.rgbOffset,
            moire: this.visualTarget.moireIntensity
        };

        this.broadcastControl = {
            interval: 33, // cap broadcasts to ~30fps unless significant changes occur
            dynamicInterval: 33,
            elapsed: 0,
            idleElapsed: 0,
            maxInterval: 260,
            lastPayload: null,
            thresholds: {
                state: {
                    intensity: 0.004,
                    chaos: 0.004,
                    speed: 0.004,
                    hue: 1,
                    rgbOffset: 0.0003,
                    moireIntensity: 0.004,
                    fractalDecay: 0.004
                },
                multipliers: {
                    mouseActivity: 0.02,
                    scrollVelocity: 0.02,
                    cardHover: 0.05,
                    timeOfDay: 0.1,
                    userEnergy: 0.015
                },
                context: {
                    scroll: 0.004,
                    userEnergy: 0.02,
                    mouseActivity: 0.02,
                    scrollVelocity: 0.02,
                    hoveredCards: 1,
                    heroProgress: 0.01,
                    heroFocus: 0.015,
                    heroEnergy: 0.015,
                    heroInstability: 0.02,
                    heroPointerShift: 1.2
                }
            }
        };

        this.broadcastBuffers = {
            payload: {
                state: {},
                multipliers: {},
                context: {}
            },
            last: {
                state: {},
                multipliers: {},
                context: {}
            },
            detail: {
                state: {},
                multipliers: {},
                context: {}
            }
        };

        this.broadcastContextKeySet = {
            section: true,
            scroll: true,
            userEnergy: true,
            mouseActivity: true,
            scrollVelocity: true,
            hoveredCards: true,
            heroProgress: true,
            heroFocus: true,
            heroEnergy: true,
            heroInstability: true,
            heroPreset: true,
            heroPointerShift: true
        };

        this.dynamicColorState = {
            hue: this.visualTarget.hue,
            saturation: 0.75,
            value: 0.88,
            targetHue: this.visualTarget.hue,
            targetSaturation: 0.75,
            targetValue: 0.88
        };

        this.heroEventHandler = null;

        // Section-based visual profiles WITH FORMS
        this.sectionProfiles = {
            hero: {
                preset: 'quantum',
                form: 'lattice',           // Quantum 4D lattice structure
                intensity: 0.6,
                chaos: 0.15,
                speed: 0.5,
                hue: 180,
                rgbOffset: 0.0005,
                moireIntensity: 0.05,
                formMix: 1.0
            },
            signals: {
                preset: 'neural',
                form: 'wave',              // Flowing wave patterns
                intensity: 0.75,
                chaos: 0.4,
                speed: 0.8,
                hue: 280,
                rgbOffset: 0.0008,
                moireIntensity: 0.12,
                formMix: 1.0
            },
            capabilities: {
                preset: 'crystal',
                form: 'crystal',           // Sharp crystalline structures
                intensity: 0.65,
                chaos: 0.1,
                speed: 0.4,
                hue: 200,
                rgbOffset: 0.0004,
                moireIntensity: 0.04,
                formMix: 1.0
            },
            research: {
                preset: 'cosmic',
                form: 'nebula',            // Organic nebula clouds
                intensity: 0.7,
                chaos: 0.3,
                speed: 0.6,
                hue: 240,
                rgbOffset: 0.0006,
                moireIntensity: 0.08,
                formMix: 1.0
            },
            platforms: {
                preset: 'cyber',
                form: 'vortex',            // Swirling vortex/spiral
                intensity: 0.8,
                chaos: 0.25,
                speed: 0.7,
                hue: 160,
                rgbOffset: 0.0008,
                moireIntensity: 0.1,
                formMix: 1.0
            },
            contact: {
                preset: 'aurora',
                form: 'fractal',           // Fractal branching patterns
                intensity: 0.55,
                chaos: 0.2,
                speed: 0.5,
                hue: 200,
                rgbOffset: 0.0005,
                moireIntensity: 0.06,
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
        document.querySelectorAll('.card, .signal-card').forEach(card => {
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

        const handleHeroChoreography = (event) => {
            if (!event) return;
            this.ingestHeroState(event.detail);
        };

        window.addEventListener('hero:choreography', handleHeroChoreography);
        this.heroEventHandler = handleHeroChoreography;
    }
    
    observeSections() {
        const sections = document.querySelectorAll('[data-section]');
        
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
        
        sections.forEach(section => observer.observe(section));
    }
    
    transitionToSection(sectionId) {
        console.log(`🎬 Transitioning to section: ${sectionId}`);
        this.state.currentSection = sectionId;
        
        const profile = this.sectionProfiles[sectionId] || this.sectionProfiles.hero;
        
        // Set new visual target
        Object.assign(this.visualTarget, profile);
        
        // Dispatch event for other systems
        window.dispatchEvent(new CustomEvent('sectionTransition', {
            detail: { section: sectionId, profile }
        }));
    }
    
    onCardHover(card, isEntering) {
        if (isEntering) {
            // Card is being hovered - increase effects
            this.visualTarget.chaos = Math.min(1.0, this.visualTarget.chaos + 0.12);
            this.visualTarget.rgbOffset = Math.min(0.005, this.visualTarget.rgbOffset + 0.0006);
            this.visualTarget.moireIntensity = Math.min(0.32, this.visualTarget.moireIntensity + 0.04);

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
            let deltaTime = timestamp - this.lastUpdateTime;
            if (!Number.isFinite(deltaTime) || deltaTime <= 0) {
                deltaTime = 16;
            } else {
                deltaTime = Math.min(deltaTime, 48);
            }
            this.lastUpdateTime = timestamp;

            if (typeof document !== 'undefined' && document.hidden) {
                requestAnimationFrame(update);
                return;
            }

            // Update session time
            this.state.sessionTime += deltaTime / 1000;

            // Smooth out raw interaction data for calmer visuals
            this.updateDynamics(deltaTime);

            // Calculate multipliers based on current state
            this.calculateMultipliers();

            // Apply multipliers to target
            this.applyMultipliers();

            // Smooth interpolation toward target
            this.interpolateVisualState(deltaTime);

            // Decay user energy over time using frame-rate independent easing toward resting values
            const energyDecay = Math.exp(-deltaTime / 9000);
            const activityDecay = Math.exp(-deltaTime / 2600);

            this.state.userEnergy = this.restingState.energy +
                (this.state.userEnergy - this.restingState.energy) * energyDecay;
            this.state.userEnergy = Math.min(1, Math.max(0, this.state.userEnergy));

            this.state.mouseActivity = this.restingState.mouseActivity +
                (this.state.mouseActivity - this.restingState.mouseActivity) * activityDecay;
            this.state.mouseActivity = Math.min(1, Math.max(0, this.state.mouseActivity));

            // Broadcast current visual state
            this.broadcastState(deltaTime);

            requestAnimationFrame(update);
        };

        requestAnimationFrame(update);
    }

    updateDynamics(deltaTime) {
        const smoothing = 1 - Math.exp(-deltaTime / 200);

        const mouseVelMag = Math.sqrt(
            this.state.mouseVelocity.x ** 2 +
            this.state.mouseVelocity.y ** 2
        );

        this.dynamics.mouseVelocity += (mouseVelMag - this.dynamics.mouseVelocity) * smoothing;
        this.dynamics.scrollVelocity += (this.state.scrollVelocity - this.dynamics.scrollVelocity) * smoothing;
        this.dynamics.hover += ((this.state.hoveredCards.size || 0) - this.dynamics.hover) * smoothing;
        this.dynamics.energy += (this.state.userEnergy - this.dynamics.energy) * smoothing;
        this.dynamics.rgbOffset += (this.visualTarget.rgbOffset - this.dynamics.rgbOffset) * smoothing;
        this.dynamics.moire += (this.visualTarget.moireIntensity - this.dynamics.moire) * smoothing;
    }

    calculateMultipliers() {
        const mouseEnergy = Math.min(1, (this.state.mouseActivity * 0.55) + (this.dynamics.mouseVelocity * 2.2));
        this.multipliers.mouseActivity = 0.85 + (mouseEnergy * 0.6);

        const scrollMomentum = Math.min(1.1, this.dynamics.scrollVelocity);
        this.multipliers.scrollVelocity = 0.92 + (scrollMomentum * 0.35);

        const hoverEnergy = Math.min(1.4, this.dynamics.hover * 0.45);
        this.multipliers.cardHover = 1.0 + hoverEnergy;

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
        this.multipliers.userEnergy = 0.55 + (this.dynamics.energy * 0.9);
    }

    applyMultipliers() {
        const profile = this.sectionProfiles[this.state.currentSection];
        if (!profile) return;

        const heroEnergy = Math.max(0, Math.min(1, this.heroState.energy));
        const heroFocus = Math.max(0, Math.min(1, this.heroState.focus));
        const heroInstability = Math.max(0, Math.min(1, this.heroState.instability));

        const combinedEnergy = Math.max(0, Math.min(1, (this.state.userEnergy * 0.6) + (heroEnergy * 0.4)));
        const userEnergyBoost = Math.max(0, this.multipliers.userEnergy - 0.55);
        const heroEnergyBoost = Math.max(0, combinedEnergy - 0.55);

        // Modulate intensity with energy while preserving base profile balance
        this.visualTarget.intensity = profile.intensity + (userEnergyBoost * 0.6) + (heroEnergyBoost * 0.45);

        // Modulate chaos and speed using smoothed activity blended with hero instability
        const chaosBoost = Math.min(0.8,
            (this.dynamics.mouseVelocity * 0.4) +
            (this.dynamics.hover * 0.15) +
            (heroInstability * 0.25)
        );
        this.visualTarget.chaos = profile.chaos + chaosBoost;

        const speedBoost = Math.min(0.9,
            (this.dynamics.mouseVelocity * 0.45) +
            (this.dynamics.scrollVelocity * 0.35) +
            (heroEnergy * 0.25)
        );
        this.visualTarget.speed = profile.speed + speedBoost;

        // RGB offset increases with mouse velocity, hover energy, and hero focus but remains subtle
        const hoverRgb = Math.min(0.0014, (this.dynamics.hover * 0.0006) + (heroFocus * 0.0004));
        const desiredRgbOffset = profile.rgbOffset + (this.dynamics.mouseVelocity * 0.0012) + hoverRgb;
        this.visualTarget.rgbOffset = (desiredRgbOffset * 0.75) + (this.dynamics.rgbOffset * 0.25);

        // Moiré responds to scroll momentum, energy, hover focus, and hero instability
        const moireFromScroll = this.dynamics.scrollVelocity * 0.1;
        const moireFromEnergy = heroEnergyBoost * 0.25;
        const moireFromHover = Math.min(0.1, (this.dynamics.hover * 0.03) + (heroFocus * 0.05));
        const moireFromInstability = heroInstability * 0.06;
        const desiredMoire = profile.moireIntensity + moireFromScroll + moireFromEnergy + moireFromHover + moireFromInstability;
        this.visualTarget.moireIntensity = (desiredMoire * 0.7) + (this.dynamics.moire * 0.3);

        // Hue shifts slightly based on mouse position with hero preset bias
        const hueShift = (this.state.mousePos.x - 0.5) * 40 + this.resolveHeroHueBias();
        this.visualTarget.hue = (profile.hue + hueShift + 360) % 360;

        this.dynamicColorState.targetHue = this.visualTarget.hue;
        this.dynamicColorState.targetSaturation = Math.min(1,
            0.66 + combinedEnergy * 0.22 + heroFocus * 0.12 + this.dynamics.hover * 0.08
        );
        this.dynamicColorState.targetValue = Math.min(1,
            0.58 + combinedEnergy * 0.3 + this.dynamics.scrollVelocity * 0.12
        );

        // Clamp all values
        this.visualTarget.intensity = Math.min(1.0, Math.max(0.2, this.visualTarget.intensity));
        this.visualTarget.chaos = Math.min(1.0, Math.max(0, this.visualTarget.chaos));
        this.visualTarget.speed = Math.min(2.0, Math.max(0.1, this.visualTarget.speed));
        this.visualTarget.rgbOffset = Math.min(0.006, Math.max(0, this.visualTarget.rgbOffset));
        this.visualTarget.moireIntensity = Math.min(0.38, Math.max(0, this.visualTarget.moireIntensity));
    }

    ingestHeroState(detail = {}) {
        const hero = detail?.state || detail;
        if (!hero || typeof hero !== 'object') {
            return;
        }

        const clamp01 = (value, fallback = 0) => {
            if (!Number.isFinite(value)) {
                return fallback;
            }
            if (value <= 0) return 0;
            if (value >= 1) return 1;
            return value;
        };

        const lerp = (current, next, alpha) => current + (next - current) * alpha;

        const easing = 0.28;

        if (typeof hero.progress === 'number') {
            const progress = clamp01(hero.progress, this.heroState.progress);
            this.heroState.progress = lerp(this.heroState.progress, progress, easing);
        }

        if (typeof hero.focus === 'number') {
            const focus = clamp01(hero.focus, this.heroState.focus);
            this.heroState.focus = lerp(this.heroState.focus, focus, easing);
        }

        if (typeof hero.baseFocus === 'number') {
            const baseFocus = clamp01(hero.baseFocus, this.heroState.baseFocus);
            this.heroState.baseFocus = lerp(this.heroState.baseFocus, baseFocus, easing);
        }

        if (typeof hero.pointerFocus === 'number') {
            const pointerFocus = clamp01(hero.pointerFocus, this.heroState.pointerFocus);
            this.heroState.pointerFocus = lerp(this.heroState.pointerFocus, pointerFocus, easing);
        }

        if (typeof hero.pointerShift === 'number' && Number.isFinite(hero.pointerShift)) {
            this.heroState.pointerShift = lerp(this.heroState.pointerShift, hero.pointerShift, 0.24);
        }

        if (typeof hero.energy === 'number') {
            const energy = clamp01(hero.energy, this.heroState.energy);
            this.heroState.energy = lerp(this.heroState.energy, energy, 0.32);
        }

        if (typeof hero.instability === 'number') {
            const instability = clamp01(hero.instability, this.heroState.instability);
            this.heroState.instability = lerp(this.heroState.instability, instability, 0.34);
        }

        if (typeof hero.density === 'number') {
            this.heroState.density = lerp(this.heroState.density, hero.density, 0.25);
        }

        if (typeof hero.stability === 'number') {
            this.heroState.stability = lerp(this.heroState.stability, hero.stability, 0.25);
        }

        if (typeof hero.zoom === 'number') {
            this.heroState.zoom = lerp(this.heroState.zoom, hero.zoom, 0.25);
        }

        if (typeof hero.presetHint === 'string' && hero.presetHint) {
            this.heroState.presetHint = hero.presetHint;
        }

        const combinedEnergy = clamp01((this.state.userEnergy * 0.55) + (this.heroState.energy * 0.45), this.state.userEnergy);
        this.state.userEnergy = combinedEnergy;

        const pointerActivity = clamp01(this.heroState.pointerFocus * 0.6 + this.heroState.focus * 0.2, 0);
        if (pointerActivity > this.state.mouseActivity) {
            this.state.mouseActivity = pointerActivity;
        }

        this.dynamicColorState.targetHue = (this.visualTarget.hue + this.resolveHeroHueBias() + 360) % 360;
        this.dynamicColorState.targetSaturation = Math.min(1, 0.68 + combinedEnergy * 0.25 + this.heroState.focus * 0.12);
        this.dynamicColorState.targetValue = Math.min(1, 0.58 + combinedEnergy * 0.34);
    }

    resolveHeroHueBias() {
        const hint = this.heroState.presetHint;
        switch (hint) {
            case 'surge':
                return -18;
            case 'focus':
                return 26;
            case 'unstable':
                return -24;
            case 'disperse':
                return 18;
            default:
                return 0;
        }
    }

    interpolateVisualState(deltaTime) {
        // Frame-rate independent smoothing using exponential easing toward the target state
        const smoothing = Math.min(1, 1 - Math.exp(-deltaTime / 220));

        Object.keys(this.visualTarget).forEach(key => {
            const target = this.visualTarget[key];
            if (typeof target === 'number') {
                const current = this.visualState[key] ?? target;
                this.visualState[key] = current + (target - current) * smoothing;
            } else if (target !== undefined) {
                this.visualState[key] = target;
            }
        });

        Object.keys(this.visualState).forEach(key => {
            if (!(key in this.visualTarget)) {
                delete this.visualState[key];
            }
        });

        this.updateDominantColor(deltaTime);
    }

    broadcastState(deltaTime = 16) {
        const control = this.broadcastControl;
        control.elapsed += deltaTime;
        control.idleElapsed += deltaTime;

        if (!Number.isFinite(control.dynamicInterval)) {
            control.dynamicInterval = control.interval;
        } else {
            const relaxFactor = Math.exp(-deltaTime / 120);
            control.dynamicInterval = control.interval +
                (control.dynamicInterval - control.interval) * relaxFactor;
        }

        const payload = this.composeBroadcastPayload();
        const changeMagnitude = this.measureBroadcastChange(payload);
        const significantChange = !Number.isFinite(changeMagnitude) || changeMagnitude >= 1;
        const urgency = !Number.isFinite(changeMagnitude)
            ? 1
            : Math.min(1, Math.max(0, changeMagnitude));

        if (urgency > 0) {
            const targetInterval = Math.max(16, control.interval - (control.interval - 16) * urgency * 0.9);
            control.dynamicInterval += (targetInterval - control.dynamicInterval) * 0.6;
        }

        const meetsInterval = control.elapsed >= control.dynamicInterval;
        const needsIdleUpdate = control.idleElapsed >= control.maxInterval;

        if (!significantChange) {
            if (!needsIdleUpdate) {
                if (!meetsInterval) {
                    return;
                }
                control.elapsed = Math.min(control.elapsed, control.dynamicInterval);
                return;
            }
            if (!meetsInterval) {
                return;
            }
        }

        this.dispatchBroadcast(payload);
        control.elapsed = 0;
        if (significantChange || needsIdleUpdate) {
            control.idleElapsed = 0;
        }
        control.lastPayload = this.cloneBroadcastPayload(payload);
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

    composeBroadcastPayload() {
        const payload = this.broadcastBuffers.payload;

        this.copyBroadcastSection(payload.state, this.visualState);
        this.copyBroadcastSection(payload.multipliers, this.multipliers);

        const context = payload.context;
        context.section = this.state.currentSection;
        context.scroll = this.state.scroll;
        context.userEnergy = this.state.userEnergy;
        context.mouseActivity = this.state.mouseActivity;
        context.scrollVelocity = this.state.scrollVelocity;
        context.hoveredCards = this.state.hoveredCards.size;
        context.heroProgress = this.heroState.progress;
        context.heroFocus = this.heroState.focus;
        context.heroEnergy = this.heroState.energy;
        context.heroInstability = this.heroState.instability;
        context.heroPreset = this.heroState.presetHint;
        context.heroPointerShift = this.heroState.pointerShift;

        for (const key in context) {
            if (!this.broadcastContextKeySet[key]) {
                delete context[key];
            }
        }

        return payload;
    }

    cloneBroadcastPayload(payload) {
        const clone = this.broadcastBuffers.last;
        this.copyBroadcastSection(clone.state, payload.state);
        this.copyBroadcastSection(clone.multipliers, payload.multipliers);
        this.copyBroadcastSection(clone.context, payload.context);
        return clone;
    }

    copyBroadcastSection(target, source) {
        for (const key in target) {
            if (!(key in source)) {
                delete target[key];
            }
        }
        for (const key in source) {
            target[key] = source[key];
        }
        return target;
    }

    measureBroadcastChange(payload) {
        const control = this.broadcastControl;
        const last = control.lastPayload;
        if (!last) {
            return Infinity;
        }

        const thresholds = control.thresholds;
        let maxRatio = 0;

        maxRatio = Math.max(maxRatio, this.evaluateBroadcastSection(
            payload.state,
            last.state,
            thresholds.state
        ));

        if (maxRatio === Infinity) {
            return Infinity;
        }

        maxRatio = Math.max(maxRatio, this.evaluateBroadcastSection(
            payload.multipliers,
            last.multipliers,
            thresholds.multipliers
        ));

        if (maxRatio === Infinity) {
            return Infinity;
        }

        maxRatio = Math.max(maxRatio, this.evaluateBroadcastSection(
            payload.context,
            last.context,
            thresholds.context
        ));

        return maxRatio;
    }

    evaluateBroadcastSection(next, prev, thresholds = {}) {
        let maxRatio = 0;
        const seen = Object.create(null);

        for (const key in next) {
            const nextValue = next[key];
            const prevValue = prev[key];
            seen[key] = true;

            if (typeof nextValue === 'number' && typeof prevValue === 'number') {
                const epsilon = thresholds[key] ?? 0.001;
                const delta = Math.abs(nextValue - prevValue);
                if (delta === 0) {
                    continue;
                }
                if (epsilon <= 0) {
                    return delta > 0 ? Infinity : maxRatio;
                }
                const ratio = delta / epsilon;
                if (ratio > maxRatio) {
                    maxRatio = ratio;
                }
            } else if (nextValue !== prevValue) {
                return Infinity;
            }
        }

        for (const key in prev) {
            if (!seen[key] && prev[key] !== undefined) {
                return Infinity;
            }
        }

        return maxRatio;
    }

    dispatchBroadcast(payload) {
        const detailBuffers = this.broadcastBuffers.detail;
        this.copyBroadcastSection(detailBuffers.state, payload.state);
        this.copyBroadcastSection(detailBuffers.multipliers, payload.multipliers);
        this.copyBroadcastSection(detailBuffers.context, payload.context);

        window.dispatchEvent(new CustomEvent('visualStateUpdate', {
            detail: {
                state: { ...detailBuffers.state },
                multipliers: { ...detailBuffers.multipliers },
                context: { ...detailBuffers.context }
            }
        }));
    }

    updateDominantColor(deltaTime = 16) {
        const easing = 1 - Math.exp(-deltaTime / 480);
        const color = this.dynamicColorState;

        const hueDelta = this.wrapHueDelta(color.targetHue, color.hue);
        color.hue = (color.hue + hueDelta * easing + 360) % 360;
        color.saturation += (color.targetSaturation - color.saturation) * easing;
        color.value += (color.targetValue - color.value) * easing;

        this.state.dominantColor = {
            h: color.hue,
            s: Math.min(1, Math.max(0, color.saturation)),
            v: Math.min(1, Math.max(0, color.value))
        };
    }

    wrapHueDelta(target, current) {
        let delta = target - current;
        if (!Number.isFinite(delta)) {
            return 0;
        }
        delta = ((delta + 540) % 360) - 180;
        return delta;
    }
}
