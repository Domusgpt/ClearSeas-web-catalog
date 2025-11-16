/**
 * Clearseas Codex - Event Helper Utilities
 * Author: Paul Phillips
 *
 * Centralized event creation and dispatch helpers to eliminate duplication
 * and provide a consistent event API across all components.
 */

// ===== EVENT TYPE CONSTANTS =====
export const EVENT_TYPES = {
    // Visual System Events
    VISUAL_STATE_UPDATE: 'visualStateUpdate',
    SECTION_TRANSITION: 'sectionTransition',
    QUALITY_CHANGE: 'qualityChange',

    // Card Events
    CARD_EMERGE: 'cardEmerge',
    CARD_DECAY: 'cardDecay',
    CARD_HOVER: 'cardHover',

    // Audio Events (NEW)
    AUDIO_ENABLED: 'audioEnabled',
    AUDIO_DISABLED: 'audioDisabled',
    AUDIO_FREQUENCY_UPDATE: 'audioFrequencyUpdate',

    // Gesture Events (NEW)
    GESTURE_PINCH: 'gesturePinch',
    GESTURE_ROTATE: 'gestureRotate',
    GESTURE_SWIPE: 'gestureSwipe',

    // System Events
    READY: 'clearSeasEnhancedReady',
    ERROR: 'clearSeasError',
    CONTEXT_LOST: 'webglContextLost',
    CONTEXT_RESTORED: 'webglContextRestored'
};

// ===== EVENT CREATORS =====

/**
 * Create a visual state update event
 * @param {Object} state - Current visual state
 * @param {Object} multipliers - Active multipliers
 * @param {Object} context - Additional context
 * @returns {CustomEvent}
 */
export function createVisualStateEvent(state, multipliers, context) {
    return new CustomEvent(EVENT_TYPES.VISUAL_STATE_UPDATE, {
        detail: {
            state: { ...state },
            multipliers: { ...multipliers },
            context: { ...context },
            timestamp: performance.now()
        },
        bubbles: true,
        composed: true
    });
}

/**
 * Create a section transition event
 * @param {string} section - New section ID
 * @param {Object} profile - Section profile
 * @param {string} previousSection - Previous section ID
 * @returns {CustomEvent}
 */
export function createSectionTransitionEvent(section, profile, previousSection) {
    return new CustomEvent(EVENT_TYPES.SECTION_TRANSITION, {
        detail: {
            section,
            profile: { ...profile },
            previousSection,
            timestamp: performance.now()
        },
        bubbles: true,
        composed: true
    });
}

/**
 * Create a quality change event
 * @param {number} quality - New quality level (0.5 - 1.0)
 * @param {number} fps - Current FPS
 * @param {string} reason - Reason for change
 * @returns {CustomEvent}
 */
export function createQualityChangeEvent(quality, fps, reason) {
    return new CustomEvent(EVENT_TYPES.QUALITY_CHANGE, {
        detail: {
            quality,
            fps,
            reason,
            timestamp: performance.now()
        },
        bubbles: true,
        composed: true
    });
}

/**
 * Create a card emerge event
 * @param {number} intensity - Emergence intensity
 * @param {string} color - Card color
 * @param {HTMLElement} element - Card element
 * @returns {CustomEvent}
 */
export function createCardEmergeEvent(intensity, color, element) {
    return new CustomEvent(EVENT_TYPES.CARD_EMERGE, {
        detail: {
            intensity,
            color,
            element,
            timestamp: performance.now()
        },
        bubbles: true,
        composed: true
    });
}

/**
 * Create a card decay event
 * @param {number} fractalDepth - Decay fractal depth
 * @param {string} color - Card color
 * @param {HTMLElement} element - Card element
 * @returns {CustomEvent}
 */
export function createCardDecayEvent(fractalDepth, color, element) {
    return new CustomEvent(EVENT_TYPES.CARD_DECAY, {
        detail: {
            fractalDepth,
            color,
            element,
            timestamp: performance.now()
        },
        bubbles: true,
        composed: true
    });
}

/**
 * Create an audio frequency update event (NEW)
 * @param {Object} frequencies - { bass, mid, high } normalized 0-1
 * @param {Float32Array} rawData - Raw frequency data
 * @returns {CustomEvent}
 */
export function createAudioFrequencyEvent(frequencies, rawData) {
    return new CustomEvent(EVENT_TYPES.AUDIO_FREQUENCY_UPDATE, {
        detail: {
            frequencies: { ...frequencies },
            rawData,
            timestamp: performance.now()
        },
        bubbles: true,
        composed: true
    });
}

