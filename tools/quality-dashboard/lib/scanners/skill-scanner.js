'use strict';

const path = require('path');
const {
  dirExists, fileExists, listDirs,
  readFileContent, parseFrontmatter, starRating,
} = require('../utils');

function scanSkill(skillDir, name) {
  const skillMdPath = path.join(skillDir, 'SKILL.md');
  const hasSkillMd = fileExists(skillMdPath);

  let frontmatter = null;
  let hasVetoConditions = false;
  let hasCompletionCriteria = false;
  let riskLevel = null;

  if (hasSkillMd) {
    const content = readFileContent(skillMdPath) || '';
    frontmatter = parseFrontmatter(content);

    const lower = content.toLowerCase();
    hasVetoConditions = lower.includes('veto') || lower.includes('never') || lower.includes('block');
    hasCompletionCriteria = lower.includes('completion') || lower.includes('done when') || lower.includes('success criteria');

    if (frontmatter) {
      riskLevel = frontmatter.risk || frontmatter.risk_level || null;
    }

    // Also check content for risk mentions
    if (!riskLevel) {
      const riskMatch = content.match(/risk[_\s]*level\s*:\s*(\w+)/i);
      if (riskMatch) riskLevel = riskMatch[1];
    }
  }

  let score = 0;
  if (hasSkillMd) score += 3;
  if (frontmatter) score += 2;
  if (hasVetoConditions) score += 2;
  if (hasCompletionCriteria) score += 2;
  if (riskLevel) score += 1;
  score = Math.min(10, score);

  return {
    name,
    type: 'skill',
    score,
    rating: starRating(score),
    hasSkillMd,
    hasFrontmatter: !!frontmatter,
    hasVetoConditions,
    hasCompletionCriteria,
    riskLevel: riskLevel || '-',
  };
}

function scanAll(rootDir) {
  const skillsDir = path.join(rootDir, '.aios', 'skills');
  if (!dirExists(skillsDir)) return { category: 'Skills', count: 0, avgScore: 0, rating: starRating(0), items: [] };

  const names = listDirs(skillsDir);
  const results = names.map(name => scanSkill(path.join(skillsDir, name), name));
  results.sort((a, b) => b.score - a.score);

  const avg = results.length
    ? +(results.reduce((s, r) => s + r.score, 0) / results.length).toFixed(1)
    : 0;

  return {
    category: 'Skills',
    count: results.length,
    avgScore: avg,
    rating: starRating(avg),
    items: results,
  };
}

module.exports = { scanAll, scanSkill };
