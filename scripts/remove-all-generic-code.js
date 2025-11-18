#!/usr/bin/env node

/**
 * Remove ALL Generic Code
 *
 * Removes:
 * - Error handling scripts
 * - PerformanceOptimizer
 * - WebGLGSAPSync
 * - ScrollOptimizer
 * - All my generic additions
 *
 * Back to clean slate for individual fixes
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const inventoryPath = path.join(rootDir, 'test-results', 'build-inventory.json');
const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
const builds = inventory.builds || [];

console.log('\n🧹 Removing ALL Generic Code...\n');

let totalRemoved = 0;

for (const build of builds) {
  const buildPath = path.join(rootDir, build.path);
  const indexPath = path.join(buildPath, 'index.html');

  try {
    let html = fs.readFileSync(indexPath, 'utf8');
    let changes = 0;

    // Remove PerformanceOptimizer
    if (html.includes('PerformanceOptimizer')) {
      html = html.replace(/<script>\s*\/\*\*[\s\S]*?PerformanceOptimizer[\s\S]*?<\/script>\s*/g, '');
      changes++;
    }

    // Remove WebGLGSAPSync
    if (html.includes('WebGLGSAPSync')) {
      html = html.replace(/<script>\s*\/\*\*[\s\S]*?WebGLGSAPSync[\s\S]*?<\/script>\s*/g, '');
      changes++;
    }

    // Remove ScrollOptimizer
    if (html.includes('ScrollOptimizer')) {
      html = html.replace(/<script>\s*\/\*\*[\s\S]*?ScrollOptimizer[\s\S]*?<\/script>\s*/g, '');
      changes++;
    }

    // Remove error handling
    if (html.includes('Enhanced Error Handling')) {
      html = html.replace(/<script>\s*\/\/\s*Enhanced Error Handling[\s\S]*?<\/script>\s*/g, '');
      changes++;
    }

    // Remove skip links I added
    if (html.includes('skip-link')) {
      html = html.replace(/<a href="#main-content" class="skip-link">Skip to main content<\/a>\s*/g, '');
      changes++;
    }

    if (changes > 0) {
      fs.writeFileSync(indexPath, html);
      console.log(`✅ ${build.name || build.path} - Removed ${changes} generic additions`);
      totalRemoved++;
    }

  } catch (err) {
    // Skip
  }
}

// Also remove from CSS
for (const build of builds) {
  const buildPath = path.join(rootDir, build.path);
  const stylesDir = path.join(buildPath, 'styles');

  if (!fs.existsSync(stylesDir)) continue;

  const cssFiles = fs.readdirSync(stylesDir).filter(f => f.endsWith('.css'));

  for (const cssFile of cssFiles) {
    const cssPath = path.join(stylesDir, cssFile);

    try {
      let css = fs.readFileSync(cssPath, 'utf8');
      let changes = 0;

      // Remove my accessibility enhancements section
      if (css.includes('Accessibility Enhancements')) {
        css = css.replace(/\/\* Accessibility Enhancements \*\/[\s\S]*?\/\* Skip to main content link \*\/[\s\S]*?\}/g, '');
        changes++;
      }

      if (changes > 0) {
        fs.writeFileSync(cssPath, css);
      }

    } catch (err) {
      // Skip
    }
  }
}

console.log(`\n✅ Removed generic code from ${totalRemoved} builds\n`);
console.log('Ready for individual, tailored fixes.\n');
