#!/usr/bin/env node

/**
 * Find Dependency Bugs via Static Analysis
 *
 * Searches for REAL bugs like the CardPolytopeVisualizer issue:
 * - Classes/functions referenced but not defined
 * - Scripts loaded in wrong order
 * - Missing script dependencies
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const inventoryPath = path.join(rootDir, 'test-results', 'build-inventory.json');
const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
const builds = inventory.uniqueOnly || [];

console.log('\n🔍 Finding Dependency Bugs via Static Analysis...\n');

const allIssues = [];

function findInFile(filepath, searchPattern) {
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    const matches = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      if (searchPattern.test(line)) {
        matches.push({
          line: index + 1,
          content: line.trim()
        });
      }
    });

    return matches;
  } catch (err) {
    return [];
  }
}

function analyzeHTMLScriptOrder(htmlPath) {
  const issues = [];

  try {
    const html = fs.readFileSync(htmlPath, 'utf8');
    const scriptTags = [];

    // Extract all script tags in order
    const scriptRegex = /<script[^>]*src=["']([^"']+)["'][^>]*>/g;
    let match;

    while ((match = scriptRegex.exec(html)) !== null) {
      scriptTags.push({
        src: match[1],
        fullTag: match[0],
        index: match.index
      });
    }

    // Check for polytope dependency issues
    const smoothScrollIndex = scriptTags.findIndex(s => s.src.includes('card-polytope-smooth-scroll'));
    const visualizerIndex = scriptTags.findIndex(s => s.src.includes('card-polytope-visualizer'));

    if (smoothScrollIndex > -1 && visualizerIndex === -1) {
      issues.push({
        type: 'missing-dependency',
        severity: 'critical',
        message: 'Loads card-polytope-smooth-scroll.js but NOT card-polytope-visualizer.js',
        fix: 'Add <script src="scripts/card-polytope-visualizer.js" defer></script> before smooth-scroll'
      });
    }

    if (smoothScrollIndex > -1 && visualizerIndex > -1 && smoothScrollIndex < visualizerIndex) {
      issues.push({
        type: 'wrong-order',
        severity: 'critical',
        message: 'card-polytope-smooth-scroll.js loads BEFORE card-polytope-visualizer.js',
        fix: 'Move card-polytope-visualizer.js to load before smooth-scroll.js'
      });
    }

    // Check for other common patterns
    const hasGSAP = scriptTags.some(s => s.src.includes('gsap'));
    const hasScrollTrigger = scriptTags.some(s => s.src.includes('ScrollTrigger'));

    // Check for scripts that use GSAP/ScrollTrigger
    const customScripts = scriptTags.filter(s => s.src.includes('scripts/') && !s.src.includes('.min.'));

    for (const script of customScripts) {
      const scriptPath = path.join(path.dirname(htmlPath), script.src);

      if (fs.existsSync(scriptPath)) {
        const content = fs.readFileSync(scriptPath, 'utf8');

        // Check if script uses GSAP but GSAP not loaded
        if (content.includes('gsap.') && !hasGSAP) {
          issues.push({
            type: 'missing-dependency',
            severity: 'high',
            message: `${path.basename(script.src)} uses GSAP but GSAP not loaded`,
            fix: 'Add GSAP CDN or local script before this file'
          });
        }

        // Check if script uses ScrollTrigger but not loaded
        if (content.includes('ScrollTrigger') && !hasScrollTrigger) {
          issues.push({
            type: 'missing-dependency',
            severity: 'high',
            message: `${path.basename(script.src)} uses ScrollTrigger but not loaded`,
            fix: 'Add ScrollTrigger CDN or local script'
          });
        }

        // Check for "new ClassName()" without checking if class exists
        const newClassRegex = /new\s+([A-Z][a-zA-Z0-9]+)\s*\(/g;
        let classMatch;

        while ((classMatch = newClassRegex.exec(content)) !== null) {
          const className = classMatch[1];

          // Check if this class is defined anywhere in the build
          const buildPath = path.dirname(htmlPath);
          const scriptsDir = path.join(buildPath, 'scripts');

          if (fs.existsSync(scriptsDir)) {
            const scriptFiles = fs.readdirSync(scriptsDir)
              .filter(f => f.endsWith('.js'));

            let classFound = false;

            for (const scriptFile of scriptFiles) {
              const scriptContent = fs.readFileSync(path.join(scriptsDir, scriptFile), 'utf8');

              if (scriptContent.includes(`class ${className}`) ||
                  scriptContent.includes(`function ${className}`) ||
                  scriptContent.includes(`const ${className} =`) ||
                  scriptContent.includes(`var ${className} =`)) {
                classFound = true;

                // Check if that script is loaded in HTML
                const isLoaded = scriptTags.some(s => s.src.includes(scriptFile));

                if (!isLoaded) {
                  issues.push({
                    type: 'missing-script',
                    severity: 'critical',
                    message: `Uses "new ${className}()" but ${scriptFile} not loaded in HTML`,
                    fix: `Add <script src="scripts/${scriptFile}" defer></script>`
                  });
                }

                break;
              }
            }

            if (!classFound && !['Array', 'Object', 'Map', 'Set', 'Date', 'Promise', 'Error'].includes(className)) {
              issues.push({
                type: 'undefined-class',
                severity: 'high',
                message: `Uses "new ${className}()" but class not found in any script`,
                fix: `Ensure ${className} is defined or imported`
              });
            }
          }
        }
      }
    }

  } catch (err) {
    // Skip builds we can't analyze
  }

  return issues;
}

// Analyze each build
for (const build of builds) {
  const buildPath = path.join(rootDir, build.path);
  const indexPath = path.join(buildPath, 'index.html');

  if (!fs.existsSync(indexPath)) {
    continue;
  }

  const buildIssues = analyzeHTMLScriptOrder(indexPath);

  if (buildIssues.length > 0) {
    allIssues.push({
      build: build.name || build.path,
      path: build.path,
      issues: buildIssues
    });
  }
}

// Report
console.log(`\n📊 DEPENDENCY BUG REPORT\n`);
console.log(`Analyzed: ${builds.length} builds`);
console.log(`Builds with issues: ${allIssues.length}\n`);

if (allIssues.length === 0) {
  console.log('✅ No dependency bugs found!\n');
} else {
  const criticalCount = allIssues.reduce((sum, b) =>
    sum + b.issues.filter(i => i.severity === 'critical').length, 0);
  const highCount = allIssues.reduce((sum, b) =>
    sum + b.issues.filter(i => i.severity === 'high').length, 0);

  console.log(`🔴 Critical issues: ${criticalCount}`);
  console.log(`🟡 High priority issues: ${highCount}\n`);

  // Group by issue type
  console.log('\n📋 ISSUES BY TYPE:\n');

  const byType = {};
  allIssues.forEach(build => {
    build.issues.forEach(issue => {
      if (!byType[issue.type]) {
        byType[issue.type] = [];
      }
      byType[issue.type].push({
        build: build.build,
        ...issue
      });
    });
  });

  Object.entries(byType).forEach(([type, issues]) => {
    console.log(`\n${type.toUpperCase()} (${issues.length} issues):`);
    issues.slice(0, 10).forEach(issue => {
      console.log(`  🔸 ${issue.build}`);
      console.log(`     ${issue.message}`);
      console.log(`     💡 Fix: ${issue.fix}\n`);
    });

    if (issues.length > 10) {
      console.log(`  ... and ${issues.length - 10} more\n`);
    }
  });

  // Detailed report for critical issues
  const criticalBuilds = allIssues.filter(b => b.issues.some(i => i.severity === 'critical'));

  if (criticalBuilds.length > 0) {
    console.log('\n\n🚨 CRITICAL ISSUES NEEDING IMMEDIATE FIX:\n');

    criticalBuilds.forEach(build => {
      const critical = build.issues.filter(i => i.severity === 'critical');

      console.log(`\n📁 ${build.build}`);
      critical.forEach(issue => {
        console.log(`   ❌ ${issue.message}`);
        console.log(`   💡 ${issue.fix}`);
      });
    });
  }
}

// Save JSON report
const reportPath = path.join(rootDir, 'test-results', 'dependency-bugs.json');
fs.writeFileSync(reportPath, JSON.stringify({
  timestamp: new Date().toISOString(),
  totalBuilds: builds.length,
  buildsWithIssues: allIssues.length,
  criticalIssues: allIssues.reduce((sum, b) =>
    sum + b.issues.filter(i => i.severity === 'critical').length, 0),
  results: allIssues
}, null, 2));

console.log(`\n\n💾 Full report saved to: test-results/dependency-bugs.json\n`);
