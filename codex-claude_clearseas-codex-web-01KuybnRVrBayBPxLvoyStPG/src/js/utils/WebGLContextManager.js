/**
 * Clearseas Codex - WebGL Context Manager
 * Author: Paul Phillips
 *
 * Robust WebGL context management with automatic recovery from context loss.
 * Prevents crashes and provides graceful fallbacks.
 */

import {
    createContextLostEvent,
    createContextRestoredEvent,
    createErrorEvent,
    dispatchEvent
} from './EventHelpers.js';

export class WebGLContextManager {
    constructor(canvas, contextOptions = {}) {
        this.canvas = canvas;
        this.contextOptions = {
            alpha: true,
            antialias: true,
            depth: false,
            stencil: false,
            powerPreference: 'high-performance',
            preserveDrawingBuffer: false,
            ...contextOptions
        };

        this.gl = null;
        this.isContextLost = false;
        this.restorationAttempts = 0;
        this.maxRestorationAttempts = 3;

        // Callbacks
        this.onContextLost = null;
        this.onContextRestored = null;

        // Resources that need to be recreated
        this.restorationCallbacks = [];

        // Bound handlers
        this.handleContextLost = this.handleContextLost.bind(this);
        this.handleContextRestored = this.handleContextRestored.bind(this);

        this.initialize();
    }

    /**
     * Initialize WebGL context and event listeners
     */
    initialize() {
        try {
            // Get WebGL context
            this.gl = this.canvas.getContext('webgl2', this.contextOptions) ||
                      this.canvas.getContext('webgl', this.contextOptions) ||
                      this.canvas.getContext('experimental-webgl', this.contextOptions);

            if (!this.gl) {
                throw new Error('WebGL not supported');
            }

            // Add context loss/restore listeners
            this.canvas.addEventListener('webglcontextlost', this.handleContextLost, false);
            this.canvas.addEventListener('webglcontextrestored', this.handleContextRestored, false);

            console.log('✅ WebGL context initialized:', {
                version: this.gl instanceof WebGL2RenderingContext ? 'WebGL 2' : 'WebGL 1',
                vendor: this.gl.getParameter(this.gl.VENDOR),
                renderer: this.gl.getParameter(this.gl.RENDERER)
            });

            return true;
        } catch (error) {
            console.error('❌ Failed to initialize WebGL context:', error);
            dispatchEvent(createErrorEvent(error, 'WebGLContextManager'));
            return false;
        }
    }

    /**
     * Handle context lost event
     * @param {Event} event - Context lost event
     */
    handleContextLost(event) {
        event.preventDefault(); // CRITICAL: Prevent default to allow restoration

        this.isContextLost = true;
        console.warn('⚠️ WebGL context lost');

        // Dispatch custom event
        dispatchEvent(createContextLostEvent(this.canvas, 'WebGLContextManager'));

        // Trigger callback
        if (this.onContextLost) {
            this.onContextLost(event);
        }
    }

    /**
     * Handle context restored event
     * @param {Event} event - Context restored event
     */
    handleContextRestored(event) {
        console.log('✅ WebGL context restored');

        this.isContextLost = false;
        this.restorationAttempts++;

        // Re-initialize context
        const success = this.initialize();

        if (success) {
            // Recreate all resources
            this.recreateResources();

            // Dispatch custom event
            dispatchEvent(createContextRestoredEvent(this.canvas, 'WebGLContextManager'));

            // Trigger callback
            if (this.onContextRestored) {
                this.onContextRestored(event);
            }
        } else {
            console.error('❌ Failed to restore WebGL context');

            if (this.restorationAttempts < this.maxRestorationAttempts) {
                console.log(`Retrying restoration (attempt ${this.restorationAttempts}/${this.maxRestorationAttempts})...`);
                setTimeout(() => {
                    this.handleContextRestored(event);
                }, 1000);
            } else {
                console.error('❌ Max restoration attempts reached. WebGL context permanently lost.');
                dispatchEvent(createErrorEvent(
                    new Error('WebGL context restoration failed'),
                    'WebGLContextManager'
                ));
            }
        }
    }

    /**
     * Register a callback to recreate resources after context restoration
     * @param {Function} callback - Function to recreate resources
     * @returns {Function} Cleanup function to unregister callback
     */
    registerRestorationCallback(callback) {
        this.restorationCallbacks.push(callback);

        // Return cleanup function
        return () => {
            const index = this.restorationCallbacks.indexOf(callback);
            if (index !== -1) {
                this.restorationCallbacks.splice(index, 1);
            }
        };
    }

    /**
     * Recreate all registered resources
     */
    recreateResources() {
        console.log(`🔄 Recreating ${this.restorationCallbacks.length} resources...`);

        this.restorationCallbacks.forEach((callback, index) => {
            try {
                callback(this.gl);
                console.log(`✅ Resource ${index + 1} recreated`);
            } catch (error) {
                console.error(`❌ Failed to recreate resource ${index + 1}:`, error);
            }
        });
    }

    /**
     * Get WebGL context
     * @returns {WebGLRenderingContext|WebGL2RenderingContext|null}
     */
    getContext() {
        return this.gl;
    }

    /**
     * Check if context is lost
     * @returns {boolean}
     */
    isLost() {
        return this.isContextLost || this.gl.isContextLost();
    }

    /**
     * Safely execute a WebGL operation with error handling
     * @param {Function} operation - WebGL operation to execute
     * @param {*} fallbackValue - Value to return on error
     * @returns {*} Operation result or fallback value
     */
    safeExecute(operation, fallbackValue = null) {
        if (this.isLost()) {
            console.warn('Cannot execute operation: WebGL context is lost');
            return fallbackValue;
        }

        try {
            return operation(this.gl);
        } catch (error) {
            console.error('WebGL operation failed:', error);
            dispatchEvent(createErrorEvent(error, 'WebGLContextManager'));
            return fallbackValue;
        }
    }

