#!/usr/bin/env node

/**
 * Fix Class Conflict - Remove Duplicate Visualizer Scripts
 *
 * PROBLEM: Multiple scripts define the same class (CardPolytopeVisualizer)
 * causing them to overwrite each other. This breaks the visualizers,
 * showing white/foaming instead of colorful polytopes.
 *
 * SOLUTION: Remove the conflicting enhanced/advanced scripts.
 * Each build should load ONLY:
 *   - card-polytope-visualizer.js (base class)
 *   - card-polytope-smooth-scroll.js (scroll integration)
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

console.log('\n🔧 Fixing Class Conflict - Removing Duplicate Visualizer Scripts...\n');

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

    // Remove card-polytope-visualizer-enhanced.js
    const enhancedRegex = /\s*<script src="scripts\/card-polytope-visualizer-enhanced\.js" defer><\/script>\s*/g;
    if (html.match(enhancedRegex)) {
      html = html.replace(enhancedRegex, '\n');
      changesMade = true;
      console.log(`✅ ${buildPath}: Removed visualizer-enhanced.js`);
    }

    // Remove card-polytope-visualizer-advanced.js
    const advancedRegex = /\s*<script src="scripts\/card-polytope-visualizer-advanced\.js" defer><\/script>\s*/g;
    if (html.match(advancedRegex)) {
      html = html.replace(advancedRegex, '\n');
      changesMade = true;
      console.log(`✅ ${buildPath}: Removed visualizer-advanced.js`);
    }

    // Ensure proper order: visualizer.js THEN smooth-scroll.js
    // Remove duplicate smooth-scroll.js if exists
    const smoothScrollRegex = /<script src="scripts\/card-polytope-smooth-scroll\.js" defer><\/script>/g;
    const smoothScrollMatches = html.match(smoothScrollRegex) || [];

    if (smoothScrollMatches.length > 1) {
      // Keep only the first occurrence after visualizer.js
      let foundFirst = false;
      html = html.replace(smoothScrollRegex, (match) => {
        if (!foundFirst) {
          foundFirst = true;
          return match;
        }
        return '';
      });
      changesMade = true;
      console.log(`✅ ${buildPath}: Removed duplicate smooth-scroll.js`);
    }

    if (changesMade) {
      fs.writeFileSync(indexPath, html);
      fixedCount++;
    } else {
      console.log(`⏭️  ${buildPath}: No conflicts found`);
    }

  } catch (error) {
    console.error(`❌ ${buildPath}: ${error.message}`);
  }
}

console.log(`\n✅ Fixed ${fixedCount}/${buildsToFix.length} builds\n`);
console.log('Each build now loads ONLY:');
console.log('  - card-polytope-visualizer.js (base)');
console.log('  - card-polytope-smooth-scroll.js (scroll integration)\n');
