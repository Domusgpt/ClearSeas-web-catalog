/**
 * ENHANCED QUANTUM BACKGROUND WITH RGB OFFSET & MOIRÉ
 * Responds dynamically to Visual Orchestrator state
 */

export class EnhancedQuantumBackground {
    constructor(canvasManager, canvasId) {
        this.manager = canvasManager;
        this.canvasId = canvasId;
        
        this.params = {
            gridDensity: 12,
            morphFactor: 1.0,
            chaos: 0.2,
            speed: 0.6,
            hue: 180,
            intensity: 0.5,
            saturation: 0.9,
            rgbOffset: 0.002,        // NEW: Chromatic aberration
            moireIntensity: 0.1,     // NEW: Moiré pattern strength
            moireFrequency: 8.0      // NEW: Moiré frequency
        };
        
        this.time = 0;
        this.rotation4D = { xw: 0, yw: 0, zw: 0 };
        this.gl = null;
        this.program = null;
        this.uniforms = {};
        
        // Listen to orchestrator
        window.addEventListener('visualStateUpdate', (e) => {
            this.updateFromOrchestrator(e.detail);
        });
    }
    
    initialize() {
        const canvasData = this.manager.getCanvas(this.canvasId);
        if (!canvasData) {
            console.error('Canvas not found:', this.canvasId);
            return false;
        }
        
        this.gl = canvasData.gl;
        this.initShaders();
        
        this.manager.registerRenderer(this.canvasId, (context) => {
            this.render(context);
        }, 5);
        
        console.log('🌌 Enhanced Quantum Background initialized with RGB offset & moiré');
        return true;
    }
    
    updateFromOrchestrator(detail) {
        const { state } = detail;
        
        // Smoothly update parameters from orchestrator
        this.params.gridDensity = 10 + state.intensity * 8;
        this.params.chaos = state.chaos;
        this.params.speed = state.speed;
        this.params.hue = state.hue;
        this.params.intensity = state.intensity;
        this.params.rgbOffset = state.rgbOffset;
        this.params.moireIntensity = state.moireIntensity;
    }
    
