/**
 * Clearseas Codex - Audio Reactive Visualization System
 * Author: Paul Phillips
 *
 * INNOVATIVE FEATURE: Particles and visuals react to audio input from microphone or system audio.
 * Uses Web Audio API for real-time frequency analysis.
 */

import { VISUALIZER_CONFIG } from '../config/VisualizerConfig.js';
import {
    createAudioFrequencyEvent,
    EVENT_TYPES,
    dispatchEvent
} from '../utils/EventHelpers.js';

export class AudioReactiveSystem {
    constructor(options = {}) {
        this.options = {
            enabled: options.enabled ?? VISUALIZER_CONFIG.audio.enabled,
            source: options.source || 'microphone', // 'microphone' or 'media'
            ...options
        };

        // Audio context
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.mediaSource = null;

        // Frequency data
        this.frequencyData = null;
        this.dataArray = null;
        this.bufferLength = 0;

        // Analyzed values (0-1 normalized)
        this.frequencies = {
            bass: 0,
            mid: 0,
            high: 0,
            overall: 0
        };

        // Smoothed values
        this.smoothedFrequencies = {
            bass: 0,
            mid: 0,
            high: 0,
            overall: 0
        };

        // State
        this.isActive = false;
        this.isListening = false;
        this.animationFrameId = null;

        // Configuration
        this.config = VISUALIZER_CONFIG.audio;
    }

