#!/usr/bin/env node

/**
 * Deep Code Analysis for Enhancement Opportunities
 *
 * Analyzes all builds to identify:
 * - Code quality improvements
 * - Performance optimizations
 * - Accessibility enhancements
 * - Modern JS patterns to adopt
 * - Security improvements
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const inventoryPath = path.join(rootDir, 'test-results', 'build-inventory.json');

const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
const builds = inventory.uniqueOnly || [];

console.log('\n🔬 Deep Code Analysis for Enhancement Opportunities...\n');

const enhancements = {
  performance: [],
  accessibility: [],
  codeQuality: [],
  security: [],
  modernization: []
};

// Analyze JavaScript files
function analyzeJavaScript(content, filePath, buildName) {
  const issues = [];

  // Check for console.log (should be removed in production)
  const consoleLogs = (content.match(/console\.log\(/g) || []).length;
  if (consoleLogs > 5) {
    issues.push({
      type: 'codeQuality',
      severity: 'low',
      issue: `${consoleLogs} console.log statements found`,
      file: filePath,
      fix: 'Remove or wrap in development check'
    });
  }

  // Check for error handling
  const tryBlocks = (content.match(/try\s*{/g) || []).length;
  const asyncFunctions = (content.match(/async\s+function|async\s*\(/g) || []).length;

  if (asyncFunctions > 0 && tryBlocks === 0) {
    issues.push({
      type: 'codeQuality',
      severity: 'medium',
      issue: 'Async functions without try/catch blocks',
      file: filePath,
      fix: 'Add error handling to async operations'
    });
  }

  // Check for performance: multiple DOM queries
  const querySelector = (content.match(/querySelector|getElementById|getElementsBy/g) || []).length;
  if (querySelector > 10) {
    issues.push({
      type: 'performance',
      severity: 'medium',
      issue: `${querySelector} DOM queries - consider caching`,
      file: filePath,
      fix: 'Cache frequently accessed DOM elements'
    });
  }

  // Check for accessibility: focus management
  if (content.includes('addEventListener') && !content.includes('focus')) {
    issues.push({
      type: 'accessibility',
      severity: 'low',
      issue: 'Event listeners without focus management',
      file: filePath,
      fix: 'Add keyboard navigation support'
    });
  }

  // Check for modern patterns
  if (content.includes('var ')) {
    issues.push({
      type: 'modernization',
      severity: 'low',
      issue: 'Using var instead of let/const',
      file: filePath,
      fix: 'Replace var with const/let'
    });
  }

  // Check for requestAnimationFrame
  if (content.includes('setInterval') && (content.includes('canvas') || content.includes('animation'))) {
    issues.push({
      type: 'performance',
      severity: 'high',
      issue: 'Using setInterval for animations',
      file: filePath,
      fix: 'Use requestAnimationFrame for smoother animations'
    });
  }

  // Check for WebGL context loss handling
  if (content.includes('getContext') && content.includes('webgl')) {
    if (!content.includes('webglcontextlost')) {
      issues.push({
        type: 'codeQuality',
        severity: 'medium',
        issue: 'WebGL without context loss handling',
        file: filePath,
        fix: 'Add webglcontextlost and webglcontextrestored event listeners'
      });
    }
  }

  // Check for memory leaks: event listeners
  if (content.includes('addEventListener') && !content.includes('removeEventListener')) {
    issues.push({
      type: 'performance',
      severity: 'medium',
      issue: 'Event listeners may not be cleaned up',
      file: filePath,
      fix: 'Add removeEventListener in cleanup/destroy methods'
    });
  }

  return issues;
}

// Analyze CSS files
function analyzeCSS(content, filePath, buildName) {
  const issues = [];

  // Check for animations without will-change
  if (content.includes('@keyframes') || content.includes('transition:')) {
    if (!content.includes('will-change')) {
      issues.push({
        type: 'performance',
        severity: 'low',
        issue: 'Animations without will-change hint',
        file: filePath,
        fix: 'Add will-change for animated properties'
      });
    }
  }

  // Check for accessibility: focus styles
  if (!content.includes(':focus')) {
    issues.push({
      type: 'accessibility',
      severity: 'high',
      issue: 'No focus styles defined',
      file: filePath,
      fix: 'Add :focus styles for keyboard navigation'
    });
  }

  // Check for reduced motion
  if (!content.includes('prefers-reduced-motion')) {
    issues.push({
      type: 'accessibility',
      severity: 'medium',
      issue: 'No reduced motion support',
      file: filePath,
      fix: 'Add @media (prefers-reduced-motion: reduce) rules'
    });
  }

  // Check for mobile responsiveness
  if (!content.includes('@media')) {
    issues.push({
      type: 'codeQuality',
      severity: 'medium',
      issue: 'No media queries found',
      file: filePath,
      fix: 'Add responsive breakpoints'
    });
  }

  return issues;
}

// Analyze each build
for (const build of builds.slice(0, 10)) { // Analyze first 10 builds
  const buildPath = path.join(rootDir, build.path);

  console.log(`📦 ${build.name}`);

  // Find JS files
  try {
    const files = fs.readdirSync(buildPath, { recursive: true });

    for (const file of files) {
      const fullPath = path.join(buildPath, file);
      if (!fs.statSync(fullPath).isFile()) continue;

      if (file.endsWith('.js') && !file.includes('node_modules') && !file.includes('min.js')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const jsIssues = analyzeJavaScript(content, file, build.name);

        jsIssues.forEach(issue => {
          enhancements[issue.type].push({
            build: build.name,
            category: build.category,
            ...issue
          });
        });

        if (jsIssues.length > 0) {
          console.log(`  📄 ${file}: ${jsIssues.length} enhancement opportunities`);
        }
      }

      if (file.endsWith('.css') && !file.includes('node_modules') && !file.includes('min.css')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const cssIssues = analyzeCSS(content, file, build.name);

        cssIssues.forEach(issue => {
          enhancements[issue.type].push({
            build: build.name,
            category: build.category,
            ...issue
          });
        });

        if (cssIssues.length > 0) {
          console.log(`  🎨 ${file}: ${cssIssues.length} enhancement opportunities`);
        }
      }
    }
  } catch (err) {
    console.log(`  ❌ Error: ${err.message}`);
  }

  console.log();
}

// Summary
console.log('\n📊 ENHANCEMENT OPPORTUNITIES\n');

for (const [category, issues] of Object.entries(enhancements)) {
  if (issues.length > 0) {
    const highPriority = issues.filter(i => i.severity === 'high').length;
    const mediumPriority = issues.filter(i => i.severity === 'medium').length;
    const lowPriority = issues.filter(i => i.severity === 'low').length;

    console.log(`${category.toUpperCase()}:`);
    console.log(`  Total: ${issues.length}`);
    console.log(`  High priority: ${highPriority}`);
    console.log(`  Medium priority: ${mediumPriority}`);
    console.log(`  Low priority: ${lowPriority}`);
    console.log();
  }
}

// Save report
const reportPath = path.join(rootDir, 'test-results', 'enhancement-report.json');
const report = {
  generatedAt: new Date().toISOString(),
  buildsAnalyzed: 10,
  enhancements,
  topPriorities: [
    'Add focus styles for accessibility',
    'Add WebGL context loss handling',
    'Add error handling to async functions',
    'Add reduced motion support',
    'Cache frequently accessed DOM elements'
  ]
};

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`💾 Enhancement report saved to: test-results/enhancement-report.json\n`);
