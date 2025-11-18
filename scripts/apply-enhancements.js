#!/usr/bin/env node

/**
 * Apply Enhancement Fixes to All Builds
 *
 * Systematically applies:
 * - Accessibility improvements
 * - Performance optimizations
 * - Code quality fixes
 * - Error handling
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const inventoryPath = path.join(rootDir, 'test-results', 'build-inventory.json');

const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
const builds = inventory.uniqueOnly || [];

console.log('\n🔧 Applying Enhancements to All Builds...\n');

let totalFixes = 0;

// Enhancement templates
const CSS_ENHANCEMENTS = `
/* Accessibility Enhancements */
*:focus {
  outline: 2px solid #4A90E2;
  outline-offset: 2px;
}

*:focus:not(:focus-visible) {
  outline: none;
}

*:focus-visible {
  outline: 2px solid #4A90E2;
  outline-offset: 2px;
}

/* Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Performance Optimizations */
.animated-element {
  will-change: transform, opacity;
}

canvas {
  will-change: contents;
}

/* Skip to main content link */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px;
  text-decoration: none;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
`;

const JS_ERROR_HANDLING = `
// Enhanced Error Handling
window.addEventListener('error', function(event) {
  console.error('Global error:', event.error);
  // Graceful degradation for visualization errors
  if (event.error && event.error.message &&
      (event.error.message.includes('WebGL') || event.error.message.includes('canvas'))) {
    console.warn('Visualization error detected - degrading gracefully');
    // Hide canvas elements if they're causing issues
    document.querySelectorAll('canvas').forEach(canvas => {
      if (canvas.style) canvas.style.opacity = '0';
    });
  }
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
        console.warn('WebGL context lost');
        event.preventDefault();
      }, false);

      canvas.addEventListener('webglcontextrestored', function() {
        console.log('WebGL context restored');
        // Re-initialize WebGL if needed
      }, false);
    }
  });
});
`;

// Apply CSS enhancements
function enhanceCSS(cssPath, buildName) {
  try {
    let content = fs.readFileSync(cssPath, 'utf8');

    // Check if already enhanced
    if (content.includes('Accessibility Enhancements')) {
      return false;
    }

    // Add enhancements
    content += '\n\n' + CSS_ENHANCEMENTS;
    fs.writeFileSync(cssPath, content);
    return true;
  } catch (err) {
    console.error(`  Error enhancing CSS in ${buildName}:`, err.message);
    return false;
  }
}

// Apply JS enhancements
function enhanceJS(htmlPath, buildName) {
  try {
    let content = fs.readFileSync(htmlPath, 'utf8');

    // Check if already enhanced
    if (content.includes('Enhanced Error Handling')) {
      return false;
    }

    // Add error handling script before closing body tag
    const scriptTag = `\n<script>\n${JS_ERROR_HANDLING}\n</script>\n</body>`;
    content = content.replace('</body>', scriptTag);
    fs.writeFileSync(htmlPath, content);
    return true;
  } catch (err) {
    console.error(`  Error enhancing JS in ${buildName}:`, err.message);
    return false;
  }
}

// Add skip link to HTML
function addSkipLink(htmlPath, buildName) {
  try {
    let content = fs.readFileSync(htmlPath, 'utf8');

    // Check if already has skip link
    if (content.includes('skip-link') || content.includes('skip to main')) {
      return false;
    }

    // Add skip link after opening body tag
    const skipLink = '<a href="#main-content" class="skip-link">Skip to main content</a>\n';
    content = content.replace('<body>', '<body>\n' + skipLink);

    // Add id to main content area if not present
    if (!content.includes('id="main-content"')) {
      // Try to find main tag
      if (content.includes('<main>')) {
        content = content.replace('<main>', '<main id="main-content">');
      } else if (content.includes('<section')) {
        // Add to first section
        content = content.replace('<section', '<section id="main-content"');
      }
    }

    fs.writeFileSync(htmlPath, content);
    return true;
  } catch (err) {
    console.error(`  Error adding skip link in ${buildName}:`, err.message);
    return false;
  }
}

// Process each build
for (const build of builds) {
  const buildPath = path.join(rootDir, build.path);
  const indexPath = path.join(buildPath, 'index.html');

  console.log(`📦 Enhancing: ${build.name}`);

  let buildFixes = 0;

  // Enhance main CSS file
  const mainCSSPath = path.join(buildPath, 'styles', 'main.css');
  if (fs.existsSync(mainCSSPath)) {
    if (enhanceCSS(mainCSSPath, build.name)) {
      buildFixes++;
      console.log(`  ✅ Enhanced main.css`);
    }
  }

  // Enhance other CSS files
  try {
    const stylesDir = path.join(buildPath, 'styles');
    if (fs.existsSync(stylesDir)) {
      const cssFiles = fs.readdirSync(stylesDir).filter(f => f.endsWith('.css'));
      cssFiles.forEach(file => {
        const cssPath = path.join(stylesDir, file);
        if (file !== 'main.css' && enhanceCSS(cssPath, build.name)) {
          buildFixes++;
        }
      });
    }
  } catch (err) {
    // Ignore
  }

  // Enhance index.html with error handling
  if (enhanceJS(indexPath, build.name)) {
    buildFixes++;
    console.log(`  ✅ Added error handling to index.html`);
  }

  // Add skip link
  if (addSkipLink(indexPath, build.name)) {
    buildFixes++;
    console.log(`  ✅ Added skip link for accessibility`);
  }

  if (buildFixes > 0) {
    console.log(`  🎯 Applied ${buildFixes} enhancements`);
    totalFixes += buildFixes;
  } else {
    console.log(`  ℹ️  Already enhanced or no applicable fixes`);
  }

  console.log();
}

console.log(`\n✅ Enhancement Complete!\n`);
console.log(`Total enhancements applied: ${totalFixes}`);
console.log(`Builds processed: ${builds.length}\n`);

// Save summary
const summaryPath = path.join(rootDir, 'test-results', 'enhancement-summary.json');
const summary = {
  timestamp: new Date().toISOString(),
  buildsProcessed: builds.length,
  totalEnhancements: totalFixes,
  categories: [
    'Accessibility: Focus styles, reduced motion, skip links',
    'Performance: Will-change hints, error handling',
    'Reliability: WebGL context loss handling, global error handling'
  ]
};

fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
console.log(`💾 Summary saved to: test-results/enhancement-summary.json\n`);
