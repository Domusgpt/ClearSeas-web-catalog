/**
 * Enhanced Polychora Visualizer
 * Integrated system combining 4D polytopes, glassmorphic effects, and holographic rendering
 *
 * Features from vib34d-xr-quaternion-sdk:
 * - 4D polytope mathematics (tesseract, 16-cell, 24-cell, 120-cell, 600-cell, 5-cell)
 * - Glassmorphic rendering with refraction and chromatic aberration
 * - Holographic shimmer and interference patterns
 * - Complete 6D rotational freedom (XY, XZ, YZ, XW, YW, ZW)
 * - Cinema-quality glass effects
 */

export class EnhancedPolychoraVisualizer {
    constructor(canvasId, role = 'content', params = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`Canvas ${canvasId} not found`);
            return;
        }

        this.role = role;
        this.params = {
            polytope: 0, // 0-5: tesseract, 16-cell, 24-cell, 120-cell, 600-cell, 5-cell
            glassRefraction: 1.5,
            holographicIntensity: 0.3,
            chromaticAberration: 0.1,
            edgeThickness: 2.0,
            faceTransparency: 0.7,
            projectionDistance: 5.0,
            rot4dXW: 0.0,
            rot4dYW: 0.0,
            rot4dZW: 0.0,
            rot4dXY: 0.0,
            rot4dXZ: 0.0,
            rot4dYZ: 0.0,
            hue: 200,
            intensity: 0.5,
            speed: 1.0,
            ...params
        };

        this.mouseX = 0.5;
        this.mouseY = 0.5;
        this.mouseIntensity = 0.0;
        this.time = 0;
        this.startTime = Date.now();

        this.initWebGL();
        if (this.gl) {
            this.initShaders();
            this.initBuffers();
            this.initPolytopes();
        }
    }

    initWebGL() {
        const contextOptions = {
            alpha: true,
            depth: true,
            stencil: false,
            antialias: true,
            premultipliedAlpha: true,
            preserveDrawingBuffer: false,
            powerPreference: 'high-performance'
        };

        this.gl = this.canvas.getContext('webgl2', contextOptions) ||
                  this.canvas.getContext('webgl', contextOptions);

        if (!this.gl) {
            console.error(`WebGL not supported for ${this.canvas.id}`);
            return;
        }

        // Enable blending for glassmorphic effects
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    }

    initShaders() {
        const vertexShaderSource = `
            attribute vec2 a_position;
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;

        const fragmentShaderSource = `
            precision highp float;

            uniform vec2 u_resolution;
            uniform float u_time;
            uniform vec2 u_mouse;
            uniform float u_polytope;
            uniform float u_hue;
            uniform float u_intensity;
            uniform float u_speed;

            // 6D rotation uniforms
            uniform float u_rot4dXW;
            uniform float u_rot4dYW;
            uniform float u_rot4dZW;
            uniform float u_rot4dXY;
            uniform float u_rot4dXZ;
            uniform float u_rot4dYZ;

            // Glass effect uniforms
            uniform float u_glassRefraction;
            uniform float u_chromaticAberration;
            uniform float u_edgeThickness;
            uniform float u_faceTransparency;
            uniform float u_holographicIntensity;
            uniform float u_projectionDistance;
            uniform float u_mouseIntensity;

            // Complete 4D rotation matrices
            mat4 rotateXY(float angle) {
                float c = cos(angle);
                float s = sin(angle);
                return mat4(
                    c, -s, 0.0, 0.0,
                    s, c, 0.0, 0.0,
                    0.0, 0.0, 1.0, 0.0,
                    0.0, 0.0, 0.0, 1.0
                );
            }

            mat4 rotateXZ(float angle) {
                float c = cos(angle);
                float s = sin(angle);
                return mat4(
                    c, 0.0, -s, 0.0,
                    0.0, 1.0, 0.0, 0.0,
                    s, 0.0, c, 0.0,
                    0.0, 0.0, 0.0, 1.0
                );
            }

            mat4 rotateYZ(float angle) {
                float c = cos(angle);
                float s = sin(angle);
                return mat4(
                    1.0, 0.0, 0.0, 0.0,
                    0.0, c, -s, 0.0,
                    0.0, s, c, 0.0,
                    0.0, 0.0, 0.0, 1.0
                );
            }

            mat4 rotateXW(float angle) {
                float c = cos(angle);
                float s = sin(angle);
                return mat4(
                    c, 0.0, 0.0, -s,
                    0.0, 1.0, 0.0, 0.0,
                    0.0, 0.0, 1.0, 0.0,
                    s, 0.0, 0.0, c
                );
            }

            mat4 rotateYW(float angle) {
                float c = cos(angle);
                float s = sin(angle);
                return mat4(
                    1.0, 0.0, 0.0, 0.0,
                    0.0, c, 0.0, -s,
                    0.0, 0.0, 1.0, 0.0,
                    0.0, s, 0.0, c
                );
            }

            mat4 rotateZW(float angle) {
                float c = cos(angle);
                float s = sin(angle);
                return mat4(
                    1.0, 0.0, 0.0, 0.0,
                    0.0, 1.0, 0.0, 0.0,
                    0.0, 0.0, c, -s,
                    0.0, 0.0, s, c
                );
            }

            // 4D polytope distance functions
            float polytope4D(vec4 p, float type) {
                if (type < 0.5) {
                    // Tesseract (8-Cell hypercube)
                    vec4 q = abs(p) - 1.0;
                    return length(max(q, 0.0)) + min(max(max(max(q.x, q.y), q.z), q.w), 0.0);
                } else if (type < 1.5) {
                    // 16-Cell (4-Orthoplex)
                    return abs(p.x) + abs(p.y) + abs(p.z) + abs(p.w) - 1.5;
                } else if (type < 2.5) {
                    // 24-Cell
                    vec4 q = abs(p);
                    return max(max(q.x + q.y, q.z + q.w), max(q.x + q.z, q.y + q.w)) - 1.2;
                } else if (type < 3.5) {
                    // 120-Cell (simplified)
                    vec4 q = abs(p);
                    return max(max(max(q.x, q.y), max(q.z, q.w)), length(q.xy) + length(q.zw)) - 1.1;
                } else if (type < 4.5) {
                    // 600-Cell
                    float phi = 1.618033989;
                    vec4 q = abs(p);
                    float d = length(q) - 1.0;
                    float r = max(max(q.x, q.y/phi), max(q.z*phi, q.w)) - 0.8;
                    return min(d, r);
                } else {
                    // 5-Cell (4-Simplex)
                    vec4 q = abs(p) - 0.8;
                    float d1 = length(max(q, 0.0)) + min(max(max(max(q.x, q.y), q.z), q.w), 0.0);
                    vec4 r = p - vec4(0.5);
                    float d2 = length(r) - 0.3;
                    return min(d1, d2);
                }
            }

            // Apply all 6D rotations
            vec4 apply6DRotation(vec4 pos, float timeOffset) {
                pos = rotateXY(u_rot4dXY + timeOffset * 0.08) * pos;
                pos = rotateXZ(u_rot4dXZ + timeOffset * 0.09) * pos;
                pos = rotateYZ(u_rot4dYZ + timeOffset * 0.07) * pos;
                pos = rotateXW(u_rot4dXW + timeOffset * 0.10) * pos;
                pos = rotateYW(u_rot4dYW + timeOffset * 0.11) * pos;
                pos = rotateZW(u_rot4dZW + timeOffset * 0.12) * pos;
                return pos;
            }

            // Holographic shimmer effect
            vec3 holographicShimmer(vec2 uv, float dist) {
                float interference = sin(uv.x * 20.0 + u_time * 0.001) *
                                   cos(uv.y * 15.0 - u_time * 0.0008) *
                                   sin(dist * 10.0);

                vec3 shimmer = vec3(0.0);
                shimmer.r = sin(interference * 2.0 + u_time * 0.001) * u_holographicIntensity;
                shimmer.g = sin(interference * 3.0 + u_time * 0.0011) * u_holographicIntensity;
                shimmer.b = sin(interference * 4.0 + u_time * 0.0009) * u_holographicIntensity;

                return shimmer;
            }

            // Glass refraction effect
            vec3 glassEffect(vec3 baseColor, vec2 uv, float dist) {
                // Chromatic aberration
                vec2 offset = normalize(uv) * u_chromaticAberration * 0.01;
                float r = baseColor.r * (1.0 + sin(dist * 10.0 + u_time * 0.001) * u_chromaticAberration);
                float g = baseColor.g * (1.0 + sin(dist * 10.0 + u_time * 0.001 + 2.09) * u_chromaticAberration);
                float b = baseColor.b * (1.0 + sin(dist * 10.0 + u_time * 0.001 + 4.18) * u_chromaticAberration);

                // Refraction distortion
                float refraction_intensity = (u_glassRefraction - 1.0) * 0.3;
                vec3 refracted = vec3(r, g, b) * (1.0 + refraction_intensity);

                return refracted;
            }

            void main() {
                vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);

                // Create 4D point
                float timeSpeed = u_time * 0.0003 * u_speed;
                vec4 pos = vec4(uv * 2.0,
                    sin(timeSpeed * 3.0) * 0.5,
                    cos(timeSpeed * 2.0) * 0.5 * u_projectionDistance * 0.1
                );

                // Add mouse interaction
                vec2 mouseOffset = (u_mouse - 0.5) * u_mouseIntensity;
                pos.xy += mouseOffset * 0.3;

                // Apply 6D rotation
                pos = apply6DRotation(pos, timeSpeed);

                // Get polytope distance
                float dist = polytope4D(pos, u_polytope);

                // Multi-layer edge rendering
                float edgeCore = u_edgeThickness * 0.01;
                float lineCore = 1.0 - smoothstep(0.0, edgeCore, abs(dist));
                float lineOutline = 1.0 - smoothstep(0.0, edgeCore * 1.5, abs(dist + 0.05));
                float lineFine = 1.0 - smoothstep(0.0, edgeCore * 0.5, abs(dist));

                float alpha = lineCore * 0.6 + lineOutline * 0.3 + lineFine * 0.1;

                // Face transparency
                if (abs(dist) > edgeCore * 2.0) {
                    alpha *= u_faceTransparency;
                }

                // Base color from hue
                float hue = u_hue / 360.0 + dist * 0.1;
                vec3 color = vec3(
                    sin(hue * 6.28318) * 0.5 + 0.5,
                    sin(hue * 6.28318 + 2.0943) * 0.5 + 0.5,
                    sin(hue * 6.28318 + 4.1887) * 0.5 + 0.5
                );

                // Apply glass effects
                color = glassEffect(color, uv, dist);

                // Add holographic shimmer
                color += holographicShimmer(uv, dist);

                // Apply intensity
                color *= u_intensity;

                gl_FragColor = vec4(color, alpha * 0.95);
            }
        `;

        this.program = this.createProgram(vertexShaderSource, fragmentShaderSource);

        if (!this.program) return;

        // Get uniform locations
        this.uniforms = {
            resolution: this.gl.getUniformLocation(this.program, 'u_resolution'),
            time: this.gl.getUniformLocation(this.program, 'u_time'),
            mouse: this.gl.getUniformLocation(this.program, 'u_mouse'),
            polytope: this.gl.getUniformLocation(this.program, 'u_polytope'),
            hue: this.gl.getUniformLocation(this.program, 'u_hue'),
            intensity: this.gl.getUniformLocation(this.program, 'u_intensity'),
            speed: this.gl.getUniformLocation(this.program, 'u_speed'),
            rot4dXW: this.gl.getUniformLocation(this.program, 'u_rot4dXW'),
            rot4dYW: this.gl.getUniformLocation(this.program, 'u_rot4dYW'),
            rot4dZW: this.gl.getUniformLocation(this.program, 'u_rot4dZW'),
            rot4dXY: this.gl.getUniformLocation(this.program, 'u_rot4dXY'),
            rot4dXZ: this.gl.getUniformLocation(this.program, 'u_rot4dXZ'),
            rot4dYZ: this.gl.getUniformLocation(this.program, 'u_rot4dYZ'),
            glassRefraction: this.gl.getUniformLocation(this.program, 'u_glassRefraction'),
            chromaticAberration: this.gl.getUniformLocation(this.program, 'u_chromaticAberration'),
            edgeThickness: this.gl.getUniformLocation(this.program, 'u_edgeThickness'),
            faceTransparency: this.gl.getUniformLocation(this.program, 'u_faceTransparency'),
            holographicIntensity: this.gl.getUniformLocation(this.program, 'u_holographicIntensity'),
            projectionDistance: this.gl.getUniformLocation(this.program, 'u_projectionDistance'),
            mouseIntensity: this.gl.getUniformLocation(this.program, 'u_mouseIntensity')
        };
    }

    createProgram(vertexSource, fragmentSource) {
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentSource);

        if (!vertexShader || !fragmentShader) return null;

        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('Program linking failed:', this.gl.getProgramInfoLog(program));
            return null;
        }

        return program;
    }

    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', this.gl.getShaderInfoLog(shader));
            return null;
        }

        return shader;
    }

    initBuffers() {
        const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);

        this.buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);

        const positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
    }

    initPolytopes() {
        this.polytopeNames = [
            'Tesseract (8-Cell)',
            '16-Cell (Cross-Polytope)',
            '24-Cell',
            '120-Cell',
            '600-Cell',
            '5-Cell (Simplex)'
        ];
    }

    updateParameters(params) {
        Object.assign(this.params, params);
    }

    updateInteraction(x, y, intensity) {
        this.mouseX = x;
        this.mouseY = y;
        this.mouseIntensity = intensity;
    }

    resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;

        if (this.canvas.width !== width * dpr || this.canvas.height !== height * dpr) {
            this.canvas.width = width * dpr;
            this.canvas.height = height * dpr;
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    render() {
        if (!this.program) return;

        this.resize();
        this.gl.useProgram(this.program);

        // Clear with transparent background
        this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        const time = Date.now() - this.startTime;

        // Set uniforms
        this.gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
        this.gl.uniform1f(this.uniforms.time, time);
        this.gl.uniform2f(this.uniforms.mouse, this.mouseX, this.mouseY);
        this.gl.uniform1f(this.uniforms.polytope, this.params.polytope);
        this.gl.uniform1f(this.uniforms.hue, this.params.hue);
        this.gl.uniform1f(this.uniforms.intensity, this.params.intensity);
        this.gl.uniform1f(this.uniforms.speed, this.params.speed);
        this.gl.uniform1f(this.uniforms.rot4dXW, this.params.rot4dXW);
        this.gl.uniform1f(this.uniforms.rot4dYW, this.params.rot4dYW);
        this.gl.uniform1f(this.uniforms.rot4dZW, this.params.rot4dZW);
        this.gl.uniform1f(this.uniforms.rot4dXY, this.params.rot4dXY);
        this.gl.uniform1f(this.uniforms.rot4dXZ, this.params.rot4dXZ);
        this.gl.uniform1f(this.uniforms.rot4dYZ, this.params.rot4dYZ);
        this.gl.uniform1f(this.uniforms.glassRefraction, this.params.glassRefraction);
        this.gl.uniform1f(this.uniforms.chromaticAberration, this.params.chromaticAberration);
        this.gl.uniform1f(this.uniforms.edgeThickness, this.params.edgeThickness);
        this.gl.uniform1f(this.uniforms.faceTransparency, this.params.faceTransparency);
        this.gl.uniform1f(this.uniforms.holographicIntensity, this.params.holographicIntensity);
        this.gl.uniform1f(this.uniforms.projectionDistance, this.params.projectionDistance);
        this.gl.uniform1f(this.uniforms.mouseIntensity, this.mouseIntensity);

        // Draw
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }

    destroy() {
        if (this.gl && this.program) {
            this.gl.deleteProgram(this.program);
        }
        if (this.gl && this.buffer) {
            this.gl.deleteBuffer(this.buffer);
        }
    }
}
