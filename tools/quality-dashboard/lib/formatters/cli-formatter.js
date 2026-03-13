'use strict';

const { c, scoreColor } = require('../utils');

function pad(str, len, align = 'left') {
  const s = String(str);
  if (align === 'right') return s.padStart(len);
  return s.padEnd(len);
}

function formatHeader(title) {
  return [
    '',
    c('bold', c('cyan', `  ${'='.repeat(60)}`)),
    c('bold', c('cyan', `  ${title}`)),
    c('bold', c('cyan', `  ${'='.repeat(60)}`)),
    '',
  ].join('\n');
}

function formatCategorySummary(result) {
  const color = scoreColor(result.avgScore);
  return [
    c('bold', `  ${result.category}`),
    `  ${c('gray', 'Count:')} ${result.count}  ${c('gray', 'Avg:')} ${c(color, result.avgScore.toFixed(1))}  ${result.rating.emoji} ${c('gray', result.rating.label)}`,
  ].join('\n');
}

function formatSquadTable(items) {
  const lines = [];
  lines.push(c('gray', `  ${'Name'.padEnd(30)} ${'Score'.padStart(5)}  ${'Rating'.padEnd(8)} ${'Agents'.padStart(6)} ${'Tasks'.padStart(5)} ${'WF'.padStart(4)} ${'Domain'}`));
  lines.push(c('gray', `  ${'─'.repeat(80)}`));

  for (const item of items) {
    const color = scoreColor(item.score);
    lines.push(
      `  ${pad(item.name, 30)} ${c(color, pad(item.score.toFixed(1), 5, 'right'))}  ${pad(item.rating.emoji, 8)} ${pad(String(item.components.agents), 6, 'right')} ${pad(String(item.components.tasks), 5, 'right')} ${pad(String(item.components.workflows), 4, 'right')} ${c('gray', item.domain)}`
    );
  }
  return lines.join('\n');
}

function formatToolTable(items) {
  const lines = [];
  lines.push(c('gray', `  ${'Name'.padEnd(30)} ${'Score'.padStart(5)}  ${'Rating'.padEnd(8)} ${'README'.padStart(6)} ${'Pkg'.padStart(4)} ${'CLI'.padStart(4)} ${'Tests'.padStart(5)}`));
  lines.push(c('gray', `  ${'─'.repeat(70)}`));

  for (const item of items) {
    const color = scoreColor(item.score);
    const check = (v) => v ? c('green', '\u2713') : c('red', '\u2717');
    lines.push(
      `  ${pad(item.name, 30)} ${c(color, pad(item.score.toFixed(1), 5, 'right'))}  ${pad(item.rating.emoji, 8)} ${pad(check(item.hasReadme), 6, 'right')} ${pad(check(item.hasPkg), 4, 'right')} ${pad(check(item.hasCli), 4, 'right')} ${pad(check(item.hasTests), 5, 'right')}`
    );
  }
  return lines.join('\n');
}

function formatSkillTable(items) {
  const lines = [];
  lines.push(c('gray', `  ${'Name'.padEnd(30)} ${'Score'.padStart(5)}  ${'Rating'.padEnd(8)} ${'SKILL'.padStart(5)} ${'FM'.padStart(4)} ${'Veto'.padStart(5)} ${'Risk'.padStart(8)}`));
  lines.push(c('gray', `  ${'─'.repeat(70)}`));

  for (const item of items) {
    const color = scoreColor(item.score);
    const check = (v) => v ? c('green', '\u2713') : c('red', '\u2717');
    lines.push(
      `  ${pad(item.name, 30)} ${c(color, pad(item.score.toFixed(1), 5, 'right'))}  ${pad(item.rating.emoji, 8)} ${pad(check(item.hasSkillMd), 5, 'right')} ${pad(check(item.hasFrontmatter), 4, 'right')} ${pad(check(item.hasVetoConditions), 5, 'right')} ${pad(item.riskLevel, 8, 'right')}`
    );
  }
  return lines.join('\n');
}

function formatMindTable(items) {
  const lines = [];
  lines.push(c('gray', `  ${'Name'.padEnd(25)} ${'Score'.padStart(5)}  ${'Rating'.padEnd(8)} ${'Status'.padEnd(14)} ${'Fidelity'.padEnd(13)} ${'Srcs'.padStart(4)} ${'Voice'.padStart(5)} ${'Think'.padStart(5)}`));
  lines.push(c('gray', `  ${'─'.repeat(85)}`));

  for (const item of items) {
    const color = scoreColor(item.score);
    const check = (v) => v ? c('green', '\u2713') : c('red', '\u2717');
    lines.push(
      `  ${pad(item.name, 25)} ${c(color, pad(item.score.toFixed(1), 5, 'right'))}  ${pad(item.rating.emoji, 8)} ${pad(item.status, 14)} ${pad(item.fidelity, 13)} ${pad(String(item.sourceCount), 4, 'right')} ${pad(check(item.hasVoiceDna), 5, 'right')} ${pad(check(item.hasThinkingDna), 5, 'right')}`
    );
  }
  return lines.join('\n');
}

function formatSquadDetail(item) {
  const lines = [];
  const color = scoreColor(item.score);
  lines.push(formatHeader(`Squad: ${item.name}`));
  lines.push(`  ${c('gray', 'Score:')} ${c(color, item.score.toFixed(1))} ${item.rating.emoji} ${item.rating.label}`);
  lines.push(`  ${c('gray', 'Domain:')} ${item.domain}`);
  lines.push(`  ${c('gray', 'Version:')} ${item.version}`);
  lines.push('');
  lines.push(c('bold', '  Components:'));

  const check = (v) => v ? c('green', '\u2713') : c('red', '\u2717');
  for (const [comp, count] of Object.entries(item.components)) {
    const status = count > 0 ? c('green', `${count} files`) : c('red', 'missing');
    lines.push(`    ${pad(comp, 15)} ${status}`);
  }

  lines.push('');
  lines.push(c('bold', '  Files:'));
  lines.push(`    README.md    ${check(item.hasReadme)}`);
  lines.push(`    config.yaml  ${check(item.hasConfig)}`);
  lines.push(`    CHANGELOG    ${check(item.hasChangelog)}`);
  lines.push('');

  return lines.join('\n');
}

function formatOverallSummary(categories) {
  const totalItems = categories.reduce((s, cat) => s + cat.count, 0);
  const overallAvg = categories.length
    ? +(categories.reduce((s, cat) => s + cat.avgScore * cat.count, 0) / totalItems).toFixed(1)
    : 0;

  const lines = [];
  lines.push(formatHeader('AIOS Ecosystem Quality Dashboard'));
  lines.push(c('bold', `  Overall: ${totalItems} items, avg ${c(scoreColor(overallAvg), overallAvg.toFixed(1))}`));
  lines.push('');

  for (const cat of categories) {
    lines.push(formatCategorySummary(cat));
    lines.push('');
  }

  return lines.join('\n');
}

function format(data, options = {}) {
  const lines = [];

  // If detail view for a specific item
  if (options.detail && data.detail) {
    if (data.detail.type === 'squad') {
      return formatSquadDetail(data.detail);
    }
  }

  // Overall summary
  lines.push(formatOverallSummary(data.categories));

  // Per-category tables
  for (const cat of data.categories) {
    if (cat.items.length === 0) continue;
    lines.push(formatHeader(cat.category));

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

module.exports = { format, formatSquadDetail };
