'use strict';

const path = require('path');
const squadScanner = require('./lib/scanners/squad-scanner');
const toolScanner = require('./lib/scanners/tool-scanner');
const skillScanner = require('./lib/scanners/skill-scanner');
const mindScanner = require('./lib/scanners/mind-scanner');
const cliFormatter = require('./lib/formatters/cli-formatter');
const markdownFormatter = require('./lib/formatters/markdown-formatter');
const jsonFormatter = require('./lib/formatters/json-formatter');

const SCANNERS = {
  squads: squadScanner,
  tools: toolScanner,
  skills: skillScanner,
  minds: mindScanner,
};

const FORMATTERS = {
  cli: cliFormatter,
  markdown: markdownFormatter,
  json: jsonFormatter,
};

/**
 * Scan the AIOS ecosystem and return quality data.
 * @param {object} options
 * @param {string} [options.rootDir] - Root of aios-core
 * @param {string} [options.category] - Filter to one category
 * @param {string} [options.squad] - Show detail for a specific squad
 * @returns {object} Dashboard data
 */
function scan(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..', '..');

  let categories;
  if (options.category) {
    const scanner = SCANNERS[options.category];
    if (!scanner) {
      throw new Error(`Unknown category: ${options.category}. Valid: ${Object.keys(SCANNERS).join(', ')}`);
    }
    categories = [scanner.scanAll(rootDir)];
  } else {
    categories = Object.values(SCANNERS).map(s => s.scanAll(rootDir));
  }

  const data = { categories };

  // Detail view
  if (options.squad) {
    const squadsResult = categories.find(c => c.category === 'Squads');
    if (squadsResult) {
      const detail = squadsResult.items.find(i => i.name === options.squad);
      if (detail) data.detail = detail;
    }
    // If squads wasn't included in categories, scan just for the detail
    if (!data.detail) {
      const allSquads = squadScanner.scanAll(rootDir);
      const detail = allSquads.items.find(i => i.name === options.squad);
      if (detail) data.detail = detail;
    }
  }

  return data;
}

/**
 * Format dashboard data.
 * @param {object} data - From scan()
 * @param {string} [format='cli'] - cli|markdown|json
 * @param {object} [options] - Additional format options
 * @returns {string}
 */
function formatData(data, format = 'cli', options = {}) {
  const formatter = FORMATTERS[format];
  if (!formatter) {
    throw new Error(`Unknown format: ${format}. Valid: ${Object.keys(FORMATTERS).join(', ')}`);
  }
  return formatter.format(data, options);
}

module.exports = { scan, formatData, SCANNERS, FORMATTERS };