    /**
     * Initialize audio context and analyser
     */
    async initialize() {
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Create analyser node
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = this.config.fftSize;
            this.analyser.smoothingTimeConstant = this.config.smoothingTimeConstant;

            this.bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(this.bufferLength);

            console.log('✅ AudioReactiveSystem initialized');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize AudioReactiveSystem:', error);
            return false;
        }
    }

    /**
     * Start listening to microphone
     */
    async startMicrophone() {
        if (!this.audioContext) {
            const initialized = await this.initialize();
            if (!initialized) return false;
        }

        try {
            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Create microphone source
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.microphone.connect(this.analyser);

            this.isListening = true;
            this.isActive = true;

            // Start analysis loop
            this.startAnalysis();

            console.log('🎤 Microphone listening started');

            // Dispatch event
            window.dispatchEvent(new CustomEvent(EVENT_TYPES.AUDIO_ENABLED, {
                detail: { source: 'microphone' }
            }));

            return true;
        } catch (error) {
            console.error('❌ Failed to start microphone:', error);
            alert('Microphone access denied or not available. Please allow microphone access to use audio-reactive features.');
            return false;
        }
    }

    /**
     * Start listening to media element (audio/video tag)
     * @param {HTMLMediaElement} mediaElement - Audio or video element
     */
    startMediaElement(mediaElement) {
        if (!this.audioContext) {
            this.initialize();
        }

        try {
            // Create media element source
            this.mediaSource = this.audioContext.createMediaElementSource(mediaElement);
            this.mediaSource.connect(this.analyser);

            // Also connect to destination so audio still plays
            this.mediaSource.connect(this.audioContext.destination);

            this.isListening = true;
            this.isActive = true;

            // Start analysis loop
            this.startAnalysis();

            console.log('🔊 Media element listening started');

            // Dispatch event
            window.dispatchEvent(new CustomEvent(EVENT_TYPES.AUDIO_ENABLED, {
                detail: { source: 'media' }
            }));

            return true;
        } catch (error) {
            console.error('❌ Failed to connect media element:', error);
            return false;
        }
    }

    /**
     * Start analysis loop
     */
    startAnalysis() {
        if (this.animationFrameId) return;

        const analyze = () => {
            if (!this.isActive) return;

            // Get frequency data
            this.analyser.getByteFrequencyData(this.dataArray);

            // Analyze frequencies
            this.analyzeFrequencies();

            // Apply smoothing
            this.applySmoothing();

            // Dispatch frequency update event
            dispatchEvent(createAudioFrequencyEvent(this.smoothedFrequencies, this.dataArray));

            // Continue loop
            this.animationFrameId = requestAnimationFrame(analyze);
        };

        analyze();
    }

    /**
     * Analyze frequency data into bass, mid, high ranges
     */
    analyzeFrequencies() {
        const [bassStart, bassEnd] = this.config.bassRange;
        const [midStart, midEnd] = this.config.midRange;
        const [highStart, highEnd] = this.config.highRange;

        const bassStartIndex = Math.floor(bassStart * this.bufferLength);
        const bassEndIndex = Math.floor(bassEnd * this.bufferLength);
        const midStartIndex = Math.floor(midStart * this.bufferLength);
        const midEndIndex = Math.floor(midEnd * this.bufferLength);
        const highStartIndex = Math.floor(highStart * this.bufferLength);
        const highEndIndex = Math.floor(highEnd * this.bufferLength);

        // Calculate average amplitude for each range
        this.frequencies.bass = this.getAverageAmplitude(bassStartIndex, bassEndIndex);
        this.frequencies.mid = this.getAverageAmplitude(midStartIndex, midEndIndex);
        this.frequencies.high = this.getAverageAmplitude(highStartIndex, highEndIndex);

        // Overall is weighted average
        this.frequencies.overall = (
            this.frequencies.bass * 0.3 +
            this.frequencies.mid * 0.5 +
            this.frequencies.high * 0.2
        );
    }

    /**
     * Get average amplitude for a frequency range
     * @param {number} startIndex - Start index in data array
     * @param {number} endIndex - End index in data array
     * @returns {number} Normalized amplitude (0-1)
     */
    getAverageAmplitude(startIndex, endIndex) {
        let sum = 0;
        let count = 0;

        for (let i = startIndex; i < endIndex && i < this.bufferLength; i++) {
            sum += this.dataArray[i];
            count++;
        }

        // Normalize to 0-1 (max value is 255)
        return count > 0 ? (sum / count) / 255 : 0;
    }

    /**
     * Apply smoothing to frequency values
     */
    applySmoothing() {
        const alpha = this.config.gainSmoothing;

        this.smoothedFrequencies.bass =
            (1 - alpha) * this.frequencies.bass + alpha * this.smoothedFrequencies.bass;

        this.smoothedFrequencies.mid =
            (1 - alpha) * this.frequencies.mid + alpha * this.smoothedFrequencies.mid;

        this.smoothedFrequencies.high =
            (1 - alpha) * this.frequencies.high + alpha * this.smoothedFrequencies.high;

        this.smoothedFrequencies.overall =
            (1 - alpha) * this.frequencies.overall + alpha * this.smoothedFrequencies.overall;
    }

    /**
     * Stop listening
     */
    stop() {
        this.isActive = false;
        this.isListening = false;

        // Stop animation frame
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        // Disconnect sources
        if (this.microphone) {
            this.microphone.disconnect();
            this.microphone = null;
        }

        if (this.mediaSource) {
            this.mediaSource.disconnect();
            this.mediaSource = null;
        }

        console.log('🔇 Audio listening stopped');

        // Dispatch event
        window.dispatchEvent(new CustomEvent(EVENT_TYPES.AUDIO_DISABLED));
    }

    /**
     * Resume audio context (required after user interaction on some browsers)
     */
    async resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
            console.log('▶️ Audio context resumed');
        }
    }

    /**
     * Get current frequency values
     * @returns {Object} { bass, mid, high, overall } (0-1 normalized)
     */
    getFrequencies() {
        return { ...this.smoothedFrequencies };
    }

    /**
     * Get audio influence on visual parameters
     * @returns {Object} Visual parameter modifiers
     */
    getAudioInfluence() {
        const { bassInfluence, midInfluence, highInfluence } = this.config;
        const { bass, mid, high } = this.smoothedFrequencies;

        return {
            intensity: bass * bassInfluence.intensity,
            chaos: bass * bassInfluence.chaos,
            particleSize: bass * bassInfluence.particleSize,
            speed: mid * midInfluence.speed,
            hueShift: mid * midInfluence.hue,
            rgbOffset: high * highInfluence.rgbOffset,
            moireIntensity: high * highInfluence.moireIntensity
        };
    }

    /**
     * Get raw frequency data array
     * @returns {Uint8Array} Raw frequency data
     */
    getRawData() {
        return this.dataArray;
    }

    /**
     * Check if system is active
     * @returns {boolean}
     */
    isSystemActive() {
        return this.isActive;
    }

    /**
     * Enable audio reactivity
     */
    async enable() {
        if (this.options.source === 'microphone') {
            return await this.startMicrophone();
        }
        return false;
    }

    /**
     * Disable audio reactivity
     */
    disable() {
        this.stop();
    }

    /**
     * Toggle audio reactivity
     */
    async toggle() {
        if (this.isActive) {
            this.disable();
            return false;
        } else {
            return await this.enable();
        }
    }

    /**
     * Cleanup and release resources
     */
    destroy() {
        this.stop();

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        this.analyser = null;
        this.dataArray = null;

        console.log('✅ AudioReactiveSystem destroyed');
    }
}

/**
 * Create and configure audio reactive system
 * @param {Object} options - Configuration options
 * @returns {AudioReactiveSystem}
 */
export function createAudioReactiveSystem(options = {}) {
    return new AudioReactiveSystem(options);
}

/**
 * Helper: Create audio toggle button
 * @param {AudioReactiveSystem} audioSystem - Audio system instance
 * @param {HTMLElement} container - Container to append button
 * @returns {HTMLButtonElement} Button element
 */
export function createAudioToggleButton(audioSystem, container = document.body) {
    const button = document.createElement('button');
    button.className = 'audio-toggle-button';
    button.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
        </svg>
        <span>Enable Audio Reactive</span>
    `;

    button.addEventListener('click', async () => {
        const enabled = await audioSystem.toggle();

        if (enabled) {
            button.classList.add('active');
            button.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                </svg>
                <span>Audio Reactive ON</span>
            `;
        } else {
            button.classList.remove('active');
            button.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                </svg>
                <span>Enable Audio Reactive</span>
            `;
        }
    });

    container.appendChild(button);
    return button;
}

export default AudioReactiveSystem;
