'use strict';

const path = require('path');
const fs = require('fs');
const {
  dirExists, fileExists, listDirs, listFiles,
  readFileContent, starRating,
} = require('../utils');

function scanToolDir(toolDir, name) {
  const hasReadme = fileExists(path.join(toolDir, 'README.md'));
  const hasPkg = fileExists(path.join(toolDir, 'package.json'));
  const hasIndex = fileExists(path.join(toolDir, 'index.js'))
    || fileExists(path.join(toolDir, 'index.mjs'));
  const hasCli = fileExists(path.join(toolDir, 'cli.js'));
  const hasTests = dirExists(path.join(toolDir, 'tests'))
    || dirExists(path.join(toolDir, '__tests__'));

  let depCount = 0;
  if (hasPkg) {
    try {
      const pkg = JSON.parse(readFileContent(path.join(toolDir, 'package.json')));
      depCount = Object.keys(pkg.dependencies || {}).length;
    } catch { /* ignore */ }
  }

  let score = 0;
  if (hasReadme) score += 2.5;
  if (hasPkg) score += 2;
  if (hasIndex) score += 2;
  if (hasCli) score += 1.5;
  if (hasTests) score += 2;
  score = Math.min(10, score);

  return {
    name,
    type: 'tool',
    isDirectory: true,
    score,
    rating: starRating(score),
    hasReadme,
    hasPkg,
    hasIndex,
    hasCli,
    hasTests,
    depCount,
  };
}

function scanToolFile(filePath, name) {
  // Standalone .js or .py file in tools/
  const ext = path.extname(name);
  const content = readFileContent(filePath) || '';
  const lines = content.split('\n').length;

  // Standalone files get partial score: they exist and have content
  let score = 2; // exists
  if (lines > 50) score += 1;  // substantial
  if (lines > 200) score += 1; // large
  // No README, no package.json, no tests by definition
  score = Math.min(10, score);

  return {
    name,
    type: 'tool',
    isDirectory: false,
    score,
    rating: starRating(score),
    hasReadme: false,
    hasPkg: false,
    hasIndex: true, // it IS the entry
    hasCli: false,
    hasTests: false,
    depCount: 0,
    lines,
    ext,
  };
}

function scanAll(rootDir) {
  const toolsDir = path.join(rootDir, 'tools');
  if (!dirExists(toolsDir)) return { category: 'Tools', count: 0, avgScore: 0, rating: starRating(0), items: [] };

  const results = [];

  // Scan directories
  for (const name of listDirs(toolsDir)) {
    // Skip quality-dashboard itself from scoring
    results.push(scanToolDir(path.join(toolsDir, name), name));
  }

  // Scan standalone files
  try {
    const entries = fs.readdirSync(toolsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && !entry.name.startsWith('.') &&
          (entry.name.endsWith('.js') || entry.name.endsWith('.py'))) {
        results.push(scanToolFile(path.join(toolsDir, entry.name), entry.name));
      }
    }
  } catch { /* ignore */ }

  results.sort((a, b) => b.score - a.score);

  const avg = results.length
    ? +(results.reduce((s, r) => s + r.score, 0) / results.length).toFixed(1)
    : 0;

  return {
    category: 'Tools',
    count: results.length,
    avgScore: avg,
    rating: starRating(avg),
    items: results,
  };
}

module.exports = { scanAll, scanToolDir, scanToolFile };
