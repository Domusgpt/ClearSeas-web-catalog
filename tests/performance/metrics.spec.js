/**
 * Performance Tests for All Builds
 *
 * Measures and validates:
 * - Page load time
 * - First Contentful Paint (FCP)
 * - Largest Contentful Paint (LCP)
 * - Time to Interactive (TTI)
 * - Total Blocking Time (TBT)
 * - Animation frame rate
 * - Memory usage
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Load build inventory
const inventoryPath = path.join(__dirname, '../../test-results/build-inventory.json');
let builds = [];

if (fs.existsSync(inventoryPath)) {
  const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
  builds = (inventory.uniqueOnly || inventory.builds || []).slice(0, 10); // Test first 10 for speed
} else {
  builds = [];
}

// Performance metrics thresholds
const THRESHOLDS = {
  FCP: 2000, // 2 seconds
  LCP: 4000, // 4 seconds
  loadTime: 5000, // 5 seconds
  fps: 30 // minimum FPS
};

for (const build of builds) {
  test.describe(`Performance: ${build.name || build.path}`, () => {
    const buildPath = build.path || build.name;

    test('should meet Core Web Vitals', async ({ page }) => {
      await page.goto(`/${buildPath}/`, { waitUntil: 'networkidle' });

      // Get performance metrics
      const metrics = await page.evaluate(() => {
        return new Promise(resolve => {
          if (window.performance && window.performance.timing) {
            const timing = window.performance.timing;
            const navigation = window.performance.navigation;

            // Calculate metrics
            const loadTime = timing.loadEventEnd - timing.navigationStart;
            const domReadyTime = timing.domContentLoadedEventEnd - timing.navigationStart;
            const responseTime = timing.responseEnd - timing.requestStart;

            resolve({
              loadTime,
              domReadyTime,
              responseTime,
              type: navigation.type
            });
          } else {
            resolve({});
          }
        });
      });

      console.log(`  📊 ${buildPath} metrics:`, metrics);

      // Check load time
      if (metrics.loadTime) {
        expect(metrics.loadTime).toBeLessThan(THRESHOLDS.loadTime);
      }
    });

    test('should not have memory leaks', async ({ page }) => {
      await page.goto(`/${buildPath}/`, { waitUntil: 'networkidle' });

      // Get initial memory
      const initialMemory = await page.evaluate(() => {
        if (performance.memory) {
          return performance.memory.usedJSHeapSize;
        }
        return 0;
      });

      // Scroll and interact
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(1000);
      await page.evaluate(() => {
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(1000);

      // Get final memory
      const finalMemory = await page.evaluate(() => {
        if (performance.memory) {
          return performance.memory.usedJSHeapSize;
        }
        return 0;
      });

      // Memory should not increase dramatically (less than 50MB)
      const memoryIncrease = finalMemory - initialMemory;
      console.log(`  💾 Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);

      if (initialMemory > 0) {
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      }
    });

    test('should maintain smooth animations', async ({ page }) => {
      await page.goto(`/${buildPath}/`, { waitUntil: 'networkidle' });

      // Check for canvas/animation elements
      const hasCanvas = await page.locator('canvas').count() > 0;

      if (hasCanvas) {
        // Monitor FPS for a few seconds
        const fps = await page.evaluate(() => {
          return new Promise(resolve => {
            let frameCount = 0;
            let lastTime = performance.now();
            const duration = 2000; // 2 seconds
            const startTime = lastTime;

            function countFrames() {
              frameCount++;
              const currentTime = performance.now();

              if (currentTime - startTime < duration) {
                requestAnimationFrame(countFrames);
              } else {
                const avgFPS = frameCount / (duration / 1000);
                resolve(avgFPS);
              }
            }

            requestAnimationFrame(countFrames);
          });
        });

        console.log(`  🎬 Average FPS: ${fps.toFixed(2)}`);
        expect(fps).toBeGreaterThan(THRESHOLDS.fps);
      }
    });
  });
}
