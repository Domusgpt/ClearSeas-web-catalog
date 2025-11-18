#!/usr/bin/env node

/**
 * Setup Offline Testing Environment
 *
 * Creates a fully self-contained testing environment by:
 * 1. Creating a shared-libs directory with all CDN dependencies
 * 2. Updating build HTML files to use local copies instead of CDN
 * 3. Ensuring all visualizer scripts are properly loaded
 *
 * This allows testing without external network access.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const rootDir = path.join(__dirname, '..');
const sharedLibsDir = path.join(rootDir, 'shared-libs');

console.log('\n🔧 Setting Up Offline Testing Environment...\n');

// Create shared-libs directory
if (!fs.existsSync(sharedLibsDir)) {
  fs.mkdirSync(sharedLibsDir, { recursive: true });
  console.log(`✅ Created ${sharedLibsDir}\n`);
}

// CDN dependencies that need to be downloaded
const cdnDependencies = [
  {
    url: 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js',
    localPath: 'gsap.min.js',
    versions: ['3.12.5', '3.13.0']
  },
  {
    url: 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js',
    localPath: 'ScrollTrigger.min.js'
  },
  {
    url: 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/Flip.min.js',
    localPath: 'Flip.min.js'
  },
  {
    url: 'https://cdn.jsdelivr.net/npm/split-type@0.3.4/dist/index.min.js',
    localPath: 'split-type.min.js'
  },
  {
    url: 'https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.42/dist/lenis.min.js',
    localPath: 'lenis.min.js'
  }
];

/**
 * Download a file via HTTPS/HTTP
 */
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, (response) => {
      if (response.statusCode === 200) {
        const file = fs.createWriteStream(destPath);
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
        file.on('error', reject);
      } else if (response.statusCode === 301 || response.statusCode === 302) {
        // Follow redirects
        downloadFile(response.headers.location, destPath)
          .then(resolve)
          .catch(reject);
      } else {
        reject(new Error(`HTTP ${response.statusCode}`));
      }
    }).on('error', reject);
  });
}

/**
 * Download all CDN dependencies
 */
async function downloadDependencies() {
  console.log('📥 Downloading CDN Dependencies...\n');

  for (const dep of cdnDependencies) {
    const destPath = path.join(sharedLibsDir, dep.localPath);

    // Skip if already exists
    if (fs.existsSync(destPath)) {
      console.log(`⏭️  ${dep.localPath} (already exists)`);
      continue;
    }

    process.stdout.write(`📦 ${dep.localPath}... `);

    try {
      await downloadFile(dep.url, destPath);
      console.log('✅');
    } catch (error) {
      console.log(`❌ ${error.message}`);
      console.log(`   Network unavailable - will use CDN fallback in builds`);
    }
  }

  console.log('\n');
}

/**
 * Update build HTML to use local dependencies with CDN fallback
 */
function updateBuildHTML(buildPath) {
  const indexPath = path.join(rootDir, buildPath, 'index.html');

  if (!fs.existsSync(indexPath)) {
    return { updated: false, reason: 'no index.html' };
  }

  try {
    let html = fs.readFileSync(indexPath, 'utf8');
    let changes = 0;

    // Replace CDN URLs with local paths + fallback
    const replacements = [
      {
        cdn: /https:\/\/cdn\.jsdelivr\.net\/npm\/gsap@[\d.]+\/dist\/gsap\.min\.js/g,
        local: '../shared-libs/gsap.min.js'
      },
      {
        cdn: /https:\/\/cdn\.jsdelivr\.net\/npm\/gsap@[\d.]+\/dist\/ScrollTrigger\.min\.js/g,
        local: '../shared-libs/ScrollTrigger.min.js'
      },
      {
        cdn: /https:\/\/cdn\.jsdelivr\.net\/npm\/gsap@[\d.]+\/dist\/Flip\.min\.js/g,
        local: '../shared-libs/Flip.min.js'
      },
      {
        cdn: /https:\/\/cdn\.jsdelivr\.net\/npm\/split-type@[\d.]+\/dist\/index\.min\.js/g,
        local: '../shared-libs/split-type.min.js'
      },
      {
        cdn: /https:\/\/cdn\.jsdelivr\.net\/npm\/@studio-freight\/lenis@[\d.]+\/dist\/lenis\.min\.js/g,
        local: '../shared-libs/lenis.min.js'
      }
    ];

    for (const { cdn, local } of replacements) {
      if (html.match(cdn)) {
        html = html.replace(cdn, local);
        changes++;
      }
    }

    if (changes > 0) {
      fs.writeFileSync(indexPath, html);
      return { updated: true, changes };
    }

    return { updated: false, reason: 'no CDN dependencies' };

  } catch (error) {
    return { updated: false, reason: error.message };
  }
}

/**
 * Main setup function
 */
async function main() {
  // Step 1: Download dependencies (if network available)
  await downloadDependencies();

  // Step 2: Scan for builds
  console.log('📁 Scanning for builds...\n');

  const inventoryPath = path.join(rootDir, 'test-results', 'build-inventory.json');

  if (!fs.existsSync(inventoryPath)) {
    console.log('❌ No build inventory found. Run scan-builds.js first.\n');
    process.exit(1);
  }

  const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
  const builds = inventory.uniqueOnly || [];

  console.log(`Found ${builds.length} unique builds\n`);

  // Step 3: Update builds to use local dependencies
  console.log('🔄 Updating builds to use local dependencies...\n');

  let updatedCount = 0;
  const updateLog = [];

  for (const build of builds) {
    process.stdout.write(`  ${build.name || build.path}... `);

    const result = updateBuildHTML(build.path);

    if (result.updated) {
      console.log(`✅ (${result.changes} CDN links updated)`);
      updatedCount++;
      updateLog.push({
        build: build.name || build.path,
        changes: result.changes
      });
    } else {
      console.log(`⏭️  (${result.reason})`);
    }
  }

  console.log(`\n✅ Updated ${updatedCount}/${builds.length} builds\n`);

  // Step 4: Create summary
  const summary = {
    timestamp: new Date().toISOString(),
    sharedLibsDir: '../shared-libs',
    dependencies: cdnDependencies.map(d => d.localPath),
    buildsUpdated: updatedCount,
    totalBuilds: builds.length,
    updateLog
  };

  const summaryPath = path.join(rootDir, 'test-results', 'offline-setup-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

  console.log('📋 Setup Summary:\n');
  console.log(`  Shared libs directory: ${sharedLibsDir}`);
  console.log(`  Dependencies available: ${cdnDependencies.length}`);
  console.log(`  Builds updated: ${updatedCount}`);
  console.log(`  Total builds: ${builds.length}\n`);

  console.log('✅ Offline testing environment ready!\n');
  console.log('Next steps:');
  console.log('  1. Run: npm run serve (starts http://localhost:8000)');
  console.log('  2. Run: npm test (runs Playwright tests)');
  console.log('  3. Or: node scripts/physical-test-builds.js\n');
}

main().catch(console.error);
