/**
 * Unit Tests for HandoffReader
 *
 * Story WIS-16: Workflow-Aware Greeting Handoffs
 *
 * Covers:
 * - Reading most recent handoff artifact for a given agent
 * - Filtering by target agent ID
 * - Staleness check (artifacts older than 1 hour are ignored)
 * - YAML parsing and schema validation
 * - Graceful degradation (missing dir, malformed YAML, etc.)
 * - _normalize() producing clean data structure
 * - Backward compat: works without handoff dir
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const HandoffReader = require('../../.aios-core/development/scripts/handoff-reader');

/** Create a temp handoff dir and return its project-root-equivalent path */
function makeTempProject() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aios-wis16-'));
  const handoffDir = path.join(root, '.aios', 'handoffs');
  fs.mkdirSync(handoffDir, { recursive: true });
  return { root, handoffDir };
}

/** Write a handoff YAML file with the given content */
function writeHandoff(handoffDir, filename, content) {
  const fp = path.join(handoffDir, filename);
  fs.writeFileSync(fp, content, 'utf8');
  return fp;
}

/** Build minimal valid handoff YAML string */
function makeHandoffYaml(from, to, extra = '') {
  return `handoff:
  from_agent: "${from}"
  to_agent: "${to}"
  timestamp: "2026-02-26T14:00:00Z"
  story_context:
    story_id: "WIS-16"
    story_path: "docs/stories/WIS-16.md"
    story_status: "In Progress"
    current_task: "Task 2: Render section"
    branch: "feat/wis-16"
  decisions:
    - "Used HandoffReader for structured parsing"
    - "Graceful degradation on missing dir"
  files_modified:
    - ".aios-core/development/scripts/handoff-reader.js"
    - ".aios-core/development/scripts/greeting-builder.js"
  blockers:
    - ""
  next_action: "Run QA gate on WIS-16."
${extra}
`;
}

// Helper: age file by manipulating atime/mtime back in time
function ageFile(filePath, ms) {
  const oldDate = new Date(Date.now() - ms);
  fs.utimesSync(filePath, oldDate, oldDate);
}

