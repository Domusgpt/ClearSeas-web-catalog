/**
 * ADDITION #1: Interactive Particle Network System
 * Creates dynamic particle connections that respond to mouse and scroll
 */

export class ParticleNetworkSystem {
    constructor(canvasManager, canvasId, options = {}) {
        this.manager = canvasManager;
        this.canvasId = canvasId;
        
        this.options = {
            particleCount: options.particleCount || 150,
            connectionDistance: options.connectionDistance || 0.15,
            particleSize: options.particleSize || 3.0,
            speed: options.speed || 0.3,
            mouseInfluence: options.mouseInfluence || 0.2,
            colorScheme: options.colorScheme || 'cyan',
            depthLayers: options.depthLayers || 3,
            ...options
        };

        this.baseOptions = { ...this.options };

        this.dynamicState = {
            speedMultiplier: 1,
            targetSpeedMultiplier: 1,
            connectionMultiplier: 1,
            targetConnectionMultiplier: 1,
            mouseInfluenceMultiplier: 1,
            targetMouseInfluenceMultiplier: 1,
            quality: 1,
            targetQuality: 1
        };

        this.orchestratorColor = { h: 180, s: 0.8, v: 0.85 };
        this.heroContext = { energy: 0, focus: 0 };

        this.particles = [];
        this.connections = [];
        this.gl = null;
        this.program = null;
        this.lineProgram = null;
        this.isInitialized = false;

        this.handleVisualStateUpdate = this.handleVisualStateUpdate.bind(this);

        this.colorSchemes = {
            cyan: { h: 180, s: 0.8, v: 0.9 },
            purple: { h: 280, s: 0.7, v: 0.85 },
            green: { h: 120, s: 0.75, v: 0.8 },
            orange: { h: 30, s: 0.85, v: 0.9 },
            blue: { h: 210, s: 0.8, v: 0.85 }
        };
    }
    
    initialize() {
        const canvasData = this.manager.getCanvas(this.canvasId);
        if (!canvasData) {
            console.error('Canvas not found:', this.canvasId);
            return false;
        }
        
        this.gl = canvasData.gl;
        
        // Initialize particles
        this.createParticles();
        
        // Initialize shaders
        this.initializeShaders();
        
        // Register render callback
        this.manager.registerRenderer(this.canvasId, (context) => {
            this.render(context);
        }, 10); // Higher priority
        
        this.isInitialized = true;
        window.addEventListener('visualStateUpdate', this.handleVisualStateUpdate);

        console.log(`✨ Particle Network initialized with ${this.particles.length} particles`);

        return true;
    }
    
    createParticles() {
        this.particles = [];

        for (let i = 0; i < this.options.particleCount; i++) {
            const layer = Math.floor(i / (this.options.particleCount / this.options.depthLayers));
            const depth = layer / this.options.depthLayers;

            this.particles.push({
                x: Math.random() * 2 - 1,
                y: Math.random() * 2 - 1,
                z: depth,
                vx: (Math.random() - 0.5) * this.options.speed,
                vy: (Math.random() - 0.5) * this.options.speed,
                size: this.options.particleSize * (0.5 + depth * 0.5),
                alpha: 0.3 + depth * 0.6,
                hue: (depth * 60) % 360
            });
        }
    }

    handleVisualStateUpdate(event) {
        const detail = event?.detail;
        if (!detail) return;

        const state = detail.state || {};
        const multipliers = detail.multipliers || {};
        const context = detail.context || {};

        const intensity = Number.isFinite(state.intensity) ? state.intensity : 0.6;
        const chaos = Number.isFinite(state.chaos) ? state.chaos : 0.2;
        const speed = Number.isFinite(state.speed) ? state.speed : 0.5;
        const hue = Number.isFinite(state.hue) ? state.hue : this.orchestratorColor.h;

        const energy = Number.isFinite(context.heroEnergy)
            ? context.heroEnergy
            : (Number.isFinite(context.userEnergy) ? context.userEnergy : this.heroContext.energy);
        const focus = Number.isFinite(context.heroFocus) ? context.heroFocus : this.heroContext.focus;
        const hovered = Number.isFinite(context.hoveredCards) ? context.hoveredCards : 0;
        const scrollVelocity = Number.isFinite(context.scrollVelocity) ? context.scrollVelocity : 0;

        this.dynamicState.targetSpeedMultiplier = this.clamp(0.7 + speed * 0.7 + chaos * 0.4 + scrollVelocity * 0.12, 0.4, 2.8);
        this.dynamicState.targetConnectionMultiplier = this.clamp(0.78 + intensity * 0.55 - chaos * 0.2 + focus * 0.25, 0.45, 2.4);
        this.dynamicState.targetMouseInfluenceMultiplier = this.clamp(0.85 + focus * 0.4 + hovered * 0.05 + (multipliers.mouseActivity ? (multipliers.mouseActivity - 1) * 0.4 : 0), 0.35, 2.2);
        this.dynamicState.targetQuality = this.clamp(0.8 + energy * 0.4, 0.4, 1.4);

        this.heroContext = {
            energy: Math.max(0, Math.min(1, energy)),
            focus: Math.max(0, Math.min(1, focus))
        };

        const saturation = Math.min(1, 0.6 + intensity * 0.3 + energy * 0.25);
        const value = Math.min(1, 0.62 + energy * 0.3 + focus * 0.12);
        this.orchestratorColor = { h: hue, s: saturation, v: value };
    }
    
