#!/usr/bin/env node

/**
 * Smart Build Grouping and Individual Enhancement Analyzer
 *
 * Creates intelligent groupings based on:
 * - Technology stack (WebGL, GSAP, vanilla)
 * - Feature sets (video backgrounds, polytopes, quantum effects)
 * - File structure similarities
 * - Individual build characteristics
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const inventoryPath = path.join(rootDir, 'test-results', 'build-inventory.json');
const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
const builds = inventory.uniqueOnly || [];

console.log('\n🎯 Smart Build Grouping & Individual Analysis\n');

// Feature detection
function analyzeFeatures(buildPath) {
  const features = {
    hasWebGL: false,
    hasGSAP: false,
    hasVideo: false,
    hasPolytope: false,
    hasQuantum: false,
    hasCardSystem: false,
    hasScrollChoreography: false,
    hasPerformanceMonitor: false,
    hasVisualOrchestrator: false,
    javascriptFiles: [],
    cssFiles: [],
    visualizers: []
  };

  try {
    const indexPath = path.join(rootDir, buildPath, 'index.html');
    const indexHTML = fs.readFileSync(indexPath, 'utf8');

    // Detect technologies
    features.hasWebGL = indexHTML.includes('webgl') || indexHTML.includes('WebGL');
    features.hasGSAP = indexHTML.includes('gsap') || indexHTML.includes('ScrollTrigger');
    features.hasVideo = indexHTML.includes('<video') || indexHTML.includes('video-backgrounds');
    features.hasPolytope = indexHTML.includes('polytope') || indexHTML.includes('Polytope');
    features.hasQuantum = indexHTML.includes('quantum') || indexHTML.includes('Quantum');
    features.hasCardSystem = indexHTML.includes('card') || indexHTML.includes('Card');

    // Scan for JavaScript files
    const files = fs.readdirSync(path.join(rootDir, buildPath), { recursive: true });

    for (const file of files) {
      const fullPath = path.join(rootDir, buildPath, file);
      if (!fs.statSync(fullPath).isFile()) continue;

      if (file.endsWith('.js') && !file.includes('node_modules') && !file.includes('.min.')) {
        features.javascriptFiles.push(file);

        // Check for specific managers/visualizers
        if (file.includes('ScrollChoreographer')) features.hasScrollChoreography = true;
        if (file.includes('PerformanceMonitor')) features.hasPerformanceMonitor = true;
        if (file.includes('VisualOrchestrator')) features.hasVisualOrchestrator = true;
        if (file.includes('Visualizer') || file.includes('visualizer')) {
          features.visualizers.push(file);
        }
      }

      if (file.endsWith('.css') && !file.includes('node_modules') && !file.includes('.min.')) {
        features.cssFiles.push(file);
      }
    }
  } catch (err) {
    console.error(`Error analyzing ${buildPath}:`, err.message);
  }

  return features;
}

// Analyze all builds
const buildAnalysis = builds.map(build => ({
  ...build,
  features: analyzeFeatures(build.path)
}));

// Smart grouping by technology stack
const groups = {
  webglPolytope: [],
  gsapChoreography: [],
  videoBackgrounds: [],
  quantumVisualizers: [],
  basicStatic: [],
  advancedCombo: []
};

for (const build of buildAnalysis) {
  const f = build.features;

  // Advanced combo (has multiple advanced features)
  if ((f.hasWebGL && f.hasGSAP) || (f.hasPolytope && f.hasQuantum) || f.hasScrollChoreography) {
    groups.advancedCombo.push(build);
  }
  // WebGL Polytope specialists
  else if (f.hasWebGL && f.hasPolytope) {
    groups.webglPolytope.push(build);
  }
  // GSAP animation focused
  else if (f.hasGSAP) {
    groups.gsapChoreography.push(build);
  }
  // Quantum visualizers
  else if (f.hasQuantum) {
    groups.quantumVisualizers.push(build);
  }
  // Video backgrounds
  else if (f.hasVideo) {
    groups.videoBackgrounds.push(build);
  }
  // Basic/static
  else {
    groups.basicStatic.push(build);
  }
}

// Report
console.log('📊 Smart Groups Created:\n');

for (const [groupName, groupBuilds] of Object.entries(groups)) {
  if (groupBuilds.length === 0) continue;

  console.log(`\n🎯 ${groupName.toUpperCase()} (${groupBuilds.length} builds):`);
  console.log('─'.repeat(60));

  groupBuilds.forEach(build => {
    const f = build.features;
    console.log(`\n  📦 ${build.name}`);
    console.log(`     Category: ${build.category}`);
    console.log(`     JS Files: ${f.javascriptFiles.length}`);
    console.log(`     CSS Files: ${f.cssFiles.length}`);
    console.log(`     Visualizers: ${f.visualizers.length}`);

    const techs = [];
    if (f.hasWebGL) techs.push('WebGL');
    if (f.hasGSAP) techs.push('GSAP');
    if (f.hasPolytope) techs.push('Polytope');
    if (f.hasQuantum) techs.push('Quantum');
    if (f.hasVideo) techs.push('Video');
    if (f.hasScrollChoreography) techs.push('ScrollChoreography');

    console.log(`     Tech Stack: ${techs.join(', ') || 'Basic'}`);
  });
}

// Save detailed analysis
const detailedReport = {
  timestamp: new Date().toISOString(),
  totalBuilds: builds.length,
  groups,
  buildAnalysis,
  recommendations: {
    advancedCombo: [
      'Optimize WebGL + GSAP integration',
      'Add progressive enhancement layers',
      'Implement advanced error recovery',
      'Add performance budgets',
      'Cache visualizer instances'
    ],
    webglPolytope: [
      'Optimize shader compilation',
      'Add geometry LOD system',
      'Implement vertex buffer caching',
      'Add WebGL extension detection'
    ],
    gsapChoreography: [
      'Batch GSAP animations',
      'Use GSAP timeline optimization',
      'Add scroll event throttling',
      'Implement intersection observers'
    ],
    quantumVisualizers: [
      'Optimize particle systems',
      'Add spatial partitioning',
      'Implement object pooling',
      'Use typed arrays for positions'
    ],
    videoBackgrounds: [
      'Add lazy video loading',
      'Implement video preloading',
      'Add poster images',
      'Optimize video formats'
    ],
    basicStatic: [
      'Add resource hints (preconnect, dns-prefetch)',
      'Optimize images with srcset',
      'Add service worker support',
      'Implement critical CSS'
    ]
  }
};

const reportPath = path.join(rootDir, 'test-results', 'smart-groups.json');
fs.writeFileSync(reportPath, JSON.stringify(detailedReport, null, 2));

console.log('\n\n💾 Detailed analysis saved to: test-results/smart-groups.json\n');

module.exports = { groups, buildAnalysis };
