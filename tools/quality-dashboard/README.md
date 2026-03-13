# Quality Dashboard

Unified quality dashboard for the AIOS ecosystem. Scans squads, tools, skills, and minds, computing quality scores for each.

## Usage

```bash
# Full dashboard (CLI output)
node tools/quality-dashboard/cli.js

# Filter by category
node tools/quality-dashboard/cli.js --category squads

# Squad detail view
node tools/quality-dashboard/cli.js --squad hormozi

# Markdown report
node tools/quality-dashboard/cli.js --format markdown --output report.md

# JSON output
node tools/quality-dashboard/cli.js --format json
```

## API

```js
const { scan, formatData } = require('./tools/quality-dashboard');

const data = scan({ category: 'squads' });
const output = formatData(data, 'markdown');
```

## Score Algorithm

Each category uses specific criteria (0-10 scale):

- **Squads**: agents, tasks, workflows, templates, checklists, README, config, changelog
- **Tools**: README, package.json, index, CLI, tests
- **Skills**: SKILL.md, frontmatter, veto conditions, completion criteria, risk level
- **Minds**: status (complete/partial/sources-only) + fidelity bonus

### Star Rating

| Score | Rating |
|------:|--------|
| 9.0+  | Elite  |
| 7.0+  | Strong |
| 5.0+  | Basic  |
| < 5.0 | WIP    |
