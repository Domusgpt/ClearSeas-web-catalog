/**
 * Holographic Visualizer - Single Layer WebGL Renderer
 * Adapted from VIB3+ Engine
 *
 * A Paul Phillips Manifestation - Paul@clearseassolutions.com
 */

export class HolographicVisualizer {
    constructor(canvasManager, canvasId, role, reactivity, variant) {
        this.manager = canvasManager;
        this.canvasId = canvasId;
        this.role = role;
        this.reactivity = reactivity;
        this.variant = variant;

        this.gl = null;
        this.program = null;
        this.uniforms = {};
        this.time = 0;

        this.params = {
            geometry: 0,
            gridDensity: 15,
            morphFactor: 1.0,
            chaos: 0.2,
            speed: 1.0,
            hue: 320,
            intensity: 0.6,
            saturation: 0.8
        };
    }

    initialize() {
        const canvasData = this.manager.getCanvas(this.canvasId);
        if (!canvasData) {
            console.error(`❌ Canvas not found: ${this.canvasId}`);
            return false;
        }

        this.gl = canvasData.gl;
        if (!this.gl) {
            console.error(`❌ No WebGL context for: ${this.canvasId}`);
            return false;
        }

        if (!this.initShaders()) {
            console.error(`❌ Shader initialization failed for: ${this.canvasId}`);
            return false;
        }

        // Register render callback
        this.manager.registerRenderer(this.canvasId, (context) => {
            this.render(context);
        }, 10);

        console.log(`✅ Holographic visualizer initialized: ${this.role}`);
        return true;
    }

    initShaders() {
        const vertexSource = `
            attribute vec2 a_position;
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;

        const fragmentSource = `
            precision highp float;

            uniform vec2 u_resolution;
            uniform float u_time;
            uniform float u_geometry;
            uniform float u_gridDensity;
            uniform float u_morphFactor;
            uniform float u_chaos;
            uniform float u_hue;
            uniform float u_intensity;
            uniform float u_roleIntensity;

            // Simple holographic lattice
            float holographicLattice(vec3 p, float gridSize) {
                vec3 cell = fract(p * gridSize) - 0.5;
                float dist = length(cell);
                return 1.0 - smoothstep(0.0, 0.15, dist);
            }

            void main() {
                vec2 uv = (gl_FragCoord.xy - u_resolution.xy * 0.5) / min(u_resolution.x, u_resolution.y);

                // Create 3D position with holographic shimmer
                vec3 pos = vec3(uv * 2.0, sin(u_time * 0.001) * 0.5);
                pos.xy += vec2(sin(u_time * 0.0005), cos(u_time * 0.0007)) * u_chaos;

                // Calculate lattice value
                float value = holographicLattice(pos, u_gridDensity * 0.1);

                // Holographic shimmer
                float shimmer = sin(uv.x * 20.0 + u_time * 0.005) * cos(uv.y * 15.0 + u_time * 0.003) * 0.1;
                value += shimmer * value;

                // Color based on role
                float hueVal = (u_hue / 360.0) + value * 0.2 + u_time * 0.0001;
                vec3 color = vec3(
                    0.5 + 0.5 * cos(hueVal * 6.28),
                    0.5 + 0.5 * cos((hueVal + 0.33) * 6.28),
                    0.5 + 0.5 * cos((hueVal + 0.67) * 6.28)
                );

                float alpha = value * u_intensity * u_roleIntensity;
                gl_FragColor = vec4(color * alpha, alpha);
            }
        `;

        this.program = this.createProgram(vertexSource, fragmentSource);
        if (!this.program) return false;

        // Get uniform locations
        this.uniforms = {
            resolution: this.gl.getUniformLocation(this.program, 'u_resolution'),
            time: this.gl.getUniformLocation(this.program, 'u_time'),
            geometry: this.gl.getUniformLocation(this.program, 'u_geometry'),
            gridDensity: this.gl.getUniformLocation(this.program, 'u_gridDensity'),
            morphFactor: this.gl.getUniformLocation(this.program, 'u_morphFactor'),
            chaos: this.gl.getUniformLocation(this.program, 'u_chaos'),
            hue: this.gl.getUniformLocation(this.program, 'u_hue'),
            intensity: this.gl.getUniformLocation(this.program, 'u_intensity'),
            roleIntensity: this.gl.getUniformLocation(this.program, 'u_roleIntensity')
        };

        // Create fullscreen quad
        const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
        const buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);

        const posLocation = this.gl.getAttribLocation(this.program, 'a_position');
        this.gl.enableVertexAttribArray(posLocation);
        this.gl.vertexAttribPointer(posLocation, 2, this.gl.FLOAT, false, 0, 0);

        return true;
    }

    createProgram(vertexSource, fragmentSource) {
        const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentSource);

        if (!vertexShader || !fragmentShader) return null;

        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('Program link error:', this.gl.getProgramInfoLog(program));
            return null;
        }

        return program;
    }

    compileShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', this.gl.getShaderInfoLog(shader));
            return null;
        }

        return shader;
    }

    updateParameters(params) {
        Object.assign(this.params, params);
    }

    render(context) {
        if (!this.program) return;

        this.time = context.timestamp;

        const canvasData = this.manager.getCanvas(this.canvasId);
        const width = canvasData.canvas.width;
        const height = canvasData.canvas.height;

        this.gl.useProgram(this.program);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        // Set uniforms
        this.gl.uniform2f(this.uniforms.resolution, width, height);
        this.gl.uniform1f(this.uniforms.time, this.time * this.params.speed);
        this.gl.uniform1f(this.uniforms.geometry, this.params.geometry);
        this.gl.uniform1f(this.uniforms.gridDensity, this.params.gridDensity);
        this.gl.uniform1f(this.uniforms.morphFactor, this.params.morphFactor);
        this.gl.uniform1f(this.uniforms.chaos, this.params.chaos);
        this.gl.uniform1f(this.uniforms.hue, this.params.hue);
        this.gl.uniform1f(this.uniforms.intensity, this.params.intensity);
        this.gl.uniform1f(this.uniforms.roleIntensity, this.reactivity);

        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }

    dispose() {
        if (this.gl && this.program) {
            this.gl.deleteProgram(this.program);
        }
        this.program = null;
        this.gl = null;
    }
}

export default HolographicVisualizer;
