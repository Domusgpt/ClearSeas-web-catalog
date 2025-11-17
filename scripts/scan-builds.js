#!/usr/bin/env node

/**
 * Build Scanner for Clear Seas Web Catalog
 *
 * Scans all build directories and categorizes them:
 * - Identifies unique builds vs duplicates
 * - Generates metadata for each build
 * - Creates build inventory for testing
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const rootDir = path.join(__dirname, '..');

// Build categories based on directory patterns
const BUILD_CATEGORIES = {
  v2: /^v2-/,
  solutions: /^solutions-/,
  enhanced: /^enhanced-/,
  codex: /^codex-/,
  ultimate: /^ultimate-/
};

/**
 * Get hash of file content for duplicate detection
 */
function getFileHash(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return crypto.createHash('md5').update(content).digest('hex');
  } catch (err) {
    return null;
  }
}

/**
 * Get build metadata
 */
function getBuildMetadata(buildDir) {
  const indexPath = path.join(rootDir, buildDir, 'index.html');
  const packagePath = path.join(rootDir, buildDir, 'package.json');

  const metadata = {
    name: buildDir,
    path: buildDir,
    hasIndex: fs.existsSync(indexPath),
    hasPackageJson: fs.existsSync(packagePath),
    indexHash: null,
    size: 0,
    files: []
  };

  if (metadata.hasIndex) {
    metadata.indexHash = getFileHash(indexPath);
  }

  // Count files
  try {
    const files = fs.readdirSync(path.join(rootDir, buildDir), { recursive: true });
    metadata.files = files.filter(f => {
      const fullPath = path.join(rootDir, buildDir, f);
      return fs.statSync(fullPath).isFile();
    });
    metadata.size = metadata.files.length;
  } catch (err) {
    console.error(`Error reading ${buildDir}:`, err.message);
  }

  // Get category
  for (const [category, pattern] of Object.entries(BUILD_CATEGORIES)) {
    if (pattern.test(buildDir)) {
      metadata.category = category;
      break;
    }
  }

  return metadata;
}

/**
 * Main scanner function
 */
function scanBuilds() {
  console.log('🔍 Scanning Clear Seas Web Catalog builds...\n');

  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  const buildDirs = entries
    .filter(entry => entry.isDirectory())
    .filter(entry => !entry.name.startsWith('.'))
    .filter(entry => !['node_modules', 'test-results', 'tests', 'scripts'].includes(entry.name))
    .map(entry => entry.name);

  console.log(`📦 Found ${buildDirs.length} directories\n`);

  // Scan all builds
  const builds = buildDirs.map(dir => getBuildMetadata(dir));

  // Filter to only valid builds (with index.html)
  const validBuilds = builds.filter(b => b.hasIndex);
  console.log(`✅ Valid builds (with index.html): ${validBuilds.length}\n`);

  // Group by category
  const byCategory = {};
  for (const build of validBuilds) {
    const cat = build.category || 'other';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(build);
  }

  console.log('📊 Builds by category:');
  for (const [category, categoryBuilds] of Object.entries(byCategory)) {
    console.log(`  ${category}: ${categoryBuilds.length}`);
  }
  console.log();

  // Detect duplicates by hash
  const hashMap = {};
  for (const build of validBuilds) {
    if (!build.indexHash) continue;
    if (!hashMap[build.indexHash]) {
      hashMap[build.indexHash] = [];
    }
    hashMap[build.indexHash].push(build.name);
  }

  const duplicateGroups = Object.values(hashMap).filter(group => group.length > 1);
  console.log(`🔁 Duplicate groups found: ${duplicateGroups.length}\n`);

  if (duplicateGroups.length > 0) {
    console.log('Duplicate builds (same index.html):');
    duplicateGroups.forEach((group, i) => {
      console.log(`  Group ${i + 1}:`);
      group.forEach(name => console.log(`    - ${name}`));
    });
    console.log();
  }

  // Get unique builds (one from each hash)
  const uniqueHashes = new Set();
  const uniqueBuilds = [];
  for (const build of validBuilds) {
    if (!build.indexHash) {
      uniqueBuilds.push(build);
      continue;
    }
    if (!uniqueHashes.has(build.indexHash)) {
      uniqueHashes.add(build.indexHash);
      uniqueBuilds.push(build);
    }
  }

  console.log(`✨ Unique builds (deduplicated): ${uniqueBuilds.length}\n`);

  // Save results
  const results = {
    scannedAt: new Date().toISOString(),
    totalDirectories: buildDirs.length,
    validBuilds: validBuilds.length,
    uniqueBuilds: uniqueBuilds.length,
    duplicateGroups: duplicateGroups.length,
    categories: byCategory,
    builds: validBuilds,
    uniqueOnly: uniqueBuilds,
    duplicates: duplicateGroups
  };

  const outputPath = path.join(rootDir, 'test-results', 'build-inventory.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  console.log(`💾 Results saved to: test-results/build-inventory.json`);
  console.log('\n✅ Scan complete!\n');

  return results;
}

// Run if called directly
if (require.main === module) {
  scanBuilds();
}

module.exports = { scanBuilds, getBuildMetadata };
