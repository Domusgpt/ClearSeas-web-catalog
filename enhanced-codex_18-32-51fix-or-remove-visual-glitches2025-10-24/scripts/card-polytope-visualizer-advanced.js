/**
 * Clear Seas Advanced Scroll Choreography System
 * Section-locked headers, tick-based animation, visualizer detachment, parallax
 *
 * Inspired by https://weare-simone.webflow.io/
 *
 * © 2025 Paul Phillips - Clear Seas Solutions LLC
 * "The Revolution Will Not be in a Structured Format"
 */

(function() {
  'use strict';

  // ============================================
  // PARAMETER ANIMATOR (Enhanced)
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
        easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
        easeOutQuart: t => 1 - (--t) * t * t * t,
        easeInOutQuart: t => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t
      };

      const ease = easingFunctions[easing] || easingFunctions.easeOutCubic;

      const update = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = ease(progress);

        if (typeof target === 'object' && target.hasOwnProperty('value')) {
          target.value = from + (to - from) * easedProgress;
        } else {
          return; // Can't animate non-object
        }

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
  // CARD POLYTOPE VISUALIZER (Same as before)
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

      // Current animated parameters
      this.params = {
        gridDensity: { value: 15 },
        morphFactor: { value: 1.0 },
        chaos: { value: 0.2 },
        speed: { value: 1.0 },
        hue: { value: Math.random() * 360 },
        intensity: { value: 0.6 },
        rot4dXW: { value: 0 },
        rot4dYW: { value: 0 },
        rot4dZW: { value: 0 },
        scale: { value: 1.0 },
        opacity: { value: 1.0 }
      };

      this.animator = new ParameterAnimator();
      this.init();
    }

    init() {
      this.initShaders();
      this.initBuffers();
      this.resize();
    }

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
    }

    render() {
      if (!this.program) return;

      this.resize();
      this.gl.useProgram(this.program);
      this.gl.clearColor(0, 0, 0, 0);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);

      const time = Date.now() - this.startTime;

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
  // ADVANCED SCROLL CHOREOGRAPHY SYSTEM
  // ============================================

  class AdvancedScrollChoreographer {
    constructor(enhancer) {
      this.enhancer = enhancer;
      this.sections = [];
      this.currentSectionIndex = -1;
      this.sectionProgress = 0; // 0-1 progress through current section's choreography
      this.ticksPerSection = 4; // 3-4 ticks as requested
      this.currentTick = 0;
      this.isLocked = false;
      this.tickDuration = 800; // ms per tick
      this.deltaAccumulator = 0;
      this.threshold = 50; // Lower threshold for more responsive ticks
      this.wheelTimeout = null;

      this.init();
    }

    init() {
      this.identifySections();
      this.createProgressIndicator();
      window.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
      window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });

      // Initial section detection
      this.handleScroll();
    }

    createProgressIndicator() {
      // Visual feedback during scroll lock
      this.progressBar = document.createElement('div');
      this.progressBar.style.cssText = `
        position: fixed;
        bottom: 40px;
        left: 50%;
        transform: translateX(-50%);
        width: 200px;
        height: 4px;
        background: rgba(0, 212, 255, 0.2);
        border-radius: 2px;
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: 10000;
        overflow: hidden;
      `;

      this.progressFill = document.createElement('div');
      this.progressFill.style.cssText = `
        width: 0%;
        height: 100%;
        background: linear-gradient(90deg, #00d4ff, #ff006e);
        border-radius: 2px;
        transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
      `;

      this.progressBar.appendChild(this.progressFill);
      document.body.appendChild(this.progressBar);

      // Tick indicator dots
      this.tickIndicator = document.createElement('div');
      this.tickIndicator.style.cssText = `
        position: fixed;
        bottom: 50px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 8px;
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: 10001;
      `;

      for (let i = 0; i < this.ticksPerSection; i++) {
        const dot = document.createElement('div');
        dot.className = `tick-dot tick-${i}`;
        dot.style.cssText = `
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          border: 2px solid rgba(0, 212, 255, 0.5);
          transition: all 0.3s ease;
        `;
        this.tickIndicator.appendChild(dot);
      }

      document.body.appendChild(this.tickIndicator);
    }

    updateProgressIndicator() {
      const progressPercent = (this.currentTick / this.ticksPerSection) * 100;

      this.progressBar.style.opacity = this.isLocked ? '1' : '0';
      this.tickIndicator.style.opacity = this.isLocked ? '1' : '0';
      this.progressFill.style.width = `${progressPercent}%`;

      // Update dot indicators
      const dots = this.tickIndicator.querySelectorAll('.tick-dot');
      dots.forEach((dot, i) => {
        if (i < this.currentTick) {
          dot.style.background = 'rgba(0, 212, 255, 0.9)';
          dot.style.transform = 'scale(1.2)';
        } else if (i === this.currentTick) {
          dot.style.background = 'rgba(255, 0, 110, 0.9)';
          dot.style.transform = 'scale(1.4)';
          dot.style.boxShadow = '0 0 20px rgba(255, 0, 110, 0.8)';
        } else {
          dot.style.background = 'rgba(255, 255, 255, 0.2)';
          dot.style.transform = 'scale(1)';
          dot.style.boxShadow = 'none';
        }
      });
    }

    identifySections() {
      // Find all major sections by their IDs
      const sectionElements = document.querySelectorAll('section[id]');

      sectionElements.forEach(section => {
        const header = section.querySelector('.section-heading h2, h2');
        if (header) {
          this.sections.push({
            element: section,
            header: header,
            id: section.id,
            progress: 0,
            tick: 0,
            locked: false
          });
        }
      });

      console.log(`Found ${this.sections.length} sections for choreography`);
    }

    handleScroll() {
      if (this.isLocked) return;

      // Detect which section is in view
      const viewportCenter = window.innerHeight / 2;

      this.sections.forEach((section, index) => {
        const rect = section.header.getBoundingClientRect();
        const headerCenter = rect.top + rect.height / 2;

        // Check if header is near viewport center
        if (Math.abs(headerCenter - viewportCenter) < 200) {
          if (this.currentSectionIndex !== index) {
            this.enterSection(index);
          }
        }
      });
    }

    handleWheel(e) {
      if (this.isLocked) {
        e.preventDefault();
        return;
      }

      this.deltaAccumulator += Math.abs(e.deltaY);

      if (this.wheelTimeout) {
        clearTimeout(this.wheelTimeout);
      }

      this.wheelTimeout = setTimeout(() => {
        if (this.deltaAccumulator >= this.threshold) {
          const direction = e.deltaY > 0 ? 1 : -1;
          this.processTick(direction);
          this.deltaAccumulator = 0;
        }
      }, 30);
    }

    enterSection(index) {
      console.log(`Entering section: ${this.sections[index].id}`);

      this.currentSectionIndex = index;
      this.currentTick = 0;
      this.sectionProgress = 0;

      const section = this.sections[index];

      // Lock header in center
      this.lockHeaderInCenter(section);

      // Start section choreography
      this.performSectionChoreography(0);
    }

    lockHeaderInCenter(section) {
      // Calculate offset to center header
      const rect = section.header.getBoundingClientRect();
      const viewportCenter = window.innerHeight / 2;
      const headerCenter = rect.top + rect.height / 2;
      const offset = headerCenter - viewportCenter;

      // Smooth scroll to center the header
      window.scrollBy({
        top: offset,
        behavior: 'smooth'
      });
    }

    processTick(direction) {
      if (this.currentSectionIndex === -1) return;

      const section = this.sections[this.currentSectionIndex];

      // Advance or retreat tick
      this.currentTick = Math.max(0, Math.min(this.ticksPerSection, this.currentTick + direction));

      // Calculate progress (0-1)
      this.sectionProgress = this.currentTick / this.ticksPerSection;

      console.log(`Section ${section.id}: Tick ${this.currentTick}/${this.ticksPerSection} (${Math.round(this.sectionProgress * 100)}%)`);

      // Update progress indicator
      this.updateProgressIndicator();

      // Lock scroll during transition
      this.lockScroll();

      // Perform DRAMATIC choreography for this tick
      this.performSectionChoreography(this.sectionProgress);

      // If we've completed all ticks, unlock section
      if (this.currentTick === this.ticksPerSection) {
        setTimeout(() => {
          console.log(`Section ${section.id} choreography complete, unlocking`);
          section.locked = false;
          this.updateProgressIndicator(); // Hide indicator
        }, this.tickDuration);
      }
    }

    performSectionChoreography(progress) {
      const section = this.sections[this.currentSectionIndex];

      // Get all cards in this section
      const cards = Array.from(section.element.querySelectorAll(
        '.signal-card, .capability-card, .platform-card, .research-lab, .step'
      ));

      // Apply choreography based on section ID and progress
      switch(section.id) {
        case 'hero':
          this.choreographHero(cards, progress);
          break;
        case 'capabilities':
          this.choreographCapabilities(cards, progress);
          break;
        case 'products':
          this.choreographProducts(cards, progress);
          break;
        case 'research':
          this.choreographResearch(cards, progress);
          break;
        case 'engagement':
          this.choreographEngagement(cards, progress);
          break;
        default:
          this.choreographGeneric(cards, progress);
      }
    }

    // ============================================
    // SECTION-SPECIFIC CHOREOGRAPHY
    // ============================================

    choreographHero(cards, progress) {
      // Each tick = dramatic state change (0, 0.25, 0.5, 0.75, 1.0)
      const tick = Math.floor(progress * this.ticksPerSection);

      cards.forEach((card, i) => {
        const data = this.enhancer.visualizers.get(card);
        if (!data) return;

        const canvas = data.canvas;
        const viz = data.visualizer;

        // TICK-BASED DISCRETE STATES with smooth parameter transitions
        canvas.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        card.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';

        switch(tick) {
          case 0: // TICK 1: Explode from cards
            canvas.style.position = 'absolute';
            canvas.style.transform = `scale(2) rotate(${i * 45}deg)`;
            canvas.style.opacity = '1';
            canvas.style.filter = 'blur(0px)';

            // Animate visualizer parameters dramatically
            viz.animator.animate('gridDensity', viz.params.gridDensity, viz.params.gridDensity.value, 8, 800, 'easeOutQuart');
            viz.animator.animate('morphFactor', viz.params.morphFactor, viz.params.morphFactor.value, 2.0, 800, 'easeOutQuart');
            viz.animator.animate('speed', viz.params.speed, viz.params.speed.value, 3.0, 800, 'easeOutQuart');
            viz.animator.animate('intensity', viz.params.intensity, viz.params.intensity.value, 0.9, 800, 'easeOutQuart');

            // Change geometry dramatically
            viz.geometry = (viz.geometry + 8) % 24;
            break;

          case 1: // TICK 2: Detach and move to background
            canvas.style.position = 'fixed';
            canvas.style.zIndex = '-1';
            canvas.style.left = '0';
            canvas.style.top = '0';
            canvas.style.width = '100vw';
            canvas.style.height = '100vh';
            canvas.style.transform = 'scale(1) rotate(0deg)';
            canvas.style.filter = 'blur(2px)';
            canvas.style.opacity = '0.6';

            // Spin visualizers dramatically
            viz.animator.animate('rot4dXW', viz.params.rot4dXW, viz.params.rot4dXW.value, Math.PI * 2, 800, 'easeInOutQuart');
            viz.animator.animate('rot4dYW', viz.params.rot4dYW, viz.params.rot4dYW.value, Math.PI * 1.5, 800, 'easeInOutQuart');
            viz.animator.animate('gridDensity', viz.params.gridDensity, viz.params.gridDensity.value, 20, 800, 'easeInOutCubic');
            viz.animator.animate('morphFactor', viz.params.morphFactor, viz.params.morphFactor.value, 1.2, 800, 'easeInOutCubic');

            // Cards pop forward
            card.style.transform = 'translateZ(150px) scale(1.1)';
            card.style.filter = 'brightness(1.3) saturate(1.2)';
            card.style.boxShadow = '0 50px 100px rgba(0, 212, 255, 0.4)';
            break;

          case 2: // TICK 3: Move to text whitespace
            // Find section heading area
            const textArea = card.closest('section')?.querySelector('.section-heading');
            if (textArea) {
              const textRect = textArea.getBoundingClientRect();

              canvas.style.position = 'fixed';
              canvas.style.left = `${textRect.left}px`;
              canvas.style.top = `${textRect.top}px`;
              canvas.style.width = `${textRect.width}px`;
              canvas.style.height = `${textRect.height}px`;
              canvas.style.zIndex = '0';
              canvas.style.opacity = '0.4';
              canvas.style.mixBlendMode = 'color-dodge';
              canvas.style.filter = 'blur(4px) saturate(2)';
            }

            // Change geometry and parameters
            viz.geometry = (i * 7 + 16) % 24; // Jump to different geometry
            viz.animator.animate('gridDensity', viz.params.gridDensity, viz.params.gridDensity.value, 12, 800, 'easeOutCubic');
            viz.animator.animate('morphFactor', viz.params.morphFactor, viz.params.morphFactor.value, 1.6, 800, 'easeOutCubic');
            viz.animator.animate('chaos', viz.params.chaos, viz.params.chaos.value, 0.5, 800, 'easeOutCubic');
            viz.animator.animate('hue', viz.params.hue, viz.params.hue.value, (viz.params.hue.value + 120) % 360, 800, 'easeInOutCubic');

            // Cards shrink and fade
            card.style.transform = 'translateZ(0) scale(0.9)';
            card.style.opacity = '0.7';
            card.style.filter = 'brightness(0.8)';
            break;

          case 3: // TICK 4: Return to cards
            canvas.style.position = 'absolute';
            canvas.style.left = '0';
            canvas.style.top = '0';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.zIndex = '1';
            canvas.style.transform = 'scale(1) rotate(0deg)';
            canvas.style.opacity = '0';
            canvas.style.filter = 'blur(0px)';
            canvas.style.mixBlendMode = 'screen';

            // Reset parameters
            viz.animator.animate('gridDensity', viz.params.gridDensity, viz.params.gridDensity.value, 15, 800, 'easeInOutCubic');
            viz.animator.animate('morphFactor', viz.params.morphFactor, viz.params.morphFactor.value, 1.0, 800, 'easeInOutCubic');
            viz.animator.animate('speed', viz.params.speed, viz.params.speed.value, 1.0, 800, 'easeInOutCubic');
            viz.animator.animate('rot4dXW', viz.params.rot4dXW, viz.params.rot4dXW.value, 0, 800, 'easeInOutCubic');
            viz.animator.animate('rot4dYW', viz.params.rot4dYW, viz.params.rot4dYW.value, 0, 800, 'easeInOutCubic');
            viz.animator.animate('chaos', viz.params.chaos, viz.params.chaos.value, 0.2, 800, 'easeInOutCubic');

            // Cards return to normal
            card.style.transform = 'translateZ(0) scale(1)';
            card.style.opacity = '1';
            card.style.filter = 'brightness(1)';
            card.style.boxShadow = 'none';
            break;
        }
      });
    }

    choreographCapabilities(cards, progress) {
      const tick = Math.floor(progress * this.ticksPerSection);

      cards.forEach((card, i) => {
        const data = this.enhancer.visualizers.get(card);
        if (!data) return;

        const viz = data.visualizer;
        const canvas = data.canvas;

        canvas.style.transition = 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)';
        card.style.transition = 'all 0.8s cubic-bezier(0.23, 1, 0.32, 1)';

        switch(tick) {
          case 0: // TICK 1: Expand and rotate
            card.style.transform = `scale(1.2) rotate(${i * 15}deg)`;
            canvas.style.opacity = '1';

            viz.geometry = (i * 4) % 24;
            viz.animator.animate('gridDensity', viz.params.gridDensity, viz.params.gridDensity.value, 10, 800, 'easeOutQuart');
            viz.animator.animate('morphFactor', viz.params.morphFactor, viz.params.morphFactor.value, 1.5, 800, 'easeOutQuart');
            viz.animator.animate('rot4dZW', viz.params.rot4dZW, viz.params.rot4dZW.value, Math.PI, 800, 'easeOutQuart');
            break;

          case 1: // TICK 2: Grid formation
            const col = i % 3;
            const row = Math.floor(i / 3);
            card.style.transform = `translate(${col * 250}px, ${row * 200}px) scale(0.85)`;

            viz.geometry = (i * 6 + 8) % 24; // Different geometry
            viz.animator.animate('gridDensity', viz.params.gridDensity, viz.params.gridDensity.value, 18, 800, 'easeInOutCubic');
            viz.animator.animate('morphFactor', viz.params.morphFactor, viz.params.morphFactor.value, 1.2, 800, 'easeInOutCubic');
            viz.animator.animate('hue', viz.params.hue, viz.params.hue.value, (viz.params.hue.value + 180) % 360, 800, 'easeInOutCubic');
            break;

          case 2: // TICK 3: Migrate to text whitespace
            const textArea = card.closest('.container')?.querySelector('.section-heading');
            if (textArea) {
              const textRect = textArea.getBoundingClientRect();

              canvas.style.position = 'fixed';
              canvas.style.left = `${textRect.left + i * 50}px`;
              canvas.style.top = `${textRect.top + Math.sin(i) * 40}px`;
              canvas.style.width = `${textRect.width * 0.3}px`;
              canvas.style.height = `${textRect.height * 0.5}px`;
              canvas.style.zIndex = '0';
              canvas.style.opacity = '0.5';
              canvas.style.mixBlendMode = 'color-dodge';
              canvas.style.filter = 'blur(3px) saturate(3)';
            }

            viz.geometry = (i * 3 + 16) % 24;
            viz.animator.animate('speed', viz.params.speed, viz.params.speed.value, 2.5, 800, 'easeOutCubic');
            viz.animator.animate('chaos', viz.params.chaos, viz.params.chaos.value, 0.6, 800, 'easeOutCubic');

            card.style.opacity = '0.6';
            break;

          case 3: // TICK 4: Return
            canvas.style.position = 'absolute';
            canvas.style.left = '0';
            canvas.style.top = '0';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.zIndex = '1';
            canvas.style.opacity = '0';
            canvas.style.filter = 'blur(0px)';
            canvas.style.mixBlendMode = 'screen';

            card.style.transform = 'translate(0, 0) scale(1) rotate(0deg)';
            card.style.opacity = '1';

            viz.animator.animate('gridDensity', viz.params.gridDensity, viz.params.gridDensity.value, 15, 800, 'easeInOutCubic');
            viz.animator.animate('morphFactor', viz.params.morphFactor, viz.params.morphFactor.value, 1.0, 800, 'easeInOutCubic');
            viz.animator.animate('speed', viz.params.speed, viz.params.speed.value, 1.0, 800, 'easeInOutCubic');
            viz.animator.animate('chaos', viz.params.chaos, viz.params.chaos.value, 0.2, 800, 'easeInOutCubic');
            break;
        }
      });
    }

    choreographProducts(cards, progress) {
      // Circular orbit choreography
      const center = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2
      };

      cards.forEach((card, i) => {
        const data = this.enhancer.visualizers.get(card);
        if (!data) return;

        const angle = (i / cards.length) * Math.PI * 2 + progress * Math.PI * 2;
        const radius = 300 + progress * 100;

        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        card.style.transition = 'transform 600ms ease-out';
        card.style.transform = `translate(${x}px, ${y}px) rotate(${angle}rad) scale(${0.8 + progress * 0.2})`;

        const viz = data.visualizer;
        viz.params.rot4dXW.value = angle;
        viz.params.rot4dYW.value = angle * 0.7;
        viz.params.morphFactor.value = 1.0 + progress * 1.5;
        viz.params.speed.value = 1.0 + progress * 2.0;
      });
    }

    choreographResearch(cards, progress) {
      // Wave pattern choreography
      cards.forEach((card, i) => {
        const data = this.enhancer.visualizers.get(card);
        if (!data) return;

        const wave = Math.sin(i * 0.5 + progress * Math.PI * 2);

        card.style.transition = 'transform 700ms cubic-bezier(0.34, 1.56, 0.64, 1)';
        card.style.transform = `translateY(${wave * 100}px) translateX(${progress * (i % 2 === 0 ? 50 : -50)}px) rotateX(${wave * 10}deg)`;

        const viz = data.visualizer;
        viz.params.gridDensity.value = 15 + wave * 5;
        viz.params.chaos.value = 0.2 + progress * 0.3;
        viz.geometry = Math.floor((i * 5 + progress * 24)) % 24;
      });
    }

    choreographEngagement(cards, progress) {
      // Sequential reveal with parallax
      cards.forEach((card, i) => {
        const data = this.enhancer.visualizers.get(card);
        if (!data) return;

        const delay = i * 0.25;
        const p = Math.max(0, Math.min(1, (progress - delay) * 2));

        // Deep parallax effect
        const depth = i * 100;
        card.style.transition = 'all 900ms cubic-bezier(0.19, 1, 0.22, 1)';
        card.style.transform = `translateZ(${-depth + p * depth}px) scale(${0.7 + p * 0.3}) rotateY(${(1 - p) * 90}deg)`;
        card.style.opacity = `${p}`;

        const viz = data.visualizer;
        viz.params.intensity.value = 0.3 + p * 0.5;
        viz.params.gridDensity.value = 20 - p * 10;
        viz.params.morphFactor.value = 2.0 - p * 1.0;
      });
    }

    choreographGeneric(cards, progress) {
      // Fallback choreography
      cards.forEach((card, i) => {
        const data = this.enhancer.visualizers.get(card);
        if (!data) return;

        card.style.transition = 'transform 800ms ease-out';
        card.style.transform = `scale(${0.9 + progress * 0.1}) translateY(${(1 - progress) * 50}px)`;

        const viz = data.visualizer;
        viz.params.morphFactor.value = 1.0 + progress * 0.5;
        viz.geometry = Math.floor((i + progress * 10)) % 24;
      });
    }

    lockScroll() {
      this.isLocked = true;
      document.body.style.overflow = 'hidden';

      setTimeout(() => {
        this.isLocked = false;
        document.body.style.overflow = '';
      }, this.tickDuration);
    }

    destroy() {
      window.removeEventListener('wheel', this.handleWheel);
      window.removeEventListener('scroll', this.handleScroll);
      if (this.wheelTimeout) clearTimeout(this.wheelTimeout);
      document.body.style.overflow = '';
    }
  }

  // ============================================
  // CARD INTEGRATION SYSTEM
  // ============================================

  class AdvancedCardEnhancer {
    constructor() {
      this.visualizers = new Map();
      this.animationFrame = null;
      this.isRunning = false;
      this.choreographer = null;

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

      // Initialize advanced scroll choreography
      this.choreographer = new AdvancedScrollChoreographer(this);

      this.startRenderLoop();
    }

    setupCard(card, index) {
      const canvas = document.createElement('canvas');
      canvas.className = 'polytope-card-viz-advanced';
      canvas.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.5s ease, transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
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

      // Hover events (simplified for advanced choreography)
      card.addEventListener('mouseenter', () => {
        const data = this.visualizers.get(card);
        if (data) {
          canvas.style.opacity = '0.8';
          data.isVisible = true;
        }
      });

      card.addEventListener('mouseleave', () => {
        const data = this.visualizers.get(card);
        if (data) {
          canvas.style.opacity = '0';
          data.isVisible = false;
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
      if (this.choreographer) {
        this.choreographer.destroy();
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
      console.log('Advanced choreography disabled due to reduced motion preference');
      return;
    }

    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.log('WebGL not supported, advanced choreography disabled');
      return;
    }

    window.advancedCardEnhancer = new AdvancedCardEnhancer();
    console.log('Advanced scroll choreography system initialized');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.AdvancedCardEnhancer = AdvancedCardEnhancer;
  window.AdvancedScrollChoreographer = AdvancedScrollChoreographer;

})();

/**
 * © 2025 Paul Phillips - Clear Seas Solutions LLC
 * "The Revolution Will Not be in a Structured Format"
 */
