/**
 * Performance Monitor
 * Tracks FPS and warns if performance drops
 */

(function() {
  'use strict';

  // Only monitor in development
  const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  if (!isDev) {
    console.log('Performance monitoring disabled in production');
    return;
  }

  let fps = 60;
  let lastTime = performance.now();
  let frameCount = 0;
  let fpsHistory = [];
  const historyLength = 60; // 1 second at 60fps

  // Create FPS counter
  const fpsCounter = document.createElement('div');
  fpsCounter.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.8);
    color: #0f0;
    font-family: monospace;
    font-size: 14px;
    padding: 8px 12px;
    border-radius: 4px;
    z-index: 99999;
    pointer-events: none;
    min-width: 120px;
  `;
  fpsCounter.innerHTML = 'FPS: <span id="fps-value">60</span><br>AVG: <span id="fps-avg">60</span>';
  document.body.appendChild(fpsCounter);

  const fpsValue = document.getElementById('fps-value');
  const fpsAvg = document.getElementById('fps-avg');

  // Create performance warning
  const warning = document.createElement('div');
  warning.className = 'perf-warning';
  warning.textContent = '⚠️ Low FPS detected!';
  document.body.appendChild(warning);

  function updateFPS(currentTime) {
    frameCount++;
    const elapsed = currentTime - lastTime;

    if (elapsed >= 1000) {
      fps = Math.round((frameCount * 1000) / elapsed);
      frameCount = 0;
      lastTime = currentTime;

      // Update display
      if (fpsValue) {
        fpsValue.textContent = fps;

        // Color code based on FPS
        if (fps >= 55) {
          fpsValue.style.color = '#0f0'; // Green
        } else if (fps >= 30) {
          fpsValue.style.color = '#ff0'; // Yellow
        } else {
          fpsValue.style.color = '#f00'; // Red
        }
      }

      // Track history
      fpsHistory.push(fps);
      if (fpsHistory.length > historyLength) {
        fpsHistory.shift();
      }

      // Calculate average
      const avgFPS = Math.round(
        fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length
      );

      if (fpsAvg) {
        fpsAvg.textContent = avgFPS;
      }

      // Show warning if consistently low FPS
      if (avgFPS < 30 && fpsHistory.length >= historyLength) {
        warning.classList.add('show');
        console.warn('Low FPS detected:', avgFPS);
      } else {
        warning.classList.remove('show');
      }
    }

    requestAnimationFrame(updateFPS);
  }

  // Start monitoring
  requestAnimationFrame(updateFPS);

  // Log paint and layout metrics
  if (window.PerformanceObserver) {
    try {
      // Monitor long tasks
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.warn('Long task detected:', entry.duration.toFixed(2) + 'ms');
          }
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });

      // Monitor layout shifts
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.value > 0.1) {
            console.warn('Layout shift detected:', entry.value.toFixed(4));
          }
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

    } catch (e) {
      console.log('Some performance observers not supported');
    }
  }

  // Log memory usage if available
  if (performance.memory) {
    setInterval(() => {
      const used = Math.round(performance.memory.usedJSHeapSize / 1048576);
      const total = Math.round(performance.memory.totalJSHeapSize / 1048576);
      console.log(`Memory: ${used}MB / ${total}MB`);
    }, 10000); // Every 10 seconds
  }

  console.log('📊 Performance monitoring enabled');

})();
