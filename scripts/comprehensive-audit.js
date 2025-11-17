#!/usr/bin/env node

/**
 * Comprehensive Build Audit
 *
 * Finds ALL issues like the missing CardPolytopeVisualizer:
 * - Missing script dependencies
 * - Missing CSS files
 * - Broken src/href references
 * - Class usage without definition
 * - Missing GSAP when needed
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const inventoryPath = path.join(rootDir, 'test-results', 'build-inventory.json');
const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
const builds = inventory.builds || [];

console.log('\n🔍 COMPREHENSIVE BUILD AUDIT\n');
console.log(`Analyzing ${builds.length} builds...\n`);

const allIssues = {
  missingScripts: [],
  missingCSS: [],
  missingClasses: [],
  missingGSAP: [],
  brokenReferences: [],
  dependencyOrder: []
};

let totalIssues = 0;

for (const build of builds) {
  const buildPath = path.join(rootDir, build.path);
  const indexPath = path.join(buildPath, 'index.html');

  if (!fs.existsSync(indexPath)) continue;

  const buildIssues = [];

  try {
    const html = fs.readFileSync(indexPath, 'utf8');

    // 1. Check all <script src="...">
    const scriptMatches = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)];
    for (const match of scriptMatches) {
      const src = match[1];
      if (src.startsWith('http') || src.startsWith('//')) continue;

      const scriptPath = path.join(buildPath, src);
      if (!fs.existsSync(scriptPath)) {
        buildIssues.push({
          type: 'missingScript',
          file: src,
          severity: 'high'
        });
      }
    }

    // 2. Check all <link href="..." (CSS)
    const linkMatches = [...html.matchAll(/<link[^>]+href=["']([^"']+)["']/g)];
    for (const match of linkMatches) {
      const href = match[1];
      if (href.startsWith('http') || href.startsWith('//')) continue;
      if (!href.endsWith('.css')) continue;

      const cssPath = path.join(buildPath, href);
      if (!fs.existsSync(cssPath)) {
        buildIssues.push({
          type: 'missingCSS',
          file: href,
          severity: 'medium'
        });
      }
    }

    // 3. Check for GSAP usage without loading
    const usesGSAP = html.includes('gsap.') || html.includes('ScrollTrigger') || html.includes('Flip.');
    const hasGSAPCDN = html.includes('cdn.jsdelivr.net/npm/gsap') || html.includes('cdnjs.cloudflare.com/ajax/libs/gsap');
    const hasGSAPLocal = scriptMatches.some(m => m[1].includes('gsap'));

    if (usesGSAP && !hasGSAPCDN && !hasGSAPLocal) {
      buildIssues.push({
        type: 'missingGSAP',
        detail: 'Uses GSAP but not loaded',
        severity: 'high'
      });
    }

    // 4. Scan loaded JavaScript files for class dependencies
    const loadedScripts = scriptMatches
      .map(m => m[1])
      .filter(src => !src.startsWith('http') && !src.startsWith('//'))
      .map(src => path.join(buildPath, src))
      .filter(p => fs.existsSync(p));

    // Build a map of defined classes
    const definedClasses = new Set();
    const usedClasses = new Set();

    for (const scriptPath of loadedScripts) {
      try {
        const scriptContent = fs.readFileSync(scriptPath, 'utf8');

        // Find class definitions
        const classDefMatches = [...scriptContent.matchAll(/class\s+(\w+)/g)];
        classDefMatches.forEach(m => definedClasses.add(m[1]));

        // Find class usage (new ClassName)
        const classUseMatches = [...scriptContent.matchAll(/new\s+(\w+)\(/g)];
        classUseMatches.forEach(m => usedClasses.add(m[1]));

      } catch (err) {
        // Skip on error
      }
    }

    // Check for used but not defined classes
    for (const usedClass of usedClasses) {
      if (!definedClasses.has(usedClass) && !['Date', 'Array', 'Object', 'Map', 'Set', 'Promise', 'Error', 'CustomEvent', 'IntersectionObserver', 'ResizeObserver', 'MutationObserver', 'FormData', 'URLSearchParams', 'WebSocket', 'Worker', 'Image', 'Audio'].includes(usedClass)) {
        buildIssues.push({
          type: 'missingClass',
          class: usedClass,
          severity: 'high',
          detail: `Class "${usedClass}" used but not defined in loaded scripts`
        });
      }
    }

    // 5. Check script loading order for dependencies
    const scriptOrder = scriptMatches.map(m => path.basename(m[1]));

    // Known dependency requirements
    const dependencies = {
      'card-polytope-smooth-scroll.js': ['card-polytope-visualizer.js'],
      'global-page-orchestrator.js': ['clear-seas-home.js'],
      'app-enhanced.js': ['app.js']
    };

    for (const [dependent, required] of Object.entries(dependencies)) {
      if (scriptOrder.includes(dependent)) {
        for (const req of required) {
          const dependentIndex = scriptOrder.indexOf(dependent);
          const requiredIndex = scriptOrder.indexOf(req);

          if (requiredIndex === -1) {
            // Required script not loaded at all
            buildIssues.push({
              type: 'missingDependency',
              script: dependent,
              requires: req,
              severity: 'critical',
              detail: `${dependent} requires ${req} but it's not loaded`
            });
          } else if (requiredIndex > dependentIndex) {
            // Required script loaded AFTER dependent
            buildIssues.push({
              type: 'dependencyOrder',
              script: dependent,
              requires: req,
              severity: 'high',
              detail: `${dependent} loaded before ${req} (wrong order)`
            });
          }
        }
      }
    }

    // Report build issues
    if (buildIssues.length > 0) {
      console.log(`\n⚠️  ${build.name || build.path}`);
      console.log(`    ${buildIssues.length} issues found:`);

      buildIssues.forEach(issue => {
        const icon = issue.severity === 'critical' ? '🔴' : issue.severity === 'high' ? '🟠' : '🟡';
        console.log(`    ${icon} [${issue.type}] ${issue.file || issue.class || issue.script || issue.detail}`);

        // Add to global issues
        if (!allIssues[issue.type]) allIssues[issue.type] = [];
        allIssues[issue.type].push({
          build: build.name || build.path,
          ...issue
        });
      });

      totalIssues += buildIssues.length;
    }

  } catch (err) {
    console.error(`❌ Error analyzing ${build.name}:`, err.message);
  }
}

// Summary report
console.log('\n\n📊 AUDIT SUMMARY\n');
console.log(`Total builds analyzed: ${builds.length}`);
console.log(`Total issues found: ${totalIssues}\n`);

for (const [type, issues] of Object.entries(allIssues)) {
  if (issues.length > 0) {
    console.log(`${type}: ${issues.length} issues across ${new Set(issues.map(i => i.build)).size} builds`);
  }
}

// Save detailed report
const reportPath = path.join(rootDir, 'test-results', 'comprehensive-audit.json');
const report = {
  timestamp: new Date().toISOString(),
  totalBuilds: builds.length,
  totalIssues,
  issuesByType: allIssues,
  summary: Object.entries(allIssues).map(([type, issues]) => ({
    type,
    count: issues.length,
    affectedBuilds: new Set(issues.map(i => i.build)).size
  }))
};

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`\n💾 Full report saved to: test-results/comprehensive-audit.json\n`);
