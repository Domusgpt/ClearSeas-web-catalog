#!/usr/bin/env node

/**
 * Advanced Combo Builds - Tailored Fixes
 *
 * These builds have WebGL + GSAP + multiple advanced features
 * Requires specialized optimizations for integration
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const groupsPath = path.join(rootDir, 'test-results', 'smart-groups.json');
const groups = JSON.parse(fs.readFileSync(groupsPath, 'utf8'));

const advancedBuilds = groups.groups.advancedCombo || [];

console.log(`\n🚀 Fixing Advanced Combo Builds (${advancedBuilds.length} builds)\n`);

let totalFixes = 0;

// Advanced performance optimization module
const PERFORMANCE_MODULE = `
/**
 * Advanced Performance Optimization Module
 * For builds with WebGL + GSAP + Complex Visualizers
 */

class PerformanceOptimizer {
  constructor() {
    this.rafId = null;
    this.lastFrameTime = 0;
    this.fpsHistory = [];
    this.memoryWarningThreshold = 100 * 1024 * 1024; // 100MB
  }

  // Throttle expensive operations
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Debounce for resize/scroll
  debounce(func, delay) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  // Monitor FPS
  startFPSMonitoring() {
    const measureFPS = (timestamp) => {
      if (this.lastFrameTime) {
        const delta = timestamp - this.lastFrameTime;
        const fps = 1000 / delta;
        this.fpsHistory.push(fps);

        if (this.fpsHistory.length > 60) {
          this.fpsHistory.shift();
        }

        const avgFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;

        // If FPS drops below 30, reduce quality
        if (avgFPS < 30) {
          this.reduceQuality();
        }
      }

      this.lastFrameTime = timestamp;
      this.rafId = requestAnimationFrame(measureFPS);
    };

    this.rafId = requestAnimationFrame(measureFPS);
  }

  reduceQuality() {
    // Reduce particle counts, shader complexity, etc.
    const event = new CustomEvent('performance:reduce-quality', {
      detail: { avgFPS: this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length }
    });
    window.dispatchEvent(event);
  }

  // Memory monitoring
  checkMemory() {
    if (performance.memory) {
      const used = performance.memory.usedJSHeapSize;
      if (used > this.memoryWarningThreshold) {
        console.warn('High memory usage detected:', (used / 1024 / 1024).toFixed(2), 'MB');

        // Trigger garbage collection hint
        const event = new CustomEvent('performance:high-memory');
        window.dispatchEvent(event);
      }
    }
  }

  cleanup() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
  }
}

// Initialize on DOMContentLoaded
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    window.perfOptimizer = new PerformanceOptimizer();
    window.perfOptimizer.startFPSMonitoring();

    // Check memory every 5 seconds
    setInterval(() => window.perfOptimizer.checkMemory(), 5000);
  });
}
`;

// WebGL + GSAP integration optimizer
const WEBGL_GSAP_OPTIMIZER = `
/**
 * WebGL + GSAP Integration Optimizer
 * Synchronizes GSAP timeline with WebGL render loop
 */

class WebGLGSAPSync {
  constructor() {
    this.gsapTimeline = null;
    this.webglRenderer = null;
    this.syncedAnimations = [];
  }

  // Batch GSAP updates with WebGL rendering
  syncRenderLoop() {
    const render = (timestamp) => {
      // Update GSAP first
      if (this.gsapTimeline && typeof gsap !== 'undefined') {
        gsap.ticker.tick();
      }

      // Then render WebGL
      if (this.webglRenderer && typeof this.webglRenderer.render === 'function') {
        this.webglRenderer.render();
      }

      // Trigger custom visualizers
      this.syncedAnimations.forEach(anim => {
        if (typeof anim.update === 'function') {
          anim.update(timestamp);
        }
      });

      requestAnimationFrame(render);
    };

    requestAnimationFrame(render);
  }

  register(visualizer) {
    this.syncedAnimations.push(visualizer);
  }

  unregister(visualizer) {
    const index = this.syncedAnimations.indexOf(visualizer);
    if (index > -1) {
      this.syncedAnimations.splice(index, 1);
    }
  }
}

if (typeof window !== 'undefined') {
  window.webglGSAPSync = new WebGLGSAPSync();
}
`;

// Enhanced scroll optimization for ScrollChoreography builds
const SCROLL_OPTIMIZER = `
/**
 * Advanced Scroll Optimization
 * Uses Intersection Observer + passive listeners
 */

class ScrollOptimizer {
  constructor() {
    this.observers = new Map();
    this.scrollCallbacks = [];
    this.isScrolling = false;
    this.scrollTimeout = null;

    this.init();
  }