describe('HandoffReader', () => {
  describe('constructor', () => {
    test('defaults to process.cwd() when no root provided', () => {
      const reader = new HandoffReader();
      expect(reader.projectRoot).toBe(process.cwd());
    });

    test('accepts explicit project root', () => {
      const reader = new HandoffReader('/tmp/project');
      expect(reader.projectRoot).toBe('/tmp/project');
    });
  });

  describe('readLatestHandoff — missing directory', () => {
    test('returns null when .aios/handoffs does not exist', () => {
      const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aios-no-handoffs-'));
      const reader = new HandoffReader(root);
      const result = reader.readLatestHandoff('qa');
      expect(result).toBeNull();
      fs.rmSync(root, { recursive: true });
    });
  });

  describe('readLatestHandoff — empty directory', () => {
    test('returns null when handoffs dir is empty', () => {
      const { root, handoffDir } = makeTempProject();
      const reader = new HandoffReader(root);
      const result = reader.readLatestHandoff('qa');
      expect(result).toBeNull();
      fs.rmSync(root, { recursive: true });
    });
  });

  describe('readLatestHandoff — valid handoff', () => {
    test('returns parsed handoff for matching agent', () => {
      const { root, handoffDir } = makeTempProject();
      writeHandoff(handoffDir, 'handoff-dev-to-qa-2026-02-26T14-00-00Z.yaml', makeHandoffYaml('dev', 'qa'));

      const reader = new HandoffReader(root);
      const result = reader.readLatestHandoff('qa');

      expect(result).not.toBeNull();
      expect(result.fromAgent).toBe('dev');
      expect(result.toAgent).toBe('qa');
      expect(result.storyId).toBe('WIS-16');
      expect(result.branch).toBe('feat/wis-16');
      expect(result.storyStatus).toBe('In Progress');
      expect(result.currentTask).toBe('Task 2: Render section');
      expect(result.decisions).toHaveLength(2);
      expect(result.filesModified).toHaveLength(2);
      expect(result.nextAction).toBe('Run QA gate on WIS-16.');

      fs.rmSync(root, { recursive: true });
    });

    test('returns null when handoff is for a different agent', () => {
      const { root, handoffDir } = makeTempProject();
      writeHandoff(handoffDir, 'handoff-dev-to-devops-2026-02-26T14-00-00Z.yaml', makeHandoffYaml('dev', 'devops'));

      const reader = new HandoffReader(root);
      const result = reader.readLatestHandoff('qa');
      expect(result).toBeNull();

      fs.rmSync(root, { recursive: true });
    });

    test('returns handoff even when to_agent field is absent (filename-only match)', () => {
      const { root, handoffDir } = makeTempProject();
      const yaml = `handoff:
  from_agent: "sm"
  timestamp: "2026-02-26T14:00:00Z"
  next_action: "Develop the story."
`;
      // Filename-based filtering will block it for 'qa' since filename says 'dev'
      writeHandoff(handoffDir, 'handoff-sm-to-dev-2026-02-26T14-00-00Z.yaml', yaml);

      const reader = new HandoffReader(root);
      const devResult = reader.readLatestHandoff('dev');
      expect(devResult).not.toBeNull();
      expect(devResult.fromAgent).toBe('sm');

      const qaResult = reader.readLatestHandoff('qa');
      expect(qaResult).toBeNull();

      fs.rmSync(root, { recursive: true });
    });
  });

  describe('readLatestHandoff — staleness check', () => {
    test('ignores artifacts older than 1 hour', () => {
      const { root, handoffDir } = makeTempProject();
      const fp = writeHandoff(
        handoffDir,
        'handoff-dev-to-qa-2026-02-26T12-00-00Z.yaml',
        makeHandoffYaml('dev', 'qa'),
      );

      // Age the file by more than 1 hour (1 hour + 1 minute)
      ageFile(fp, 61 * 60 * 1000);

      const reader = new HandoffReader(root);
      const result = reader.readLatestHandoff('qa');
      expect(result).toBeNull();

      fs.rmSync(root, { recursive: true });
    });

    test('returns artifact less than 1 hour old', () => {
      const { root, handoffDir } = makeTempProject();
      const fp = writeHandoff(
        handoffDir,
        'handoff-dev-to-qa-2026-02-26T14-00-00Z.yaml',
        makeHandoffYaml('dev', 'qa'),
      );

      // Age the file by only 30 minutes
      ageFile(fp, 30 * 60 * 1000);

      const reader = new HandoffReader(root);
      const result = reader.readLatestHandoff('qa');
      expect(result).not.toBeNull();
      expect(result.fromAgent).toBe('dev');

      fs.rmSync(root, { recursive: true });
    });
  });

  describe('readLatestHandoff — multiple artifacts, picks newest', () => {
    test('returns the most recently modified artifact', () => {
      const { root, handoffDir } = makeTempProject();

      // Write two handoffs for the same target agent
      const older = writeHandoff(
        handoffDir,
        'handoff-sm-to-qa-2026-02-26T12-00-00Z.yaml',
        makeHandoffYaml('sm', 'qa'),
      );
      const newer = writeHandoff(
        handoffDir,
        'handoff-dev-to-qa-2026-02-26T14-00-00Z.yaml',
        makeHandoffYaml('dev', 'qa'),
      );

      // Make older file actually older
      ageFile(older, 20 * 60 * 1000); // 20 min ago

      const reader = new HandoffReader(root);
      const result = reader.readLatestHandoff('qa');

      expect(result).not.toBeNull();
      expect(result.fromAgent).toBe('dev'); // newer one

      fs.rmSync(root, { recursive: true });
    });
  });

  describe('readLatestHandoff — malformed YAML', () => {
    test('returns null for invalid YAML', () => {
      const { root, handoffDir } = makeTempProject();
      writeHandoff(handoffDir, 'handoff-dev-to-qa-2026-02-26T14-00-00Z.yaml', '{{{invalid yaml: [}}}');

      const reader = new HandoffReader(root);
      const result = reader.readLatestHandoff('qa');
      expect(result).toBeNull();

      fs.rmSync(root, { recursive: true });
    });

    test('returns null when required from_agent field is missing', () => {
      const { root, handoffDir } = makeTempProject();
      const yaml = `handoff:
  to_agent: "qa"
  next_action: "Do something"
`;
      writeHandoff(handoffDir, 'handoff-unknown-to-qa-2026-02-26T14-00-00Z.yaml', yaml);

      const reader = new HandoffReader(root);
      const result = reader.readLatestHandoff('qa');
      expect(result).toBeNull();

      fs.rmSync(root, { recursive: true });
    });

    test('returns null for non-matching to_agent field', () => {
      const { root, handoffDir } = makeTempProject();
      const yaml = `handoff:
  from_agent: "dev"
  to_agent: "devops"
  next_action: "Push changes."
`;
      writeHandoff(handoffDir, 'handoff-dev-to-qa-2026-02-26T14-00-00Z.yaml', yaml);

      const reader = new HandoffReader(root);
      // Filename says "qa" but to_agent field says "devops" — data takes precedence for body check
      // but file is found first by filename filter
      const result = reader.readLatestHandoff('qa');
      // to_agent mismatch in data should reject it
      expect(result).toBeNull();

      fs.rmSync(root, { recursive: true });
    });
  });

  describe('_normalize', () => {
    test('cleans empty strings from arrays', () => {
      const { root, handoffDir } = makeTempProject();
      const yaml = `handoff:
  from_agent: "dev"
  to_agent: "qa"
  decisions:
    - ""
    - "Valid decision"
    - ""
  files_modified:
    - ""
  blockers:
    - ""
    - ""
  next_action: "Review story."
`;
      writeHandoff(handoffDir, 'handoff-dev-to-qa-2026-02-26T14-00-00Z.yaml', yaml);

      const reader = new HandoffReader(root);
      const result = reader.readLatestHandoff('qa');

      expect(result.decisions).toEqual(['Valid decision']);
      expect(result.filesModified).toEqual([]);
      expect(result.blockers).toEqual([]);

      fs.rmSync(root, { recursive: true });
    });

    test('caps arrays at their max lengths', () => {
      const { root, handoffDir } = makeTempProject();
      // 6 decisions (max 5), 11 files (max 10), 4 blockers (max 3)
      const yaml = `handoff:
  from_agent: "dev"
  to_agent: "qa"
  decisions:
    - "d1"
    - "d2"
    - "d3"
    - "d4"
    - "d5"
    - "d6"
  files_modified:
    - "f1"
    - "f2"
    - "f3"
    - "f4"
    - "f5"
    - "f6"
    - "f7"
    - "f8"
    - "f9"
    - "f10"
    - "f11"
  blockers:
    - "b1"
    - "b2"
    - "b3"
    - "b4"
  next_action: "Done."
`;
      writeHandoff(handoffDir, 'handoff-dev-to-qa-2026-02-26T14-00-00Z.yaml', yaml);

      const reader = new HandoffReader(root);
      const result = reader.readLatestHandoff('qa');

      expect(result.decisions).toHaveLength(5);
      expect(result.filesModified).toHaveLength(10);
      expect(result.blockers).toHaveLength(3);

      fs.rmSync(root, { recursive: true });
    });

    test('handles handoff data at root level (not nested under handoff:)', () => {
      const { root, handoffDir } = makeTempProject();
      const yaml = `from_agent: "sm"
to_agent: "dev"
next_action: "Implement story."
`;
      writeHandoff(handoffDir, 'handoff-sm-to-dev-2026-02-26T14-00-00Z.yaml', yaml);

      const reader = new HandoffReader(root);
      const result = reader.readLatestHandoff('dev');

      expect(result).not.toBeNull();
      expect(result.fromAgent).toBe('sm');
      expect(result.nextAction).toBe('Implement story.');

      fs.rmSync(root, { recursive: true });
    });
  });

  describe('readLatestHandoff — filename pattern matching', () => {
    test('ignores files that do not match the handoff filename pattern', () => {
      const { root, handoffDir } = makeTempProject();
      // Write a file with a non-matching name
      fs.writeFileSync(path.join(handoffDir, 'session-state.json'), '{}');
      fs.writeFileSync(path.join(handoffDir, 'random-notes.txt'), 'notes');
      writeHandoff(handoffDir, 'handoff-dev-to-qa-2026-02-26T14-00-00Z.yaml', makeHandoffYaml('dev', 'qa'));

      const reader = new HandoffReader(root);
      const result = reader.readLatestHandoff('qa');

      expect(result).not.toBeNull();
      expect(result.fromAgent).toBe('dev');

      fs.rmSync(root, { recursive: true });
    });
  });
});
