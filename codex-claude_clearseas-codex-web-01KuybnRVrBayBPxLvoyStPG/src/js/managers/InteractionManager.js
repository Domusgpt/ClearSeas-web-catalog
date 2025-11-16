/**
 * Clearseas Codex - Interaction Manager
 * Author: Paul Phillips
 *
 * Centralized manager for all user interactions (mouse, touch, keyboard, gestures).
 * Eliminates code duplication across visualizers and provides a unified API.
 */

import { VISUALIZER_CONFIG } from '../config/VisualizerConfig.js';
import {
    createGesturePinchEvent,
    createGestureRotateEvent,
    createGestureSwipeEvent,
    dispatchEvent
} from '../utils/EventHelpers.js';

export class InteractionManager {
    constructor(options = {}) {
        this.options = {
            target: options.target || document.body,
            enableGestures: options.enableGestures ?? VISUALIZER_CONFIG.gestures.enabled,
            enableSmoothing: options.enableSmoothing ?? true,
            ...options
        };

        // Mouse state
        this.mouse = {
            x: 0,
            y: 0,
            normalizedX: 0.5,
            normalizedY: 0.5,
            velocityX: 0,
            velocityY: 0,
            prevX: 0,
            prevY: 0,
            isDown: false,
            isHovering: false
        };

        // Touch state
        this.touch = {
            active: false,
            touches: [],
            initialDistance: 0,
            currentDistance: 0,
            initialAngle: 0,
            currentAngle: 0,
            swipeStart: null,
            swipeEnd: null
        };

        // Keyboard state
        this.keys = new Set();

        // Input smoothing (Exponential Moving Average)
        this.smoothing = {
            mousePosition: { x: 0.5, y: 0.5 },
            mouseVelocity: { x: 0, y: 0 },
            alpha: VISUALIZER_CONFIG.inputSmoothing.mousePositionAlpha
        };

        // Velocity tracking
        this.velocityHistory = [];
        this.maxVelocityHistory = VISUALIZER_CONFIG.inputSmoothing.velocityHistoryLength;

        // Callbacks
        this.callbacks = {
            mouseMove: [],
            mouseDown: [],
            mouseUp: [],
            mouseEnter: [],
            mouseLeave: [],
            touchStart: [],
            touchMove: [],
            touchEnd: [],
            keyDown: [],
            keyUp: [],
            pinch: [],
            rotate: [],
            swipe: [],
            click: []
        };

        // Bound methods for event listeners
        this.boundHandlers = {
            handleMouseMove: this.handleMouseMove.bind(this),
            handleMouseDown: this.handleMouseDown.bind(this),
            handleMouseUp: this.handleMouseUp.bind(this),
            handleMouseEnter: this.handleMouseEnter.bind(this),
            handleMouseLeave: this.handleMouseLeave.bind(this),
            handleTouchStart: this.handleTouchStart.bind(this),
            handleTouchMove: this.handleTouchMove.bind(this),
            handleTouchEnd: this.handleTouchEnd.bind(this),
            handleKeyDown: this.handleKeyDown.bind(this),
            handleKeyUp: this.handleKeyUp.bind(this),
            handleClick: this.handleClick.bind(this)
        };

        this.initialize();
    }

    initialize() {
        const { target } = this.options;

        // Mouse events
        target.addEventListener('mousemove', this.boundHandlers.handleMouseMove, { passive: true });
        target.addEventListener('mousedown', this.boundHandlers.handleMouseDown);
        target.addEventListener('mouseup', this.boundHandlers.handleMouseUp);
        target.addEventListener('mouseenter', this.boundHandlers.handleMouseEnter);
        target.addEventListener('mouseleave', this.boundHandlers.handleMouseLeave);
        target.addEventListener('click', this.boundHandlers.handleClick);

        // Touch events
        target.addEventListener('touchstart', this.boundHandlers.handleTouchStart, { passive: false });
        target.addEventListener('touchmove', this.boundHandlers.handleTouchMove, { passive: true });
        target.addEventListener('touchend', this.boundHandlers.handleTouchEnd);

        // Keyboard events
        window.addEventListener('keydown', this.boundHandlers.handleKeyDown);
        window.addEventListener('keyup', this.boundHandlers.handleKeyUp);

        console.log('✅ InteractionManager initialized');
    }

