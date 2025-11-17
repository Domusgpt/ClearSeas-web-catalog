/**
 * Clear Seas Visualizer System
 * Full-screen WebGL background that responds to scroll and card hovers
 * A Paul Phillips Manifestation
 * © 2025 Paul Phillips - Clear Seas Solutions LLC
 */

(function() {
  'use strict';

  // Color schemes for different sections
  const COLOR_SCHEMES = {
    hero: {
      primary: [0, 0.83, 1],      // Cyan
      secondary: [0, 0.5, 1]
    },
    products: {
      primary: [1, 0, 0.43],      // Magenta
      secondary: [0.8, 0, 0.6]
    },
    'reality-1': {
      primary: [0.2, 1, 0],       // Green
      secondary: [0, 0.8, 1]
    },
    capabilities: {
      primary: [0.75, 0.52, 0.99], // Purple
      secondary: [0.5, 0, 1]
    },
    'reality-2': {
      primary: [0.96, 0.73, 0.14], // Orange
      secondary: [1, 0.5, 0]
    },
    research: {
      primary: [0, 0.71, 0.83],   // Teal
      secondary: [0, 0.9, 0.7]
    },
    contact: {
      primary: [0, 0.83, 1],      // Cyan
      secondary: [1, 0, 0.43]     // Magenta
    }
  };

  class ClearSeasVisualizer {
    constructor(canvas) {
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

      this.currentSection = 'hero';
      this.targetScheme = COLOR_SCHEMES.hero;
      this.currentScheme = { ...COLOR_SCHEMES.hero };
      this.rotation4D = { xw: 0, yw: 0, zw: 0, xy: 0 };
      this.rotation3D = { x: 0.3, y: 0.4, z: 0 };
      this.time = 0;
      this.scrollProgress = 0;
      this.intensity = 1.0;

      // Tesseract geometry (4D hypercube)
      this.vertices = [
        [-1,-1,-1,-1], [1,-1,-1,-1], [-1,1,-1,-1], [1,1,-1,-1],
        [-1,-1,1,-1], [1,-1,1,-1], [-1,1,1,-1], [1,1,1,-1],
        [-1,-1,-1,1], [1,-1,-1,1], [-1,1,-1,1], [1,1,-1,1],
        [-1,-1,1,1], [1,-1,1,1], [-1,1,1,1], [1,1,1,1]
      ];

      this.edges = [
        [0,1],[0,2],[0,4],[0,8],[1,3],[1,5],[1,9],[2,3],[2,6],[2,10],
        [3,7],[3,11],[4,5],[4,6],[4,12],[5,7],[5,13],[6,7],[6,14],[7,15],
        [8,9],[8,10],[8,12],[9,11],[9,13],[10,11],[10,14],[11,15],[12,13],[12,14],
        [13,15],[14,15]
      ];

      this.init();
      this.setupScrollTracking();
      this.setupCardHoverTracking();
    }

    init() {
      const gl = this.gl;

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);

      // Vertex shader
      const vertexShader = `
        attribute vec3 a_position;
        attribute float a_depth;

        uniform mat4 u_projection;
        uniform mat4 u_rotation;
        uniform float u_time;

        varying float v_depth;
        varying vec3 v_position;

        void main() {
          vec4 rotated = u_rotation * vec4(a_position, 1.0);
          gl_Position = u_projection * rotated;
          v_depth = a_depth;
          v_position = a_position;
          gl_PointSize = mix(6.0, 2.0, a_depth * 0.5 + 0.5);
        }
      `;

      // Fragment shader
      const fragmentShader = `
        precision mediump float;

        uniform float u_time;
        uniform vec3 u_colorPrimary;
        uniform vec3 u_colorSecondary;
        uniform float u_intensity;

        varying float v_depth;
        varying vec3 v_position;

        void main() {
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          if (dist > 0.5) discard;

          float depthFactor = v_depth * 0.5 + 0.5;
          vec3 color = mix(u_colorPrimary, u_colorSecondary, depthFactor);

          float shimmer = sin(u_time * 2.0 + v_position.x * 3.0) * 0.2 + 0.8;
          color *= shimmer * u_intensity;

          float alpha = (1.0 - smoothstep(0.3, 0.5, dist)) * (0.5 + depthFactor * 0.3) * u_intensity;

          gl_FragColor = vec4(color, alpha);
        }
      `;

      // Line fragment shader
      const lineFragmentShader = `
        precision mediump float;

        uniform float u_time;
        uniform vec3 u_colorPrimary;
        uniform vec3 u_colorSecondary;
        uniform float u_intensity;

        varying float v_depth;

        void main() {
          float depthFactor = v_depth * 0.5 + 0.5;
          vec3 color = mix(u_colorPrimary, u_colorSecondary, depthFactor);
          float alpha = (0.2 + depthFactor * 0.15) * u_intensity;
          gl_FragColor = vec4(color, alpha);
        }
      `;

      this.pointProgram = this.createProgram(vertexShader, fragmentShader);
      this.lineProgram = this.createProgram(vertexShader, lineFragmentShader);

      this.resize();
      this.startRenderLoop();
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
        return null;
      }

      return shader;
    }

    updateGeometry() {
      // 4D rotation matrices
      const xw = this.rotateXW(this.rotation4D.xw);
      const yw = this.rotateYW(this.rotation4D.yw);
      const zw = this.rotateZW(this.rotation4D.zw);
      const xy = this.rotateXY(this.rotation4D.xy);

      let rotation4D = this.multiply4D(xw, yw);
      rotation4D = this.multiply4D(rotation4D, zw);
      rotation4D = this.multiply4D(rotation4D, xy);

      // Project to 3D
      const vertices3D = this.vertices.map(v4d => {
        const rotated = this.transform4D(rotation4D, v4d);
        return this.project4Dto3D(rotated);
      });

      const vertexData = [];
      const depthData = [];

      vertices3D.forEach(v => {
        vertexData.push(...v);
        depthData.push(v[2] / 3.0);
      });

      const lineData = [];
      const lineDepthData = [];

      this.edges.forEach(([i, j]) => {
        lineData.push(...vertices3D[i], ...vertices3D[j]);
        lineDepthData.push(depthData[i], depthData[j]);
      });

      this.vertexBuffer = this.createBuffer(new Float32Array(vertexData));
      this.depthBuffer = this.createBuffer(new Float32Array(depthData));
      this.lineBuffer = this.createBuffer(new Float32Array(lineData));
      this.lineDepthBuffer = this.createBuffer(new Float32Array(lineDepthData));

      this.vertexCount = vertices3D.length;
      this.lineVertexCount = lineData.length / 3;
    }

    rotateXW(angle) {
      const c = Math.cos(angle), s = Math.sin(angle);
      return [[c,0,0,-s],[0,1,0,0],[0,0,1,0],[s,0,0,c]];
    }

    rotateYW(angle) {
      const c = Math.cos(angle), s = Math.sin(angle);
      return [[1,0,0,0],[0,c,0,-s],[0,0,1,0],[0,s,0,c]];
    }

    rotateZW(angle) {
      const c = Math.cos(angle), s = Math.sin(angle);
      return [[1,0,0,0],[0,1,0,0],[0,0,c,-s],[0,0,s,c]];
    }

    rotateXY(angle) {
      const c = Math.cos(angle), s = Math.sin(angle);
      return [[c,-s,0,0],[s,c,0,0],[0,0,1,0],[0,0,0,1]];
    }

    multiply4D(a, b) {
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

    transform4D(matrix, vector) {
      const result = [0, 0, 0, 0];
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          result[i] += matrix[i][j] * vector[j];
        }
      }
      return result;
    }

    project4Dto3D(vertex4D) {
      const distance = 2.0;
      const w = vertex4D[3];
      const scale = distance / (distance - w);
      return [vertex4D[0] * scale, vertex4D[1] * scale, vertex4D[2] * scale];
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

      // Smooth color transition
      const transitionSpeed = 0.02;
      this.currentScheme.primary[0] += (this.targetScheme.primary[0] - this.currentScheme.primary[0]) * transitionSpeed;
      this.currentScheme.primary[1] += (this.targetScheme.primary[1] - this.currentScheme.primary[1]) * transitionSpeed;
      this.currentScheme.primary[2] += (this.targetScheme.primary[2] - this.currentScheme.primary[2]) * transitionSpeed;
      this.currentScheme.secondary[0] += (this.targetScheme.secondary[0] - this.currentScheme.secondary[0]) * transitionSpeed;
      this.currentScheme.secondary[1] += (this.targetScheme.secondary[1] - this.currentScheme.secondary[1]) * transitionSpeed;
      this.currentScheme.secondary[2] += (this.targetScheme.secondary[2] - this.currentScheme.secondary[2]) * transitionSpeed;

      // Rotate
      this.rotation4D.xw += 0.003;
      this.rotation4D.yw += 0.005;
      this.rotation4D.xy += 0.002;
      this.rotation3D.y += 0.001;

      this.time += 0.016;

      this.updateGeometry();

      const projectionMatrix = this.createPerspectiveMatrix(
        Math.PI / 4,
        this.canvas.width / this.canvas.height,
        0.1,
        100
      );

      const rotationMatrix = this.createRotationMatrix(
        this.rotation3D.x,
        this.rotation3D.y,
        this.rotation3D.z
      );

      // Render lines
      gl.useProgram(this.lineProgram);
      this.bindAttributes(this.lineProgram, this.lineBuffer, this.lineDepthBuffer);
      this.setUniforms(this.lineProgram, projectionMatrix, rotationMatrix);
      gl.drawArrays(gl.LINES, 0, this.lineVertexCount);

      // Render points
      gl.useProgram(this.pointProgram);
      this.bindAttributes(this.pointProgram, this.vertexBuffer, this.depthBuffer);
      this.setUniforms(this.pointProgram, projectionMatrix, rotationMatrix);
      gl.drawArrays(gl.POINTS, 0, this.vertexCount);
    }

    bindAttributes(program, vertexBuffer, depthBuffer) {
      const gl = this.gl;
      const positionLoc = gl.getAttribLocation(program, 'a_position');
      const depthLoc = gl.getAttribLocation(program, 'a_depth');

      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.enableVertexAttribArray(positionLoc);
      gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, depthBuffer);
      gl.enableVertexAttribArray(depthLoc);
      gl.vertexAttribPointer(depthLoc, 1, gl.FLOAT, false, 0, 0);
    }

    setUniforms(program, projectionMatrix, rotationMatrix) {
      const gl = this.gl;
      gl.uniformMatrix4fv(gl.getUniformLocation(program, 'u_projection'), false, projectionMatrix);
      gl.uniformMatrix4fv(gl.getUniformLocation(program, 'u_rotation'), false, rotationMatrix);
      gl.uniform1f(gl.getUniformLocation(program, 'u_time'), this.time);
      gl.uniform3fv(gl.getUniformLocation(program, 'u_colorPrimary'), this.currentScheme.primary);
      gl.uniform3fv(gl.getUniformLocation(program, 'u_colorSecondary'), this.currentScheme.secondary);
      gl.uniform1f(gl.getUniformLocation(program, 'u_intensity'), this.intensity);
    }

    createPerspectiveMatrix(fov, aspect, near, far) {
      const f = 1.0 / Math.tan(fov / 2);
      const rangeInv = 1.0 / (near - far);
      return [
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (near + far) * rangeInv, -1,
        0, 0, near * far * rangeInv * 2, 0
      ];
    }

    createRotationMatrix(angleX, angleY, angleZ) {
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

    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth * dpr;
      const height = window.innerHeight * dpr;

      if (this.canvas.width !== width || this.canvas.height !== height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.canvas.style.width = window.innerWidth + 'px';
        this.canvas.style.height = window.innerHeight + 'px';
        this.gl.viewport(0, 0, width, height);
      }
    }

    setupScrollTracking() {
      let ticking = false;

      const updateSection = () => {
        const sections = document.querySelectorAll('[data-section]');
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;

        sections.forEach(section => {
          const rect = section.getBoundingClientRect();
          const sectionMiddle = rect.top + rect.height / 2;

          if (sectionMiddle > -windowHeight / 2 && sectionMiddle < windowHeight * 1.5) {
            const sectionId = section.getAttribute('data-section');
            if (sectionId !== this.currentSection && COLOR_SCHEMES[sectionId]) {
              this.currentSection = sectionId;
              this.targetScheme = COLOR_SCHEMES[sectionId];
              document.body.setAttribute('data-section', sectionId);
            }
          }
        });

        ticking = false;
      };

      window.addEventListener('scroll', () => {
        if (!ticking) {
          requestAnimationFrame(updateSection);
          ticking = true;
        }
      });

      updateSection();
    }

    setupCardHoverTracking() {
      const cards = document.querySelectorAll('[data-product-card]');

      cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
          this.intensity = 1.5;
          this.rotation4D.xw += 0.1;
          this.rotation4D.yw += 0.15;
        });

        card.addEventListener('mouseleave', () => {
          this.intensity = 1.0;
        });
      });
    }

    startRenderLoop() {
      const render = () => {
        this.resize();
        this.render();
        requestAnimationFrame(render);
      };
      render();
    }
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    const canvas = document.getElementById('clear-seas-visualizer');
    if (!canvas) {
      console.error('Canvas element not found');
      return;
    }

    const visualizer = new ClearSeasVisualizer(canvas);
    window.clearSeasVisualizer = visualizer;

    console.log('✅ Clear Seas Visualizer initialized');
  }

})();