/**
 * Create a gesture pinch event (NEW)
 * @param {number} scale - Pinch scale (0.5 - 2.0)
 * @param {Object} center - { x, y } pinch center point
 * @returns {CustomEvent}
 */
export function createGesturePinchEvent(scale, center) {
    return new CustomEvent(EVENT_TYPES.GESTURE_PINCH, {
        detail: {
            scale,
            center: { ...center },
            timestamp: performance.now()
        },
        bubbles: true,
        composed: true
    });
}

/**
 * Create a gesture rotate event (NEW)
 * @param {number} rotation - Rotation angle in radians
 * @param {Object} center - { x, y } rotation center point
 * @returns {CustomEvent}
 */
export function createGestureRotateEvent(rotation, center) {
    return new CustomEvent(EVENT_TYPES.GESTURE_ROTATE, {
        detail: {
            rotation,
            center: { ...center },
            timestamp: performance.now()
        },
        bubbles: true,
        composed: true
    });
}

/**
 * Create a gesture swipe event (NEW)
 * @param {string} direction - 'left', 'right', 'up', 'down'
 * @param {number} velocity - Swipe velocity
 * @param {Object} start - { x, y } start point
 * @param {Object} end - { x, y } end point
 * @returns {CustomEvent}
 */
export function createGestureSwipeEvent(direction, velocity, start, end) {
    return new CustomEvent(EVENT_TYPES.GESTURE_SWIPE, {
        detail: {
            direction,
            velocity,
            start: { ...start },
            end: { ...end },
            timestamp: performance.now()
        },
        bubbles: true,
        composed: true
    });
}

/**
 * Create a WebGL context lost event
 * @param {HTMLCanvasElement} canvas - Canvas that lost context
 * @param {string} visualizer - Visualizer name
 * @returns {CustomEvent}
 */
export function createContextLostEvent(canvas, visualizer) {
    return new CustomEvent(EVENT_TYPES.CONTEXT_LOST, {
        detail: {
            canvas,
            visualizer,
            timestamp: performance.now()
        },
        bubbles: true,
        composed: true
    });
}

/**
 * Create a WebGL context restored event
 * @param {HTMLCanvasElement} canvas - Canvas that restored context
 * @param {string} visualizer - Visualizer name
 * @returns {CustomEvent}
 */
export function createContextRestoredEvent(canvas, visualizer) {
    return new CustomEvent(EVENT_TYPES.CONTEXT_RESTORED, {
        detail: {
            canvas,
            visualizer,
            timestamp: performance.now()
        },
        bubbles: true,
        composed: true
    });
}

/**
 * Create an error event
 * @param {Error} error - Error object
 * @param {string} source - Error source/component
 * @param {Object} context - Additional context
 * @returns {CustomEvent}
 */
export function createErrorEvent(error, source, context = {}) {
    return new CustomEvent(EVENT_TYPES.ERROR, {
        detail: {
            error,
            message: error.message,
            stack: error.stack,
            source,
            context,
            timestamp: performance.now()
        },
        bubbles: true,
        composed: true
    });
}

/**
 * Create a ready event
 * @param {Object} app - Application instance
 * @returns {CustomEvent}
 */
export function createReadyEvent(app) {
    return new CustomEvent(EVENT_TYPES.READY, {
        detail: {
            app,
            timestamp: performance.now()
        },
        bubbles: true,
        composed: true
    });
}

// ===== EVENT DISPATCHER =====

/**
 * Centralized event dispatcher with error handling
 */
export class EventDispatcher {
    constructor(target = window) {
        this.target = target;
        this.listeners = new Map();
        this.eventHistory = [];
        this.maxHistoryLength = 50;
    }

    /**
     * Dispatch an event
     * @param {CustomEvent} event - Event to dispatch
     * @param {boolean} recordHistory - Whether to record in history
     * @returns {boolean} Whether the event was successfully dispatched
     */
    dispatch(event, recordHistory = true) {
        try {
            const result = this.target.dispatchEvent(event);

            if (recordHistory) {
                this.eventHistory.push({
                    type: event.type,
                    detail: event.detail,
                    timestamp: event.detail?.timestamp || performance.now()
                });

                // Trim history
                if (this.eventHistory.length > this.maxHistoryLength) {
                    this.eventHistory.shift();
                }
            }

            return result;
        } catch (error) {
            console.error(`Failed to dispatch event ${event.type}:`, error);
            return false;
        }
    }

