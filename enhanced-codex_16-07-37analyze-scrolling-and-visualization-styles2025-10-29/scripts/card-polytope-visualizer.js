/**
 * Clear Seas Card Polytope Visualizer
 * Extracted from VIB3+ Engine - Quantum & Holographic Systems Only
 * Lean, elegant WebGL shader integration for card hover interactions
 *
 * © 2025 Paul Phillips - Clear Seas Solutions LLC
 * "The Revolution Will Not be in a Structured Format"
 */

(function() {
  'use strict';

  // ============================================
  // CARD POLYTOPE VISUALIZER CLASS
  // ============================================

  class CardPolytopeVisualizer {
    constructor(canvas, mode = 'quantum') {
      this.canvas = canvas;
      this.mode = mode; // 'quantum' or 'holographic'

      // WebGL context
      this.gl = this.canvas.getContext('webgl', {
        alpha: true,
        premultipliedAlpha: false,
        antialias: false
      });

      if (!this.gl) {
        console.error('WebGL not supported');
        return;
      }

      // State
      this.mouseX = 0.5;
      this.mouseY = 0.5;
      this.startTime = Date.now();
      this.geometry = Math.floor(Math.random() * 24); // Random from 24 geometries

      // Parameters (controlled by mouse position)
      this.params = {
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

        // 6D rotation matrices
        mat4 rotateXY(float theta) {
          float c = cos(theta);
          float s = sin(theta);
          return mat4(c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        }

        mat4 rotateXW(float theta) {
          float c = cos(theta);
          float s = sin(theta);
          return mat4(c, 0, 0, -s, 0, 1, 0, 0, 0, 0, 1, 0, s, 0, 0, c);
        }

        mat4 rotateYW(float theta) {
          float c = cos(theta);
          float s = sin(theta);
          return mat4(1, 0, 0, 0, 0, c, 0, -s, 0, 0, 1, 0, 0, s, 0, c);
        }

        mat4 rotateZW(float theta) {
          float c = cos(theta);
          float s = sin(theta);
          return mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, c, -s, 0, 0, s, c);
        }

        vec3 project4Dto3D(vec4 p) {
          float w = 2.5 / (2.5 + p.w);
          return vec3(p.x * w, p.y * w, p.z * w);
        }

        // Polytope core warp functions
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

          if (coreIndex == 1) {
            return warpHypersphereCore(p, geometryIndex);
          }
          return p;
        }

        // Geometry lattice functions (8 base types)
        float hypercubeLattice(vec3 p, float gridSize) {
          vec3 grid = fract(p * gridSize);
          vec3 edges = min(grid, 1.0 - grid);
          float minEdge = min(min(edges.x, edges.y), edges.z);
          return 1.0 - smoothstep(0.0, 0.03, minEdge);
        }

        float sphereLattice(vec3 p, float gridSize) {
          vec3 cell = fract(p * gridSize) - 0.5;
          return 1.0 - smoothstep(0.15, 0.25, length(cell));
        }

        float waveLattice(vec3 p, float gridSize) {
          vec3 cell = fract(p * gridSize) - 0.5;
          float wave1 = sin(p.x * gridSize * 2.0 + u_time * 0.001 * u_speed);
          float wave2 = sin(p.y * gridSize * 1.8 + u_time * 0.0008 * u_speed);
          float amplitude = 1.0 - length(cell) * 2.0;
          return max(0.0, (wave1 + wave2) / 2.0 * amplitude);
        }

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

        vec3 hsv2rgb(vec3 c) {
          vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
          vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
          return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }

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

          // Holographic color
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

        mat4 rotateXY(float theta) {
          float c = cos(theta);
          float s = sin(theta);
          return mat4(c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        }

        mat4 rotateXW(float theta) {
          float c = cos(theta);
          float s = sin(theta);
          return mat4(c, 0, 0, -s, 0, 1, 0, 0, 0, 0, 1, 0, s, 0, 0, c);
        }

        mat4 rotateYW(float theta) {
          float c = cos(theta);
          float s = sin(theta);
          return mat4(1, 0, 0, 0, 0, c, 0, -s, 0, 0, 1, 0, 0, s, 0, c);
        }

        mat4 rotateZW(float theta) {
          float c = cos(theta);
          float s = sin(theta);
          return mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, c, -s, 0, 0, s, c);
        }

        vec3 project4Dto3D(vec4 p) {
          float w = 2.5 / (2.5 + p.w);
          return vec3(p.x * w, p.y * w, p.z * w);
        }

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

          if (coreIndex == 1) {
            return warpHypersphereCore(p, geometryIndex);
          }
          return p;
        }

        float tetrahedronLattice(vec3 p, float gridSize) {
          vec3 q = fract(p * gridSize) - 0.5;
          float d1 = length(q);
          float d2 = length(q - vec3(0.35, 0.0, 0.0));
          float d3 = length(q - vec3(0.0, 0.35, 0.0));
          float vertices = 1.0 - smoothstep(0.0, 0.03, min(min(d1, d2), d3));

          float shimmer = sin(u_time * 0.002) * 0.02;
          float edges = 1.0 - smoothstep(0.0, 0.015, abs(length(q.xy) - (0.18 + shimmer)));

          return max(vertices, edges * 0.7);
        }

        float hypercubeLattice(vec3 p, float gridSize) {
          vec3 grid = fract(p * gridSize);
          vec3 q = grid - 0.5;

          vec3 edges = 1.0 - smoothstep(0.0, 0.025, abs(q));
          float wireframe = max(max(edges.x, edges.y), edges.z);

          float glow = exp(-length(q) * 2.5) * 0.12;

          return wireframe * 0.8 + glow;
        }

        float getDynamicGeometry(vec3 p, float gridSize, float geometryType) {
          vec3 warped = applyCoreWarp(p, geometryType);
          float baseGeomFloat = geometryType - floor(geometryType / 8.0) * 8.0;
          int baseGeom = int(baseGeomFloat);

          if (baseGeom == 0) return tetrahedronLattice(warped, gridSize);
          else if (baseGeom == 1) return hypercubeLattice(warped, gridSize);
          else return hypercubeLattice(warped, gridSize);
        }

        vec3 hsv2rgb(vec3 c) {
          vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
          vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
          return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }

        void main() {
          vec2 uv = gl_FragCoord.xy / u_resolution.xy;
          float aspectRatio = u_resolution.x / u_resolution.y;
          uv.x *= aspectRatio;
          uv -= 0.5;

          float time = u_time * 0.0004 * u_speed;
          vec2 mouseOffset = (u_mouse - 0.5) * 0.25;

          vec4 p4d = vec4(uv + mouseOffset * 0.1,
                         sin(time * 0.1) * 0.15,
                         cos(time * 0.08) * 0.15);

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

      // Mouse position drives 4D rotation
      this.params.rot4dXW = (x - 0.5) * Math.PI * 2;
      this.params.rot4dYW = (y - 0.5) * Math.PI * 2;
      this.params.rot4dZW = ((x + y) / 2 - 0.5) * Math.PI;
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
      this.gl.uniform1f(this.uniforms.gridDensity, this.params.gridDensity);
      this.gl.uniform1f(this.uniforms.morphFactor, this.params.morphFactor);
      this.gl.uniform1f(this.uniforms.chaos, this.params.chaos);
      this.gl.uniform1f(this.uniforms.speed, this.params.speed);
      this.gl.uniform1f(this.uniforms.hue, this.params.hue);
      this.gl.uniform1f(this.uniforms.intensity, this.params.intensity);
      this.gl.uniform1f(this.uniforms.rot4dXW, this.params.rot4dXW);
      this.gl.uniform1f(this.uniforms.rot4dYW, this.params.rot4dYW);
      this.gl.uniform1f(this.uniforms.rot4dZW, this.params.rot4dZW);

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

  // ============================================
  // CARD INTEGRATION SYSTEM
  // ============================================

  class CardPolytopeEnhancer {
    constructor() {
      this.visualizers = new Map();
      this.animationFrame = null;
      this.isRunning = false;

      this.cardSelectors = [
        '.signal-card',
        '.capability-card',
        '.platform-card',
        '.research-lab',
        '.step'
      ];

      // Alternate quantum/holographic per card
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

      this.startRenderLoop();
    }

    setupCard(card, index) {
      // Create canvas overlay
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

      // Alternate between quantum and holographic
      const mode = index % 2 === 0 ? 'quantum' : 'holographic';
      const visualizer = new CardPolytopeVisualizer(canvas, mode);
      visualizer.resize();

      this.visualizers.set(card, { canvas, visualizer, isVisible: false });

      // Hover events
      card.addEventListener('mouseenter', () => {
        const data = this.visualizers.get(card);
        if (data) {
          canvas.style.opacity = '1';
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
    console.log('Card polytope visualizer initialized');
  }

  function shouldAutoInit() {
    if (window.__CARD_POLYTOPE_DISABLE_AUTOINIT__ === true) {
      return false;
    }
    const root = document.documentElement;
    if (root && root.dataset && root.dataset.cardPolytopeAutoinit === 'false') {
      return false;
    }
    return true;
  }

  if (shouldAutoInit()) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
      init();
    }
  }

  // Expose for external control
  window.CardPolytopeVisualizer = CardPolytopeVisualizer;
  window.CardPolytopeEnhancer = CardPolytopeEnhancer;
  window.initCardPolytopeEnhancer = init;

})();

/**
 * © 2025 Paul Phillips - Clear Seas Solutions LLC
 * "The Revolution Will Not be in a Structured Format"
 */
