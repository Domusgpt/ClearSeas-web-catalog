/**
 * Polytope Shader System
 * Lightweight WebGL shader implementation for 4D polytope projections
 * A Paul Phillips Manifestation - Clear Seas Solutions
 *
 * Features:
 * - GPU-accelerated 4D to 3D projections
 * - Holographic rendering with gradient effects
 * - Mouse-reactive rotation systems
 * - Optimized for card hover interactions
 *
 * © 2025 Paul Phillips - Clear Seas Solutions LLC
 */

(function() {
  'use strict';

  // ============================================
  // POLYTOPE GEOMETRY DEFINITIONS
  // ============================================

  const POLYTOPES = {
    tesseract: {
      // 4D Hypercube vertices (16 vertices)
      vertices: [
        [-1,-1,-1,-1], [1,-1,-1,-1], [-1,1,-1,-1], [1,1,-1,-1],
        [-1,-1,1,-1], [1,-1,1,-1], [-1,1,1,-1], [1,1,1,-1],
        [-1,-1,-1,1], [1,-1,-1,1], [-1,1,-1,1], [1,1,-1,1],
        [-1,-1,1,1], [1,-1,1,1], [-1,1,1,1], [1,1,1,1]
      ],
      edges: [
        [0,1],[0,2],[0,4],[0,8],[1,3],[1,5],[1,9],[2,3],[2,6],[2,10],
        [3,7],[3,11],[4,5],[4,6],[4,12],[5,7],[5,13],[6,7],[6,14],[7,15],
        [8,9],[8,10],[8,12],[9,11],[9,13],[10,11],[10,14],[11,15],[12,13],[12,14],
        [13,15],[14,15]
      ]
    },

    cell24: {
      // 24-cell vertices (24 vertices)
      vertices: [
        [1,0,0,0], [-1,0,0,0], [0,1,0,0], [0,-1,0,0],
        [0,0,1,0], [0,0,-1,0], [0,0,0,1], [0,0,0,-1],
        [0.5,0.5,0.5,0.5], [0.5,0.5,0.5,-0.5], [0.5,0.5,-0.5,0.5], [0.5,0.5,-0.5,-0.5],
        [0.5,-0.5,0.5,0.5], [0.5,-0.5,0.5,-0.5], [0.5,-0.5,-0.5,0.5], [0.5,-0.5,-0.5,-0.5],
        [-0.5,0.5,0.5,0.5], [-0.5,0.5,0.5,-0.5], [-0.5,0.5,-0.5,0.5], [-0.5,0.5,-0.5,-0.5],
        [-0.5,-0.5,0.5,0.5], [-0.5,-0.5,0.5,-0.5], [-0.5,-0.5,-0.5,0.5], [-0.5,-0.5,-0.5,-0.5]
      ],
      edges: generateCompleteEdges(24, 2.0) // Connect vertices within distance threshold
    },

    simplex5: {
      // 5-cell (4D simplex) vertices (5 vertices)
      vertices: [
        [1,1,1,-1], [1,-1,-1,-1], [-1,1,-1,-1], [-1,-1,1,-1], [0,0,0,Math.sqrt(5)]
      ],
      edges: [[0,1],[0,2],[0,3],[0,4],[1,2],[1,3],[1,4],[2,3],[2,4],[3,4]]
    },

    cell120: {
      // 120-cell approximation (simplified subset)
      vertices: generateDodecahedralVertices(),
      edges: generateCompleteEdges(20, 1.8)
    }
  };

  function generateCompleteEdges(numVertices, threshold) {
    const edges = [];
    for (let i = 0; i < numVertices; i++) {
      for (let j = i + 1; j < numVertices; j++) {
        edges.push([i, j]);
      }
    }
    return edges;
  }

  function generateDodecahedralVertices() {
    const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio
    const vertices = [];

    // Standard dodecahedron vertices in 4D
    for (let i = -1; i <= 1; i += 2) {
      for (let j = -1; j <= 1; j += 2) {
        for (let k = -1; k <= 1; k += 2) {
          vertices.push([i, j, k, 0]);
        }
      }
    }

    // Additional vertices for 4D symmetry
    const coords = [[0, phi, 1/phi, 0], [0, -phi, 1/phi, 0], [0, phi, -1/phi, 0], [0, -phi, -1/phi, 0]];
    coords.forEach(c => vertices.push(c));

    return vertices.slice(0, 20); // Limit to 20 for performance
  }

  // ============================================
  // WEBGL SHADER SOURCES
  // ============================================

  const VERTEX_SHADER = `
    attribute vec3 a_position;
    attribute float a_depth;

    uniform mat4 u_projection;
    uniform mat4 u_rotation;
    uniform float u_time;

    varying float v_depth;
    varying vec3 v_position;

    void main() {
      // Apply 3D rotation
      vec4 rotated = u_rotation * vec4(a_position, 1.0);

      // Apply perspective projection
      gl_Position = u_projection * rotated;

      // Pass depth for fragment shader coloring
      v_depth = a_depth;
      v_position = a_position;

      // Dynamic point size based on depth
      gl_PointSize = mix(8.0, 3.0, a_depth * 0.5 + 0.5);
    }
  `;

  const FRAGMENT_SHADER = `
    precision mediump float;

    uniform float u_time;
    uniform vec3 u_colorPrimary;
    uniform vec3 u_colorSecondary;

    varying float v_depth;
    varying vec3 v_position;

    void main() {
      // Circular point rendering
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      if (dist > 0.5) discard;

      // Holographic gradient based on depth
      float depthFactor = v_depth * 0.5 + 0.5;
      vec3 color = mix(u_colorPrimary, u_colorSecondary, depthFactor);

      // Add temporal shimmer
      float shimmer = sin(u_time * 2.0 + v_position.x * 3.0) * 0.2 + 0.8;
      color *= shimmer;

      // Soft edge falloff
      float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
      alpha *= (0.7 + depthFactor * 0.3);

      gl_FragColor = vec4(color, alpha);
    }
  `;

  const LINE_FRAGMENT_SHADER = `
    precision mediump float;

    uniform float u_time;
    uniform vec3 u_colorPrimary;
    uniform vec3 u_colorSecondary;

    varying float v_depth;

    void main() {
      float depthFactor = v_depth * 0.5 + 0.5;
      vec3 color = mix(u_colorPrimary, u_colorSecondary, depthFactor);

      float alpha = 0.3 + depthFactor * 0.2;
      gl_FragColor = vec4(color, alpha);
    }
  `;

  // ============================================
  // MATRIX MATHEMATICS
  // ============================================

  class Matrix4D {
    static rotateXW(angle) {
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      return [
        [c, 0, 0, -s],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [s, 0, 0, c]
      ];
    }

    static rotateYW(angle) {
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      return [
        [1, 0, 0, 0],
        [0, c, 0, -s],
        [0, 0, 1, 0],
        [0, s, 0, c]
      ];
    }

    static rotateZW(angle) {
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      return [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, c, -s],
        [0, 0, s, c]
      ];
    }

    static rotateXY(angle) {
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      return [
        [c, -s, 0, 0],
        [s, c, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
      ];
    }

    static multiply(a, b) {
      const result = Array(4).fill(0).map(() => Array(4).fill(0));
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          for (let k = 0; k < 4; k++) {
            result[i][j] += a[i][k] * b[k][j];
          }
        }
      }
      return result;
    }

    static transform(matrix, vector) {
      const result = [0, 0, 0, 0];
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          result[i] += matrix[i][j] * vector[j];
        }
      }
      return result;
    }
  }

  function project4Dto3D(vertex4D) {
    // Stereographic projection from 4D to 3D
    const distance = 2.0;
    const w = vertex4D[3];
    const scale = distance / (distance - w);

    return [
      vertex4D[0] * scale,
      vertex4D[1] * scale,
      vertex4D[2] * scale
    ];
  }

  function createPerspectiveMatrix(fov, aspect, near, far) {
    const f = 1.0 / Math.tan(fov / 2);
    const rangeInv = 1.0 / (near - far);

    return [
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (near + far) * rangeInv, -1,
      0, 0, near * far * rangeInv * 2, 0
    ];
  }

  function createRotationMatrix(angleX, angleY, angleZ) {
    const cx = Math.cos(angleX), sx = Math.sin(angleX);
    const cy = Math.cos(angleY), sy = Math.sin(angleY);
    const cz = Math.cos(angleZ), sz = Math.sin(angleZ);

    return [
      cy * cz, -cy * sz, sy, 0,
      sx * sy * cz + cx * sz, -sx * sy * sz + cx * cz, -sx * cy, 0,
      -cx * sy * cz + sx * sz, cx * sy * sz + sx * cz, cx * cy, 0,
      0, 0, 0, 1
    ];
  }

  // ============================================
  // WEBGL POLYTOPE VISUALIZER
  // ============================================

  class PolytopeVisualizer {
    constructor(canvas, polytopeType = 'tesseract') {
      this.canvas = canvas;
      this.gl = canvas.getContext('webgl', {
        alpha: true,
        antialias: true,
        premultipliedAlpha: false
      });

      if (!this.gl) {
        console.error('WebGL not supported');
        return;
      }

      this.polytope = POLYTOPES[polytopeType];
      this.rotation4D = { xw: 0, yw: 0, zw: 0, xy: 0 };
      this.rotation3D = { x: 0.3, y: 0.4, z: 0 };
      this.time = 0;
      this.mouseX = 0;
      this.mouseY = 0;
      this.isActive = false;

      this.colorSchemes = {
        cyan: { primary: [0, 1, 1], secondary: [0, 0.5, 1] },
        magenta: { primary: [1, 0, 1], secondary: [1, 0, 0.5] },
        lime: { primary: [0, 1, 0.67], secondary: [0, 0.8, 1] },
        purple: { primary: [0.75, 0.52, 0.99], secondary: [0.5, 0, 1] }
      };

      this.currentScheme = 'cyan';

      this.init();
    }

    init() {
      const gl = this.gl;

      // Enable blending for transparency
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);

      // Compile shaders
      this.pointProgram = this.createProgram(VERTEX_SHADER, FRAGMENT_SHADER);
      this.lineProgram = this.createProgram(VERTEX_SHADER, LINE_FRAGMENT_SHADER);

      // Initialize buffers
      this.updateGeometry();

      // Resize canvas
      this.resize();
    }

    createProgram(vertexSource, fragmentSource) {
      const gl = this.gl;

      const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexSource);
      const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fragmentSource);

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

    updateGeometry() {
      // Rotate in 4D space
      const xw = Matrix4D.rotateXW(this.rotation4D.xw);
      const yw = Matrix4D.rotateYW(this.rotation4D.yw);
      const zw = Matrix4D.rotateZW(this.rotation4D.zw);
      const xy = Matrix4D.rotateXY(this.rotation4D.xy);

      let rotation4D = Matrix4D.multiply(xw, yw);
      rotation4D = Matrix4D.multiply(rotation4D, zw);
      rotation4D = Matrix4D.multiply(rotation4D, xy);

      // Transform vertices and project to 3D
      const vertices3D = this.polytope.vertices.map(v4d => {
        const rotated = Matrix4D.transform(rotation4D, v4d);
        return project4Dto3D(rotated);
      });

      // Create vertex buffer data
      const vertexData = [];
      const depthData = [];

      vertices3D.forEach(v => {
        vertexData.push(...v);
        // Calculate depth for coloring (normalized z-coordinate)
        depthData.push(v[2] / 3.0);
      });

      // Create line vertex data
      const lineData = [];
      const lineDepthData = [];

      this.polytope.edges.forEach(([i, j]) => {
        lineData.push(...vertices3D[i], ...vertices3D[j]);
        lineDepthData.push(depthData[i], depthData[j]);
      });

      // Update WebGL buffers
      this.vertexBuffer = this.createBuffer(new Float32Array(vertexData));
      this.depthBuffer = this.createBuffer(new Float32Array(depthData));
      this.lineBuffer = this.createBuffer(new Float32Array(lineData));
      this.lineDepthBuffer = this.createBuffer(new Float32Array(lineDepthData));

      this.vertexCount = vertices3D.length;
      this.lineVertexCount = lineData.length / 3;
    }

    createBuffer(data) {
      const gl = this.gl;
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      return buffer;
    }

    render() {
      const gl = this.gl;

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      // Update rotation based on mouse
      if (this.isActive) {
        this.rotation3D.y += (this.mouseX * 2 - this.rotation3D.y) * 0.1;
        this.rotation3D.x += (this.mouseY * 2 - this.rotation3D.x) * 0.1;
      }

      // Auto-rotation in 4D
      this.rotation4D.xw += 0.005;
      this.rotation4D.yw += 0.007;
      this.rotation4D.xy += 0.003;

      this.time += 0.016;

      this.updateGeometry();

      const scheme = this.colorSchemes[this.currentScheme];
      const projectionMatrix = createPerspectiveMatrix(
        Math.PI / 4,
        this.canvas.width / this.canvas.height,
        0.1,
        100
      );

      const rotationMatrix = createRotationMatrix(
        this.rotation3D.x,
        this.rotation3D.y,
        this.rotation3D.z
      );

      // Render lines (edges)
      gl.useProgram(this.lineProgram);

      const linePositionLoc = gl.getAttribLocation(this.lineProgram, 'a_position');
      const lineDepthLoc = gl.getAttribLocation(this.lineProgram, 'a_depth');

      gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuffer);
      gl.enableVertexAttribArray(linePositionLoc);
      gl.vertexAttribPointer(linePositionLoc, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.lineDepthBuffer);
      gl.enableVertexAttribArray(lineDepthLoc);
      gl.vertexAttribPointer(lineDepthLoc, 1, gl.FLOAT, false, 0, 0);

      gl.uniformMatrix4fv(gl.getUniformLocation(this.lineProgram, 'u_projection'), false, projectionMatrix);
      gl.uniformMatrix4fv(gl.getUniformLocation(this.lineProgram, 'u_rotation'), false, rotationMatrix);
      gl.uniform1f(gl.getUniformLocation(this.lineProgram, 'u_time'), this.time);
      gl.uniform3fv(gl.getUniformLocation(this.lineProgram, 'u_colorPrimary'), scheme.primary);
      gl.uniform3fv(gl.getUniformLocation(this.lineProgram, 'u_colorSecondary'), scheme.secondary);

      gl.drawArrays(gl.LINES, 0, this.lineVertexCount);

      // Render points (vertices)
      gl.useProgram(this.pointProgram);

      const positionLoc = gl.getAttribLocation(this.pointProgram, 'a_position');
      const depthLoc = gl.getAttribLocation(this.pointProgram, 'a_depth');

      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.enableVertexAttribArray(positionLoc);
      gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.depthBuffer);
      gl.enableVertexAttribArray(depthLoc);
      gl.vertexAttribPointer(depthLoc, 1, gl.FLOAT, false, 0, 0);

      gl.uniformMatrix4fv(gl.getUniformLocation(this.pointProgram, 'u_projection'), false, projectionMatrix);
      gl.uniformMatrix4fv(gl.getUniformLocation(this.pointProgram, 'u_rotation'), false, rotationMatrix);
      gl.uniform1f(gl.getUniformLocation(this.pointProgram, 'u_time'), this.time);
      gl.uniform3fv(gl.getUniformLocation(this.pointProgram, 'u_colorPrimary'), scheme.primary);
      gl.uniform3fv(gl.getUniformLocation(this.pointProgram, 'u_colorSecondary'), scheme.secondary);

      gl.drawArrays(gl.POINTS, 0, this.vertexCount);
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

    setColorScheme(scheme) {
      if (this.colorSchemes[scheme]) {
        this.currentScheme = scheme;
      }
    }

    setMousePosition(x, y) {
      this.mouseX = x;
      this.mouseY = y;
    }

    activate() {
      this.isActive = true;
    }

    deactivate() {
      this.isActive = false;
    }

    destroy() {
      const gl = this.gl;
      gl.deleteProgram(this.pointProgram);
      gl.deleteProgram(this.lineProgram);
      gl.deleteBuffer(this.vertexBuffer);
      gl.deleteBuffer(this.depthBuffer);
      gl.deleteBuffer(this.lineBuffer);
      gl.deleteBuffer(this.lineDepthBuffer);
    }
  }

  // ============================================
  // CARD HOVER INTEGRATION SYSTEM
  // ============================================

  class PolytopeCardEnhancer {
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

      this.polytopeMapping = {
        'signal-card': 'tesseract',
        'capability-card': 'cell24',
        'platform-card': 'simplex5',
        'research-lab': 'cell120',
        'step': 'tesseract'
      };

      this.colorMapping = {
        'signal-card': 'cyan',
        'capability-card': 'magenta',
        'platform-card': 'lime',
        'research-lab': 'purple',
        'step': 'cyan'
      };

      this.init();
    }

    init() {
      // Find all eligible cards
      const cards = [];
      this.cardSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(card => cards.push(card));
      });

      // Setup each card
      cards.forEach((card, index) => {
        this.setupCard(card, index);
      });

      // Start render loop
      this.startRenderLoop();
    }

    setupCard(card, index) {
      // Create canvas overlay
      const canvas = document.createElement('canvas');
      canvas.className = 'polytope-overlay';
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

      // Ensure card is positioned
      const position = getComputedStyle(card).position;
      if (position === 'static') {
        card.style.position = 'relative';
      }

      // Insert canvas
      card.style.overflow = 'hidden';
      card.insertBefore(canvas, card.firstChild);

      // Determine polytope type
      const cardType = this.cardSelectors.find(sel => card.matches(sel));
      const className = cardType.replace('.', '');
      const polytopeType = this.polytopeMapping[className] || 'tesseract';
      const colorScheme = this.colorMapping[className] || 'cyan';

      // Create visualizer
      const visualizer = new PolytopeVisualizer(canvas, polytopeType);
      visualizer.setColorScheme(colorScheme);
      visualizer.resize();

      this.visualizers.set(card, { canvas, visualizer, isVisible: false });

      // Setup hover events
      card.addEventListener('mouseenter', () => {
        const data = this.visualizers.get(card);
        if (data) {
          canvas.style.opacity = '1';
          data.visualizer.activate();
          data.isVisible = true;
        }
      });

      card.addEventListener('mouseleave', () => {
        const data = this.visualizers.get(card);
        if (data) {
          canvas.style.opacity = '0';
          data.visualizer.deactivate();
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
        this.visualizers.forEach(({ visualizer, canvas }) => {
          visualizer.resize();
          visualizer.render();
        });

        this.animationFrame = requestAnimationFrame(render);
      };

      render();
    }

    stopRenderLoop() {
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = null;
      }
      this.isRunning = false;
    }

    destroy() {
      this.stopRenderLoop();
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

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPolytopeSystem);
  } else {
    initPolytopeSystem();
  }

  function initPolytopeSystem() {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      console.log('Polytope visualizations disabled due to reduced motion preference');
      return;
    }

    // Check for WebGL support
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) {
      console.log('WebGL not supported, polytope visualizations disabled');
      return;
    }

    // Initialize the system
    window.polytopeEnhancer = new PolytopeCardEnhancer();

    console.log('Polytope shader system initialized');
  }

  // Expose API for external control
  window.PolytopeVisualizer = PolytopeVisualizer;
  window.PolytopeCardEnhancer = PolytopeCardEnhancer;

})();

/**
 * © 2025 Paul Phillips - Clear Seas Solutions LLC
 * A Paul Phillips Manifestation
 * Paul@clearseassolutions.com
 * "The Revolution Will Not be in a Structured Format"
 */
