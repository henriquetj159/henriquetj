'use strict';

const fs = require('fs');
const path = require('path');

// ── ANSI Colors ──

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
};

let colorsEnabled = true;

function setColorsEnabled(enabled) {
  colorsEnabled = enabled;
}

function c(color, text) {
  if (!colorsEnabled) return text;
  return `${COLORS[color] || ''}${text}${COLORS.reset}`;
}

// ── File Helpers ──

function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function dirExists(dirPath) {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch {
    return false;
  }
}

function listDirs(parentDir) {
  if (!dirExists(parentDir)) return [];
  return fs.readdirSync(parentDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('.'))
    .map(d => d.name)
    .sort();
}

function listFiles(parentDir, ext) {
  if (!dirExists(parentDir)) return [];
  const entries = fs.readdirSync(parentDir, { withFileTypes: true })
    .filter(d => d.isFile() && !d.name.startsWith('.'));
  if (ext) {
    return entries.filter(d => d.name.endsWith(ext)).map(d => d.name).sort();
  }
  return entries.map(d => d.name).sort();
}

function countFilesRecursive(dir, ext) {
  if (!dirExists(dir)) return 0;
  let count = 0;
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (!ext || entry.name.endsWith(ext)) {
        count++;
      }
    }
  };
  walk(dir);
  return count;
}

function readFileContent(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

// ── Minimal YAML Parser ──
// Handles simple key: value, no nested objects or arrays needed for config.yaml

function parseSimpleYaml(content) {
  if (!content) return {};
  const result = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;
    const key = trimmed.slice(0, colonIdx).trim();
    let val = trimmed.slice(colonIdx + 1).trim();
    // Remove surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    result[key] = val;
  }
  return result;
}

// ── YAML Frontmatter Parser ──

function parseFrontmatter(content) {
  if (!content) return null;
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  return parseSimpleYaml(match[1]);
}

// ── Star Rating ──

function starRating(score) {
  if (score >= 9.0) return { stars: 3, label: 'Elite', emoji: '\u2B50\u2B50\u2B50' };
  if (score >= 7.0) return { stars: 2, label: 'Strong', emoji: '\u2B50\u2B50' };
  if (score >= 5.0) return { stars: 1, label: 'Basic', emoji: '\u2B50' };
  return { stars: 0, label: 'WIP', emoji: '\uD83D\uDD28' };
}

// ── Score Color ──

function scoreColor(score) {
  if (score >= 9.0) return 'green';
  if (score >= 7.0) return 'cyan';
  if (score >= 5.0) return 'yellow';
  return 'red';
}

module.exports = {
  COLORS,
  setColorsEnabled,
  c,
  fileExists,
  dirExists,
  listDirs,
  listFiles,
  countFilesRecursive,
  readFileContent,
  parseSimpleYaml,
  parseFrontmatter,
  starRating,
  scoreColor,
};
