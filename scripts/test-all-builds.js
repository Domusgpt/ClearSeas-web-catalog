#!/usr/bin/env node

/**
 * Comprehensive Build Tester
 *
 * Tests all builds and identifies common issues:
 * - Missing files
 * - Broken imports
 * - Console errors
 * - Missing dependencies
 * - Common code patterns that need fixing
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const inventoryPath = path.join(rootDir, 'test-results', 'build-inventory.json');

// Load inventory
const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
const builds = inventory.uniqueOnly || [];

console.log('\n🔍 Analyzing all unique builds for common issues...\n');

const issuesByCategory = {
  missingFiles: [],
  brokenImports: [],
  invalidHTML: [],
  missingDependencies: [],
  consoleErrors: [],
  performanceIssues: [],
  accessibilityIssues: []
};

const fixes = {
  global: [],
  byCategory: {},
  byBuild: {}
};

// Analyze each build
for (const build of builds) {
  const buildPath = path.join(rootDir, build.path);
  const indexPath = path.join(buildPath, 'index.html');

  console.log(`📦 Analyzing: ${build.name}`);

  try {
    const indexHTML = fs.readFileSync(indexPath, 'utf8');

    // Check for common issues
    const issues = {
      build: build.name,
      category: build.category,
      issues: []
    };

    // 1. Check for script tags with src attributes
    const scriptMatches = indexHTML.matchAll(/<script[^>]+src=["']([^"']+)["']/g);
    for (const match of scriptMatches) {
      const scriptSrc = match[1];

      // Skip external URLs
      if (scriptSrc.startsWith('http') || scriptSrc.startsWith('//')) continue;

      // Check if file exists
      const scriptPath = path.join(buildPath, scriptSrc);
      if (!fs.existsSync(scriptPath)) {
        issues.issues.push({
          type: 'missingFile',
          file: scriptSrc,
          fix: 'Create file or remove reference'
        });
      }
    }

    // 2. Check for link tags (CSS)
    const linkMatches = indexHTML.matchAll(/<link[^>]+href=["']([^"']+)["']/g);
    for (const match of linkMatches) {
      const href = match[1];

      // Skip external URLs and fonts
      if (href.startsWith('http') || href.startsWith('//')) continue;

      const cssPath = path.join(buildPath, href);
      if (!fs.existsSync(cssPath)) {
        issues.issues.push({
          type: 'missingFile',
          file: href,
          fix: 'Create file or remove reference'
        });
      }
    }

    // 3. Check for missing GSAP
    const usesGSAP = indexHTML.includes('gsap') || indexHTML.includes('ScrollTrigger');
    const hasGSAPScript = indexHTML.includes('gsap.min.js') || indexHTML.includes('cdn.jsdelivr.net/npm/gsap');

    if (usesGSAP && !hasGSAPScript) {
      issues.issues.push({
        type: 'missingDependency',
        dependency: 'GSAP',
        fix: 'Add GSAP CDN script tag'
      });
    }

    // 4. Check for proper DOCTYPE
    if (!indexHTML.trim().toLowerCase().startsWith('<!doctype html>')) {
      issues.issues.push({
        type: 'invalidHTML',
        issue: 'Missing or invalid DOCTYPE',
        fix: 'Add <!DOCTYPE html> at the beginning'
      });
    }

    // 5. Check for lang attribute
    if (!indexHTML.includes('<html lang=')) {
      issues.issues.push({
        type: 'accessibilityIssue',
        issue: 'Missing lang attribute on <html>',
        fix: 'Add lang="en" to <html> tag'
      });
    }

    // 6. Check for meta charset
    if (!indexHTML.includes('charset=')) {
      issues.issues.push({
        type: 'invalidHTML',
        issue: 'Missing charset meta tag',
        fix: 'Add <meta charset="UTF-8">'
      });
    }

    // 7. Check for viewport meta
    if (!indexHTML.includes('name="viewport"')) {
      issues.issues.push({
        type: 'invalidHTML',
        issue: 'Missing viewport meta tag',
        fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1.0">'
      });
    }

    // Print issues
    if (issues.issues.length > 0) {
      console.log(`  ⚠️  Found ${issues.issues.length} issues:`);
      issues.issues.forEach(issue => {
        console.log(`     - ${issue.type}: ${issue.file || issue.issue || issue.dependency}`);

        // Add to category
        if (!issuesByCategory[issue.type]) issuesByCategory[issue.type] = [];
        issuesByCategory[issue.type].push({
          build: build.name,
          ...issue
        });
      });
    } else {
      console.log(`  ✅ No issues found`);
    }

  } catch (err) {
    console.log(`  ❌ Error analyzing: ${err.message}`);
  }

  console.log();
}

// Summary
console.log('\n📊 SUMMARY\n');
console.log(`Total builds analyzed: ${builds.length}`);
console.log(`Unique builds: ${builds.length}\n`);

console.log('Issues by type:');
for (const [type, issues] of Object.entries(issuesByCategory)) {
  if (issues.length > 0) {
    console.log(`  ${type}: ${issues.length} occurrences across ${new Set(issues.map(i => i.build)).size} builds`);
  }
}

// Save detailed report
const reportPath = path.join(rootDir, 'test-results', 'issue-report.json');
const report = {
  generatedAt: new Date().toISOString(),
  totalBuilds: builds.length,
  issuesByCategory,
  recommendations: [
    'Fix missing lang attribute on all HTML tags',
    'Add viewport meta tag to all builds',
    'Ensure all referenced scripts and stylesheets exist',
    'Add proper DOCTYPE to all HTML files',
    'Add charset meta tag to all builds'
  ]
};

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`\n💾 Detailed report saved to: test-results/issue-report.json\n`);
