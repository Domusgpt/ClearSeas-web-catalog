/**
 * Clear Seas Smooth Scroll Choreography
 * NO scroll locking - smooth parallax response to scroll position
 * Inspired by https://weare-simone.webflow.io/
 *
 * © 2025 Paul Phillips - Clear Seas Solutions LLC
 * "The Revolution Will Not be in a Structured Format"
 */

(function() {
  'use strict';

  // ============================================
  // SMOOTH SCROLL ENGINE
  // ============================================

  class SmoothScrollEngine {
    constructor() {
      this.scrollY = 0;
      this.targetScrollY = 0;
      this.velocity = 0;
      this.ease = 0.08; // Smooth interpolation
      this.isRunning = false;

      this.init();
    }

    init() {
      window.addEventListener('scroll', () => {
        this.targetScrollY = window.scrollY;
      });

      this.start();
    }

    start() {
      if (this.isRunning) return;
      this.isRunning = true;

      const update = () => {
        // Smooth interpolation toward target
        this.velocity += (this.targetScrollY - this.scrollY) * this.ease;
        this.velocity *= 0.9; // Damping
        this.scrollY += this.velocity;

        // Trigger custom event with smooth scroll position
        window.dispatchEvent(new CustomEvent('smoothscroll', {
          detail: { scrollY: this.scrollY, velocity: this.velocity }
        }));

        requestAnimationFrame(update);
      };

      update();
    }
  }

  // ============================================
  // PARAMETER ANIMATOR
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

        if (typeof target === 'object' && target.hasOwnProperty('value')) {
          target.value = from + (to - from) * easedProgress;
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

    stopAll() {
      this.animations.forEach((anim, key) => {
        clearTimeout(anim.timer);
      });
      this.animations.clear();
    }
  }

  // ============================================
  // CARD POLYTOPE VISUALIZER (WebGL)
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

      // Animated parameters
      this.params = {
        gridDensity: { value: 15 },
        morphFactor: { value: 1.0 },
        chaos: { value: 0.2 },
        speed: { value: 1.0 },
        hue: { value: Math.random() * 360 },
        intensity: { value: 0.6 },
        rot4dXW: { value: 0 },
        rot4dYW: { value: 0 },
        rot4dZW: { value: 0 }
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
  // SMOOTH PARALLAX CHOREOGRAPHER
  // NO SCROLL LOCKING - scroll position drives animations
  // ============================================

  class SmoothParallaxChoreographer {
    constructor(enhancer) {
      this.enhancer = enhancer;
      this.sections = [];
      this.smoothScrollEngine = new SmoothScrollEngine();

      this.init();
    }

    init() {
      this.identifySections();

      // Listen to smooth scroll updates
      window.addEventListener('smoothscroll', (e) => {
        this.updateChoreography(e.detail.scrollY, e.detail.velocity);
      });

      console.log(`Smooth parallax choreography initialized for ${this.sections.length} sections`);
    }

    identifySections() {
      const sectionElements = document.querySelectorAll('section[id]');

      sectionElements.forEach(section => {
        this.sections.push({
          element: section,
          id: section.id,
          cards: []
        });
      });
    }

    updateChoreography(scrollY, velocity) {
      this.sections.forEach(section => {
        const rect = section.element.getBoundingClientRect();
        const viewportHeight = window.innerHeight;

        // Calculate progress through section (0 = top of viewport, 1 = bottom of viewport)
        const sectionTop = rect.top;
        const sectionBottom = rect.bottom;
        const sectionHeight = rect.height;

        // Progress = 0 when section enters bottom of viewport
        // Progress = 1 when section exits top of viewport
        const rawProgress = 1 - ((sectionBottom) / (viewportHeight + sectionHeight));
        const progress = Math.max(0, Math.min(1, rawProgress));

        // Only animate if section is in viewport
        if (progress > 0 && progress < 1) {
          this.animateSection(section, progress, velocity);
        }
      });
    }

    animateSection(section, progress, velocity) {
      // Get all cards in this section
      const cards = Array.from(section.element.querySelectorAll(
        '.signal-card, .capability-card, .platform-card, .research-lab, .scroll-morph-card, .step'
      ));

      // Section-specific choreography
      switch(section.id) {
        case 'hero':
          this.choreographHero(cards, progress, velocity);
          break;
        case 'immersive':
          this.choreographImmersive(cards, progress, velocity);
          break;
        case 'capabilities':
          this.choreographCapabilities(cards, progress, velocity);
          break;
        case 'products':
          this.choreographProducts(cards, progress, velocity);
          break;
        case 'research':
          this.choreographResearch(cards, progress, velocity);
          break;
        case 'engagement':
          this.choreographEngagement(cards, progress, velocity);
          break;
        default:
          this.choreographGeneric(cards, progress, velocity);
      }
    }

    // ============================================
    // SECTION CHOREOGRAPHY - SMOOTH PARALLAX
    // ============================================

    choreographHero(cards, progress, velocity) {
      cards.forEach((card, i) => {
        const data = this.enhancer.visualizers.get(card);
        if (!data) return;

        const canvas = data.canvas;
        const viz = data.visualizer;

        // PARALLAX LAYERS - different speeds
        const cardSpeed = 1.0;
        const vizSpeed = 0.6; // Visualizers move slower (background effect)

        // Card parallax
        const cardY = progress * 50 * cardSpeed;
        const cardScale = 1 + progress * 0.1;

        card.style.transform = `translateY(${-cardY}px) scale(${cardScale})`;
        card.style.opacity = `${1 - progress * 0.3}`;

        // Visualizer parallax (slower)
        const vizY = progress * 80 * vizSpeed;
        canvas.style.transform = `translateY(${-vizY}px) scale(${1 + progress * 0.2})`;
        canvas.style.opacity = `${Math.sin(progress * Math.PI) * 0.8}`;

        // Progressive parameter changes
        viz.params.gridDensity.value = 15 - progress * 7;
        viz.params.morphFactor.value = 1.0 + progress * 1.2;
        viz.params.rot4dXW.value = progress * Math.PI * 2;
        viz.params.rot4dYW.value = progress * Math.PI * 1.5;
        viz.params.speed.value = 1.0 + progress * 2.0;

        // Geometry changes based on progress threshold
        if (progress > 0.5 && viz.geometry < 8) {
          viz.geometry = (viz.geometry + 8) % 24;
        }
      });
    }

    choreographImmersive(cards, progress, velocity) {
      cards.forEach((card) => {
        const data = this.enhancer.visualizers.get(card);
        if (!data) return;

        const canvas = data.canvas;
        const viz = data.visualizer;

        const float = Math.sin(progress * Math.PI * 2) * 25;
        const sway = Math.cos(progress * Math.PI) * 14;
        const depthScale = 1 + progress * 0.14;

        card.style.transform = `translate3d(${sway}px, ${-float}px, 0) scale(${depthScale})`;

        const baseOpacity = 0.45 + progress * 0.4 + Math.min(0.25, Math.abs(velocity) * 0.25);
        canvas.style.opacity = `${Math.min(0.95, baseOpacity)}`;
        canvas.style.filter = `blur(${(1.2 - Math.min(1, progress)) * 10 + 4}px) saturate(${130 + progress * 90}%)`;
        canvas.style.transform = `scale(${1.1 + progress * 0.25})`;

        viz.params.gridDensity.value = 18 - progress * 9;
        viz.params.morphFactor.value = 1.4 + progress * 1.4;
        viz.params.chaos.value = 0.22 + progress * 0.4 + Math.min(0.35, Math.abs(velocity) * 0.6);
        viz.params.intensity.value = 0.5 + progress * 0.35;
        viz.params.speed.value = 1.0 + progress * 1.25 + Math.min(0.6, Math.abs(velocity) * 0.5);
        viz.params.rot4dXW.value = progress * Math.PI * 1.1;
        viz.params.rot4dYW.value = progress * Math.PI * 1.7 + velocity * 0.4;
        viz.params.rot4dZW.value = progress * Math.PI * 0.9;
        viz.params.hue.value = (viz.params.hue.value + progress * 8 + velocity * 12) % 360;
      });
    }

    choreographCapabilities(cards, progress, velocity) {
      cards.forEach((card, i) => {
        const data = this.enhancer.visualizers.get(card);
        if (!data) return;

        const canvas = data.canvas;
        const viz = data.visualizer;

        // Staggered parallax per card
        const stagger = i * 0.05;
        const p = Math.max(0, Math.min(1, progress - stagger));

        // Multi-layer parallax
        const cardSpeed = 0.8 + i * 0.1; // Each card slightly different speed
        const cardY = p * 60 * cardSpeed;
        const cardX = Math.sin(p * Math.PI) * 30;

        card.style.transform = `translate(${cardX}px, ${-cardY}px) rotate(${p * 5}deg)`;

        // Visualizers move independently
        const vizY = p * 40 * 0.5;
        canvas.style.opacity = `${Math.sin(p * Math.PI) * 0.9}`;

        // Smooth parameter transitions
        viz.params.gridDensity.value = 15 - p * 8;
        viz.params.morphFactor.value = 1.0 + p * 1.5;
        viz.params.hue.value = (viz.params.hue.value + velocity * 0.5) % 360;

        // Geometry progression
        const targetGeom = Math.floor(p * 24);
        if (viz.geometry !== targetGeom) {
          viz.geometry = targetGeom;
        }
      });
    }

    choreographProducts(cards, progress, velocity) {
      // Circular orbit with smooth scroll response
      const orbitRadius = 100 + progress * 200;

      cards.forEach((card, i) => {
        const data = this.enhancer.visualizers.get(card);
        if (!data) return;

        const viz = data.visualizer;

        const angle = (i / cards.length) * Math.PI * 2 + progress * Math.PI;
        const x = Math.cos(angle) * orbitRadius;
        const y = Math.sin(angle) * orbitRadius * 0.5; // Elliptical

        card.style.transform = `translate(${x}px, ${y}px) rotate(${angle}rad) scale(${0.8 + progress * 0.4})`;

        // Visualizer rotation follows scroll
        viz.params.rot4dXW.value = angle;
        viz.params.rot4dYW.value = angle * 0.7;
        viz.params.morphFactor.value = 1.0 + progress * 1.8;
      });
    }

    choreographResearch(cards, progress, velocity) {
      // Wave pattern with velocity response
      cards.forEach((card, i) => {
        const data = this.enhancer.visualizers.get(card);
        if (!data) return;

        const viz = data.visualizer;

        const wave = Math.sin(i * 0.5 + progress * Math.PI * 3);
        const velocityEffect = Math.abs(velocity) * 0.05;

        card.style.transform = `translateY(${wave * 80}px) translateX(${progress * (i % 2 === 0 ? 40 : -40)}px) rotateX(${wave * 15}deg) scale(${1 + velocityEffect})`;

        viz.params.gridDensity.value = 15 + wave * 5;
        viz.params.chaos.value = 0.2 + progress * 0.4;
        viz.params.speed.value = 1.0 + velocityEffect * 2;

        viz.geometry = Math.floor((i * 5 + progress * 24)) % 24;
      });
    }

    choreographEngagement(cards, progress, velocity) {
      // Sequential reveal with deep parallax
      cards.forEach((card, i) => {
        const data = this.enhancer.visualizers.get(card);
        if (!data) return;

        const viz = data.visualizer;

        const delay = i * 0.15;
        const p = Math.max(0, Math.min(1, (progress - delay) * 1.5));

        // Deep parallax layers
        const depth = (1 - p) * 200;
        card.style.transform = `translateZ(${-depth}px) scale(${0.6 + p * 0.4}) rotateY(${(1 - p) * 45}deg)`;
        card.style.opacity = `${p}`;

        viz.params.intensity.value = 0.3 + p * 0.6;
        viz.params.gridDensity.value = 22 - p * 12;
        viz.params.morphFactor.value = 2.2 - p * 1.2;
      });
    }

    choreographGeneric(cards, progress, velocity) {
      cards.forEach((card, i) => {
        const data = this.enhancer.visualizers.get(card);
        if (!data) return;

        const viz = data.visualizer;

        // Simple parallax
        const parallaxY = progress * 40 * (1 - i * 0.1);
        card.style.transform = `translateY(${-parallaxY}px) scale(${0.95 + progress * 0.05})`;

        viz.params.morphFactor.value = 1.0 + progress * 0.8;
      });
    }
  }

  // ============================================
  // CARD INTEGRATION
  // ============================================

  class SmoothScrollCardEnhancer {
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
        '.scroll-morph-card',
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

      // Initialize smooth parallax choreography
      this.choreographer = new SmoothParallaxChoreographer(this);

      this.startRenderLoop();
    }

    setupCard(card, index) {
      const canvas = document.createElement('canvas');
      canvas.className = 'polytope-card-viz-smooth';
      canvas.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        opacity: 0;
        will-change: transform, opacity;
        mix-blend-mode: screen;
        border-radius: inherit;
        z-index: 1;
      `;

      const position = getComputedStyle(card).position;
      if (position === 'static') {
        card.style.position = 'relative';
      }

      const allowBleed = card.dataset.allowBleed === 'true';

      card.style.overflow = allowBleed ? 'visible' : 'hidden';
      card.style.willChange = 'transform, opacity';
      card.insertBefore(canvas, card.firstChild);

      if (allowBleed) {
        canvas.style.transition = 'opacity 0.6s ease, filter 0.8s ease, transform 0.8s ease';
        canvas.style.opacity = '0.55';
        canvas.style.transform = 'scale(1.12)';
        canvas.style.filter = 'blur(14px) saturate(140%)';
      }

      const mode = index % 2 === 0 ? 'quantum' : 'holographic';
      const visualizer = new CardPolytopeVisualizer(canvas, mode);
      visualizer.resize();

      this.visualizers.set(card, { canvas, visualizer, isVisible: allowBleed });

      if (!allowBleed) {
        // Hover events only for contained cards
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
      }

      card.addEventListener('mousemove', (e) => {
        const data = this.visualizers.get(card);
        if (!data) return;
        if (!allowBleed && !data.isVisible) return;

        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        data.visualizer.setMousePosition(x, y);
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
        // No destroy needed - no event listeners to clean
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
      console.log('Smooth scroll choreography disabled due to reduced motion preference');
      return;
    }

    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.log('WebGL not supported, smooth scroll choreography disabled');
      return;
    }

    window.smoothScrollCardEnhancer = new SmoothScrollCardEnhancer();
    console.log('Smooth parallax scroll choreography initialized');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.SmoothScrollCardEnhancer = SmoothScrollCardEnhancer;
  window.SmoothParallaxChoreographer = SmoothParallaxChoreographer;

})();

/**
 * © 2025 Paul Phillips - Clear Seas Solutions LLC
 * "The Revolution Will Not be in a Structured Format"
 */