    /**
     * Force context loss (for testing)
     */
    loseContext() {
        const ext = this.gl.getExtension('WEBGL_lose_context');
        if (ext) {
            ext.loseContext();
            console.log('🧪 Context loss simulated');
        }
    }

    /**
     * Force context restoration (for testing)
     */
    restoreContext() {
        const ext = this.gl.getExtension('WEBGL_lose_context');
        if (ext) {
            ext.restoreContext();
            console.log('🧪 Context restoration simulated');
        }
    }

    /**
     * Get WebGL capabilities and limits
     * @returns {Object} WebGL capabilities
     */
    getCapabilities() {
        if (!this.gl || this.isLost()) {
            return null;
        }

        return {
            maxTextureSize: this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE),
            maxVertexAttribs: this.gl.getParameter(this.gl.MAX_VERTEX_ATTRIBS),
            maxVertexUniformVectors: this.gl.getParameter(this.gl.MAX_VERTEX_UNIFORM_VECTORS),
            maxFragmentUniformVectors: this.gl.getParameter(this.gl.MAX_FRAGMENT_UNIFORM_VECTORS),
            maxVaryingVectors: this.gl.getParameter(this.gl.MAX_VARYING_VECTORS),
            maxCombinedTextureImageUnits: this.gl.getParameter(this.gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
            maxCubeMapTextureSize: this.gl.getParameter(this.gl.MAX_CUBE_MAP_TEXTURE_SIZE),
            maxRenderbufferSize: this.gl.getParameter(this.gl.MAX_RENDERBUFFER_SIZE),
            maxViewportDims: this.gl.getParameter(this.gl.MAX_VIEWPORT_DIMS),
            aliasedPointSizeRange: this.gl.getParameter(this.gl.ALIASED_POINT_SIZE_RANGE),
            aliasedLineWidthRange: this.gl.getParameter(this.gl.ALIASED_LINE_WIDTH_RANGE)
        };
    }

    /**
     * Check if an extension is supported
     * @param {string} extension - Extension name
     * @returns {boolean|Object} Extension object or false
     */
    getExtension(extension) {
        if (!this.gl || this.isLost()) {
            return false;
        }

        return this.gl.getExtension(extension);
    }

    /**
     * Get list of supported extensions
     * @returns {string[]} Array of extension names
     */
    getSupportedExtensions() {
        if (!this.gl || this.isLost()) {
            return [];
        }

        return this.gl.getSupportedExtensions() || [];
    }

    /**
     * Cleanup and remove event listeners
     */
    destroy() {
        // Remove event listeners
        this.canvas.removeEventListener('webglcontextlost', this.handleContextLost);
        this.canvas.removeEventListener('webglcontextrestored', this.handleContextRestored);

        // Clear callbacks
        this.restorationCallbacks = [];
        this.onContextLost = null;
        this.onContextRestored = null;

        // Lose context if extension available (cleanup)
        const ext = this.gl?.getExtension('WEBGL_lose_context');
        if (ext) {
            ext.loseContext();
        }

        this.gl = null;

        console.log('✅ WebGLContextManager destroyed');
    }
}

/**
 * Create a managed WebGL context
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Object} options - Context options
 * @returns {WebGLContextManager}
 */
export function createWebGLContext(canvas, options = {}) {
    return new WebGLContextManager(canvas, options);
}

/**
 * Helper: Create a shader with error handling
 * @param {WebGLRenderingContext} gl - WebGL context
 * @param {number} type - Shader type (gl.VERTEX_SHADER or gl.FRAGMENT_SHADER)
 * @param {string} source - Shader source code
 * @returns {WebGLShader|null} Compiled shader or null
 */
export function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compilation failed:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

/**
 * Helper: Create a shader program with error handling
 * @param {WebGLRenderingContext} gl - WebGL context
 * @param {string} vertexSource - Vertex shader source
 * @param {string} fragmentSource - Fragment shader source
 * @returns {WebGLProgram|null} Linked program or null
 */
export function createProgram(gl, vertexSource, fragmentSource) {
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

    if (!vertexShader || !fragmentShader) {
        return null;
    }

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program linking failed:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }

    // Clean up shaders (program keeps references)
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    return program;
}

/**
 * Helper: Check for WebGL errors
 * @param {WebGLRenderingContext} gl - WebGL context
 * @param {string} operation - Operation name for debugging
 * @returns {boolean} Whether an error occurred
 */
export function checkGLError(gl, operation = '') {
    const error = gl.getError();
    if (error !== gl.NO_ERROR) {
        let errorName = 'UNKNOWN_ERROR';
        switch (error) {
            case gl.INVALID_ENUM:
                errorName = 'INVALID_ENUM';
                break;
            case gl.INVALID_VALUE:
                errorName = 'INVALID_VALUE';
                break;
            case gl.INVALID_OPERATION:
                errorName = 'INVALID_OPERATION';
                break;
            case gl.INVALID_FRAMEBUFFER_OPERATION:
                errorName = 'INVALID_FRAMEBUFFER_OPERATION';
                break;
            case gl.OUT_OF_MEMORY:
                errorName = 'OUT_OF_MEMORY';
                break;
            case gl.CONTEXT_LOST_WEBGL:
                errorName = 'CONTEXT_LOST_WEBGL';
                break;
        }

        console.error(`WebGL Error after ${operation}: ${errorName} (${error})`);
        return true;
    }
    return false;
}

export default WebGLContextManager;