    initializeShaders() {
        const gl = this.gl;
        
        // Particle shader
        const vertexShaderSource = `
            attribute vec2 a_position;
            attribute float a_size;
            attribute float a_alpha;
            attribute float a_hue;
            
            varying float v_alpha;
            varying float v_hue;
            
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
                gl_PointSize = a_size;
                v_alpha = a_alpha;
                v_hue = a_hue;
            }
        `;
        
        const fragmentShaderSource = `
            precision mediump float;
            
            varying float v_alpha;
            varying float v_hue;
            
            uniform vec3 u_baseColor;
            
            vec3 hsv2rgb(vec3 c) {
                vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
                vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
                return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
            }
            
            void main() {
                vec2 coord = gl_PointCoord - vec2(0.5);
                float dist = length(coord);
                
                if (dist > 0.5) {
                    discard;
                }
                
                float alpha = (1.0 - dist * 2.0) * v_alpha;
                vec3 color = hsv2rgb(vec3(v_hue / 360.0, 0.8, 0.9));
                color = mix(u_baseColor, color, 0.5);
                
                gl_FragColor = vec4(color, alpha);
            }
        `;
        
        this.program = this.createProgram(vertexShaderSource, fragmentShaderSource);
        
        // Line shader
        const lineVertexShaderSource = `
            attribute vec2 a_position;
            attribute float a_alpha;
            
            varying float v_alpha;
            
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
                v_alpha = a_alpha;
            }
        `;
        
        const lineFragmentShaderSource = `
            precision mediump float;
            
            varying float v_alpha;
            uniform vec3 u_baseColor;
            
            void main() {
                gl_FragColor = vec4(u_baseColor, v_alpha * 0.3);
            }
        `;
        
        this.lineProgram = this.createProgram(lineVertexShaderSource, lineFragmentShaderSource);
    }
    
