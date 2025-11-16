/**
 * Clear Seas Card Polytope Visualizer - Enhanced with Flourishes & Scroll Choreography
 * Extracted from VIB3+ Engine - Quantum & Holographic Systems
 * Features: Hover flourishes, scroll-locked transformations
 *
 * © 2025 Paul Phillips - Clear Seas Solutions LLC
 * "The Revolution Will Not be in a Structured Format"
 */

(function() {
  'use strict';

  // ============================================
  // ANIMATION UTILITIES
  // ============================================

  class ParameterAnimator {
    constructor() {
      this.animations = new Map();
    }

    animate(key, target, from, to, duration, easing = 'easeOutCubic') {
      if (this.animations.has(key)) {
        clearTimeout(this.animations.get(key).timer);
      }

      const startTime = Date.now();
      const easingFunctions = {
        linear: t => t,
        easeInQuad: t => t * t,
        easeOutQuad: t => t * (2 - t),
        easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
        easeInCubic: t => t * t * t,
        easeOutCubic: t => (--t) * t * t + 1,
        easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
      };

      const ease = easingFunctions[easing] || easingFunctions.easeOutCubic;

      const update = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = ease(progress);

        target.value = from + (to - from) * easedProgress;

        if (progress < 1) {
          const timer = setTimeout(update, 16);
          this.animations.set(key, { timer, target, to });
        } else {
          this.animations.delete(key);
        }
      };

      update();
    }

    stop(key) {
      if (this.animations.has(key)) {
        clearTimeout(this.animations.get(key).timer);
        this.animations.delete(key);
      }
    }

    stopAll() {
      this.animations.forEach((anim, key) => this.stop(key));
    }
  }

  // ============================================
  // CARD POLYTOPE VISUALIZER CLASS
  // ============================================

  class CardPolytopeVisualizer {
    constructor(canvas, mode = 'quantum') {
      this.canvas = canvas;
      this.mode = mode;

      this.gl = this.canvas.getContext('webgl', {
        alpha: true,
        premultipliedAlpha: false,
        antialias: false
      });

      if (!this.gl) {
        console.error('WebGL not supported');
        return;
      }

      this.mouseX = 0.5;
      this.mouseY = 0.5;
      this.startTime = Date.now();
      this.geometry = Math.floor(Math.random() * 24);

      // Base parameters
      this.baseParams = {
        gridDensity: 15,
        morphFactor: 1.0,
        chaos: 0.2,
        speed: 1.0,
        hue: Math.random() * 360,
        intensity: 0.6,
        rot4dXW: 0,
        rot4dYW: 0,
        rot4dZW: 0
      };

      // Current animated parameters (wrapped for animation)
      this.params = {
        gridDensity: { value: 15 },
        morphFactor: { value: 1.0 },
        chaos: { value: 0.2 },
        speed: { value: 1.0 },
        hue: { value: this.baseParams.hue },
        intensity: { value: 0.6 },
        rot4dXW: { value: 0 },
        rot4dYW: { value: 0 },
        rot4dZW: { value: 0 }
      };

      // Flourish parameters
      this.flourishParams = {
        enter: {
          gridDensity: 8,      // Lower density for flourish
          morphFactor: 1.8,     // More morphing
          speed: 2.5,           // Faster rotation
          rot4dXWOffset: Math.PI,  // Full rotation
          rot4dYWOffset: Math.PI * 0.7,
          rot4dZWOffset: Math.PI * 0.5
        },
        exit: {
          gridDensity: 15,      // Back to base
          morphFactor: 1.0,
          speed: 1.0,
          rot4dXWOffset: 0,
          rot4dYWOffset: 0,
          rot4dZWOffset: 0
        }
      };

      this.animator = new ParameterAnimator();
      this.isFlourishing = false;

      this.init();
    }

    init() {
      this.initShaders();
      this.initBuffers();
      this.resize();
    }

    // [... Previous shader code remains the same ...]
    initShaders() {
      const vertexShader = `
        attribute vec2 a_position;
        void main() {
          gl_Position = vec4(a_position, 0.0, 1.0);
        }
      `;

      const fragmentShader = this.mode === 'quantum'
        ? this.getQuantumShader()
        : this.getHolographicShader();

      this.program = this.createProgram(vertexShader, fragmentShader);
      this.setupUniforms();
    }

    getQuantumShader() {
      // Same as original - keeping it concise here
      return `
        precision mediump float;
        uniform vec2 u_resolution;
        uniform float u_time;
        uniform vec2 u_mouse;
        uniform float u_geometry;
        uniform float u_gridDensity;
        uniform float u_morphFactor;
        uniform float u_chaos;
        uniform float u_speed;
        uniform float u_hue;
        uniform float u_intensity;
        uniform float u_rot4dXW;
        uniform float u_rot4dYW;
        uniform float u_rot4dZW;

        mat4 rotateXY(float theta) { float c = cos(theta); float s = sin(theta); return mat4(c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1); }
        mat4 rotateXW(float theta) { float c = cos(theta); float s = sin(theta); return mat4(c, 0, 0, -s, 0, 1, 0, 0, 0, 0, 1, 0, s, 0, 0, c); }
        mat4 rotateYW(float theta) { float c = cos(theta); float s = sin(theta); return mat4(1, 0, 0, 0, 0, c, 0, -s, 0, 0, 1, 0, 0, s, 0, c); }
        mat4 rotateZW(float theta) { float c = cos(theta); float s = sin(theta); return mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, c, -s, 0, 0, s, c); }

        vec3 project4Dto3D(vec4 p) { float w = 2.5 / (2.5 + p.w); return vec3(p.x * w, p.y * w, p.z * w); }

        vec3 warpHypersphereCore(vec3 p, int geometryIndex) {
          float radius = length(p);
          float morphBlend = clamp(u_morphFactor * 0.6 + 0.3, 0.0, 2.0);
          float w = sin(radius * (1.3 + float(geometryIndex) * 0.12) + u_time * 0.0008 * u_speed);
          w *= (0.4 + morphBlend * 0.45);
          vec4 p4d = vec4(p * (1.0 + morphBlend * 0.2), w);
          p4d = rotateXW(u_rot4dXW) * p4d;
          p4d = rotateYW(u_rot4dYW) * p4d;
          p4d = rotateZW(u_rot4dZW) * p4d;
          vec3 projected = project4Dto3D(p4d);
          return mix(p, projected, clamp(0.45 + morphBlend * 0.35, 0.0, 1.0));
        }

        vec3 applyCoreWarp(vec3 p, float geometryType) {
          float totalBase = 8.0;
          float coreFloat = floor(geometryType / totalBase);
          int coreIndex = int(clamp(coreFloat, 0.0, 2.0));
          float baseGeomFloat = geometryType - floor(geometryType / totalBase) * totalBase;
          int geometryIndex = int(clamp(floor(baseGeomFloat + 0.5), 0.0, totalBase - 1.0));
          if (coreIndex == 1) return warpHypersphereCore(p, geometryIndex);
          return p;
        }

        float hypercubeLattice(vec3 p, float gridSize) { vec3 grid = fract(p * gridSize); vec3 edges = min(grid, 1.0 - grid); float minEdge = min(min(edges.x, edges.y), edges.z); return 1.0 - smoothstep(0.0, 0.03, minEdge); }
        float sphereLattice(vec3 p, float gridSize) { vec3 cell = fract(p * gridSize) - 0.5; return 1.0 - smoothstep(0.15, 0.25, length(cell)); }
        float waveLattice(vec3 p, float gridSize) { vec3 cell = fract(p * gridSize) - 0.5; float wave1 = sin(p.x * gridSize * 2.0 + u_time * 0.001 * u_speed); float wave2 = sin(p.y * gridSize * 1.8 + u_time * 0.0008 * u_speed); float amplitude = 1.0 - length(cell) * 2.0; return max(0.0, (wave1 + wave2) / 2.0 * amplitude); }

        float geometryFunction(vec4 p) {
          float totalBase = 8.0;
          float baseGeomFloat = floor(u_geometry - floor(u_geometry / totalBase) * totalBase);
          int geomType = int(clamp(baseGeomFloat, 0.0, totalBase - 1.0));
          vec3 p3d = project4Dto3D(p);
          vec3 warped = applyCoreWarp(p3d, u_geometry);
          float gridSize = u_gridDensity * 0.08;
          if (geomType == 1) return hypercubeLattice(warped, gridSize) * u_morphFactor;
          else if (geomType == 2) return sphereLattice(warped, gridSize) * u_morphFactor;
          else if (geomType == 6) return waveLattice(warped, gridSize) * u_morphFactor;
          else return hypercubeLattice(warped, gridSize) * u_morphFactor;
        }

        vec3 hsv2rgb(vec3 c) { vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0); vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www); return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y); }

        void main() {
          vec2 uv = (gl_FragCoord.xy - u_resolution.xy * 0.5) / min(u_resolution.x, u_resolution.y);
          float timeSpeed = u_time * 0.0001 * u_speed;
          vec4 pos = vec4(uv * 3.0, sin(timeSpeed * 3.0), cos(timeSpeed * 2.0));
          pos.xy += (u_mouse - 0.5) * 2.0;
          pos = rotateXY(timeSpeed * 0.1) * pos;
          pos = rotateXW(u_rot4dXW + timeSpeed * 0.2) * pos;
          pos = rotateYW(u_rot4dYW + timeSpeed * 0.15) * pos;
          pos = rotateZW(u_rot4dZW + timeSpeed * 0.25) * pos;
          float value = geometryFunction(pos);
          float noise = sin(pos.x * 7.0) * cos(pos.y * 11.0) * u_chaos;
          value += noise;
          float geometryIntensity = 1.0 - clamp(abs(value * 0.8), 0.0, 1.0);
          geometryIntensity = pow(geometryIntensity, 1.5);
          float finalIntensity = geometryIntensity * u_intensity;
          float hue = u_hue / 360.0;
          vec3 color = hsv2rgb(vec3(hue + value * 0.1, 0.8, 0.5 + finalIntensity * 0.5));
          gl_FragColor = vec4(color, finalIntensity * 0.8);
        }
      `;
    }

    getHolographicShader() {
      // Same as original
      return `
        precision mediump float;
        uniform vec2 u_resolution;
        uniform float u_time;
        uniform vec2 u_mouse;
        uniform float u_geometry;
        uniform float u_gridDensity;
        uniform float u_morphFactor;
        uniform float u_chaos;
        uniform float u_speed;
        uniform float u_hue;
        uniform float u_intensity;
        uniform float u_rot4dXW;
        uniform float u_rot4dYW;
        uniform float u_rot4dZW;

        mat4 rotateXY(float theta) { float c = cos(theta); float s = sin(theta); return mat4(c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1); }
        mat4 rotateXW(float theta) { float c = cos(theta); float s = sin(theta); return mat4(c, 0, 0, -s, 0, 1, 0, 0, 0, 0, 1, 0, s, 0, 0, c); }
        mat4 rotateYW(float theta) { float c = cos(theta); float s = sin(theta); return mat4(1, 0, 0, 0, 0, c, 0, -s, 0, 0, 1, 0, 0, s, 0, c); }
        mat4 rotateZW(float theta) { float c = cos(theta); float s = sin(theta); return mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, c, -s, 0, 0, s, c); }

        vec3 project4Dto3D(vec4 p) { float w = 2.5 / (2.5 + p.w); return vec3(p.x * w, p.y * w, p.z * w); }

        vec3 warpHypersphereCore(vec3 p, int geometryIndex) {
          float radius = length(p);
          float morphBlend = clamp(u_morphFactor * 0.6 + 0.3, 0.0, 2.0);
          float w = sin(radius * (1.3 + float(geometryIndex) * 0.12) + u_time * 0.0008 * u_speed);
          w *= (0.4 + morphBlend * 0.45);
          vec4 p4d = vec4(p * (1.0 + morphBlend * 0.2), w);
          p4d = rotateXW(u_rot4dXW) * p4d;
          p4d = rotateYW(u_rot4dYW) * p4d;
          p4d = rotateZW(u_rot4dZW) * p4d;
          vec3 projected = project4Dto3D(p4d);
          return mix(p, projected, clamp(0.45 + morphBlend * 0.35, 0.0, 1.0));
        }

        vec3 applyCoreWarp(vec3 p, float geometryType) {
          float totalBase = 8.0;
          float coreFloat = floor(geometryType / totalBase);
          int coreIndex = int(clamp(coreFloat, 0.0, 2.0));
          float baseGeomFloat = geometryType - floor(geometryType / totalBase) * totalBase;
          int geometryIndex = int(clamp(floor(baseGeomFloat + 0.5), 0.0, totalBase - 1.0));
          if (coreIndex == 1) return warpHypersphereCore(p, geometryIndex);
          return p;
        }

        float tetrahedronLattice(vec3 p, float gridSize) { vec3 q = fract(p * gridSize) - 0.5; float d1 = length(q); float d2 = length(q - vec3(0.35, 0.0, 0.0)); float d3 = length(q - vec3(0.0, 0.35, 0.0)); float vertices = 1.0 - smoothstep(0.0, 0.03, min(min(d1, d2), d3)); float shimmer = sin(u_time * 0.002) * 0.02; float edges = 1.0 - smoothstep(0.0, 0.015, abs(length(q.xy) - (0.18 + shimmer))); return max(vertices, edges * 0.7); }
        float hypercubeLattice(vec3 p, float gridSize) { vec3 grid = fract(p * gridSize); vec3 q = grid - 0.5; vec3 edges = 1.0 - smoothstep(0.0, 0.025, abs(q)); float wireframe = max(max(edges.x, edges.y), edges.z); float glow = exp(-length(q) * 2.5) * 0.12; return wireframe * 0.8 + glow; }

        float getDynamicGeometry(vec3 p, float gridSize, float geometryType) {
          vec3 warped = applyCoreWarp(p, geometryType);
          float baseGeomFloat = geometryType - floor(geometryType / 8.0) * 8.0;
          int baseGeom = int(baseGeomFloat);
          if (baseGeom == 0) return tetrahedronLattice(warped, gridSize);
          else if (baseGeom == 1) return hypercubeLattice(warped, gridSize);
          else return hypercubeLattice(warped, gridSize);
        }

        vec3 hsv2rgb(vec3 c) { vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0); vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www); return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y); }

        void main() {
          vec2 uv = gl_FragCoord.xy / u_resolution.xy;
          float aspectRatio = u_resolution.x / u_resolution.y;
          uv.x *= aspectRatio;
          uv -= 0.5;
          float time = u_time * 0.0004 * u_speed;
          vec2 mouseOffset = (u_mouse - 0.5) * 0.25;
          vec4 p4d = vec4(uv + mouseOffset * 0.1, sin(time * 0.1) * 0.15, cos(time * 0.08) * 0.15);
          p4d = rotateXY(time * 0.1) * p4d;
          p4d = rotateXW(u_rot4dXW + time * 0.2 + mouseOffset.y * 0.5) * p4d;
          p4d = rotateYW(u_rot4dYW + time * 0.15 + mouseOffset.x * 0.5) * p4d;
          p4d = rotateZW(u_rot4dZW + time * 0.25) * p4d;
          vec3 p = project4Dto3D(p4d);
          float gridSize = u_gridDensity * 0.08;
          float morphedGeometry = u_geometry + u_morphFactor * 3.0;
          float lattice = getDynamicGeometry(p, gridSize, morphedGeometry);
          float latticeIntensity = lattice * u_intensity;
          float hue = u_hue / 360.0;
          vec3 color = hsv2rgb(vec3(hue, 0.8, 0.5 + latticeIntensity * 0.5));
          color *= (0.2 + latticeIntensity * 0.8);
          gl_FragColor = vec4(color, 0.95);
        }
      `;
    }

    setupUniforms() {
      this.uniforms = {
        resolution: this.gl.getUniformLocation(this.program, 'u_resolution'),
        time: this.gl.getUniformLocation(this.program, 'u_time'),
        mouse: this.gl.getUniformLocation(this.program, 'u_mouse'),
        geometry: this.gl.getUniformLocation(this.program, 'u_geometry'),
        gridDensity: this.gl.getUniformLocation(this.program, 'u_gridDensity'),
        morphFactor: this.gl.getUniformLocation(this.program, 'u_morphFactor'),
        chaos: this.gl.getUniformLocation(this.program, 'u_chaos'),
        speed: this.gl.getUniformLocation(this.program, 'u_speed'),
        hue: this.gl.getUniformLocation(this.program, 'u_hue'),
        intensity: this.gl.getUniformLocation(this.program, 'u_intensity'),
        rot4dXW: this.gl.getUniformLocation(this.program, 'u_rot4dXW'),
        rot4dYW: this.gl.getUniformLocation(this.program, 'u_rot4dYW'),
        rot4dZW: this.gl.getUniformLocation(this.program, 'u_rot4dZW')
      };
    }

    createProgram(vertexSource, fragmentSource) {
      const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexSource);
      const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentSource);
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
        this.gl.deleteShader(shader);
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

    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = this.canvas.clientWidth * dpr;
      const height = this.canvas.clientHeight * dpr;
      if (this.canvas.width !== width || this.canvas.height !== height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.gl.viewport(0, 0, width, height);
      }
    }

    setMousePosition(x, y) {
      this.mouseX = x;
      this.mouseY = y;
      const baseRotX = (x - 0.5) * Math.PI * 2;
      const baseRotY = (y - 0.5) * Math.PI * 2;
      const baseRotZ = ((x + y) / 2 - 0.5) * Math.PI;

      // Apply flourish offsets if flourishing
      this.params.rot4dXW.value = baseRotX + (this.params.rot4dXWOffset?.value || 0);
      this.params.rot4dYW.value = baseRotY + (this.params.rot4dYWOffset?.value || 0);
      this.params.rot4dZW.value = baseRotZ + (this.params.rot4dZWOffset?.value || 0);
    }

    // ============================================
    // FLOURISH ANIMATIONS
    // ============================================

    flourishEnter() {
      if (this.isFlourishing) return;
      this.isFlourishing = true;

      const f = this.flourishParams.enter;
      const duration = 800; // ms

      // Animate to flourish state
      this.animator.animate('gridDensity', this.params.gridDensity,
        this.params.gridDensity.value, f.gridDensity, duration, 'easeOutCubic');

      this.animator.animate('morphFactor', this.params.morphFactor,
        this.params.morphFactor.value, f.morphFactor, duration, 'easeOutCubic');

      this.animator.animate('speed', this.params.speed,
        this.params.speed.value, f.speed, duration, 'easeOutCubic');

      // Add rotation offset params if they don't exist
      if (!this.params.rot4dXWOffset) {
        this.params.rot4dXWOffset = { value: 0 };
        this.params.rot4dYWOffset = { value: 0 };
        this.params.rot4dZWOffset = { value: 0 };
      }

      this.animator.animate('rot4dXWOffset', this.params.rot4dXWOffset,
        0, f.rot4dXWOffset, duration, 'easeOutCubic');

      this.animator.animate('rot4dYWOffset', this.params.rot4dYWOffset,
        0, f.rot4dYWOffset, duration, 'easeOutCubic');

      this.animator.animate('rot4dZWOffset', this.params.rot4dZWOffset,
        0, f.rot4dZWOffset, duration, 'easeOutCubic');
    }

    flourishExit() {
      if (!this.isFlourishing) return;
      this.isFlourishing = false;

      const f = this.flourishParams.exit;
      const duration = 600; // Slightly faster exit

      // Animate back to base state
      this.animator.animate('gridDensity', this.params.gridDensity,
        this.params.gridDensity.value, f.gridDensity, duration, 'easeInOutCubic');

      this.animator.animate('morphFactor', this.params.morphFactor,
        this.params.morphFactor.value, f.morphFactor, duration, 'easeInOutCubic');

      this.animator.animate('speed', this.params.speed,
        this.params.speed.value, f.speed, duration, 'easeInOutCubic');

      this.animator.animate('rot4dXWOffset', this.params.rot4dXWOffset,
        this.params.rot4dXWOffset.value, f.rot4dXWOffset, duration, 'easeInOutCubic');

      this.animator.animate('rot4dYWOffset', this.params.rot4dYWOffset,
        this.params.rot4dYWOffset.value, f.rot4dYWOffset, duration, 'easeInOutCubic');

      this.animator.animate('rot4dZWOffset', this.params.rot4dZWOffset,
        this.params.rot4dZWOffset.value, f.rot4dZWOffset, duration, 'easeInOutCubic');
    }

    render() {
      if (!this.program) return;

      this.resize();
      this.gl.useProgram(this.program);
      this.gl.clearColor(0, 0, 0, 0);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);

      const time = Date.now() - this.startTime;

      // Use animated parameter values
      this.gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
      this.gl.uniform1f(this.uniforms.time, time);
      this.gl.uniform2f(this.uniforms.mouse, this.mouseX, this.mouseY);
      this.gl.uniform1f(this.uniforms.geometry, this.geometry);
      this.gl.uniform1f(this.uniforms.gridDensity, this.params.gridDensity.value);
      this.gl.uniform1f(this.uniforms.morphFactor, this.params.morphFactor.value);
      this.gl.uniform1f(this.uniforms.chaos, this.params.chaos.value);
      this.gl.uniform1f(this.uniforms.speed, this.params.speed.value);
      this.gl.uniform1f(this.uniforms.hue, this.params.hue.value);
      this.gl.uniform1f(this.uniforms.intensity, this.params.intensity.value);
      this.gl.uniform1f(this.uniforms.rot4dXW, this.params.rot4dXW.value);
      this.gl.uniform1f(this.uniforms.rot4dYW, this.params.rot4dYW.value);
      this.gl.uniform1f(this.uniforms.rot4dZW, this.params.rot4dZW.value);

      this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }

    destroy() {
      this.animator.stopAll();
      if (this.gl && this.program) this.gl.deleteProgram(this.program);
      if (this.gl && this.buffer) this.gl.deleteBuffer(this.buffer);
    }
  }

  // ============================================
  // SCROLL CHOREOGRAPHY SYSTEM
  // ============================================

  class ScrollChoreographer {
    constructor(enhancer) {
      this.enhancer = enhancer;
      this.isLocked = false;
      this.scrollState = 0; // Current choreography state
      this.maxStates = 5;
      this.lockDuration = 1200; // ms
      this.wheelTimeout = null;
      this.deltaAccumulator = 0;
      this.threshold = 100; // Delta threshold for state change

      this.init();
    }

    init() {
      window.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
    }

    handleWheel(e) {
      // Accumulate wheel delta
      this.deltaAccumulator += Math.abs(e.deltaY);

      // Clear previous timeout
      if (this.wheelTimeout) {
        clearTimeout(this.wheelTimeout);
      }

      // Debounce - trigger state change after accumulation settles
      this.wheelTimeout = setTimeout(() => {
        if (this.deltaAccumulator >= this.threshold && !this.isLocked) {
          this.advanceState(e.deltaY > 0 ? 1 : -1);
          this.deltaAccumulator = 0;
        } else {
          this.deltaAccumulator = 0;
        }
      }, 50);

      // Prevent scroll if locked
      if (this.isLocked) {
        e.preventDefault();
      }
    }

    advanceState(direction) {
      const newState = Math.max(0, Math.min(this.maxStates, this.scrollState + direction));

      if (newState !== this.scrollState) {
        this.scrollState = newState;
        this.performStateTransform(newState);
        this.lockScroll();
      }
    }

    performStateTransform(state) {
      const cards = [...this.enhancer.visualizers.keys()];

      cards.forEach((card, index) => {
        const data = this.enhancer.visualizers.get(card);
        if (!data) return;

        // State-based transformations
        const transforms = this.getStateTransforms(state, index, cards.length);

        // Apply CSS transforms to card
        card.style.transition = 'transform 1s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.8s ease';
        card.style.transform = transforms.cardTransform;
        card.style.opacity = transforms.opacity;

        // Morph visualizer parameters
        const viz = data.visualizer;
        if (transforms.vizParams) {
          viz.animator.animate('geometry-morph', { value: viz.geometry },
            viz.geometry, transforms.vizParams.geometry, 1000, 'easeInOutCubic');

          viz.animator.animate('gridDensity-scroll', viz.params.gridDensity,
            viz.params.gridDensity.value, transforms.vizParams.gridDensity, 1000, 'easeInOutCubic');

          viz.animator.animate('morphFactor-scroll', viz.params.morphFactor,
            viz.params.morphFactor.value, transforms.vizParams.morphFactor, 1000, 'easeInOutCubic');
        }
      });
    }

    getStateTransforms(state, index, total) {
      // Choreography patterns based on scroll state
      const patterns = {
        0: { // Initial state
          cardTransform: 'translateY(0) scale(1) rotateY(0deg)',
          opacity: 1,
          vizParams: { geometry: index % 24, gridDensity: 15, morphFactor: 1.0 }
        },
        1: { // First scroll - cards fan out
          cardTransform: `translateX(${(index - total/2) * 20}px) scale(0.95) rotateY(${(index - total/2) * 5}deg)`,
          opacity: 1,
          vizParams: { geometry: (index * 3) % 24, gridDensity: 12, morphFactor: 1.3 }
        },
        2: { // Second scroll - grid formation
          cardTransform: `translateY(${Math.floor(index / 3) * 150}px) translateX(${(index % 3) * 250}px) scale(0.8)`,
          opacity: 1,
          vizParams: { geometry: (index * 5) % 24, gridDensity: 10, morphFactor: 1.6 }
        },
        3: { // Third scroll - circular arrangement
          cardTransform: `translateX(${Math.cos(index / total * Math.PI * 2) * 300}px) translateY(${Math.sin(index / total * Math.PI * 2) * 200}px) scale(0.7) rotateZ(${index / total * 360}deg)`,
          opacity: 0.9,
          vizParams: { geometry: (index * 7) % 24, gridDensity: 8, morphFactor: 1.8 }
        },
        4: { // Fourth scroll - stack
          cardTransform: `translateY(${index * 30}px) scale(${1 - index * 0.05}) translateZ(${-index * 50}px)`,
          opacity: 1 - index * 0.1,
          vizParams: { geometry: (index * 2) % 24, gridDensity: 6, morphFactor: 2.0 }
        },
        5: { // Final scroll - return to base
          cardTransform: 'translateY(0) scale(1) rotateY(0deg)',
          opacity: 1,
          vizParams: { geometry: index % 24, gridDensity: 15, morphFactor: 1.0 }
        }
      };

      return patterns[state] || patterns[0];
    }

    lockScroll() {
      this.isLocked = true;
      document.body.style.overflow = 'hidden';

      setTimeout(() => {
        this.isLocked = false;
        document.body.style.overflow = '';
      }, this.lockDuration);
    }

    destroy() {
      window.removeEventListener('wheel', this.handleWheel);
      if (this.wheelTimeout) clearTimeout(this.wheelTimeout);
      document.body.style.overflow = '';
    }
  }

  // ============================================
  // CARD INTEGRATION SYSTEM
  // ============================================

  class CardPolytopeEnhancer {
    constructor() {
      this.visualizers = new Map();
      this.animationFrame = null;
      this.isRunning = false;
      this.scrollChoreographer = null;

      this.cardSelectors = [
        '.signal-card',
        '.capability-card',
        '.platform-card',
        '.research-lab',
        '.step'
      ];

      this.init();
    }

    init() {
      const cards = [];
      this.cardSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(card => cards.push(card));
      });

      cards.forEach((card, index) => {
        this.setupCard(card, index);
      });

      // Initialize scroll choreography
      this.scrollChoreographer = new ScrollChoreographer(this);

      this.startRenderLoop();
    }

    setupCard(card, index) {
      const canvas = document.createElement('canvas');
      canvas.className = 'polytope-card-viz';
      canvas.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.5s ease;
        mix-blend-mode: screen;
        border-radius: inherit;
        z-index: 1;
      `;

      const position = getComputedStyle(card).position;
      if (position === 'static') {
        card.style.position = 'relative';
      }

      card.style.overflow = 'hidden';
      card.insertBefore(canvas, card.firstChild);

      const mode = index % 2 === 0 ? 'quantum' : 'holographic';
      const visualizer = new CardPolytopeVisualizer(canvas, mode);
      visualizer.resize();

      this.visualizers.set(card, { canvas, visualizer, isVisible: false });

      // Hover events with flourishes
      card.addEventListener('mouseenter', () => {
        const data = this.visualizers.get(card);
        if (data) {
          canvas.style.opacity = '1';
          data.isVisible = true;
          data.visualizer.flourishEnter();
        }
      });

      card.addEventListener('mouseleave', () => {
        const data = this.visualizers.get(card);
        if (data) {
          canvas.style.opacity = '0';
          data.isVisible = false;
          data.visualizer.flourishExit();
        }
      });

      card.addEventListener('mousemove', (e) => {
        const data = this.visualizers.get(card);
        if (data && data.isVisible) {
          const rect = card.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width;
          const y = (e.clientY - rect.top) / rect.height;
          data.visualizer.setMousePosition(x, y);
        }
      });
    }

    startRenderLoop() {
      if (this.isRunning) return;
      this.isRunning = true;

      const render = () => {
        this.visualizers.forEach(({ visualizer }) => {
          visualizer.render();
        });

        this.animationFrame = requestAnimationFrame(render);
      };

      render();
    }

    destroy() {
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
      }
      if (this.scrollChoreographer) {
        this.scrollChoreographer.destroy();
      }
      this.visualizers.forEach(({ visualizer, canvas }) => {
        visualizer.destroy();
        canvas.remove();
      });
      this.visualizers.clear();
    }
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  function init() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      console.log('Polytope visualizations disabled due to reduced motion preference');
      return;
    }

    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.log('WebGL not supported, polytope visualizations disabled');
      return;
    }

    window.cardPolytopeEnhancer = new CardPolytopeEnhancer();
    console.log('Card polytope visualizer with flourishes & scroll choreography initialized');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.CardPolytopeVisualizer = CardPolytopeVisualizer;
  window.CardPolytopeEnhancer = CardPolytopeEnhancer;
  window.ScrollChoreographer = ScrollChoreographer;

})();

/**
 * © 2025 Paul Phillips - Clear Seas Solutions LLC
 * "The Revolution Will Not be in a Structured Format"
 */
