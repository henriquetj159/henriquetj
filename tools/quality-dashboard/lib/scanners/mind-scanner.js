'use strict';

const path = require('path');
const {
  dirExists, fileExists, listDirs,
  readFileContent, starRating, countFilesRecursive,
} = require('../utils');

// Parse INDEX.md table to get status and fidelity for each mind
function parseIndex(rootDir) {
  const indexPath = path.join(rootDir, 'squads', 'mind-cloning', 'minds', 'INDEX.md');
  const content = readFileContent(indexPath);
  if (!content) return {};

  const map = {};
  const lines = content.split('\n');
  for (const line of lines) {
    // Table format: | # | Name | `slug` | Status | Fidelity | Domain |
    const match = line.match(/\|\s*\d+\s*\|[^|]+\|\s*`([^`]+)`\s*\|\s*(\w[\w\s]*?)\s*\|\s*(\w[\w\s]*?|-)\s*\|/);
    if (match) {
      const slug = match[1];
      const status = match[2].trim();
      const fidelity = match[3].trim();
      map[slug] = { status, fidelity };
    }
  }
  return map;
}

function fidelityToPercent(fidelity) {
  if (!fidelity || fidelity === '-') return null;
  const lower = fidelity.toLowerCase();
  if (lower === 'premium') return 95;
  if (lower === 'intermediate') return 85;
  if (lower === 'basic') return 75;
  // Try numeric
  const num = parseInt(fidelity, 10);
  return isNaN(num) ? null : num;
}

function scanMind(mindDir, name, indexEntry) {
  const status = indexEntry?.status || 'Unknown';
  const fidelity = indexEntry?.fidelity || '-';
  const fidelityPct = fidelityToPercent(fidelity);

  const hasVoiceDna = fileExists(path.join(mindDir, 'outputs', 'voice_dna.yaml'));
  const hasThinkingDna = fileExists(path.join(mindDir, 'outputs', 'thinking_dna.yaml'));
  const hasMindDna = fileExists(path.join(mindDir, 'outputs', 'mind_dna_complete.yaml'));
  const sourceCount = dirExists(path.join(mindDir, 'sources'))
    ? countFilesRecursive(path.join(mindDir, 'sources'))
    : 0;

  // Score based on status
  let score;
  const statusLower = status.toLowerCase();
  if (statusLower === 'complete') score = 7.0;
  else if (statusLower === 'partial') score = 4.0;
  else score = 2.0; // sources only or unknown

  // Fidelity bonus
  if (fidelityPct !== null) {
    if (fidelityPct >= 95) score += 3;
    else if (fidelityPct >= 85) score += 2;
    else if (fidelityPct >= 75) score += 1;
  }

  score = Math.min(10, score);

  return {
    name,
    type: 'mind',
    score,
    rating: starRating(score),
    status,
    fidelity,
    fidelityPct,
    hasVoiceDna,
    hasThinkingDna,
    hasMindDna,
    sourceCount,
  };
}

function scanAll(rootDir) {
  const mindsDir = path.join(rootDir, 'squads', 'mind-cloning', 'minds');
  if (!dirExists(mindsDir)) return { category: 'Minds', count: 0, avgScore: 0, rating: starRating(0), items: [] };

  const indexMap = parseIndex(rootDir);
  const names = listDirs(mindsDir);
  const results = names.map(name => scanMind(path.join(mindsDir, name), name, indexMap[name]));
  results.sort((a, b) => b.score - a.score);

  const avg = results.length
    ? +(results.reduce((s, r) => s + r.score, 0) / results.length).toFixed(1)
    : 0;

  return {
    category: 'Minds',
    count: results.length,
    avgScore: avg,
    rating: starRating(avg),
    items: results,
  };
}

module.exports = { scanAll, scanMind };