  init() {
    // Use passive listener for better performance
    window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
  }

  handleScroll() {
    if (!this.isScrolling) {
      this.isScrolling = true;
      window.requestAnimationFrame(() => {
        this.scrollCallbacks.forEach(cb => cb());
        this.isScrolling = false;
      });
    }

    // Debounced scroll end
    clearTimeout(this.scrollTimeout);
    this.scrollTimeout = setTimeout(() => {
      const event = new CustomEvent('scroll:end');
      window.dispatchEvent(event);
    }, 150);
  }

  observeElement(element, callback, options = {}) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        callback(entry);
      });
    }, {
      threshold: options.threshold || [0, 0.25, 0.5, 0.75, 1],
      rootMargin: options.rootMargin || '0px'
    });

    observer.observe(element);
    this.observers.set(element, observer);

    return observer;
  }

  onScroll(callback) {
    this.scrollCallbacks.push(callback);
  }

  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.scrollCallbacks = [];
  }
}

if (typeof window !== 'undefined') {
  window.scrollOptimizer = new ScrollOptimizer();
}
`;

// Apply fixes to each build
for (const build of advancedBuilds) {
  const buildPath = path.join(rootDir, build.path);
  const indexPath = path.join(buildPath, 'index.html');

  console.log(`🔧 ${build.name}`);

  try {
    let indexHTML = fs.readFileSync(indexPath, 'utf8');
    let fixes = 0;

    // Add performance module
    if (!indexHTML.includes('PerformanceOptimizer')) {
      const perfScript = `\n<script>\n${PERFORMANCE_MODULE}\n</script>\n`;
      indexHTML = indexHTML.replace('</head>', perfScript + '</head>');
      fixes++;
      console.log('  ✅ Added PerformanceOptimizer');
    }

    // Add WebGL + GSAP sync
    if (build.features.hasWebGL && build.features.hasGSAP && !indexHTML.includes('WebGLGSAPSync')) {
      const syncScript = `\n<script>\n${WEBGL_GSAP_OPTIMIZER}\n</script>\n`;
      indexHTML = indexHTML.replace('</head>', syncScript + '</head>');
      fixes++;
      console.log('  ✅ Added WebGL+GSAP synchronization');
    }

    // Add scroll optimizer for ScrollChoreography builds
    if (build.features.hasScrollChoreography && !indexHTML.includes('ScrollOptimizer')) {
      const scrollScript = `\n<script>\n${SCROLL_OPTIMIZER}\n</script>\n`;
      indexHTML = indexHTML.replace('</head>', scrollScript + '</head>');
      fixes++;
      console.log('  ✅ Added ScrollOptimizer');
    }

    // Add resource hints
    if (!indexHTML.includes('preconnect')) {
      const hints = `
  <!-- Resource Hints -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://cdn.jsdelivr.net">
  <link rel="dns-prefetch" href="https://fonts.gstatic.com">
`;
      indexHTML = indexHTML.replace('<head>', '<head>' + hints);
      fixes++;
      console.log('  ✅ Added resource hints');
    }

    // Add viewport meta if missing
    if (!indexHTML.includes('viewport')) {
      const viewport = '\n  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">\n';
      indexHTML = indexHTML.replace('</head>', viewport + '</head>');
      fixes++;
      console.log('  ✅ Added viewport meta');
    }

    // Save if fixes were made
    if (fixes > 0) {
      fs.writeFileSync(indexPath, indexHTML);
      totalFixes += fixes;
      console.log(`  🎯 Applied ${fixes} fixes\n`);
    } else {
      console.log('  ℹ️  Already optimized\n');
    }

  } catch (err) {
    console.error(`  ❌ Error: ${err.message}\n`);
  }
}

console.log(`\n✅ Advanced Combo Optimization Complete!`);
console.log(`Total fixes applied: ${totalFixes}\n`);

const summary = {
  timestamp: new Date().toISOString(),
  buildsProcessed: advancedBuilds.length,
  totalFixes,
  enhancements: [
    'PerformanceOptimizer with FPS monitoring',
    'WebGL + GSAP synchronization',
    'Advanced scroll optimization with Intersection Observer',
    'Resource hints for external resources',
    'Memory monitoring and quality reduction',
    'Passive event listeners',
    'requestAnimationFrame batching'
  ]
};

fs.writeFileSync(
  path.join(rootDir, 'test-results', 'advanced-combo-fixes.json'),
  JSON.stringify(summary, null, 2)
);
