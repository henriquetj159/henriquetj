/**
 * HandoffReader - Reads and parses agent handoff artifacts.
 *
 * Story WIS-16: Workflow-Aware Greeting Handoffs
 *
 * Reads the most recent handoff artifact from `.aios/handoffs/` and exposes
 * a parsed, validated data structure for GreetingBuilder to consume.
 *
 * Handoff format (agent-handoff-tmpl.yaml):
 *   handoff:
 *     from_agent:    string  (e.g. 'dev', 'qa', 'sm')
 *     to_agent:      string  (e.g. 'qa', 'devops')
 *     timestamp:     ISO-8601 string
 *     story_context: { story_id, story_path, story_status, current_task, branch }
 *     decisions:     string[]   (max 5)
 *     files_modified: string[] (max 10)
 *     blockers:      string[]   (max 3)
 *     next_action:   string
 *
 * Graceful degradation: any error → returns null (greeting continues without handoff section)
 *
 * @module development/scripts/handoff-reader
 */

'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

/**
 * Maximum age of a handoff artifact to be considered "recent" (1 hour).
 * Older artifacts are stale and ignored.
 */
const HANDOFF_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

/**
 * Directory where handoff artifacts are written.
 * Relative to project root. Runtime-only, gitignored.
 */
const HANDOFF_DIR_REL = path.join('.aios', 'handoffs');

/**
 * Filename pattern for handoff artifacts.
 * Format: handoff-{from}-to-{to}-{timestamp}.yaml
 * Example: handoff-dev-to-qa-2026-02-26T14-30-00Z.yaml
 */
const HANDOFF_FILE_PATTERN = /^handoff-([a-z][a-z0-9-]*?)-to-([a-z][a-z0-9-]*?)-\d[\dT\-Z:.]+\.ya?ml$/i;

class HandoffReader {
  /**
   * @param {string} [projectRoot] - Project root directory. Defaults to process.cwd().
   */
  constructor(projectRoot) {
    this.projectRoot = projectRoot || process.cwd();
    this.handoffDir = path.join(this.projectRoot, HANDOFF_DIR_REL);
  }

  /**
   * Read the most recent handoff artifact for the given target agent.
   *
   * Only returns handoffs directed at `toAgentId` that:
   * - Were written within the last HANDOFF_MAX_AGE_MS
   * - Pass basic schema validation
   *
   * @param {string} toAgentId - The incoming agent ID (e.g. 'dev', 'qa')
   * @returns {Object|null} Parsed, validated handoff data or null
   */
  readLatestHandoff(toAgentId) {
    try {
      if (!fs.existsSync(this.handoffDir)) {
        return null;
      }

      const files = this._listHandoffFiles(toAgentId);
      if (files.length === 0) {
        return null;
      }

      // Try files from newest to oldest; return first valid one
      for (const filePath of files) {
        const handoff = this._parseAndValidate(filePath, toAgentId);
        if (handoff) {
          return handoff;
        }
      }

      return null;
    } catch (error) {
      // Graceful degradation: any IO or parse failure → null
      console.warn('[HandoffReader] Failed to read handoff:', error.message);
      return null;
    }
  }

  /**
   * List handoff YAML files in the handoff directory, sorted newest-first.
   * Optionally filters by target agent ID from the filename.
   *
   * @private
   * @param {string|null} toAgentId - Filter by target agent or null for all
   * @returns {string[]} Sorted absolute file paths, newest first
   */
  _listHandoffFiles(toAgentId) {
    let files;
    try {
      files = fs.readdirSync(this.handoffDir);
    } catch {
      return [];
    }

    const yamlFiles = files.filter(f => {
      if (!HANDOFF_FILE_PATTERN.test(f)) {
        return false;
      }
      // If toAgentId given, filter by target in filename
      if (toAgentId) {
        const match = f.match(HANDOFF_FILE_PATTERN);
        if (match) {
          const filenameTarget = match[2];
          if (filenameTarget !== toAgentId) {
            return false;
          }
        }
      }
      return true;
    });

    // Sort by mtime descending (newest first)
    const withStats = yamlFiles.map(f => {
      const fp = path.join(this.handoffDir, f);
      try {
        const stat = fs.statSync(fp);
        return { fp, mtime: stat.mtimeMs };
      } catch {
        return { fp, mtime: 0 };
      }
    });

    withStats.sort((a, b) => b.mtime - a.mtime);
    return withStats.map(x => x.fp);
  }

  /**
   * Parse a YAML handoff file and validate its structure and freshness.
   *
   * @private
   * @param {string} filePath - Absolute path to handoff YAML file
   * @param {string} toAgentId - Expected target agent ID for validation
   * @returns {Object|null} Validated handoff payload or null
   */
  _parseAndValidate(filePath, toAgentId) {
    try {
      // Check file age (mtime-based staleness check)
      const stat = fs.statSync(filePath);
      const ageMs = Date.now() - stat.mtimeMs;
      if (ageMs > HANDOFF_MAX_AGE_MS) {
        return null; // Stale handoff — ignore
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const parsed = yaml.load(content);

      if (!parsed || typeof parsed !== 'object') {
        return null;
      }

      // The handoff data may be at `parsed.handoff` (template format) or at root level
      const handoffData = parsed.handoff || parsed;

      // Validate minimum required fields
      if (!handoffData.from_agent) {
        return null;
      }

      // Validate target agent matches (if present in data)
      if (handoffData.to_agent && toAgentId && handoffData.to_agent !== toAgentId) {
        return null;
      }

      return this._normalize(handoffData, stat.mtimeMs);
    } catch (error) {
      console.warn('[HandoffReader] Failed to parse handoff file:', error.message);
      return null;
    }
  }

  /**
   * Normalize raw handoff data into a clean structure consumed by GreetingBuilder.
   *
   * @private
   * @param {Object} raw - Raw parsed YAML data
   * @param {number} mtimeMs - File modification time in ms (used as timestamp fallback)
   * @returns {Object} Normalized handoff object
   */
  _normalize(raw, mtimeMs) {
    const storyCtx = raw.story_context || {};

    return {
      // Core identity
      fromAgent: raw.from_agent || null,
      toAgent: raw.to_agent || null,
      timestamp: raw.timestamp || new Date(mtimeMs).toISOString(),

      // Story context (compact subset)
      storyId: storyCtx.story_id || null,
      storyPath: storyCtx.story_path || null,
      storyStatus: storyCtx.story_status || null,
      currentTask: storyCtx.current_task || null,
      branch: storyCtx.branch || null,

      // Key decisions (array of strings, max 5)
      decisions: this._cleanStringArray(raw.decisions, 5),

      // Files modified (array of strings, max 10)
      filesModified: this._cleanStringArray(raw.files_modified, 10),

      // Active blockers (array of strings, max 3)
      blockers: this._cleanStringArray(raw.blockers, 3),

      // Next action for incoming agent (single string)
      nextAction: typeof raw.next_action === 'string' ? raw.next_action.trim() : null,
    };
  }

  /**
   * Sanitize a YAML array field: filter out empty/invalid entries, cap at max.
   *
   * @private
   * @param {*} value - Raw YAML value (may be undefined, null, array, or scalar)
   * @param {number} max - Maximum array length
   * @returns {string[]} Clean string array
   */
  _cleanStringArray(value, max) {
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .filter(v => typeof v === 'string' && v.trim().length > 0)
      .slice(0, max);
  }
}

module.exports = HandoffReader;
