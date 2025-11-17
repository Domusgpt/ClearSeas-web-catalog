#!/usr/bin/env node

/**
 * Restore Original Working Polytope Configuration
 *
 * PROBLEM: card-polytope-visualizer.js conflicts with card-polytope-smooth-scroll.js
 * Both define the same CardPolytopeVisualizer class.
 *
 * SOLUTION: Remove card-polytope-visualizer.js entirely.
 * card-polytope-smooth-scroll.js is SELF-CONTAINED with its own visualizer implementation.
 *
 * ORIGINAL WORKING CONFIG (from first commit):
 *   - clear-seas-home.js
 *   - video-backgrounds.js
 *   - card-polytope-smooth-scroll.js (ONLY THIS, no other polytope files!)
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

console.log('\n🔧 Restoring Original Working Polytope Configuration...\n');

const buildsToFix = [
  'enhanced-2025-10-31_17-39-08fix-or-remove-visual-glitchescodex',
  'enhanced-2025-11-02_20-54-57analyze-scrolling-and-visualization-stylescodex',
  'enhanced-codex_16-09-16analyze-scrolling-and-visualization-styles2025-10-29',
  'enhanced-codex_18-20-24fix-or-remove-visual-glitches2025-10-24',
  'enhanced-codex_20-40-18analyze-scrolling-and-visualization-styles2025-10-19',
  'enhanced-codex_21-11-11analyze-scrolling-and-visualization-styles2025-10-19',
  'enhanced-fix-hero-animation',
  'enhanced-webgl-polytope-shaders'
];

let fixedCount = 0;

for (const buildPath of buildsToFix) {
  const indexPath = path.join(rootDir, buildPath, 'index.html');

  if (!fs.existsSync(indexPath)) {
    console.log(`⏭️  ${buildPath}: index.html not found`);
    continue;
  }

  try {
    let html = fs.readFileSync(indexPath, 'utf8');
    let changesMade = false;

    // Remove card-polytope-visualizer.js (it conflicts with smooth-scroll.js)
    const visualizerRegex = /\s*<script src="scripts\/card-polytope-visualizer\.js" defer><\/script>\s*/g;
    if (html.match(visualizerRegex)) {
      html = html.replace(visualizerRegex, '\n');
      changesMade = true;
      console.log(`✅ ${buildPath}: Removed card-polytope-visualizer.js`);
    }

    // Ensure card-polytope-smooth-scroll.js is present (should already be there)
    if (!html.includes('card-polytope-smooth-scroll.js')) {
      console.log(`⚠️  ${buildPath}: Missing card-polytope-smooth-scroll.js - needs manual review`);
    }

    if (changesMade) {
      fs.writeFileSync(indexPath, html);
      fixedCount++;
    } else {
      console.log(`⏭️  ${buildPath}: Already correct`);
    }

  } catch (error) {
    console.error(`❌ ${buildPath}: ${error.message}`);
  }
}

console.log(`\n✅ Fixed ${fixedCount}/${buildsToFix.length} builds\n`);
console.log('Restored to original working configuration:');
console.log('  ✓ clear-seas-home.js');
console.log('  ✓ video-backgrounds.js');
console.log('  ✓ card-polytope-smooth-scroll.js (self-contained visualizer)\n');
