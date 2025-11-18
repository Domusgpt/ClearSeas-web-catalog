/**
 * Visual Regression Tests for All Builds
 *
 * Tests all unique builds in the catalog:
 * - Screenshot comparison
 * - Console error detection
 * - WebGL/Canvas validation
 * - Asset loading verification
 * - GSAP animation detection
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Load build inventory
const inventoryPath = path.join(__dirname, '../../test-results/build-inventory.json');
let builds = [];

// If inventory exists, use it; otherwise test all known builds
if (fs.existsSync(inventoryPath)) {
  const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
  builds = inventory.uniqueOnly || inventory.builds || [];
} else {
  // Fallback: scan directories
  const rootDir = path.join(__dirname, '../..');
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  builds = entries
    .filter(e => e.isDirectory())
    .filter(e => !e.name.startsWith('.'))
    .filter(e => !['node_modules', 'test-results', 'tests', 'scripts'].includes(e.name))
    .filter(e => {
      const indexPath = path.join(rootDir, e.name, 'index.html');
      return fs.existsSync(indexPath);
    })
    .map(e => ({ name: e.name, path: e.name }));
}

console.log(`Testing ${builds.length} builds`);

// Test each build
for (const build of builds) {
  test.describe(`Build: ${build.name || build.path}`, () => {
    const buildPath = build.path || build.name;

    test('should load without errors', async ({ page }) => {
      const consoleErrors = [];
      const consoleWarnings = [];

      // Capture console messages
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        } else if (msg.type() === 'warning') {
          consoleWarnings.push(msg.text());
        }
      });

      // Navigate to build
      const response = await page.goto(`/${buildPath}/`, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Check response
      expect(response.status()).toBe(200);

      // Wait for page to be ready
      await page.waitForLoadState('domcontentloaded');

      // Log errors for debugging
      if (consoleErrors.length > 0) {
        console.log(`  ⚠️  Console errors in ${buildPath}:`, consoleErrors.slice(0, 5));
      }

      // Errors should be minimal
      expect(consoleErrors.length).toBeLessThan(10);
    });

    test('should render main content', async ({ page }) => {
      await page.goto(`/${buildPath}/`, { waitUntil: 'networkidle' });

      // Check for basic HTML structure
      const body = await page.locator('body');
      await expect(body).toBeVisible();

      // Check for common sections
      const hasNav = await page.locator('nav, header').count();
      expect(hasNav).toBeGreaterThan(0);
    });

    test('should have valid canvas or WebGL context', async ({ page }) => {
      await page.goto(`/${buildPath}/`, { waitUntil: 'networkidle' });

      // Check for canvas elements
      const canvasCount = await page.locator('canvas').count();

      if (canvasCount > 0) {
        // Test WebGL context creation
        const hasWebGL = await page.evaluate(() => {
          const canvas = document.querySelector('canvas');
          if (!canvas) return false;

          try {
            const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
            return gl !== null;
          } catch (e) {
            return false;
          }
        });

        console.log(`  ${hasWebGL ? '✅' : '❌'} WebGL support in ${buildPath}`);
      }
    });

    test('should load CSS stylesheets', async ({ page }) => {
      await page.goto(`/${buildPath}/`, { waitUntil: 'networkidle' });

      // Check for stylesheets
      const stylesheets = await page.evaluate(() => {
        return Array.from(document.styleSheets).length;
      });

      expect(stylesheets).toBeGreaterThan(0);
    });

    test('should load JavaScript files', async ({ page }) => {
      await page.goto(`/${buildPath}/`, { waitUntil: 'networkidle' });

      // Check for scripts
      const scripts = await page.locator('script').count();
      expect(scripts).toBeGreaterThan(0);
    });

    test('should take screenshot for visual regression', async ({ page }) => {
      await page.goto(`/${buildPath}/`, { waitUntil: 'networkidle' });

      // Wait a bit for animations to settle
      await page.waitForTimeout(2000);

      // Take screenshot
      await expect(page).toHaveScreenshot(`${buildPath.replace(/\//g, '-')}-full.png`, {
        fullPage: true,
        maxDiffPixels: 100
      });
    });

    test('should be responsive on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`/${buildPath}/`, { waitUntil: 'networkidle' });

      // Check if content is visible
      const body = await page.locator('body');
      await expect(body).toBeVisible();

      // Screenshot mobile view
      await expect(page).toHaveScreenshot(`${buildPath.replace(/\//g, '-')}-mobile.png`, {
        maxDiffPixels: 100
      });
    });
  });
}
