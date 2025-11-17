#!/usr/bin/env node

/**
 * Fix All Dependency Bugs
 *
 * Fixes the 11 critical bugs found:
 * - Missing card-polytope-visualizer-enhanced.js (defines CardPolytopeEnhancer)
 * - Missing card-polytope-visualizer-advanced.js (defines CardPolytopeVisualizer)
 * - Wrong script load order
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const bugsPath = path.join(rootDir, 'test-results', 'dependency-bugs.json');
const bugs = JSON.parse(fs.readFileSync(bugsPath, 'utf8'));

console.log('\n🔧 Fixing All Dependency Bugs...\n');

let totalFixed = 0;
const fixLog = [];

// Get critical issues only
const criticalBuilds = bugs.results.filter(r =>
  r.issues.some(i => i.severity === 'critical')
);

console.log(`Found ${criticalBuilds.length} builds with critical issues\n`);

for (const build of criticalBuilds) {
  const buildPath = path.join(rootDir, build.path);
  const indexPath = path.join(buildPath, 'index.html');

  if (!fs.existsSync(indexPath)) {
    console.log(`⏭️  Skipping ${build.build} (index.html not found)`);
    continue;
  }

  try {
    let html = fs.readFileSync(indexPath, 'utf8');
    let changesMade = 0;
    const changes = [];

    for (const issue of build.issues) {
      if (issue.severity !== 'critical') continue;

      if (issue.type === 'missing-script') {
        // Extract the script filename from the fix message
        const scriptMatch = issue.fix.match(/src="([^"]+)"/);

        if (scriptMatch) {
          const scriptToAdd = scriptMatch[1];
          const scriptFilename = path.basename(scriptToAdd);

          // Check if this script file actually exists
          const scriptPath = path.join(buildPath, scriptToAdd);

          if (!fs.existsSync(scriptPath)) {
            console.log(`  ⚠️  ${build.build}: ${scriptFilename} not found on disk`);
            changes.push(`⚠️ SKIPPED: ${scriptFilename} doesn't exist`);
            continue;
          }

          // Check if already loaded
          if (html.includes(scriptToAdd)) {
            changes.push(`✓ Already loads ${scriptFilename}`);
            continue;
          }

          // Determine where to insert the script
          let insertionPoint = null;
          let insertAfter = '';

          // For polytope visualizers, insert before smooth-scroll if it exists
          if (scriptFilename.includes('visualizer-enhanced') || scriptFilename.includes('visualizer-advanced')) {
            const smoothScrollMatch = html.match(/<script[^>]*src="[^"]*card-polytope-smooth-scroll\.js"[^>]*>/);

            if (smoothScrollMatch) {
              insertionPoint = html.indexOf(smoothScrollMatch[0]);
              insertAfter = 'before smooth-scroll';
            }
          }

          // If no specific location, insert before closing </head>
          if (insertionPoint === null) {
            const headClose = html.lastIndexOf('</head>');
            if (headClose > -1) {
              insertionPoint = headClose;
              insertAfter = 'in head';
            }
          }

          if (insertionPoint !== null) {
            const scriptTag = `    <script src="${scriptToAdd}" defer></script>\n`;

            html = html.substring(0, insertionPoint) +
                   scriptTag +
                   html.substring(insertionPoint);

            changesMade++;
            changes.push(`✅ Added ${scriptFilename} ${insertAfter}`);
          }
        }
      } else if (issue.type === 'wrong-order') {
        // Fix script order
        const smoothScrollRegex = /<script[^>]*src="[^"]*card-polytope-smooth-scroll\.js"[^>]*><\/script>\s*/;
        const visualizerRegex = /<script[^>]*src="[^"]*card-polytope-visualizer\.js"[^>]*><\/script>\s*/;

        const smoothScrollMatch = html.match(smoothScrollRegex);
        const visualizerMatch = html.match(visualizerRegex);

        if (smoothScrollMatch && visualizerMatch) {
          const smoothScrollIndex = html.indexOf(smoothScrollMatch[0]);
          const visualizerIndex = html.indexOf(visualizerMatch[0]);

          // If smooth-scroll comes before visualizer, swap them
          if (smoothScrollIndex < visualizerIndex) {
            // Remove visualizer from its current position
            html = html.replace(visualizerRegex, '');

            // Insert visualizer before smooth-scroll
            html = html.replace(
              smoothScrollRegex,
              visualizerMatch[0] + smoothScrollMatch[0]
            );

            changesMade++;
            changes.push('✅ Fixed script load order (visualizer before smooth-scroll)');
          }
        }
      }
    }

    if (changesMade > 0) {
      fs.writeFileSync(indexPath, html);
      totalFixed++;

      console.log(`✅ ${build.build}:`);
      changes.forEach(change => console.log(`   ${change}`));

      fixLog.push({
        build: build.build,
        path: build.path,
        changesMade,
        changes
      });
    } else {
      console.log(`⏭️  ${build.build}: No changes needed or possible`);
    }

  } catch (err) {
    console.error(`❌ Error fixing ${build.build}:`, err.message);
  }
}

console.log(`\n✅ Fixed ${totalFixed}/${criticalBuilds.length} builds with critical issues\n`);

// Save fix log
const logPath = path.join(rootDir, 'test-results', 'dependency-fixes-log.json');
fs.writeFileSync(logPath, JSON.stringify({
  timestamp: new Date().toISOString(),
  totalBuildsFixed: totalFixed,
  fixes: fixLog
}, null, 2));

console.log(`💾 Fix log saved to: test-results/dependency-fixes-log.json\n`);
