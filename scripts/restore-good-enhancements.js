#!/usr/bin/env node

/**
 * Restore GOOD Enhancements
 *
 * Put back:
 * - Accessibility features (skip links, focus styles)
 * - Non-invasive error logging
 * - Performance hints
 *
 * DO NOT add anything that hides or breaks visualizers
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const inventoryPath = path.join(rootDir, 'test-results', 'build-inventory.json');
const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
const builds = inventory.builds || [];

console.log('\n✅ Restoring Essential Enhancements...\n');

// GOOD error handling - logs only, doesn't break anything
const GOOD_ERROR_HANDLING = `
// Error Logging (Non-Invasive)
window.addEventListener('error', function(event) {
  console.error('Error detected:', event.error);
});

window.addEventListener('unhandledrejection', function(event) {
  console.warn('Unhandled promise rejection:', event.reason);
});

// WebGL Context Recovery
document.addEventListener('DOMContentLoaded', function() {
  const canvases = document.querySelectorAll('canvas');
  canvases.forEach(canvas => {
    canvas.addEventListener('webglcontextlost', function(event) {
      console.warn('WebGL context lost - attempting recovery');
      event.preventDefault();
    }, false);

    canvas.addEventListener('webglcontextrestored', function() {
      console.log('WebGL context restored');
      window.dispatchEvent(new CustomEvent('webgl:restored'));
    }, false);
  });
});
`;

// Good CSS enhancements
const ACCESSIBILITY_CSS = `
/* Accessibility Enhancements */
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
  }
}

/* Performance Hints */
.animated-element,
[data-animate] {
  will-change: transform, opacity;
}

canvas {
  will-change: contents;
}

/* Skip Link */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px 16px;
  text-decoration: none;
  z-index: 100;
  border-radius: 0 0 4px 0;
}

.skip-link:focus {
  top: 0;
}
`;

let totalFixed = 0;

for (const build of builds) {
  const buildPath = path.join(rootDir, build.path);
  const indexPath = path.join(buildPath, 'index.html');

  try {
    let html = fs.readFileSync(indexPath, 'utf8');
    let changes = 0;

    // Add error handling if not present
    if (!html.includes('Error Logging')) {
      html = html.replace('</body>', `\n<script>\n${GOOD_ERROR_HANDLING}\n</script>\n</body>`);
      changes++;
    }

    // Add skip link if not present
    if (!html.includes('skip-link')) {
      const skipLink = '<a href="#main-content" class="skip-link">Skip to main content</a>\n';
      html = html.replace('<body>', '<body>\n' + skipLink);

      // Add id to main content if needed
      if (!html.includes('id="main-content"')) {
        if (html.includes('<main>')) {
          html = html.replace('<main>', '<main id="main-content">');
        } else if (html.includes('<section')) {
          html = html.replace(/<section([^>]*?)>/, '<section$1 id="main-content">');
        }
      }
      changes++;
    }

    if (changes > 0) {
      fs.writeFileSync(indexPath, html);
      console.log(`✅ ${build.name || build.path}`);
      totalFixed++;
    }

  } catch (err) {
    // Skip
  }

  // Add CSS enhancements
  const mainCSSPath = path.join(buildPath, 'styles', 'main.css');
  if (fs.existsSync(mainCSSPath)) {
    try {
      let css = fs.readFileSync(mainCSSPath, 'utf8');

      if (!css.includes('Accessibility Enhancements')) {
        css += '\n\n' + ACCESSIBILITY_CSS;
        fs.writeFileSync(mainCSSPath, css);
      }
    } catch (err) {
      // Skip
    }
  }
}

console.log(`\n✅ Restored essential enhancements to ${totalFixed} builds\n`);
