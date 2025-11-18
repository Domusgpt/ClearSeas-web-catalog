#!/usr/bin/env node

/**
 * Physical Testing of All Builds
 *
 * Actually loads each build in a real browser and checks:
 * - Console errors
 * - Failed network requests
 * - JavaScript exceptions
 * - WebGL context creation
 * - Visualizer initialization
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const inventoryPath = path.join(rootDir, 'test-results', 'build-inventory.json');
const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
const builds = inventory.uniqueOnly || []; // Test unique builds only

console.log('\n🧪 PHYSICAL BUILD TESTING\n');
console.log(`Testing ${builds.length} unique builds...\n`);

const testResults = [];

async function testBuild(browser, build) {
  const buildPath = build.path || build.name;
  const url = `http://localhost:8000/${buildPath}/`;

  const context = await browser.newContext();
  const page = await context.newPage();

  const result = {
    build: buildPath,
    url,
    errors: [],
    warnings: [],
    failedRequests: [],
    javaScriptErrors: [],
    webglStatus: 'unknown',
    visualizerStatus: 'unknown',
    pageLoadTime: 0,
    status: 'unknown'
  };

  try {
    // Capture console messages
    page.on('console', msg => {
      if (msg.type() === 'error') {
        result.errors.push(msg.text());
      } else if (msg.type() === 'warning') {
        result.warnings.push(msg.text());
      }
    });

    // Capture page errors
    page.on('pageerror', error => {
      result.javaScriptErrors.push(error.message);
    });

    // Capture failed requests
    page.on('requestfailed', request => {
      result.failedRequests.push({
        url: request.url(),
        failure: request.failure().errorText
      });
    });

    // Load the page
    const startTime = Date.now();
    const response = await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    result.pageLoadTime = Date.now() - startTime;

    if (!response || response.status() !== 200) {
      result.status = 'failed';
      result.errors.push(`HTTP ${response?.status() || 'unknown'}`);
      await context.close();
      return result;
    }

    // Wait a bit for JavaScript to execute
    await page.waitForTimeout(2000);

    // Check WebGL support
    result.webglStatus = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
      return gl ? 'supported' : 'not supported';
    });

    // Check for canvas elements
    const canvasCount = await page.locator('canvas').count();
    result.canvasCount = canvasCount;

    // Check for polytope visualizers
    result.hasPolytopeEnhancer = await page.evaluate(() => {
      return typeof window.polytopeEnhancer !== 'undefined' ||
             typeof window.PolytopeCardEnhancer !== 'undefined';
    });

    // Check for visual orchestrator
    result.hasVisualOrchestrator = await page.evaluate(() => {
      return typeof window.visualOrchestrator !== 'undefined';
    });

    // Check for GSAP
    result.hasGSAP = await page.evaluate(() => {
      return typeof gsap !== 'undefined';
    });

    // Determine overall status
    if (result.javaScriptErrors.length > 0) {
      result.status = 'has-js-errors';
    } else if (result.failedRequests.length > 0) {
      result.status = 'has-failed-requests';
    } else if (result.errors.length > 3) {
      result.status = 'has-many-console-errors';
    } else {
      result.status = 'ok';
    }

  } catch (error) {
    result.status = 'error';
    result.errors.push(error.message);
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
      'has-js-errors': '🔴',
      'has-failed-requests': '🟠',
      'has-many-console-errors': '🟡',
      'failed': '❌',
      'error': '💥'
    };

    const icon = statusIcons[result.status] || '❓';
    console.log(`${icon} ${result.status}`);

    if (result.status !== 'ok') {
      if (result.javaScriptErrors.length > 0) {
        console.log(`    JS Errors (${result.javaScriptErrors.length}):`);
        result.javaScriptErrors.slice(0, 3).forEach(err => {
          console.log(`      - ${err.substring(0, 100)}`);
        });
      }
      if (result.failedRequests.length > 0) {
        console.log(`    Failed Requests (${result.failedRequests.length}):`);
        result.failedRequests.slice(0, 3).forEach(req => {
          console.log(`      - ${req.url.substring(req.url.lastIndexOf('/'))}`);
        });
      }
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
  const buildsWithIssues = testResults.filter(r => r.status !== 'ok');
  console.log(`\nBuilds with issues: ${buildsWithIssues.length}`);

  // Save report
  const reportPath = path.join(rootDir, 'test-results', 'physical-test-results.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalBuilds: builds.length,
    results: testResults,
    summary: statusCounts
  }, null, 2));

  console.log(`\n💾 Full results saved to: test-results/physical-test-results.json\n`);
}

main().catch(console.error);
