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
                    sectionDepth: 0.05,
                    userEnergy: 0.02,
                    mouseActivity: 0.02,
                    scrollVelocity: 0.02,
                    hoveredCards: 1
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
            sectionDepth: true,
            scroll: true,
            userEnergy: true,
            mouseActivity: true,
            scrollVelocity: true,
            hoveredCards: true
        };

        this.sectionProfileAliases = {
            products: 'products',
            platforms: 'products',
            research: 'research',
            'research-programs': 'research',
            engagement: 'contact',
            legacy: 'contact',
            contact: 'contact'
        };

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
            products: {
                preset: 'cyber',
                form: 'vortex',            // Swirling vortex/spiral
                intensity: 0.72,
                chaos: 0.22,
                speed: 0.65,
                hue: 170,
                rgbOffset: 0.0007,
                moireIntensity: 0.09,
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
            contact: {
                preset: 'aurora',
                form: 'fractal',           // Fractal branching patterns
                intensity: 0.58,
                chaos: 0.18,
                speed: 0.48,
                hue: 205,
                rgbOffset: 0.0005,
                moireIntensity: 0.06,
                formMix: 1.0
            }
        };

        this.sectionRatios = new Map();

        this.cardSelectors = [
            '[data-visualizer-card]',
            '.signal-card',
            '.capability-card',
            '.platform-card',
            '.research-card',
            '.engagement-card',
            '.legacy-card',
            '.contact-card',
            '.vcodex-neoskeu-card'
        ];

        this.attachedCards = new WeakSet();

        this.scrollMetrics = {
            velocity: 0,
            lastY: window.pageYOffset,
            lastTime: performance.now()
        };

        this.mouseMetrics = {
            velocity: 0,
            lastPos: { ...this.lastMousePos },
            lastTime: performance.now()
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
        this.setupPointerTracking();
        this.setupScrollTracking();
        this.setupCardTracking();
        this.observeSections();
        this.scheduleTimeOfDayUpdates();
    }

    setupPointerTracking() {
        const handlePointerMove = (event) => {
            if (!event) {
                return;
            }

            const clientX = event.clientX ?? (event.touches ? event.touches[0]?.clientX : null);
            const clientY = event.clientY ?? (event.touches ? event.touches[0]?.clientY : null);

            if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) {
                return;
            }

            const width = Math.max(1, window.innerWidth || 1);
            const height = Math.max(1, window.innerHeight || 1);

            const x = clientX / width;
            const y = clientY / height;

            const now = performance.now();
            const lastPos = this.mouseMetrics.lastPos;
            const dt = Math.max(16, now - this.mouseMetrics.lastTime);

            const deltaX = x - lastPos.x;
            const deltaY = y - lastPos.y;
            const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
            const normalizedDelta = distance * (16 / dt);

            const blendedVelocity = (normalizedDelta * 1.3) + (this.mouseMetrics.velocity * 0.45);

            this.mouseMetrics.velocity = Math.min(2.2, blendedVelocity);
            this.mouseMetrics.lastPos = { x, y };
            this.mouseMetrics.lastTime = now;

            this.state.mouseVelocity.x = deltaX * (16 / dt);
            this.state.mouseVelocity.y = deltaY * (16 / dt);
            this.state.mousePos.x = x;
            this.state.mousePos.y = y;

            const activityGain = Math.min(0.18, normalizedDelta * 0.6);
            const energyGain = Math.min(0.14, normalizedDelta * 0.35);

            this.state.mouseActivity = Math.min(1, this.state.mouseActivity + activityGain);
            this.state.userEnergy = Math.min(1, this.state.userEnergy + energyGain);
        };

        window.addEventListener('pointermove', handlePointerMove, { passive: true });
        window.addEventListener('touchmove', handlePointerMove, { passive: true });
    }

    setupScrollTracking() {
        const updateScrollState = () => {
            const currentScroll = window.pageYOffset || document.documentElement.scrollTop || 0;
            const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);

            this.state.scroll = maxScroll > 0 ? Math.min(1, Math.max(0, currentScroll / maxScroll)) : 0;

            const now = performance.now();
            const dt = Math.max(16, now - this.scrollMetrics.lastTime);
            const delta = currentScroll - this.scrollMetrics.lastY;
            const normalizedDelta = (delta / Math.max(1, window.innerHeight)) * (16 / dt);
            const magnitude = Math.abs(normalizedDelta);
            const velocity = (magnitude * 1.4) + (this.scrollMetrics.velocity * 0.35);

            this.scrollMetrics.velocity = Math.min(2.8, velocity);
            this.scrollMetrics.lastY = currentScroll;
            this.scrollMetrics.lastTime = now;
            this.state.scrollVelocity = this.scrollMetrics.velocity;

            this.state.userEnergy = Math.min(1, this.state.userEnergy + Math.min(0.2, magnitude * 0.4));
        };

        window.addEventListener('scroll', updateScrollState, { passive: true });
        updateScrollState();
    }

    setupCardTracking() {
        const selector = this.cardSelectors.join(',');
        const registerCard = (card) => {
            if (!card || this.attachedCards.has(card)) {
                return;
            }

            const handleEnter = () => {
                this.state.hoveredCards.add(card);
                this.onCardHover(card, true);
            };

            const handleLeave = () => {
                this.state.hoveredCards.delete(card);
                this.onCardHover(card, false);
            };

            card.addEventListener('mouseenter', handleEnter);
            card.addEventListener('mouseleave', handleLeave);

            this.attachedCards.add(card);
        };

        const scan = () => {
            document.querySelectorAll(selector).forEach(registerCard);
        };

        scan();

        if (typeof MutationObserver === 'function') {
            const observer = new MutationObserver(() => {
                scan();
            });

            observer.observe(document.body, { childList: true, subtree: true });
            this.cardObserver = observer;
        }
    }

    scheduleTimeOfDayUpdates() {
        this.state.timeOfDay = this.getTimeOfDay();
        if (this.timeOfDayInterval) {
            clearInterval(this.timeOfDayInterval);
        }
        this.timeOfDayInterval = setInterval(() => {
            this.state.timeOfDay = this.getTimeOfDay();
        }, 60000);
    }
    
    observeSections() {
        const selector = '[data-scroll-scene], [data-section], section[id]';
        const nodes = Array.from(document.querySelectorAll(selector));
        const sections = nodes.filter((element) => this.resolveSectionId(element));

        if (sections.length === 0) {
            return;
        }

        if (this.sectionObserver) {
            this.sectionObserver.disconnect();
        }

        const observer = new IntersectionObserver((entries) => {
            let didUpdate = false;

            entries.forEach((entry) => {
                const sectionId = this.resolveSectionId(entry.target);
                if (!sectionId) {
                    return;
                }

                const ratio = entry.isIntersecting ? entry.intersectionRatio : 0;

                if (ratio > 0) {
                    this.sectionRatios.set(sectionId, ratio);
                } else {
                    this.sectionRatios.delete(sectionId);
                }

                if (sectionId === this.state.currentSection) {
                    this.state.sectionDepth = ratio;
                }

                didUpdate = true;
            });

            if (didUpdate) {
                this.refreshActiveSection();
            }
        }, { threshold: [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1] });

        sections.forEach((section) => observer.observe(section));
        this.sectionObserver = observer;

        this.sectionRatios.clear();
        sections.forEach((section) => {
            const sectionId = this.resolveSectionId(section);
            if (!sectionId) {
                return;
            }

            if (typeof section.getBoundingClientRect !== 'function') {
                if (!this.sectionRatios.has(sectionId)) {
                    this.sectionRatios.set(sectionId, sectionId === 'hero' ? 1 : 0);
                }
                return;
            }

            const rect = section.getBoundingClientRect();
            const viewportHeight = Math.max(1, window.innerHeight || 1);
            const visibleHeight = Math.max(0, Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0));
            const ratio = Math.max(0, Math.min(1, visibleHeight / Math.max(rect.height, 1)));

            if (ratio > 0) {
                this.sectionRatios.set(sectionId, ratio);
            }
        });

        this.refreshActiveSection(true);
    }

    resolveSectionId(element) {
        if (!element) {
            return null;
        }
        if (element.id) {
            return element.id;
        }
        const dataset = element.dataset || {};
        if (dataset.section) {
            return dataset.section;
        }
        if (dataset.scrollScene) {
            return dataset.scrollScene;
        }
        return null;
    }

    getSectionProfileKey(sectionId) {
        if (!sectionId) {
            return 'hero';
        }
        if (this.sectionProfiles[sectionId]) {
            return sectionId;
        }
        return this.sectionProfileAliases[sectionId] || 'hero';
    }

    refreshActiveSection(force = false) {
        let bestId = null;
        let bestRatio = 0;

        for (const [sectionId, ratio] of this.sectionRatios.entries()) {
            if (ratio > bestRatio) {
                bestId = sectionId;
                bestRatio = ratio;
            }
        }

        if (!bestId) {
            bestId = this.state.currentSection || 'hero';
            bestRatio = this.sectionRatios.get(bestId) ?? 0;
        }

        if (!bestId) {
            bestId = 'hero';
        }

        const sectionChanged = bestId !== this.state.currentSection;

        if ((sectionChanged && bestRatio >= 0.12) || force) {
            this.transitionToSection(bestId);
        }

        if (bestId === this.state.currentSection) {
            this.state.sectionDepth = bestRatio;
        } else {
            this.state.sectionDepth = this.sectionRatios.get(this.state.currentSection) ?? 0;
        }
    }

    transitionToSection(sectionId) {
        const profileKey = this.getSectionProfileKey(sectionId);
        const profile = this.sectionProfiles[profileKey] || this.sectionProfiles.hero;

        this.state.currentSection = sectionId;
        this.state.sectionDepth = this.sectionRatios.get(sectionId) ?? 0;

        Object.assign(this.visualTarget, profile);

        window.dispatchEvent(new CustomEvent('sectionTransition', {
            detail: { section: sectionId, profileKey, profile }
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

            const mouseDecay = Math.exp(-deltaTime / 260);
            const scrollDecay = Math.exp(-deltaTime / 420);

            this.mouseMetrics.velocity *= mouseDecay;
            this.state.mouseVelocity.x *= mouseDecay;
            this.state.mouseVelocity.y *= mouseDecay;

            this.scrollMetrics.velocity *= scrollDecay;
            this.state.scrollVelocity = this.scrollMetrics.velocity;

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

        const mouseVelMag = this.mouseMetrics.velocity;

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
        const sectionDepth = Math.min(1, Math.max(0, this.state.sectionDepth || 0));
        this.multipliers.scrollVelocity = 0.92 + (scrollMomentum * 0.35) + sectionDepth * 0.08;

        const hoverEnergy = Math.min(1.4, this.dynamics.hover * 0.45);
        const hoverAmplifier = 0.85 + sectionDepth * 0.5;
        this.multipliers.cardHover = 1.0 + hoverEnergy * hoverAmplifier;

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
        const profileKey = this.getSectionProfileKey(this.state.currentSection);
        const profile = this.sectionProfiles[profileKey];
        if (!profile) return;

        const energyBoost = Math.max(0, this.multipliers.userEnergy - 0.55);
        const sectionDepth = Math.min(1, Math.max(0, this.state.sectionDepth || 0));
        const sectionLift = sectionDepth * 0.35;

        // Modulate intensity with energy while preserving base profile balance
        this.visualTarget.intensity = profile.intensity + (energyBoost * 0.6) + sectionLift * 0.4;

        // Modulate chaos and speed using smoothed activity
        const chaosBoost = Math.min(0.6, (this.dynamics.mouseVelocity * 0.4) + (this.dynamics.hover * 0.15));
        const depthChaos = sectionDepth * 0.18;
        this.visualTarget.chaos = profile.chaos + chaosBoost + depthChaos;

        const speedBoost = Math.min(0.8, (this.dynamics.mouseVelocity * 0.5) + (this.dynamics.scrollVelocity * 0.3));
        const depthSpeed = sectionDepth * 0.25;
        this.visualTarget.speed = profile.speed + speedBoost + depthSpeed;

        // RGB offset increases with mouse velocity & hover energy but remains subtle
        const hoverRgb = Math.min(0.0012, this.dynamics.hover * 0.0006);
        const depthRgb = sectionDepth * 0.0004;
        const desiredRgbOffset = profile.rgbOffset + (this.dynamics.mouseVelocity * 0.0012) + hoverRgb + depthRgb;
        this.visualTarget.rgbOffset = (desiredRgbOffset * 0.75) + (this.dynamics.rgbOffset * 0.25);

        // Moiré responds to scroll momentum, energy, and hover focus
        const moireFromScroll = this.dynamics.scrollVelocity * 0.1;
        const moireFromEnergy = energyBoost * 0.18;
        const moireFromHover = Math.min(0.08, this.dynamics.hover * 0.03);
        const depthMoire = sectionDepth * 0.06;
        const desiredMoire = profile.moireIntensity + moireFromScroll + moireFromEnergy + moireFromHover + depthMoire;
        this.visualTarget.moireIntensity = (desiredMoire * 0.7) + (this.dynamics.moire * 0.3);

        // Hue shifts slightly based on mouse position
        const hueShift = (this.state.mousePos.x - 0.5) * 40;
        const depthHue = sectionDepth * 8;
        this.visualTarget.hue = (profile.hue + hueShift + depthHue + 360) % 360;

        if (profile.formMix !== undefined) {
            this.visualTarget.formMix = profile.formMix + sectionDepth * 0.1;
        }

        if (profile.form) {
            this.visualTarget.form = profile.form;
        }

        // Clamp all values
        this.visualTarget.intensity = Math.min(1.0, Math.max(0.2, this.visualTarget.intensity));
        this.visualTarget.chaos = Math.min(1.0, Math.max(0, this.visualTarget.chaos));
        this.visualTarget.speed = Math.min(2.0, Math.max(0.1, this.visualTarget.speed));
        this.visualTarget.rgbOffset = Math.min(0.006, Math.max(0, this.visualTarget.rgbOffset));
        this.visualTarget.moireIntensity = Math.min(0.38, Math.max(0, this.visualTarget.moireIntensity));
        if (this.visualTarget.formMix !== undefined) {
            this.visualTarget.formMix = Math.min(1, Math.max(0, this.visualTarget.formMix));
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
        context.sectionDepth = this.state.sectionDepth;
        context.scroll = this.state.scroll;
        context.userEnergy = this.state.userEnergy;
        context.mouseActivity = this.state.mouseActivity;
        context.scrollVelocity = this.state.scrollVelocity;
        context.hoveredCards = this.state.hoveredCards.size;

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
}
