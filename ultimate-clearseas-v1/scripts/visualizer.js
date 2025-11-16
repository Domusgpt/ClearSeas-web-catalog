/**
 * Clear Seas Visualizer - WebGL Polytope Field Visualization
 * A Paul Phillips Manifestation
 * "The Revolution Will Not be in a Structured Format"
 * © 2025 Paul Phillips - Clear Seas Solutions LLC
 */

class ClearSeasVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error('Canvas not found');
            return;
        }

        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        if (!this.gl) {
            console.error('WebGL not supported');
            return;
        }

        // Visualization parameters
        this.params = {
            rotationXY: 0,
            rotationXZ: 0,
            rotationYZ: 0,
            rotationXW: 0,
            scale: 1.0,
            colorHue: 180,
            colorSaturation: 70,
            colorBrightness: 60,
            particleCount: 200,
            waveAmplitude: 0.3,
            waveFrequency: 1.0
        };

        // Animation state
        this.time = 0;
        this.animationId = null;
        this.isRunning = false;

        // Preset configurations
        this.presets = {
            hero: {
                rotationSpeed: 0.0005,
                colorHue: 180,
                particleCount: 200,
                waveAmplitude: 0.3
            },
            transition1: {
                rotationSpeed: 0.002,
                colorHue: 200,
                particleCount: 300,
                waveAmplitude: 0.5
            },
            products: {
                rotationSpeed: 0.001,
                colorHue: 160,
                particleCount: 150,
                waveAmplitude: 0.2
            },
            transition2: {
                rotationSpeed: 0.0015,
                colorHue: 220,
                particleCount: 250,
                waveAmplitude: 0.4
            },
            capabilities: {
                rotationSpeed: 0.0008,
                colorHue: 190,
                particleCount: 180,
                waveAmplitude: 0.25
            },
            transition3: {
                rotationSpeed: 0.0018,
                colorHue: 210,
                particleCount: 280,
                waveAmplitude: 0.45
            },
            about: {
                rotationSpeed: 0.0006,
                colorHue: 170,
                particleCount: 160,
                waveAmplitude: 0.2
            },
            contact: {
                rotationSpeed: 0.0007,
                colorHue: 195,
                particleCount: 200,
                waveAmplitude: 0.3
            }
        };

        this.currentPreset = 'hero';
        this.currentRotationSpeed = this.presets.hero.rotationSpeed;

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.initShaders();
        this.initBuffers();
        this.start();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    initShaders() {
        const vertexShaderSource = `
            attribute vec3 aPosition;
            uniform float uTime;
            uniform float uRotationXY;
            uniform float uRotationXZ;
            uniform float uRotationYZ;
            uniform float uScale;
            uniform float uWaveAmplitude;
            uniform float uWaveFrequency;
            varying vec3 vPosition;
            varying float vDepth;

            mat3 rotateXY(float angle) {
                float c = cos(angle);
                float s = sin(angle);
                return mat3(
                    c, -s, 0.0,
                    s, c, 0.0,
                    0.0, 0.0, 1.0
                );
            }

            mat3 rotateXZ(float angle) {
                float c = cos(angle);
                float s = sin(angle);
                return mat3(
                    c, 0.0, -s,
                    0.0, 1.0, 0.0,
                    s, 0.0, c
                );
            }

            mat3 rotateYZ(float angle) {
                float c = cos(angle);
                float s = sin(angle);
                return mat3(
                    1.0, 0.0, 0.0,
                    0.0, c, -s,
                    0.0, s, c
                );
            }

            void main() {
                vec3 pos = aPosition;

                // Apply wave distortion
                float wave = sin(pos.x * uWaveFrequency + uTime) *
                           cos(pos.y * uWaveFrequency + uTime * 0.7) *
                           uWaveAmplitude;
                pos.z += wave;

                // Apply 3D rotations
                pos = rotateXY(uRotationXY) * pos;
                pos = rotateXZ(uRotationXZ) * pos;
                pos = rotateYZ(uRotationYZ) * pos;

                // Scale
                pos *= uScale;

                vPosition = pos;
                vDepth = pos.z;

                gl_Position = vec4(pos.xy, 0.0, 1.0);
                gl_PointSize = 3.0 + (pos.z + 1.0) * 2.0;
            }
        `;

        const fragmentShaderSource = `
            precision mediump float;
            uniform float uTime;
            uniform float uColorHue;
            uniform float uColorSaturation;
            uniform float uColorBrightness;
            varying vec3 vPosition;
            varying float vDepth;

            vec3 hsv2rgb(vec3 c) {
                vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
                vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
                return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
            }

            void main() {
                // Distance from center of point sprite
                vec2 center = gl_PointCoord - vec2(0.5);
                float dist = length(center);

                if (dist > 0.5) {
                    discard;
                }

                // Color based on position and depth
                float hue = uColorHue / 360.0 + vDepth * 0.1 + sin(uTime * 0.5) * 0.05;
                float saturation = uColorSaturation / 100.0;
                float brightness = uColorBrightness / 100.0 * (1.0 - dist * 0.5);

                vec3 color = hsv2rgb(vec3(hue, saturation, brightness));

                // Add glow effect
                float alpha = 1.0 - dist * 2.0;
                alpha *= 0.7 + 0.3 * sin(uTime + vPosition.x * 2.0);

                gl_FragColor = vec4(color, alpha);
            }
        `;

        // Create and compile shaders
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);

        // Create program
        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, vertexShader);
        this.gl.attachShader(this.program, fragmentShader);
        this.gl.linkProgram(this.program);

        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            console.error('Program link failed:', this.gl.getProgramInfoLog(this.program));
            return;
        }

        this.gl.useProgram(this.program);

        // Get attribute and uniform locations
        this.locations = {
            aPosition: this.gl.getAttribLocation(this.program, 'aPosition'),
            uTime: this.gl.getUniformLocation(this.program, 'uTime'),
            uRotationXY: this.gl.getUniformLocation(this.program, 'uRotationXY'),
            uRotationXZ: this.gl.getUniformLocation(this.program, 'uRotationXZ'),
            uRotationYZ: this.gl.getUniformLocation(this.program, 'uRotationYZ'),
            uScale: this.gl.getUniformLocation(this.program, 'uScale'),
            uWaveAmplitude: this.gl.getUniformLocation(this.program, 'uWaveAmplitude'),
            uWaveFrequency: this.gl.getUniformLocation(this.program, 'uWaveFrequency'),
            uColorHue: this.gl.getUniformLocation(this.program, 'uColorHue'),
            uColorSaturation: this.gl.getUniformLocation(this.program, 'uColorSaturation'),
            uColorBrightness: this.gl.getUniformLocation(this.program, 'uColorBrightness')
        };
    }

    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader compile failed:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    initBuffers() {
        this.generateParticles();
    }

    generateParticles() {
        const vertices = [];
        const count = this.params.particleCount;

        // Generate polytope-inspired particle field
        for (let i = 0; i < count; i++) {
            const theta = (i / count) * Math.PI * 2;
            const phi = Math.acos(2 * (i / count) - 1);
            const r = 0.5 + Math.random() * 0.3;

            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);

            vertices.push(x, y, z);
        }

        this.vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);

        this.vertexCount = count;
    }

    render() {
        if (!this.isRunning) return;

        this.time += 0.016; // ~60fps

        // Update rotations based on current preset
        this.params.rotationXY += this.currentRotationSpeed;
        this.params.rotationXZ += this.currentRotationSpeed * 0.7;
        this.params.rotationYZ += this.currentRotationSpeed * 0.5;

        // Clear canvas
        this.gl.clearColor(0, 0.1, 0.2, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        // Enable blending for transparency
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE);

        // Set uniforms
        this.gl.uniform1f(this.locations.uTime, this.time);
        this.gl.uniform1f(this.locations.uRotationXY, this.params.rotationXY);
        this.gl.uniform1f(this.locations.uRotationXZ, this.params.rotationXZ);
        this.gl.uniform1f(this.locations.uRotationYZ, this.params.rotationYZ);
        this.gl.uniform1f(this.locations.uScale, this.params.scale);
        this.gl.uniform1f(this.locations.uWaveAmplitude, this.params.waveAmplitude);
        this.gl.uniform1f(this.locations.uWaveFrequency, this.params.waveFrequency);
        this.gl.uniform1f(this.locations.uColorHue, this.params.colorHue);
        this.gl.uniform1f(this.locations.uColorSaturation, this.params.colorSaturation);
        this.gl.uniform1f(this.locations.uColorBrightness, this.params.colorBrightness);

        // Bind buffer and draw
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.enableVertexAttribArray(this.locations.aPosition);
        this.gl.vertexAttribPointer(this.locations.aPosition, 3, this.gl.FLOAT, false, 0, 0);

        this.gl.drawArrays(this.gl.POINTS, 0, this.vertexCount);

        this.animationId = requestAnimationFrame(() => this.render());
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.render();
    }

    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    setPreset(presetName) {
        const preset = this.presets[presetName];
        if (!preset) {
            console.warn('Preset not found:', presetName);
            return;
        }

        this.currentPreset = presetName;
        this.currentRotationSpeed = preset.rotationSpeed;

        // Smoothly transition parameters
        this.animateParam('colorHue', preset.colorHue, 1000);
        this.animateParam('particleCount', preset.particleCount, 1000);
        this.animateParam('waveAmplitude', preset.waveAmplitude, 1000);
    }

    animateParam(param, targetValue, duration) {
        const startValue = this.params[param];
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = this.easeInOutCubic(progress);

            this.params[param] = startValue + (targetValue - startValue) * eased;

            if (param === 'particleCount' && Math.abs(this.params[param] - targetValue) < 1) {
                this.params[param] = targetValue;
                this.generateParticles();
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    setProductHover(productName) {
        // Change visualizer parameters based on hovered product
        const productParams = {
            parserator: { colorHue: 270, waveAmplitude: 0.4 },
            aris: { colorHue: 200, waveAmplitude: 0.35 },
            esys: { colorHue: 150, waveAmplitude: 0.3 },
            outek: { colorHue: 0, waveAmplitude: 0.45 },
            nimbus: { colorHue: 190, waveAmplitude: 0.32 }
        };

        const params = productParams[productName];
        if (params) {
            this.animateParam('colorHue', params.colorHue, 500);
            this.animateParam('waveAmplitude', params.waveAmplitude, 500);
            this.currentRotationSpeed = 0.002; // Speed up on hover
        }
    }

    resetFromProductHover() {
        // Return to current preset parameters
        const preset = this.presets[this.currentPreset];
        if (preset) {
            this.animateParam('colorHue', preset.colorHue, 500);
            this.animateParam('waveAmplitude', preset.waveAmplitude, 500);
            this.currentRotationSpeed = preset.rotationSpeed;
        }
    }

    updateScale(scale) {
        this.params.scale = scale;
    }
}

// Export for use in app.js
window.ClearSeasVisualizer = ClearSeasVisualizer;
