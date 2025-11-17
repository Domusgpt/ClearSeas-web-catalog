#!/usr/bin/env node

/**
 * Fix Missing Polytope Visualizer Scripts
 *
 * Many builds load card-polytope-smooth-scroll.js but not the actual
 * card-polytope-visualizer.js that defines CardPolytopeVisualizer class
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const inventoryPath = path.join(rootDir, 'test-results', 'build-inventory.json');
const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
const builds = inventory.builds || [];

console.log('\n🔧 Fixing Missing Polytope Visualizer Scripts...\n');

let totalFixed = 0;

for (const build of builds) {
  const buildPath = path.join(rootDir, build.path);
  const indexPath = path.join(buildPath, 'index.html');
  const scriptsPath = path.join(buildPath, 'scripts');

  // Check if this build has the polytope scripts
  const hasPolytopeSmooth = fs.existsSync(path.join(scriptsPath, 'card-polytope-smooth-scroll.js'));
  const hasPolytopeVisualizer = fs.existsSync(path.join(scriptsPath, 'card-polytope-visualizer.js'));

  if (hasPolytopeSmooth && hasPolytopeVisualizer && fs.existsSync(indexPath)) {
    try {
      let html = fs.readFileSync(indexPath, 'utf8');

      // Check if HTML loads smooth-scroll but NOT the visualizer
      const loadsSmooth = html.includes('card-polytope-smooth-scroll.js');
      const loadsVisualizer = html.includes('card-polytope-visualizer.js');

      if (loadsSmooth && !loadsVisualizer) {
        // Add the visualizer script BEFORE smooth-scroll
        html = html.replace(
          'card-polytope-smooth-scroll.js',
          'card-polytope-visualizer.js" defer></script>\n    <script src="scripts/card-polytope-smooth-scroll.js'
        );

        fs.writeFileSync(indexPath, html);
        console.log(`✅ Fixed: ${build.name || build.path}`);
        totalFixed++;
      }

    } catch (err) {
      console.error(`❌ Error with ${build.name || build.path}:`, err.message);
    }
  }
}

console.log(`\n✅ Fixed ${totalFixed} builds with missing polytope visualizer scripts\n`);