    initShaders() {
        const gl = this.gl;
        
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
            uniform float u_gridDensity;
            uniform float u_morphFactor;
            uniform float u_chaos;
            uniform float u_speed;
            uniform float u_hue;
            uniform float u_intensity;
            uniform float u_saturation;
            uniform float u_scrollProgress;
            uniform vec3 u_rotation4D;
            uniform float u_rgbOffset;           // NEW
            uniform float u_moireIntensity;      // NEW
            uniform float u_moireFrequency;      // NEW
            
            // 4D Rotation matrices
            mat4 rotateXW(float theta) {
                float c = cos(theta);
                float s = sin(theta);
                return mat4(c, 0.0, 0.0, -s, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, s, 0.0, 0.0, c);
            }
            
            mat4 rotateYW(float theta) {
                float c = cos(theta);
                float s = sin(theta);
                return mat4(1.0, 0.0, 0.0, 0.0, 0.0, c, 0.0, -s, 0.0, 0.0, 1.0, 0.0, 0.0, s, 0.0, c);
            }
            
            mat4 rotateZW(float theta) {
                float c = cos(theta);
                float s = sin(theta);
                return mat4(1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, c, -s, 0.0, 0.0, s, c);
            }
            
            vec3 project4Dto3D(vec4 p) {
                float w = 2.5 / (2.5 + p.w);
                return vec3(p.x * w, p.y * w, p.z * w);
            }
            
            float sphereLattice(vec3 p, float gridSize) {
                vec3 cell = fract(p * gridSize) - 0.5;
                float dist = length(cell);
                float sphere = 1.0 - smoothstep(0.15, 0.25, dist);
                
                float rings = 0.0;
                float ringRadius = length(cell.xy);
                rings = max(rings, 1.0 - smoothstep(0.0, 0.02, abs(ringRadius - 0.3)));
                rings = max(rings, 1.0 - smoothstep(0.0, 0.02, abs(ringRadius - 0.2)));
                
                float lines = 0.0;
                lines = max(lines, 1.0 - smoothstep(0.0, 0.01, abs(cell.x)));
                lines = max(lines, 1.0 - smoothstep(0.0, 0.01, abs(cell.y)));
                lines = max(lines, 1.0 - smoothstep(0.0, 0.01, abs(cell.z)));
                lines *= 0.3;
                
                return max(sphere, max(rings * 0.6, lines));
            }
            
            vec3 hsv2rgb(vec3 c) {
                vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
                vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
                return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
            }
            
            float noise(vec3 p) {
                vec3 i = floor(p);
                vec3 f = fract(p);
                f = f * f * (3.0 - 2.0 * f);
                float n = i.x + i.y * 57.0 + 113.0 * i.z;
                return mix(
                    mix(mix(sin(n), sin(n + 1.0), f.x),
                        mix(sin(n + 57.0), sin(n + 58.0), f.x), f.y),
                    mix(mix(sin(n + 113.0), sin(n + 114.0), f.x),
                        mix(sin(n + 170.0), sin(n + 171.0), f.x), f.y), f.z
                );
            }
            
            // NEW: Moiré pattern generator
            float moire(vec2 uv, float freq, float time) {
                float pattern1 = sin((uv.x * freq + time) * 3.14159);
                float pattern2 = sin((uv.y * freq - time * 0.7) * 3.14159);
                float pattern3 = sin((length(uv) * freq + time * 0.5) * 3.14159);
                return (pattern1 * pattern2 + pattern3) * 0.5;
            }
            
            void main() {
                vec2 uv = (gl_FragCoord.xy - u_resolution * 0.5) / min(u_resolution.x, u_resolution.y);
                float t = u_time * u_speed * 0.0001;
                
                // Create 4D point
                float scrollInfluence = u_scrollProgress * 0.5;
                vec4 p4d = vec4(uv * 2.0, sin(t * 0.5 + scrollInfluence), cos(t * 0.5 + scrollInfluence));
                
                // Mouse influence
                float mouseInfluence = length(u_mouse - 0.5) * 0.3;
                
                // 4D rotations
                mat4 rotXW = rotateXW(u_rotation4D.x + t * 0.2 + mouseInfluence);
                mat4 rotYW = rotateYW(u_rotation4D.y + t * 0.14 + scrollInfluence * 0.1);
                mat4 rotZW = rotateZW(u_rotation4D.z + t * 0.1);
                
                p4d = rotZW * rotYW * rotXW * p4d;
                vec3 p = project4Dto3D(p4d);
                
                // Morphing
                p += sin(p.yzx * u_morphFactor * 3.0 + t) * u_chaos * 0.2;
                p += cos(p.zxy * u_morphFactor * 2.0 - t * 0.7) * u_chaos * 0.15;
                p += noise(p * 4.0 + t) * u_chaos * 0.1;
                
                // Base density
                float density = sphereLattice(p, u_gridDensity);
                
                // Holographic effect
                float hologram = sin(length(p) * 20.0 - t * 30.0) * 0.5 + 0.5;
                density = mix(density, density * hologram, 0.3);
                
                // Wave interference
                float interference = sin(p.x * 15.0 + t * 10.0) * 
                                   sin(p.y * 15.0 - t * 7.0) * 
                                   sin(p.z * 15.0 + t * 5.0);
                interference = (interference + 1.0) * 0.5;
                density += interference * 0.2 * u_chaos;
                
                // NEW: Add moiré patterns
                float moirePattern = moire(uv, u_moireFrequency, t * 10.0);
                density += moirePattern * u_moireIntensity * 0.3;
                
                // Color calculation
                float depth = length(p) * 0.2;
                float hue = mod(u_hue / 360.0 + density * 0.3 + t * 5.0 + scrollInfluence * 0.1, 1.0);
                
                // NEW: RGB CHROMATIC ABERRATION
                // Sample three times with offset for R, G, B channels
                vec2 offset = vec2(u_rgbOffset);
                
                // Red channel (shift right/up)
                vec4 p4d_r = vec4((uv + offset) * 2.0, sin(t * 0.5), cos(t * 0.5));
                p4d_r = rotZW * rotYW * rotXW * p4d_r;
                vec3 p_r = project4Dto3D(p4d_r);
                p_r += sin(p_r.yzx * u_morphFactor * 3.0 + t) * u_chaos * 0.2;
                float density_r = sphereLattice(p_r, u_gridDensity) * 1.05;
                
                // Green channel (no offset)
                float density_g = density;
                
                // Blue channel (shift left/down)
                vec4 p4d_b = vec4((uv - offset) * 2.0, sin(t * 0.5), cos(t * 0.5));
                p4d_b = rotZW * rotYW * rotXW * p4d_b;
                vec3 p_b = project4Dto3D(p4d_b);
                p_b += sin(p_b.yzx * u_morphFactor * 3.0 + t) * u_chaos * 0.2;
                float density_b = sphereLattice(p_b, u_gridDensity) * 1.05;
                
                // Separate color channels
                vec3 color_r = hsv2rgb(vec3(hue, u_saturation, density_r * u_intensity));
                vec3 color_g = hsv2rgb(vec3(hue, u_saturation, density_g * u_intensity));
                vec3 color_b = hsv2rgb(vec3(hue, u_saturation, density_b * u_intensity));
                
                // Combine RGB with chromatic aberration
                vec3 color = vec3(color_r.r, color_g.g, color_b.b);
                
                // Atmospheric glow
                color += vec3(0.1, 0.2, 0.3) * density * density * u_intensity;
                
                // Depth fog
                color = mix(color, vec3(0.0), depth * 0.5);
                
                // Mouse proximity glow
                vec2 mouseUV = u_mouse * 2.0 - 1.0;
                float mouseDist = length(uv - mouseUV);
                float mouseGlow = exp(-mouseDist * 3.0) * 0.2;
                color += vec3(mouseGlow) * vec3(0.0, 0.8, 1.0);
                
                // Add moiré color distortion
                color = mix(color, color * (1.0 + moirePattern * 0.5), u_moireIntensity * 0.2);
                
                gl_FragColor = vec4(color, 1.0);
            }
        `;
        
        const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
        
        this.program = gl.createProgram();
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);
        
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error('Program link error:', gl.getProgramInfoLog(this.program));
            return;
        }
        
        const positions = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
        
        const positionLocation = gl.getAttribLocation(this.program, 'a_position');
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
        
        this.uniforms = {
            resolution: gl.getUniformLocation(this.program, 'u_resolution'),
            time: gl.getUniformLocation(this.program, 'u_time'),
            mouse: gl.getUniformLocation(this.program, 'u_mouse'),
            gridDensity: gl.getUniformLocation(this.program, 'u_gridDensity'),
            morphFactor: gl.getUniformLocation(this.program, 'u_morphFactor'),
            chaos: gl.getUniformLocation(this.program, 'u_chaos'),
            speed: gl.getUniformLocation(this.program, 'u_speed'),
            hue: gl.getUniformLocation(this.program, 'u_hue'),
            intensity: gl.getUniformLocation(this.program, 'u_intensity'),
            saturation: gl.getUniformLocation(this.program, 'u_saturation'),
            scrollProgress: gl.getUniformLocation(this.program, 'u_scrollProgress'),
            rotation4D: gl.getUniformLocation(this.program, 'u_rotation4D'),
            rgbOffset: gl.getUniformLocation(this.program, 'u_rgbOffset'),
            moireIntensity: gl.getUniformLocation(this.program, 'u_moireIntensity'),
            moireFrequency: gl.getUniformLocation(this.program, 'u_moireFrequency')
        };
    }
    
    compileShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }
    
    render(context) {
        const { timestamp, deltaTime, mouse, scroll, canvas } = context;
        const gl = this.gl;
        
        this.time = timestamp;
        
        this.rotation4D.xw += deltaTime * 0.00005;
        this.rotation4D.yw += deltaTime * 0.000035;
        this.rotation4D.zw += deltaTime * 0.000025;
        
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        gl.useProgram(this.program);
        
        gl.uniform2f(this.uniforms.resolution, canvas.width, canvas.height);
        gl.uniform1f(this.uniforms.time, this.time);
        gl.uniform2f(this.uniforms.mouse, mouse.x, mouse.y);
        gl.uniform1f(this.uniforms.gridDensity, this.params.gridDensity);
        gl.uniform1f(this.uniforms.morphFactor, this.params.morphFactor);
        gl.uniform1f(this.uniforms.chaos, this.params.chaos);
        gl.uniform1f(this.uniforms.speed, this.params.speed);
        gl.uniform1f(this.uniforms.hue, this.params.hue);
        gl.uniform1f(this.uniforms.intensity, this.params.intensity);
        gl.uniform1f(this.uniforms.saturation, this.params.saturation);
        gl.uniform1f(this.uniforms.scrollProgress, scroll);
        gl.uniform3f(this.uniforms.rotation4D, this.rotation4D.xw, this.rotation4D.yw, this.rotation4D.zw);
        gl.uniform1f(this.uniforms.rgbOffset, this.params.rgbOffset);
        gl.uniform1f(this.uniforms.moireIntensity, this.params.moireIntensity);
        gl.uniform1f(this.uniforms.moireFrequency, this.params.moireFrequency);
        
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    
    dispose() {
        const gl = this.gl;
        if (this.program) gl.deleteProgram(this.program);
    }
}
