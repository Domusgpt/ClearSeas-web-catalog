(function () {
  'use strict';

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const ACCENT_SELECTOR = '[data-vib3-accent]';
  const accentRegistry = new Map();
  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let webglSupport = null;

  const hasWebGLSupport = () => {
    if (webglSupport !== null) {
      return webglSupport;
    }
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      webglSupport = Boolean(gl);
    } catch (error) {
      webglSupport = false;
    }
    return webglSupport;
  };

  const clamp01 = (value) => {
    if (!Number.isFinite(value)) {
      return 0;
    }
    if (value <= 0) {
      return 0;
    }
    if (value >= 1) {
      return 1;
    }
    return value;
  };

  class Vib3AccentVisualizer {
    constructor(element, options = {}) {
      this.element = element;
      this.options = options;

      this.canvas = null;
      this.gl = null;
      this.program = null;
      this.buffer = null;
      this.uniforms = {};

      this.animationFrame = null;
      this.startTime = 0;
      this.resumeOffset = 0;
      this.elapsed = 0;
      this.isPaused = false;
      this.isDestroyed = false;

      this.pointer = { x: 0.5, y: 0.5, active: false };
      this.pointerTimeout = null;
      this.pointerUpdateQueued = false;
      this.pendingPointerEvent = null;

      this.autoOffset = options.offset || Math.random() * Math.PI * 2;
      this.hueBase = Number.isFinite(options.hue) ? options.hue : Math.random() * 360;
      this.geometryGroup = Number.isFinite(options.geometryGroup) ? options.geometryGroup : Math.floor(Math.random() * 3);
      this.geometryBase = Number.isFinite(options.geometryBase) ? options.geometryBase : Math.floor(Math.random() * 8);

      this.params = {
        gridDensity: options.gridDensity || 14,
        morphFactor: 0.7,
        chaos: 0.18,
        speed: 1.0,
        hue: this.hueBase,
        intensity: 0.55,
        rot4dXW: 0,
        rot4dYW: 0,
        rot4dZW: 0
      };

      this.geometryValue = this.geometryGroup * 8 + this.geometryBase + 0.5;
      this.lastTimestamp = 0;
      this.needsResize = true;
      this.resizeObserver = null;

      this.handlePointerMove = this.handlePointerMove.bind(this);
      this.handleResize = this.handleResize.bind(this);

      this.init();
    }

    init() {
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'vib3-accent-canvas';
      this.element.appendChild(this.canvas);

      this.gl = this.canvas.getContext('webgl', {
        alpha: true,
        antialias: false,
        premultipliedAlpha: false
      });

      if (!this.gl) {
        console.warn('[ClearSeas] Vib3 accent visualizer: WebGL unavailable');
        this.element.classList.add('is-static');
        return;
      }

      this.setupProgram();
      this.setupBuffers();
      this.captureUniforms();
      this.resize();
      this.bindEvents();

      this.element.classList.add('is-active');
      this.element.classList.remove('is-static');

      this.start();
    }

    setupProgram() {
      const vertexShaderSource = `
        attribute vec2 a_position;
        void main() {
          gl_Position = vec4(a_position, 0.0, 1.0);
        }
      `;

      const fragmentShaderSource = this.getQuantumShader();

      const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
      const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);

      if (!vertexShader || !fragmentShader) {
        return;
      }

      this.program = this.createProgram(vertexShader, fragmentShader);
      if (!this.program) {
        return;
      }

      this.gl.useProgram(this.program);
    }

    setupBuffers() {
      if (!this.gl || !this.program) {
        return;
      }

      const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);

      this.buffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);

      const positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
      this.gl.enableVertexAttribArray(positionLocation);
      this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
    }

    captureUniforms() {
      if (!this.gl || !this.program) {
        return;
      }

      const uniformNames = [
        'u_resolution',
        'u_time',
        'u_mouse',
        'u_geometry',
        'u_gridDensity',
        'u_morphFactor',
        'u_chaos',
        'u_speed',
        'u_hue',
        'u_intensity',
        'u_rot4dXW',
        'u_rot4dYW',
        'u_rot4dZW'
      ];

      uniformNames.forEach((name) => {
        this.uniforms[name] = this.gl.getUniformLocation(this.program, name);
      });
    }

    createShader(type, source) {
      const shader = this.gl.createShader(type);
      this.gl.shaderSource(shader, source);
      this.gl.compileShader(shader);

      if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
        console.warn('[ClearSeas] Vib3 accent shader compile error:', this.gl.getShaderInfoLog(shader));
        this.gl.deleteShader(shader);
        return null;
      }

      return shader;
    }

    createProgram(vertexShader, fragmentShader) {
      const program = this.gl.createProgram();
      this.gl.attachShader(program, vertexShader);
      this.gl.attachShader(program, fragmentShader);
      this.gl.linkProgram(program);

      if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
        console.warn('[ClearSeas] Vib3 accent program link error:', this.gl.getProgramInfoLog(program));
        this.gl.deleteProgram(program);
        return null;
      }

      return program;
    }

    resize() {
      if (!this.gl || !this.canvas) {
        return;
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, this.element.offsetWidth);
      const height = Math.max(1, this.element.offsetHeight);
      const displayWidth = Math.round(width * dpr);
      const displayHeight = Math.round(height * dpr);

      if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
        this.canvas.width = displayWidth;
        this.canvas.height = displayHeight;
      }

      this.canvas.style.width = `${width}px`;
      this.canvas.style.height = `${height}px`;

      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      this.needsResize = false;
    }

    bindEvents() {
      window.addEventListener('pointermove', this.handlePointerMove, { passive: true });
      window.addEventListener('resize', this.handleResize, { passive: true });

      if (typeof window.ResizeObserver === 'function') {
        this.resizeObserver = new window.ResizeObserver(() => {
          this.needsResize = true;
        });
        this.resizeObserver.observe(this.element);
      }
    }

    handleResize() {
      this.needsResize = true;
    }

    handlePointerMove(event) {
      if (this.isDestroyed) {
        return;
      }

      this.pendingPointerEvent = event;
      if (this.pointerUpdateQueued) {
        return;
      }

      this.pointerUpdateQueued = true;
      requestAnimationFrame(() => {
        this.pointerUpdateQueued = false;
        if (!this.pendingPointerEvent || this.isDestroyed) {
          return;
        }

        const rect = this.element.getBoundingClientRect();
        if (!rect || rect.width <= 0 || rect.height <= 0) {
          this.pointer.active = false;
          return;
        }

        const x = (this.pendingPointerEvent.clientX - rect.left) / rect.width;
        const y = (this.pendingPointerEvent.clientY - rect.top) / rect.height;
        const withinBounds = x >= -0.2 && x <= 1.2 && y >= -0.2 && y <= 1.2;

        if (!withinBounds) {
          this.pointer.active = false;
          return;
        }

        this.pointer.x = clamp01(x);
        this.pointer.y = clamp01(y);
        this.pointer.active = true;

        if (this.pointerTimeout) {
          clearTimeout(this.pointerTimeout);
        }
        this.pointerTimeout = window.setTimeout(() => {
          this.pointer.active = false;
        }, 320);
      });
    }

    start() {
      if (!this.gl || !this.program || this.isDestroyed) {
        return;
      }

      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
      }

      const renderLoop = (time) => {
        if (this.isDestroyed || this.isPaused) {
          return;
        }
        this.renderFrame(time);
        this.animationFrame = requestAnimationFrame(renderLoop);
      };

      this.animationFrame = requestAnimationFrame(renderLoop);
    }

    renderFrame(time) {
      if (!this.gl || !this.program) {
        return;
      }

      if (this.needsResize) {
        this.resize();
      }

      if (!this.startTime) {
        this.startTime = time - this.resumeOffset;
        this.resumeOffset = 0;
      }

      this.elapsed = time - this.startTime;
      this.updateParameters(this.elapsed);

      this.gl.useProgram(this.program);
      this.gl.clearColor(0, 0, 0, 0);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);

      this.gl.uniform2f(this.uniforms.u_resolution, this.canvas.width, this.canvas.height);
      this.gl.uniform1f(this.uniforms.u_time, this.elapsed);
      this.gl.uniform2f(this.uniforms.u_mouse, this.pointer.x, this.pointer.y);
      this.gl.uniform1f(this.uniforms.u_geometry, this.geometryValue);
      this.gl.uniform1f(this.uniforms.u_gridDensity, this.params.gridDensity);
      this.gl.uniform1f(this.uniforms.u_morphFactor, this.params.morphFactor);
      this.gl.uniform1f(this.uniforms.u_chaos, this.params.chaos);
      this.gl.uniform1f(this.uniforms.u_speed, this.params.speed);
      this.gl.uniform1f(this.uniforms.u_hue, this.params.hue);
      this.gl.uniform1f(this.uniforms.u_intensity, this.params.intensity);
      this.gl.uniform1f(this.uniforms.u_rot4dXW, this.params.rot4dXW);
      this.gl.uniform1f(this.uniforms.u_rot4dYW, this.params.rot4dYW);
      this.gl.uniform1f(this.uniforms.u_rot4dZW, this.params.rot4dZW);

      this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }

    updateParameters(elapsed) {
      const seconds = elapsed * 0.001;
      const drift = this.autoOffset;

      if (!this.pointer.active) {
        const autoX = 0.5 + Math.sin(seconds * 0.24 + drift) * 0.18;
        const autoY = 0.5 + Math.cos(seconds * 0.21 + drift * 0.45) * 0.18;
        this.pointer.x = clamp01(autoX);
        this.pointer.y = clamp01(autoY);
      }

      this.params.morphFactor = 0.64 + Math.sin(seconds * 0.68 + drift * 0.8) * 0.28;
      this.params.gridDensity = 13.5 + Math.cos(seconds * 0.45 + drift * 0.6) * 3.4;
      this.params.chaos = 0.16 + Math.sin(seconds * 0.78 + drift * 0.7) * 0.12;
      this.params.speed = 1.05 + Math.sin(seconds * 0.36 + drift * 0.3) * 0.2;
      this.params.intensity = 0.48 + Math.cos(seconds * 0.42 + drift * 0.5) * 0.24;
      this.params.hue = (this.hueBase + seconds * 26 + Math.sin(seconds * 0.72 + drift) * 32 + 360) % 360;

      this.params.rot4dXW = (this.pointer.x - 0.5) * Math.PI * 1.6;
      this.params.rot4dYW = (this.pointer.y - 0.5) * Math.PI * 1.7;
      this.params.rot4dZW = Math.sin(seconds * 0.55 + drift * 0.9) * Math.PI * 0.45;

      const geometryJitter = Math.sin(seconds * 0.28 + drift * 0.6) * 0.32;
      this.geometryValue = this.geometryGroup * 8 + this.geometryBase + 0.5 + geometryJitter;
    }

    setPaused(paused) {
      if (this.isDestroyed || !this.gl) {
        return;
      }

      if (paused && !this.isPaused) {
        this.isPaused = true;
        if (this.animationFrame) {
          cancelAnimationFrame(this.animationFrame);
          this.animationFrame = null;
        }
        this.resumeOffset = this.elapsed;
      } else if (!paused && this.isPaused) {
        this.isPaused = false;
        this.startTime = 0;
        this.start();
      }
    }

    destroy() {
      if (this.isDestroyed) {
        return;
      }

      this.isDestroyed = true;
      this.setPaused(true);

      if (this.pointerTimeout) {
        clearTimeout(this.pointerTimeout);
        this.pointerTimeout = null;
      }

      window.removeEventListener('pointermove', this.handlePointerMove);
      window.removeEventListener('resize', this.handleResize);

      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
      }

      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = null;
      }

      if (this.gl) {
        if (this.program) {
          this.gl.deleteProgram(this.program);
        }
        if (this.buffer) {
          this.gl.deleteBuffer(this.buffer);
        }
      }

      if (this.canvas && this.canvas.parentNode === this.element) {
        this.canvas.remove();
      }

      this.element.classList.remove('is-active');
      this.element.classList.add('is-static');
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

        mat4 rotateXY(float theta) {
          float c = cos(theta);
          float s = sin(theta);
          return mat4(c, -s, 0.0, 0.0,
                      s,  c, 0.0, 0.0,
                      0.0, 0.0, 1.0, 0.0,
                      0.0, 0.0, 0.0, 1.0);
        }

        mat4 rotateXW(float theta) {
          float c = cos(theta);
          float s = sin(theta);
          return mat4(c, 0.0, 0.0, -s,
                      0.0, 1.0, 0.0, 0.0,
                      0.0, 0.0, 1.0, 0.0,
                      s, 0.0, 0.0, c);
        }

        mat4 rotateYW(float theta) {
          float c = cos(theta);
          float s = sin(theta);
          return mat4(1.0, 0.0, 0.0, 0.0,
                      0.0, c, 0.0, -s,
                      0.0, 0.0, 1.0, 0.0,
                      0.0, s, 0.0, c);
        }

        mat4 rotateZW(float theta) {
          float c = cos(theta);
          float s = sin(theta);
          return mat4(1.0, 0.0, 0.0, 0.0,
                      0.0, 1.0, 0.0, 0.0,
                      0.0, 0.0, c, -s,
                      0.0, 0.0, s,  c);
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

          float hue = u_hue / 360.0;
          vec3 color = hsv2rgb(vec3(hue + value * 0.1, 0.8, 0.5 + finalIntensity * 0.5));

          gl_FragColor = vec4(color, finalIntensity * 0.8);
        }
      `;
    }
  }

  const destroyVisualizer = (element) => {
    const instance = accentRegistry.get(element);
    if (instance) {
      instance.destroy();
      accentRegistry.delete(element);
    }
  };

  const destroyAll = () => {
    accentRegistry.forEach((instance, element) => {
      instance.destroy();
      accentRegistry.delete(element);
    });
  };

  const initAccent = (element, index) => {
    if (!element || accentRegistry.has(element)) {
      return;
    }

    const geometrySetting = Number.parseFloat(element.dataset.vib3Geometry);
    const hueSetting = Number.parseFloat(element.dataset.vib3Hue);

    let geometryGroup = null;
    let geometryBase = null;

    if (Number.isFinite(geometrySetting)) {
      geometryGroup = Math.max(0, Math.min(2, Math.floor(geometrySetting / 8)));
      geometryBase = Math.max(0, Math.min(7, Math.floor(geometrySetting % 8)));
    }

    const visualizer = new Vib3AccentVisualizer(element, {
      offset: index * 0.45,
      hue: Number.isFinite(hueSetting) ? hueSetting : undefined,
      geometryGroup,
      geometryBase
    });

    if (visualizer && visualizer.gl && !visualizer.isDestroyed) {
      accentRegistry.set(element, visualizer);
    }
  };

  const initAll = () => {
    const accents = document.querySelectorAll(ACCENT_SELECTOR);
    if (accents.length === 0) {
      return;
    }

    if (reduceMotionQuery.matches || !hasWebGLSupport()) {
      accents.forEach((element) => {
        element.classList.add('is-static');
        destroyVisualizer(element);
      });
      return;
    }

    accents.forEach((element, index) => {
      initAccent(element, index);
    });
  };

  const handleVisibilityChange = () => {
    const hidden = document.visibilityState === 'hidden';
    accentRegistry.forEach((instance) => {
      instance.setPaused(hidden);
    });
  };

  const handleReduceMotionChange = (event) => {
    if (event.matches) {
      destroyAll();
      document.querySelectorAll(ACCENT_SELECTOR).forEach((element) => {
        element.classList.add('is-static');
      });
    } else {
      initAll();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll, { once: true });
  } else {
    initAll();
  }

  document.addEventListener('visibilitychange', handleVisibilityChange);

  if (reduceMotionQuery && typeof reduceMotionQuery.addEventListener === 'function') {
    reduceMotionQuery.addEventListener('change', handleReduceMotionChange);
  } else if (reduceMotionQuery && typeof reduceMotionQuery.addListener === 'function') {
    reduceMotionQuery.addListener(handleReduceMotionChange);
  }

  window.addEventListener('beforeunload', () => {
    destroyAll();
  });
})();
