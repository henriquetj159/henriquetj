'use strict';

const { starRating } = require('../utils');

function check(v) { return v ? '\u2705' : '\u274C'; }

function formatSquadTable(items) {
  const lines = [];
  lines.push('| Squad | Score | Rating | Agents | Tasks | Workflows | Domain |');
  lines.push('|-------|------:|--------|-------:|------:|----------:|--------|');
  for (const item of items) {
    lines.push(`| ${item.name} | ${item.score.toFixed(1)} | ${item.rating.emoji} ${item.rating.label} | ${item.components.agents} | ${item.components.tasks} | ${item.components.workflows} | ${item.domain} |`);
  }
  return lines.join('\n');
}

function formatToolTable(items) {
  const lines = [];
  lines.push('| Tool | Score | Rating | README | Pkg | CLI | Tests |');
  lines.push('|------|------:|--------|:------:|:---:|:---:|:-----:|');
  for (const item of items) {
    lines.push(`| ${item.name} | ${item.score.toFixed(1)} | ${item.rating.emoji} ${item.rating.label} | ${check(item.hasReadme)} | ${check(item.hasPkg)} | ${check(item.hasCli)} | ${check(item.hasTests)} |`);
  }
  return lines.join('\n');
}

function formatSkillTable(items) {
  const lines = [];
  lines.push('| Skill | Score | Rating | SKILL.md | Frontmatter | Veto | Risk |');
  lines.push('|-------|------:|--------|:--------:|:-----------:|:----:|------|');
  for (const item of items) {
    lines.push(`| ${item.name} | ${item.score.toFixed(1)} | ${item.rating.emoji} ${item.rating.label} | ${check(item.hasSkillMd)} | ${check(item.hasFrontmatter)} | ${check(item.hasVetoConditions)} | ${item.riskLevel} |`);
  }
  return lines.join('\n');
}

function formatMindTable(items) {
  const lines = [];
  lines.push('| Mind | Score | Rating | Status | Fidelity | Sources | Voice DNA | Thinking DNA |');
  lines.push('|------|------:|--------|--------|----------|--------:|:---------:|:------------:|');
  for (const item of items) {
    lines.push(`| ${item.name} | ${item.score.toFixed(1)} | ${item.rating.emoji} ${item.rating.label} | ${item.status} | ${item.fidelity} | ${item.sourceCount} | ${check(item.hasVoiceDna)} | ${check(item.hasThinkingDna)} |`);
  }
  return lines.join('\n');
}

function format(data) {
  const lines = [];
  const cats = data.categories;
  const totalItems = cats.reduce((s, cat) => s + cat.count, 0);
  const overallAvg = totalItems
    ? +(cats.reduce((s, cat) => s + cat.avgScore * cat.count, 0) / totalItems).toFixed(1)
    : 0;
  const overall = starRating(overallAvg);

  lines.push('# AIOS Ecosystem Quality Dashboard');
  lines.push('');
  lines.push(`> Generated: ${new Date().toISOString().slice(0, 10)}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`| Category | Count | Avg Score | Rating |`);
  lines.push(`|----------|------:|----------:|--------|`);
  for (const cat of cats) {
    lines.push(`| ${cat.category} | ${cat.count} | ${cat.avgScore.toFixed(1)} | ${cat.rating.emoji} ${cat.rating.label} |`);
  }
  lines.push(`| **Overall** | **${totalItems}** | **${overallAvg.toFixed(1)}** | **${overall.emoji} ${overall.label}** |`);
  lines.push('');

  for (const cat of cats) {
    if (cat.items.length === 0) continue;
    lines.push(`## ${cat.category}`);
    lines.push('');
    switch (cat.category) {
      case 'Squads': lines.push(formatSquadTable(cat.items)); break;
      case 'Tools': lines.push(formatToolTable(cat.items)); break;
      case 'Skills': lines.push(formatSkillTable(cat.items)); break;
      case 'Minds': lines.push(formatMindTable(cat.items)); break;
    }
    lines.push('');
  }

  return lines.join('\n');
}

module.exports = { format };
