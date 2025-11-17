#!/usr/bin/env node

/**
 * Fix Broken Enhancements
 *
 * Removes error handling that hides canvases
 * Replaces with non-invasive logging only
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const inventoryPath = path.join(rootDir, 'test-results', 'build-inventory.json');
const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
const builds = inventory.builds || [];

console.log('\n🔧 Fixing Broken Error Handling...\n');

const BETTER_ERROR_HANDLING = `
// Enhanced Error Handling (Non-Invasive)
window.addEventListener('error', function(event) {
  console.error('Global error:', event.error);
  // Log only - don't hide visualizations
});

window.addEventListener('unhandledrejection', function(event) {
  console.error('Unhandled promise rejection:', event.reason);
});

// WebGL Context Loss Handling
document.addEventListener('DOMContentLoaded', function() {
  const canvases = document.querySelectorAll('canvas');
  canvases.forEach(canvas => {
    if (canvas.getContext) {
      canvas.addEventListener('webglcontextlost', function(event) {
        console.warn('WebGL context lost - will attempt recovery');
        event.preventDefault();
      }, false);

      canvas.addEventListener('webglcontextrestored', function() {
        console.log('WebGL context restored');
        // Trigger re-initialization event
        const restoreEvent = new CustomEvent('webgl:restored', { detail: { canvas } });
        window.dispatchEvent(restoreEvent);
      }, false);
    }
  });
});
`;

let totalFixed = 0;

for (const build of builds) {
  const buildPath = path.join(rootDir, build.path);
  const indexPath = path.join(buildPath, 'index.html');

  try {
    let html = fs.readFileSync(indexPath, 'utf8');

    // Find and replace the bad error handling
    const badPattern = /\/\/ Enhanced Error Handling[\s\S]*?document\.querySelectorAll\('canvas'\)\.forEach\(canvas => \{[\s\S]*?canvas\.style\.opacity = '0';[\s\S]*?\}\);[\s\S]*?\}\);/;

    if (badPattern.test(html)) {
      html = html.replace(badPattern, BETTER_ERROR_HANDLING.trim());
      fs.writeFileSync(indexPath, html);
      console.log(`✅ Fixed: ${build.name || build.path}`);
      totalFixed++;
    }

  } catch (err) {
    // Skip if file doesn't exist
  }
}

console.log(`\n✅ Fixed ${totalFixed} builds\n`);
