#!/usr/bin/env node

/**
 * Download CDN Dependencies Locally
 *
 * All builds depend on external CDN resources that fail in localhost testing.
 * This downloads them locally so builds can function offline.
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const libsDir = path.join(rootDir, 'shared-libs');

// Create shared libs directory
if (!fs.existsSync(libsDir)) {
  fs.mkdirSync(libsDir, { recursive: true });
}

console.log('\n📦 Downloading CDN Dependencies Locally...\n');

// CDN resources to download
const dependencies = [
  {
    name: 'GSAP Core (3.12.5)',
    url: 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js',
    filename: 'gsap-3.12.5.min.js'
  },
  {
    name: 'GSAP ScrollTrigger (3.12.5)',
    url: 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js',
    filename: 'ScrollTrigger-3.12.5.min.js'
  },
  {
    name: 'GSAP Flip (3.12.5)',
    url: 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/Flip.min.js',
    filename: 'Flip-3.12.5.min.js'
  },
  {
    name: 'GSAP Core (3.13.0)',
    url: 'https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js',
    filename: 'gsap-3.13.0.min.js'
  },
  {
    name: 'GSAP ScrollTrigger (3.13.0)',
    url: 'https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js',
    filename: 'ScrollTrigger-3.13.0.min.js'
  },
  {
    name: 'split-type (0.3.4)',
    url: 'https://cdn.jsdelivr.net/npm/split-type@0.3.4/dist/index.min.js',
    filename: 'split-type-0.3.4.min.js'
  },
  {
    name: 'Lenis (1.0.42)',
    url: 'https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.42/dist/lenis.min.js',
    filename: 'lenis-1.0.42.min.js'
  }
];

function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, (response) => {
      if (response.statusCode === 200) {
        const file = fs.createWriteStream(filepath);
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      } else if (response.statusCode === 301 || response.statusCode === 302) {
        // Follow redirect
        downloadFile(response.headers.location, filepath)
          .then(resolve)
          .catch(reject);
      } else {
        reject(new Error(`HTTP ${response.statusCode}`));
      }
    }).on('error', reject);
  });
}

async function main() {
  let successCount = 0;
  let failCount = 0;

  for (const dep of dependencies) {
    const filepath = path.join(libsDir, dep.filename);

    // Skip if already exists
    if (fs.existsSync(filepath)) {
      console.log(`⏭️  Skipping ${dep.name} (already exists)`);
      successCount++;
      continue;
    }

    process.stdout.write(`📥 Downloading ${dep.name}... `);

    try {
      await downloadFile(dep.url, filepath);
      console.log('✅');
      successCount++;
    } catch (error) {
      console.log(`❌ ${error.message}`);
      failCount++;
    }
  }

  console.log(`\n✅ Downloaded ${successCount}/${dependencies.length} dependencies`);
  if (failCount > 0) {
    console.log(`⚠️  ${failCount} failed (will retry on next run)`);
  }
  console.log(`📁 Saved to: ${libsDir}\n`);
}

main().catch(console.error);