    // ===== MOUSE HANDLERS =====

    handleMouseMove(event) {
        const rect = this.options.target.getBoundingClientRect();

        // Update previous position
        this.mouse.prevX = this.mouse.x;
        this.mouse.prevY = this.mouse.y;

        // Calculate new position
        this.mouse.x = event.clientX - rect.left;
        this.mouse.y = event.clientY - rect.top;

        // Normalized coordinates (0-1)
        this.mouse.normalizedX = this.mouse.x / rect.width;
        this.mouse.normalizedY = this.mouse.y / rect.height;

        // Calculate instantaneous velocity
        const rawVelX = this.mouse.x - this.mouse.prevX;
        const rawVelY = this.mouse.y - this.mouse.prevY;

        // Apply smoothing if enabled
        if (this.options.enableSmoothing) {
            this.applySmoothing(rawVelX, rawVelY);
        } else {
            this.mouse.velocityX = rawVelX;
            this.mouse.velocityY = rawVelY;
        }

        // Track velocity history
        this.addVelocityToHistory(this.mouse.velocityX, this.mouse.velocityY);

        // Trigger callbacks
        this.triggerCallbacks('mouseMove', {
            x: this.mouse.x,
            y: this.mouse.y,
            normalizedX: this.mouse.normalizedX,
            normalizedY: this.mouse.normalizedY,
            velocityX: this.mouse.velocityX,
            velocityY: this.mouse.velocityY,
            smoothedPosition: this.smoothing.mousePosition,
            event
        });
    }

    handleMouseDown(event) {
        this.mouse.isDown = true;
        this.triggerCallbacks('mouseDown', { mouse: this.mouse, event });
    }

    handleMouseUp(event) {
        this.mouse.isDown = false;
        this.triggerCallbacks('mouseUp', { mouse: this.mouse, event });
    }

    handleMouseEnter(event) {
        this.mouse.isHovering = true;
        this.triggerCallbacks('mouseEnter', { mouse: this.mouse, event });
    }

    handleMouseLeave(event) {
        this.mouse.isHovering = false;
        this.mouse.velocityX = 0;
        this.mouse.velocityY = 0;
        this.triggerCallbacks('mouseLeave', { mouse: this.mouse, event });
    }

    handleClick(event) {
        this.triggerCallbacks('click', {
            x: this.mouse.x,
            y: this.mouse.y,
            normalizedX: this.mouse.normalizedX,
            normalizedY: this.mouse.normalizedY,
            event
        });
    }

    // ===== TOUCH HANDLERS =====

    handleTouchStart(event) {
        this.touch.active = true;
        this.touch.touches = Array.from(event.touches);

        if (this.options.enableGestures && event.touches.length === 2) {
            // Initialize pinch & rotate tracking
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];

            this.touch.initialDistance = this.getDistance(touch1, touch2);
            this.touch.initialAngle = this.getAngle(touch1, touch2);
        }

        if (event.touches.length === 1) {
            // Initialize swipe tracking
            const touch = event.touches[0];
            this.touch.swipeStart = {
                x: touch.clientX,
                y: touch.clientY,
                time: performance.now()
            };
        }

