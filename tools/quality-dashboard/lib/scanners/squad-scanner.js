'use strict';

const path = require('path');
const {
  dirExists, fileExists, listDirs, countFilesRecursive,
  readFileContent, parseSimpleYaml, starRating,
} = require('../utils');

const COMPONENT_DIRS = ['agents', 'tasks', 'workflows', 'templates', 'checklists', 'scripts'];

function scanSquad(squadDir, name) {
  const components = {};
  for (const comp of COMPONENT_DIRS) {
    const compDir = path.join(squadDir, comp);
    if (dirExists(compDir)) {
      components[comp] = countFilesRecursive(compDir);
    } else {
      components[comp] = 0;
    }
  }

  const hasReadme = fileExists(path.join(squadDir, 'README.md'));
  const hasConfig = fileExists(path.join(squadDir, 'config.yaml'))
    || fileExists(path.join(squadDir, 'squad.yaml'));
  const hasChangelog = fileExists(path.join(squadDir, 'CHANGELOG.md'));

  // Parse config for domain/version
  let config = {};
  const configPath = fileExists(path.join(squadDir, 'config.yaml'))
    ? path.join(squadDir, 'config.yaml')
    : path.join(squadDir, 'squad.yaml');
  const configContent = readFileContent(configPath);
  if (configContent) {
    config = parseSimpleYaml(configContent);
  }

  // Score calculation
  let score = 0;
  if (components.agents > 0) score += 2;
  if (components.tasks > 0) score += 2;
  if (components.workflows > 0) score += 1.5;
  if (components.templates > 0) score += 1;
  if (components.checklists > 0) score += 1;
  if (hasReadme) score += 1;
  if (hasConfig) score += 1;
  if (hasChangelog) score += 0.5;

  score = Math.min(10, score);

  return {
    name,
    type: 'squad',
    score,
    rating: starRating(score),
    components,
    hasReadme,
    hasConfig,
    hasChangelog,
    domain: config.domain || config.focus || '-',
    version: config.version || '-',
  };
}

function scanAll(rootDir) {
  const squadsDir = path.join(rootDir, 'squads');
  const names = listDirs(squadsDir);
  const results = names.map(name => scanSquad(path.join(squadsDir, name), name));
  results.sort((a, b) => b.score - a.score);

  const avg = results.length
    ? +(results.reduce((s, r) => s + r.score, 0) / results.length).toFixed(1)
    : 0;

  return {
    category: 'Squads',
    count: results.length,
    avgScore: avg,
    rating: starRating(avg),
    items: results,
  };
}

module.exports = { scanAll, scanSquad };
