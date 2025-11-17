#!/usr/bin/env node

/**
 * Offline Physical Testing
 *
 * Tests builds in an environment with NO internet access.
 * Focuses on finding REAL JavaScript bugs (like missing dependencies)
 * rather than network failures.
 *
 * Uses request interception to mock successful CDN responses with empty stubs.
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const inventoryPath = path.join(rootDir, 'test-results', 'build-inventory.json');
const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
const builds = inventory.uniqueOnly || [];

console.log('\n🧪 OFFLINE PHYSICAL BUILD TESTING\n');
console.log(`Testing ${builds.length} unique builds (no internet)...\n`);

const testResults = [];

// Minimal GSAP stub to prevent crashes
const GSAP_STUB = `
window.gsap = {
  registerPlugin: () => {},
  to: () => ({ kill: () => {} }),
  from: () => ({ kill: () => {} }),
  fromTo: () => ({ kill: () => {} }),
  set: () => {},
  timeline: () => ({
    to: () => {},
    from: () => {},
    fromTo: () => {},
    kill: () => {}
  }),
  utils: {
    toArray: (x) => Array.isArray(x) ? x : [x],
    selector: (x) => document.querySelectorAll(x)
  }
};
window.ScrollTrigger = {
  create: () => ({ kill: () => {} }),
  refresh: () => {},
  update: () => {}
};
window.Flip = {
  from: () => {},
  to: () => {}
};
`;

// Minimal SplitType stub
const SPLITTYPE_STUB = `
window.SplitType = class {
  constructor() {
    this.lines = [];
    this.words = [];
    this.chars = [];
  }
};
`;

// Minimal Lenis stub
const LENIS_STUB = `
window.Lenis = class {
  constructor() {}
  on() {}
  raf() {}
  scrollTo() {}
  destroy() {}
};
`;

async function testBuild(browser, build) {
  const buildPath = build.path || build.name;
  const url = `http://localhost:8000/${buildPath}/`;

  const context = await browser.newContext();
  const page = await context.newPage();

  const result = {
    build: buildPath,
    url,
    consoleErrors: [],
    javaScriptErrors: [],
    unhandledRejections: [],
    realIssues: [],
    status: 'unknown'
  };

  try {
    // Intercept CDN requests and provide stubs
    await page.route('**/*', async (route, request) => {
      const url = request.url();

      // Mock CDN resources with stubs
      if (url.includes('gsap') && url.includes('gsap.min.js')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/javascript',
          body: GSAP_STUB
        });
      } else if (url.includes('ScrollTrigger')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/javascript',
          body: '// ScrollTrigger stub loaded via GSAP_STUB'
        });
      } else if (url.includes('Flip')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/javascript',
          body: '// Flip stub loaded via GSAP_STUB'
        });
      } else if (url.includes('split-type')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/javascript',
          body: SPLITTYPE_STUB
        });
      } else if (url.includes('lenis')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/javascript',
          body: LENIS_STUB
        });
      } else if (url.includes('fonts.googleapis.com')) {
        // Mock Google Fonts CSS
        await route.fulfill({
          status: 200,
          contentType: 'text/css',
          body: '/* Google Fonts stub */'
        });
      } else if (url.includes('fonts.gstatic.com')) {
        // Mock font files
        await route.fulfill({
          status: 200,
          contentType: 'font/woff2',
          body: ''
        });
      } else {
        // Allow all other requests to proceed normally
        await route.continue();
      }
    });

    // Capture console errors (filter out network errors)
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Skip network-related errors
        if (!text.includes('ERR_') &&
            !text.includes('Failed to load resource') &&
            !text.includes('net::')) {
          result.consoleErrors.push(text);
        }
      }
    });

    // Capture page errors (REAL JavaScript errors)
    page.on('pageerror', error => {
      result.javaScriptErrors.push({
        message: error.message,
        stack: error.stack
      });
    });

    // Capture unhandled promise rejections
    page.on('console', msg => {
      if (msg.type() === 'warning' && msg.text().includes('Unhandled Promise')) {
        result.unhandledRejections.push(msg.text());
      }
    });

    // Load the page (don't wait for networkidle - it won't happen with mocked requests)
    const startTime = Date.now();
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    // Wait a bit for JavaScript to execute
    await page.waitForTimeout(3000);

    result.pageLoadTime = Date.now() - startTime;

    // Check WebGL support
    result.webglStatus = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
      return gl ? 'supported' : 'not supported';
    });

    // Check for canvas elements
    result.canvasCount = await page.locator('canvas').count();

    // Check for polytope visualizers
    result.hasPolytopeVisualizer = await page.evaluate(() => {
      return typeof window.PolytopeVisualizer !== 'undefined' ||
             typeof window.CardPolytopeVisualizer !== 'undefined';
    });

    // Check for polytope enhancer
    result.hasPolytopeEnhancer = await page.evaluate(() => {
      return typeof window.PolytopeCardEnhancer !== 'undefined';
    });

    // Analyze REAL issues (not network failures)
    if (result.javaScriptErrors.length > 0) {
      result.javaScriptErrors.forEach(err => {
        // Check for common REAL bugs
        if (err.message.includes('is not defined')) {
          result.realIssues.push({
            type: 'undefined-variable',
            message: err.message
          });
        } else if (err.message.includes('is not a constructor')) {
          result.realIssues.push({
            type: 'missing-class',
            message: err.message
          });
        } else if (err.message.includes('Cannot read property')) {
          result.realIssues.push({
            type: 'null-reference',
            message: err.message
          });
        } else {
          result.realIssues.push({
            type: 'javascript-error',
            message: err.message
          });
        }
      });
    }

    // Determine status
    if (result.realIssues.length > 0) {
      result.status = 'has-real-bugs';
    } else if (result.javaScriptErrors.length > 0) {
      result.status = 'has-js-errors';
    } else {
      result.status = 'ok';
    }

  } catch (error) {
    result.status = 'test-error';
    result.testError = error.message;
  }

  await context.close();
  return result;
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  for (const build of builds) {
    process.stdout.write(`Testing ${build.name || build.path}... `);

    const result = await testBuild(browser, build);
    testResults.push(result);

    // Print status
    const statusIcons = {
      'ok': '✅',
      'has-real-bugs': '🔴',
      'has-js-errors': '🟡',
      'test-error': '💥'
    };

    const icon = statusIcons[result.status] || '❓';
    console.log(`${icon} ${result.status}`);

    // Show REAL issues only
    if (result.realIssues.length > 0) {
      console.log(`    Real Bugs Found (${result.realIssues.length}):`);
      result.realIssues.slice(0, 3).forEach(issue => {
        console.log(`      [${issue.type}] ${issue.message.substring(0, 100)}`);
      });
    }
  }

  await browser.close();

  // Summary
  console.log('\n\n📊 TEST SUMMARY\n');
  const statusCounts = {};
  testResults.forEach(r => {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  });

  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`${status}: ${count} builds`);
  });

  // Detailed issues
  const buildsWithRealIssues = testResults.filter(r => r.realIssues.length > 0);
  console.log(`\n🔴 Builds with REAL bugs: ${buildsWithRealIssues.length}`);

  if (buildsWithRealIssues.length > 0) {
    console.log('\nDetailed Issue Report:');
    buildsWithRealIssues.forEach(build => {
      console.log(`\n  ${build.build}:`);
      build.realIssues.forEach(issue => {
        console.log(`    - [${issue.type}] ${issue.message}`);
      });
    });
  }

  // Save report
  const reportPath = path.join(rootDir, 'test-results', 'offline-test-results.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalBuilds: builds.length,
    results: testResults,
    summary: statusCounts,
    buildsWithRealIssues: buildsWithRealIssues.length
  }, null, 2));

  console.log(`\n💾 Full results saved to: test-results/offline-test-results.json\n`);
}

main().catch(console.error);