        this.triggerCallbacks('touchStart', {
            touches: this.touch.touches,
            event
        });
    }

    handleTouchMove(event) {
        this.touch.touches = Array.from(event.touches);

        if (this.options.enableGestures && event.touches.length === 2) {
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];

            // Calculate pinch
            this.touch.currentDistance = this.getDistance(touch1, touch2);
            const pinchScale = this.touch.currentDistance / this.touch.initialDistance;

            // Constrain pinch scale
            const { pinchZoomMin, pinchZoomMax } = VISUALIZER_CONFIG.gestures;
            const constrainedScale = Math.max(pinchZoomMin, Math.min(pinchZoomMax, pinchScale));

            // Calculate pinch center
            const center = {
                x: (touch1.clientX + touch2.clientX) / 2,
                y: (touch1.clientY + touch2.clientY) / 2
            };

            // Dispatch pinch event
            dispatchEvent(createGesturePinchEvent(constrainedScale, center));
            this.triggerCallbacks('pinch', { scale: constrainedScale, center });

            // Calculate rotation
            this.touch.currentAngle = this.getAngle(touch1, touch2);
            const rotation = this.touch.currentAngle - this.touch.initialAngle;

            // Dispatch rotate event
            dispatchEvent(createGestureRotateEvent(rotation, center));
            this.triggerCallbacks('rotate', { rotation, center });
        }

        // Update mouse position for single touch (pointer emulation)
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            const fakeEvent = {
                clientX: touch.clientX,
                clientY: touch.clientY
            };
            this.handleMouseMove(fakeEvent);
        }

        this.triggerCallbacks('touchMove', {
            touches: this.touch.touches,
            event
        });
    }

    handleTouchEnd(event) {
        if (this.touch.swipeStart && event.changedTouches.length === 1) {
            const touch = event.changedTouches[0];
            this.touch.swipeEnd = {
                x: touch.clientX,
                y: touch.clientY,
                time: performance.now()
            };

            this.detectSwipe();
        }

        this.touch.active = false;
        this.touch.touches = Array.from(event.touches);

        // Reset tracking
        if (event.touches.length < 2) {
            this.touch.initialDistance = 0;
            this.touch.currentDistance = 0;
            this.touch.initialAngle = 0;
            this.touch.currentAngle = 0;
        }

        if (event.touches.length === 0) {
            this.touch.swipeStart = null;
            this.touch.swipeEnd = null;
        }

        this.triggerCallbacks('touchEnd', {
            touches: this.touch.touches,
            event
        });
    }

    // ===== KEYBOARD HANDLERS =====

    handleKeyDown(event) {
        this.keys.add(event.key);
        this.triggerCallbacks('keyDown', {
            key: event.key,
            keys: this.keys,
            event
        });
    }

    handleKeyUp(event) {
        this.keys.delete(event.key);
        this.triggerCallbacks('keyUp', {
            key: event.key,
            keys: this.keys,
            event
        });
    }

    // ===== GESTURE DETECTION =====

    getDistance(touch1, touch2) {
        const dx = touch2.clientX - touch1.clientX;
        const dy = touch2.clientY - touch1.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    getAngle(touch1, touch2) {
        return Math.atan2(
            touch2.clientY - touch1.clientY,
            touch2.clientX - touch1.clientX
        );
    }

    detectSwipe() {
        const { swipeStart, swipeEnd } = this.touch;
        if (!swipeStart || !swipeEnd) return;

        const dx = swipeEnd.x - swipeStart.x;
        const dy = swipeEnd.y - swipeStart.y;
        const dt = swipeEnd.time - swipeStart.time;

        const distance = Math.sqrt(dx * dx + dy * dy);
        const velocity = distance / dt;

        const { swipeVelocityThreshold, swipeDistanceThreshold } = VISUALIZER_CONFIG.gestures;

        if (velocity > swipeVelocityThreshold && distance > swipeDistanceThreshold) {
            // Determine direction
            const angle = Math.atan2(dy, dx);
            let direction;

            if (angle > -Math.PI / 4 && angle < Math.PI / 4) {
                direction = 'right';
            } else if (angle >= Math.PI / 4 && angle < 3 * Math.PI / 4) {
                direction = 'down';
            } else if (angle <= -Math.PI / 4 && angle > -3 * Math.PI / 4) {
                direction = 'up';
            } else {
                direction = 'left';
            }

            // Dispatch swipe event
            dispatchEvent(createGestureSwipeEvent(direction, velocity, swipeStart, swipeEnd));
            this.triggerCallbacks('swipe', { direction, velocity, start: swipeStart, end: swipeEnd });
        }
    }

    // ===== INPUT SMOOTHING =====

    applySmoothing(velX, velY) {
        const { mousePositionAlpha, mouseVelocityAlpha } = VISUALIZER_CONFIG.inputSmoothing;

        // Exponential Moving Average for position
        this.smoothing.mousePosition.x =
            mousePositionAlpha * this.mouse.normalizedX +
            (1 - mousePositionAlpha) * this.smoothing.mousePosition.x;

        this.smoothing.mousePosition.y =
            mousePositionAlpha * this.mouse.normalizedY +
            (1 - mousePositionAlpha) * this.smoothing.mousePosition.y;

        // Exponential Moving Average for velocity
        this.mouse.velocityX =
            mouseVelocityAlpha * velX +
            (1 - mouseVelocityAlpha) * this.mouse.velocityX;

        this.mouse.velocityY =
            mouseVelocityAlpha * velY +
            (1 - mouseVelocityAlpha) * this.mouse.velocityY;
    }

    addVelocityToHistory(vx, vy) {
        const magnitude = Math.sqrt(vx * vx + vy * vy);
        this.velocityHistory.push(magnitude);

        if (this.velocityHistory.length > this.maxVelocityHistory) {
            this.velocityHistory.shift();
        }
    }

    getAverageVelocity() {
        if (this.velocityHistory.length === 0) return 0;

        const sum = this.velocityHistory.reduce((acc, v) => acc + v, 0);
        return sum / this.velocityHistory.length;
    }

    // ===== CALLBACK SYSTEM =====

    on(eventType, callback) {
        if (this.callbacks[eventType]) {
            this.callbacks[eventType].push(callback);
        } else {
            console.warn(`Unknown event type: ${eventType}`);
        }

        // Return cleanup function
        return () => this.off(eventType, callback);
    }

    off(eventType, callback) {
        if (this.callbacks[eventType]) {
            const index = this.callbacks[eventType].indexOf(callback);
            if (index !== -1) {
                this.callbacks[eventType].splice(index, 1);
            }
        }
    }

    triggerCallbacks(eventType, data) {
        if (this.callbacks[eventType]) {
            this.callbacks[eventType].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in ${eventType} callback:`, error);
                }
            });
        }
    }

    // ===== GETTERS =====

    getMouse() {
        return { ...this.mouse };
    }

    getSmoothedMouse() {
        return {
            x: this.smoothing.mousePosition.x,
            y: this.smoothing.mousePosition.y,
            velocityX: this.mouse.velocityX,
            velocityY: this.mouse.velocityY
        };
    }

    getTouch() {
        return { ...this.touch };
    }

    getKeys() {
        return new Set(this.keys);
    }

    isKeyPressed(key) {
        return this.keys.has(key);
    }

    // ===== CLEANUP =====

    destroy() {
        const { target } = this.options;

        // Remove mouse listeners
        target.removeEventListener('mousemove', this.boundHandlers.handleMouseMove);
        target.removeEventListener('mousedown', this.boundHandlers.handleMouseDown);
        target.removeEventListener('mouseup', this.boundHandlers.handleMouseUp);
        target.removeEventListener('mouseenter', this.boundHandlers.handleMouseEnter);
        target.removeEventListener('mouseleave', this.boundHandlers.handleMouseLeave);
        target.removeEventListener('click', this.boundHandlers.handleClick);

        // Remove touch listeners
        target.removeEventListener('touchstart', this.boundHandlers.handleTouchStart);
        target.removeEventListener('touchmove', this.boundHandlers.handleTouchMove);
        target.removeEventListener('touchend', this.boundHandlers.handleTouchEnd);

        // Remove keyboard listeners
        window.removeEventListener('keydown', this.boundHandlers.handleKeyDown);
        window.removeEventListener('keyup', this.boundHandlers.handleKeyUp);

        // Clear callbacks
        Object.keys(this.callbacks).forEach(key => {
            this.callbacks[key] = [];
        });

        console.log('✅ InteractionManager destroyed');
    }
}

export default InteractionManager;
