/**
 * Faceted System - Clean 2D Geometric Patterns with 4D Rotation
 * Adapted from VIB3+ Engine for ClearSeas-Enhanced
 *
 * A Paul Phillips Manifestation - Paul@clearseassolutions.com
 * "The Revolution Will Not be in a Structured Format" © 2025
 */

export class FacetedSystem {
    constructor(canvasManager, canvasId) {
        this.manager = canvasManager;
        this.canvasId = canvasId;
        this.gl = null;
        this.program = null;
        this.uniforms = {};
        this.isActive = false;
        this.time = 0;

        this.params = {
            geometry: 0,
            rot4dXY: 0, rot4dXZ: 0, rot4dYZ: 0,
            rot4dXW: 0, rot4dYW: 0, rot4dZW: 0,
            gridDensity: 15,
            morphFactor: 1.0,
            chaos: 0.2,
            speed: 1.0,
            hue: 200,
            intensity: 0.7,
            dimension: 3.5
        };

        // Listen to orchestrator
        window.addEventListener('visualStateUpdate', (e) => {
            if (this.isActive) {
                this.updateFromOrchestrator(e.detail);
            }
        });
    }

    initialize() {
        const canvasData = this.manager.getCanvas(this.canvasId);
        if (!canvasData) {
            console.error('❌ Canvas not found:', this.canvasId);
            return false;
        }

        this.gl = canvasData.gl;
        if (!this.gl) {
            console.error('❌ No WebGL context for Faceted System');
            return false;
        }

        if (!this.createShaderProgram()) {
            console.error('❌ Failed to create faceted shader program');
            return false;
        }

        // Register render callback
        this.manager.registerRenderer(this.canvasId, (context) => {
            this.render(context);
        }, 10);

        console.log('✅ Faceted System initialized');
        return true;
    }

