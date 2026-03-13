#!/usr/bin/env node
'use strict';

const fs = require('fs');
const { scan, formatData } = require('./index');
const { setColorsEnabled } = require('./lib/utils');

// ── Arg Parsing ──

function parseArgs(argv) {
  const args = {
    category: null,
    squad: null,
    format: 'cli',
    output: null,
    noColor: false,
    help: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '--category':
      case '-c':
        args.category = argv[++i];
        break;
      case '--squad':
      case '-s':
        args.squad = argv[++i];
        break;
      case '--format':
      case '-f':
        args.format = argv[++i];
        break;
      case '--output':
      case '-o':
        args.output = argv[++i];
        break;
      case '--no-color':
        args.noColor = true;
        break;
      case '--help':
      case '-h':
        args.help = true;
        break;
      default:
        // Ignore unknown
        break;
    }
  }

  return args;
}

function showHelp() {
  console.log(`
  AIOS Quality Dashboard

  Usage:
    node tools/quality-dashboard/cli.js [options]

  Options:
    --category, -c <name>   Filter: squads, tools, skills, minds
    --squad, -s <name>      Show detail for a specific squad
    --format, -f <type>     Output format: cli (default), markdown, json
    --output, -o <file>     Write output to file
    --no-color              Disable ANSI colors
    --help, -h              Show this help

  Examples:
    node tools/quality-dashboard/cli.js
    node tools/quality-dashboard/cli.js --category squads
    node tools/quality-dashboard/cli.js --squad hormozi
    node tools/quality-dashboard/cli.js --format markdown --output report.md
    node tools/quality-dashboard/cli.js --format json
`);
}

// ── Main ──

function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    showHelp();
    process.exit(0);
  }

  if (args.noColor || args.format === 'json' || args.format === 'markdown') {
    setColorsEnabled(false);
  }

  try {
    const data = scan({
      category: args.category,
      squad: args.squad,
    });

    const output = formatData(data, args.format, {
      detail: !!args.squad,
    });

    if (args.output) {
      fs.writeFileSync(args.output, output, 'utf8');
      console.log(`Dashboard written to ${args.output}`);
    } else {
      console.log(output);
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();