    /**
     * Add an event listener with automatic cleanup
     * @param {string} type - Event type
     * @param {Function} handler - Event handler
     * @param {Object} options - addEventListener options
     * @returns {Function} Cleanup function
     */
    on(type, handler, options = {}) {
        this.target.addEventListener(type, handler, options);

        // Track for cleanup
        if (!this.listeners.has(type)) {
            this.listeners.set(type, []);
        }
        this.listeners.get(type).push({ handler, options });

        // Return cleanup function
        return () => this.off(type, handler);
    }

    /**
     * Remove an event listener
     * @param {string} type - Event type
     * @param {Function} handler - Event handler
     */
    off(type, handler) {
        this.target.removeEventListener(type, handler);

        // Remove from tracking
        const handlers = this.listeners.get(type);
        if (handlers) {
            const index = handlers.findIndex(h => h.handler === handler);
            if (index !== -1) {
                handlers.splice(index, 1);
            }
        }
    }

    /**
     * Remove all listeners for a type (or all types)
     * @param {string} type - Optional event type
     */
    removeAllListeners(type = null) {
        if (type) {
            const handlers = this.listeners.get(type);
            if (handlers) {
                handlers.forEach(({ handler }) => {
                    this.target.removeEventListener(type, handler);
                });
                this.listeners.delete(type);
            }
        } else {
            this.listeners.forEach((handlers, eventType) => {
                handlers.forEach(({ handler }) => {
                    this.target.removeEventListener(eventType, handler);
                });
            });
            this.listeners.clear();
        }
    }

    /**
     * Get event history
     * @param {string} type - Optional filter by event type
     * @param {number} limit - Max events to return
     * @returns {Array} Event history
     */
    getHistory(type = null, limit = 10) {
        let history = this.eventHistory;

        if (type) {
            history = history.filter(e => e.type === type);
        }

        return history.slice(-limit);
    }

    /**
     * Clear event history
     */
    clearHistory() {
        this.eventHistory = [];
    }

    /**
     * Cleanup all listeners and history
     */
    destroy() {
        this.removeAllListeners();
        this.clearHistory();
    }
}

// ===== GLOBAL EVENT DISPATCHER INSTANCE =====
export const globalEventDispatcher = new EventDispatcher(window);

// ===== UTILITY FUNCTIONS =====

/**
 * Safely dispatch an event with the global dispatcher
 * @param {CustomEvent} event - Event to dispatch
 * @returns {boolean} Success
 */
export function dispatchEvent(event) {
    return globalEventDispatcher.dispatch(event);
}

/**
 * Throttle an event handler
 * @param {Function} handler - Event handler
 * @param {number} delay - Throttle delay in ms
 * @returns {Function} Throttled handler
 */
export function throttleEventHandler(handler, delay) {
    let lastCall = 0;
    return function(...args) {
        const now = performance.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            return handler.apply(this, args);
        }
    };
}

/**
 * Debounce an event handler
 * @param {Function} handler - Event handler
 * @param {number} delay - Debounce delay in ms
 * @returns {Function} Debounced handler
 */
export function debounceEventHandler(handler, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => handler.apply(this, args), delay);
    };
}

/**
 * Create a one-time event listener
 * @param {EventTarget} target - Event target
 * @param {string} type - Event type
 * @param {Function} handler - Event handler
 * @param {Object} options - addEventListener options
 * @returns {Function} Cleanup function
 */
export function once(target, type, handler, options = {}) {
    const wrappedHandler = (event) => {
        handler(event);
        target.removeEventListener(type, wrappedHandler);
    };

    target.addEventListener(type, wrappedHandler, options);

    return () => target.removeEventListener(type, wrappedHandler);
}

// Export all as default for convenience
export default {
    EVENT_TYPES,
    createVisualStateEvent,
    createSectionTransitionEvent,
    createQualityChangeEvent,
    createCardEmergeEvent,
    createCardDecayEvent,
    createAudioFrequencyEvent,
    createGesturePinchEvent,
    createGestureRotateEvent,
    createGestureSwipeEvent,
    createContextLostEvent,
    createContextRestoredEvent,
    createErrorEvent,
    createReadyEvent,
    EventDispatcher,
    globalEventDispatcher,
    dispatchEvent,
    throttleEventHandler,
    debounceEventHandler,
    once
};