    createShaderProgram() {
        const vertexShader = `
            attribute vec2 a_position;
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;

        const fragmentShader = `
            precision highp float;
            uniform float u_time;
            uniform vec2 u_resolution;
            uniform float u_geometry;

            // 6D Rotation uniforms
            uniform float u_rot4dXY;
            uniform float u_rot4dXZ;
            uniform float u_rot4dYZ;
            uniform float u_rot4dXW;
            uniform float u_rot4dYW;
            uniform float u_rot4dZW;

            uniform float u_dimension;
            uniform float u_gridDensity;
            uniform float u_morphFactor;
            uniform float u_chaos;
            uniform float u_hue;
            uniform float u_intensity;

            // 6 Rotation matrices for complete 4D rotation
            mat4 rotateXY(float angle) {
                float c = cos(angle);
                float s = sin(angle);
                return mat4(
                    c, -s, 0, 0,
                    s, c, 0, 0,
                    0, 0, 1, 0,
                    0, 0, 0, 1
                );
            }

            mat4 rotateXZ(float angle) {
                float c = cos(angle);
                float s = sin(angle);
                return mat4(
                    c, 0, -s, 0,
                    0, 1, 0, 0,
                    s, 0, c, 0,
                    0, 0, 0, 1
                );
            }

            mat4 rotateYZ(float angle) {
                float c = cos(angle);
                float s = sin(angle);
                return mat4(
                    1, 0, 0, 0,
                    0, c, -s, 0,
                    0, s, c, 0,
                    0, 0, 0, 1
                );
            }

            mat4 rotateXW(float angle) {
                float c = cos(angle);
                float s = sin(angle);
                return mat4(
                    c, 0, 0, -s,
                    0, 1, 0, 0,
                    0, 0, 1, 0,
                    s, 0, 0, c
                );
            }

            mat4 rotateYW(float angle) {
                float c = cos(angle);
                float s = sin(angle);
                return mat4(
                    1, 0, 0, 0,
                    0, c, 0, -s,
                    0, 0, 1, 0,
                    0, s, 0, c
                );
            }

            mat4 rotateZW(float angle) {
                float c = cos(angle);
                float s = sin(angle);
                return mat4(
                    1, 0, 0, 0,
                    0, 1, 0, 0,
                    0, 0, c, -s,
                    0, 0, s, c
                );
            }

            // Apply all 6 rotations
            vec4 apply6DRotation(vec4 pos) {
                pos = rotateXY(u_rot4dXY + u_time * 0.0005) * pos;
                pos = rotateXZ(u_rot4dXZ + u_time * 0.0006) * pos;
                pos = rotateYZ(u_rot4dYZ + u_time * 0.0004) * pos;
                pos = rotateXW(u_rot4dXW + u_time * 0.0007) * pos;
                pos = rotateYW(u_rot4dYW + u_time * 0.0008) * pos;
                pos = rotateZW(u_rot4dZW + u_time * 0.0009) * pos;
                return pos;
            }

            // Simple geometry (8 base types for now)
            float geometry(vec4 p, float type) {
                if (type < 0.5) {
                    // Tetrahedron
                    return max(max(max(abs(p.x + p.y) - p.z, abs(p.x - p.y) - p.z),
                                   abs(p.x + p.y) + p.z), abs(p.x - p.y) + p.z) / sqrt(3.0);
                } else if (type < 1.5) {
                    // Hypercube
                    vec4 q = abs(p) - 0.8;
                    return length(max(q, 0.0)) + min(max(max(max(q.x, q.y), q.z), q.w), 0.0);
                } else if (type < 2.5) {
                    // Sphere
                    return length(p) - 1.0;
                } else if (type < 3.5) {
                    // Torus
                    vec2 t = vec2(length(p.xy) - 0.8, p.z);
                    return length(t) - 0.3;
                } else if (type < 4.5) {
                    // Klein Bottle
                    float r = length(p.xy);
                    return abs(r - 0.7) - 0.2 + sin(atan(p.y, p.x) * 3.0 + p.z * 5.0) * 0.1;
                } else if (type < 5.5) {
                    // Fractal
                    return length(p) - 0.8 + sin(p.x * 5.0) * sin(p.y * 5.0) * sin(p.z * 5.0) * 0.2;
                } else if (type < 6.5) {
                    // Wave
                    return abs(p.z - sin(p.x * 5.0 + u_time * 0.001) * cos(p.y * 5.0 + u_time * 0.001) * 0.3) - 0.1;
                } else {
                    // Crystal
                    vec4 q = abs(p);
                    return max(max(max(q.x, q.y), q.z), q.w) - 0.8;
                }
            }

            void main() {
                vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
                uv *= 2.0 / u_gridDensity;

                // Create 4D point
                vec4 pos = vec4(uv, sin(u_time * 0.0003) * 0.5, cos(u_time * 0.0002) * 0.5);

                // Apply full 6D rotation
                pos = apply6DRotation(pos);

                // Apply morphing
                pos *= u_morphFactor;
                pos += vec4(sin(u_time * 0.0001), cos(u_time * 0.00015), sin(u_time * 0.00012), cos(u_time * 0.00018)) * u_chaos;

                // Get distance
                float dist = geometry(pos, u_geometry);

                // Faceted rendering (sharp edges)
                float edge = smoothstep(0.02, 0.0, abs(dist));
                float fill = smoothstep(0.1, 0.0, dist) * 0.3;

                // Color based on hue and distance
                float hueVal = u_hue / 360.0 + dist * 0.2 + u_time * 0.00005;
                vec3 color = vec3(
                    0.5 + 0.5 * cos(hueVal * 6.28),
                    0.5 + 0.5 * cos((hueVal + 0.33) * 6.28),
                    0.5 + 0.5 * cos((hueVal + 0.67) * 6.28)
                );

                float alpha = (edge + fill) * u_intensity;
                gl_FragColor = vec4(color * alpha, alpha);
            }
        `;

        this.program = this.compileProgram(vertexShader, fragmentShader);
        if (!this.program) return false;

        // Get uniform locations
        this.uniforms = {
            time: this.gl.getUniformLocation(this.program, 'u_time'),
            resolution: this.gl.getUniformLocation(this.program, 'u_resolution'),
            geometry: this.gl.getUniformLocation(this.program, 'u_geometry'),
            rot4dXY: this.gl.getUniformLocation(this.program, 'u_rot4dXY'),
            rot4dXZ: this.gl.getUniformLocation(this.program, 'u_rot4dXZ'),
            rot4dYZ: this.gl.getUniformLocation(this.program, 'u_rot4dYZ'),
            rot4dXW: this.gl.getUniformLocation(this.program, 'u_rot4dXW'),
            rot4dYW: this.gl.getUniformLocation(this.program, 'u_rot4dYW'),
            rot4dZW: this.gl.getUniformLocation(this.program, 'u_rot4dZW'),
            dimension: this.gl.getUniformLocation(this.program, 'u_dimension'),
            gridDensity: this.gl.getUniformLocation(this.program, 'u_gridDensity'),
            morphFactor: this.gl.getUniformLocation(this.program, 'u_morphFactor'),
            chaos: this.gl.getUniformLocation(this.program, 'u_chaos'),
            hue: this.gl.getUniformLocation(this.program, 'u_hue'),
            intensity: this.gl.getUniformLocation(this.program, 'u_intensity')
        };

        // Create fullscreen quad
        const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
        const buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

        const posLocation = this.gl.getAttribLocation(this.program, 'a_position');
        this.gl.enableVertexAttribArray(posLocation);
        this.gl.vertexAttribPointer(posLocation, 2, this.gl.FLOAT, false, 0, 0);

        return true;
    }

    compileProgram(vertexSource, fragmentSource) {
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

    updateFromOrchestrator(detail) {
        const { state } = detail;

        this.params.gridDensity = state.gridDensity || (10 + state.intensity * 10);
        this.params.morphFactor = state.morphFactor || 1.0;
        this.params.chaos = state.chaos;
        this.params.speed = state.speed;
        this.params.hue = state.hue;
        this.params.intensity = state.intensity;

        // 4D rotation parameters
        if (state.rot4dXW !== undefined) this.params.rot4dXW = state.rot4dXW;
        if (state.rot4dYW !== undefined) this.params.rot4dYW = state.rot4dYW;
        if (state.rot4dZW !== undefined) this.params.rot4dZW = state.rot4dZW;
    }

    updateParameter(param, value) {
        if (this.params.hasOwnProperty(param)) {
            this.params[param] = value;
        }
    }

    setActive(active) {
        this.isActive = active;
        this.manager.setCanvasActive(this.canvasId, active);
        console.log(`🔷 Faceted System ${active ? 'ACTIVATED' : 'DEACTIVATED'}`);
    }

    render(context) {
        if (!this.isActive || !this.program) return;

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
        this.gl.uniform1f(this.uniforms.time, this.time);
        this.gl.uniform2f(this.uniforms.resolution, width, height);
        this.gl.uniform1f(this.uniforms.geometry, this.params.geometry);
        this.gl.uniform1f(this.uniforms.rot4dXY, this.params.rot4dXY);
        this.gl.uniform1f(this.uniforms.rot4dXZ, this.params.rot4dXZ);
        this.gl.uniform1f(this.uniforms.rot4dYZ, this.params.rot4dYZ);
        this.gl.uniform1f(this.uniforms.rot4dXW, this.params.rot4dXW);
        this.gl.uniform1f(this.uniforms.rot4dYW, this.params.rot4dYW);
        this.gl.uniform1f(this.uniforms.rot4dZW, this.params.rot4dZW);
        this.gl.uniform1f(this.uniforms.dimension, this.params.dimension);
        this.gl.uniform1f(this.uniforms.gridDensity, this.params.gridDensity * 0.1);
        this.gl.uniform1f(this.uniforms.morphFactor, this.params.morphFactor);
        this.gl.uniform1f(this.uniforms.chaos, this.params.chaos);
        this.gl.uniform1f(this.uniforms.hue, this.params.hue);
        this.gl.uniform1f(this.uniforms.intensity, this.params.intensity);

        // Draw fullscreen quad
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    }

    dispose() {
        console.log('🧹 Disposing Faceted System...');

        if (this.gl && this.program) {
            this.gl.deleteProgram(this.program);
        }

        this.program = null;
        this.gl = null;
        this.isActive = false;

        console.log('✅ Faceted System disposed');
    }
}

export default FacetedSystem;
