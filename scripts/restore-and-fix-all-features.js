#!/usr/bin/env node

/**
 * Restore ALL Features and FIX Them Properly
 *
 * Restores:
 * - PerformanceOptimizer (FIXED: won't interfere with visualizers)
 * - WebGLGSAPSync (FIXED: optional integration, not forced)
 * - ScrollOptimizer (FIXED: passive listeners)
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const groupsPath = path.join(rootDir, 'test-results', 'smart-groups.json');
const groups = JSON.parse(fs.readFileSync(groupsPath, 'utf8'));

console.log('\n🔧 Restoring ALL Features with Proper Fixes...\n');

// FIXED PerformanceOptimizer - doesn't interfere, just monitors
const FIXED_PERFORMANCE_MODULE = `
/**
 * Performance Monitor (Non-Interfering)
 * Monitors performance but doesn't change anything automatically
 */

class PerformanceMonitor {
  constructor() {
    this.rafId = null;
    this.lastFrameTime = 0;
    this.fpsHistory = [];
    this.isEnabled = true;
  }

  // Throttle helper
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

  // Debounce helper
  debounce(func, delay) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  // Monitor FPS (non-interfering)
  startMonitoring() {
    if (!this.isEnabled) return;

    const measureFPS = (timestamp) => {
      if (this.lastFrameTime) {
        const delta = timestamp - this.lastFrameTime;
        const fps = 1000 / delta;
        this.fpsHistory.push(fps);

        if (this.fpsHistory.length > 60) {
          this.fpsHistory.shift();
        }

        // Just dispatch event, don't take action
        const avgFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
        if (avgFPS < 30) {
          window.dispatchEvent(new CustomEvent('performance:low-fps', {
            detail: { fps: avgFPS }
          }));
        }
      }

      this.lastFrameTime = timestamp;
      this.rafId = requestAnimationFrame(measureFPS);
    };

    this.rafId = requestAnimationFrame(measureFPS);
  }

  getAverageFPS() {
    if (this.fpsHistory.length === 0) return 60;
    return this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
  }

  stop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    window.perfMonitor = new PerformanceMonitor();
    window.perfMonitor.startMonitoring();
  });
}
`;

// FIXED WebGL+GSAP Sync - opt-in only
const FIXED_WEBGL_GSAP_SYNC = `
/**
 * WebGL + GSAP Sync (Opt-In)
 * Visualizers can register if they want sync
 * Does NOT interfere with existing animations
 */

class WebGLGSAPSync {
  constructor() {
    this.registeredVisualizers = [];
    this.isRunning = false;
  }

  // Opt-in registration
  register(visualizer, options = {}) {
    this.registeredVisualizers.push({
      visualizer,
      options
    });

    if (!this.isRunning && this.registeredVisualizers.length > 0) {
      this.start();
    }
  }

  unregister(visualizer) {
    const index = this.registeredVisualizers.findIndex(v => v.visualizer === visualizer);
    if (index > -1) {
      this.registeredVisualizers.splice(index, 1);
    }

    if (this.registeredVisualizers.length === 0) {
      this.stop();
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    const update = (timestamp) => {
      // Update each registered visualizer
      this.registeredVisualizers.forEach(({ visualizer, options }) => {
        if (visualizer && typeof visualizer.update === 'function') {
          visualizer.update(timestamp, options);
        }
      });

      if (this.isRunning) {
        requestAnimationFrame(update);
      }
    };

    requestAnimationFrame(update);
  }

  stop() {
    this.isRunning = false;
  }
}

if (typeof window !== 'undefined') {
  window.webglGSAPSync = new WebGLGSAPSync();
}
`;

// FIXED ScrollOptimizer - completely passive
const FIXED_SCROLL_OPTIMIZER = `
/**
 * Scroll Optimizer (Passive)
 * Provides throttled scroll events and intersection observers
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
    // Passive listener for performance
    window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
  }

  handleScroll() {
    if (!this.isScrolling) {
      this.isScrolling = true;
      window.requestAnimationFrame(() => {
        this.scrollCallbacks.forEach(cb => cb(window.scrollY));
        this.isScrolling = false;
      });
    }

    clearTimeout(this.scrollTimeout);
    this.scrollTimeout = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('scroll:end', { detail: { scrollY: window.scrollY } }));
    }, 150);
  }

  // Create intersection observer
  observe(element, callback, options = {}) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => callback(entry));
    }, {
      threshold: options.threshold || [0, 0.25, 0.5, 0.75, 1],
      rootMargin: options.rootMargin || '0px'
    });

    observer.observe(element);
    this.observers.set(element, observer);
    return observer;
  }

  // Register scroll callback (throttled automatically)
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

let totalFixed = 0;

// Apply to Advanced Combo builds
const advancedBuilds = groups.groups.advancedCombo || [];

for (const build of advancedBuilds) {
  const buildPath = path.join(rootDir, build.path);
  const indexPath = path.join(buildPath, 'index.html');

  try {
    let html = fs.readFileSync(indexPath, 'utf8');
    let changes = 0;

    // Add PerformanceMonitor
    if (!html.includes('PerformanceMonitor') && !html.includes('PerformanceOptimizer')) {
      html = html.replace('</head>', `\n<script>\n${FIXED_PERFORMANCE_MODULE}\n</script>\n</head>`);
      changes++;
      console.log(`  ✅ Added PerformanceMonitor to ${build.name}`);
    }

    // Add WebGLGSAPSync for builds with both
    if (build.features.hasWebGL && build.features.hasGSAP && !html.includes('WebGLGSAPSync')) {
      html = html.replace('</head>', `\n<script>\n${FIXED_WEBGL_GSAP_SYNC}\n</script>\n</head>`);
      changes++;
      console.log(`  ✅ Added WebGLGSAPSync to ${build.name}`);
    }

    // Add ScrollOptimizer for builds with scroll choreography
    if (build.features.hasScrollChoreography && !html.includes('ScrollOptimizer')) {
      html = html.replace('</head>', `\n<script>\n${FIXED_SCROLL_OPTIMIZER}\n</script>\n</head>`);
      changes++;
      console.log(`  ✅ Added ScrollOptimizer to ${build.name}`);
    }

    if (changes > 0) {
      fs.writeFileSync(indexPath, html);
      totalFixed++;
    }

  } catch (err) {
    console.error(`  ❌ Error with ${build.name}:`, err.message);
  }
}

console.log(`\n✅ Restored and fixed features in ${totalFixed} builds\n`);
console.log('All features are now:');
console.log('- Non-interfering with existing code');
console.log('- Opt-in where appropriate');
console.log('- Passive and performance-friendly\n');