    createProgram(vertexSource, fragmentSource) {
        const gl = this.gl;
        
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexSource);
        gl.compileShader(vertexShader);
        
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            console.error('Vertex shader error:', gl.getShaderInfoLog(vertexShader));
            return null;
        }
        
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentSource);
        gl.compileShader(fragmentShader);
        
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            console.error('Fragment shader error:', gl.getShaderInfoLog(fragmentShader));
            return null;
        }
        
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Program link error:', gl.getProgramInfoLog(program));
            return null;
        }
        
        return program;
    }
    
    update(deltaTime, mouse, scroll) {
        const rawDt = Number.isFinite(deltaTime) ? deltaTime : 16;
        const dt = rawDt / 1000;
        const smoothing = 1 - Math.exp(-rawDt / 420);

        this.dynamicState.speedMultiplier += (this.dynamicState.targetSpeedMultiplier - this.dynamicState.speedMultiplier) * smoothing;
        this.dynamicState.connectionMultiplier += (this.dynamicState.targetConnectionMultiplier - this.dynamicState.connectionMultiplier) * smoothing;
        this.dynamicState.mouseInfluenceMultiplier += (this.dynamicState.targetMouseInfluenceMultiplier - this.dynamicState.mouseInfluenceMultiplier) * smoothing;
        this.dynamicState.quality += (this.dynamicState.targetQuality - this.dynamicState.quality) * smoothing;

        const speed = this.baseOptions.speed * this.dynamicState.speedMultiplier;
        const baseSpeed = this.baseOptions.speed || 0.001;
        const speedScale = speed / baseSpeed;
        const connectionDistance = this.baseOptions.connectionDistance * this.dynamicState.connectionMultiplier;
        const mouseInfluence = this.baseOptions.mouseInfluence * this.dynamicState.mouseInfluenceMultiplier;
        const focusInfluence = Math.max(0, Math.min(1, this.heroContext.focus));

        const pointerX = ((mouse && Number.isFinite(mouse.x)) ? mouse.x : 0.5) * 2 - 1;
        const pointerY = ((mouse && Number.isFinite(mouse.y)) ? mouse.y : 0.5) * 2 - 1;
        const scrollAmount = Number.isFinite(scroll) ? scroll : 0;

        this.connections = [];

        this.particles.forEach(particle => {
            // Apply velocity scaled by dynamic speed
            particle.x += particle.vx * dt * speedScale;
            particle.y += particle.vy * dt * speedScale;

            // Mouse + hero focus influence
            const dx = pointerX - particle.x;
            const dy = pointerY - particle.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const influenceRadius = mouseInfluence * (1 + focusInfluence * 0.45);

            if (dist < influenceRadius) {
                const force = (1.0 - dist / influenceRadius) * 0.0015;
                particle.vx += dx * force;
                particle.vy += dy * force;
            }

            // Scroll and energy influence on depth
            const energy = Math.max(0, Math.min(1, this.heroContext.energy));
            particle.z = (particle.z + (scrollAmount * 0.001 + energy * 0.0006) * speedScale) % 1.0;

            // Bounce off edges
            if (particle.x < -1 || particle.x > 1) {
                particle.vx *= -0.8;
                particle.x = Math.max(-1, Math.min(1, particle.x));
            }
            if (particle.y < -1 || particle.y > 1) {
                particle.vy *= -0.8;
                particle.y = Math.max(-1, Math.min(1, particle.y));
            }

            // Friction with mild energy compensation
            const friction = 0.99 - energy * 0.02;
            particle.vx *= friction;
            particle.vy *= friction;
        });

        const maxDistance = connectionDistance;
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const p1 = this.particles[i];
                const p2 = this.particles[j];

                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < maxDistance) {
                    const alpha = 1.0 - dist / maxDistance;
                    this.connections.push({
                        x1: p1.x, y1: p1.y,
                        x2: p2.x, y2: p2.y,
                        alpha: alpha * Math.min(p1.alpha, p2.alpha)
                    });
                }
            }
        }

        this.currentConnectionDistance = maxDistance;
    }
    }
    
    render(context) {
        const { deltaTime, mouse, scroll, quality } = context;
        const gl = this.gl;

        // Update particles
        this.update(deltaTime, mouse, scroll);

        // Enable blending
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // Blend orchestrator color with configured scheme
        const scheme = this.colorSchemes[this.options.colorScheme] || this.colorSchemes.cyan;
        const blendFactor = 0.5;
        const hue = (scheme.h * (1 - blendFactor)) + (this.orchestratorColor.h * blendFactor);
        const saturation = Math.min(1, (scheme.s * (1 - blendFactor)) + (this.orchestratorColor.s * blendFactor));
        const value = Math.min(1, (scheme.v * (1 - blendFactor)) + (this.orchestratorColor.v * blendFactor));
        const baseColor = this.hsv2rgb(hue, saturation, value);

        const effectiveQuality = Math.max(0.25, Math.min(1, quality * this.dynamicState.quality));

        // Render connections
        this.renderConnections(baseColor, effectiveQuality);

        // Render particles
        this.renderParticles(baseColor, effectiveQuality);

        gl.disable(gl.BLEND);
    }
    
    renderConnections(baseColor, quality) {
        const gl = this.gl;
        
        if (this.connections.length === 0) return;
        
        gl.useProgram(this.lineProgram);
        
        // Build line data
        const positions = [];
        const alphas = [];
        
        // Limit connections based on quality
        const maxConnections = Math.floor(this.connections.length * quality);
        
        for (let i = 0; i < maxConnections; i++) {
            const conn = this.connections[i];
            positions.push(conn.x1, conn.y1, conn.x2, conn.y2);
            alphas.push(conn.alpha, conn.alpha);
        }
        
        // Position buffer
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW);
        
        const positionLocation = gl.getAttribLocation(this.lineProgram, 'a_position');
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
        
        // Alpha buffer
        const alphaBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, alphaBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(alphas), gl.DYNAMIC_DRAW);
        
        const alphaLocation = gl.getAttribLocation(this.lineProgram, 'a_alpha');
        gl.enableVertexAttribArray(alphaLocation);
        gl.vertexAttribPointer(alphaLocation, 1, gl.FLOAT, false, 0, 0);
        
        // Set uniform
        const colorLocation = gl.getUniformLocation(this.lineProgram, 'u_baseColor');
        gl.uniform3fv(colorLocation, baseColor);
        
        // Draw lines
        gl.lineWidth(1.0);
        gl.drawArrays(gl.LINES, 0, positions.length / 2);
        
        // Cleanup
        gl.deleteBuffer(positionBuffer);
        gl.deleteBuffer(alphaBuffer);
    }
    
    renderParticles(baseColor, quality) {
        const gl = this.gl;
        
        gl.useProgram(this.program);
        
        // Build particle data
        const positions = [];
        const sizes = [];
        const alphas = [];
        const hues = [];
        
        // Adjust particle count based on quality
        const particleCount = Math.floor(this.particles.length * quality);
        
        for (let i = 0; i < particleCount; i++) {
            const p = this.particles[i];
            positions.push(p.x, p.y);
            sizes.push(p.size * quality);
            alphas.push(p.alpha);
            hues.push(p.hue);
        }
        
        // Position buffer
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW);
        
        const positionLocation = gl.getAttribLocation(this.program, 'a_position');
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
        
        // Size buffer
        const sizeBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sizes), gl.DYNAMIC_DRAW);
        
        const sizeLocation = gl.getAttribLocation(this.program, 'a_size');
        gl.enableVertexAttribArray(sizeLocation);
        gl.vertexAttribPointer(sizeLocation, 1, gl.FLOAT, false, 0, 0);
        
        // Alpha buffer
        const alphaBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, alphaBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(alphas), gl.DYNAMIC_DRAW);
        
        const alphaLocation = gl.getAttribLocation(this.program, 'a_alpha');
        gl.enableVertexAttribArray(alphaLocation);
        gl.vertexAttribPointer(alphaLocation, 1, gl.FLOAT, false, 0, 0);
        
        // Hue buffer
        const hueBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, hueBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(hues), gl.DYNAMIC_DRAW);
        
        const hueLocation = gl.getAttribLocation(this.program, 'a_hue');
        gl.enableVertexAttribArray(hueLocation);
        gl.vertexAttribPointer(hueLocation, 1, gl.FLOAT, false, 0, 0);
        
        // Set uniform
        const colorLocation = gl.getUniformLocation(this.program, 'u_baseColor');
        gl.uniform3fv(colorLocation, baseColor);
        
        // Draw particles
        gl.drawArrays(gl.POINTS, 0, particleCount);
        
        // Cleanup
        gl.deleteBuffer(positionBuffer);
        gl.deleteBuffer(sizeBuffer);
        gl.deleteBuffer(alphaBuffer);
        gl.deleteBuffer(hueBuffer);
    }
    
    clamp(value, min, max) {
        if (!Number.isFinite(value)) {
            return min;
        }
        if (value < min) return min;
        if (value > max) return max;
        return value;
    }

    hsv2rgb(h, s, v) {
        h = h / 360;
        const i = Math.floor(h * 6);
        const f = h * 6 - i;
        const p = v * (1 - s);
        const q = v * (1 - f * s);
        const t = v * (1 - (1 - f) * s);
        
        let r, g, b;
        switch (i % 6) {
            case 0: r = v; g = t; b = p; break;
            case 1: r = q; g = v; b = p; break;
            case 2: r = p; g = v; b = t; break;
            case 3: r = p; g = q; b = v; break;
            case 4: r = t; g = p; b = v; break;
            case 5: r = v; g = p; b = q; break;
        }
        
        return new Float32Array([r, g, b]);
    }
    
    setColorScheme(scheme) {
        if (this.colorSchemes[scheme]) {
            this.options.colorScheme = scheme;
        }
    }

    dispose() {
        window.removeEventListener('visualStateUpdate', this.handleVisualStateUpdate);
        const gl = this.gl;
        if (this.program) gl.deleteProgram(this.program);
        if (this.lineProgram) gl.deleteProgram(this.lineProgram);
    }
}
