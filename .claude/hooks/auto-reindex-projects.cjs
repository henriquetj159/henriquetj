#!/usr/bin/env node

/**
 * Auto-reindex hook for ACTIVE.md
 * Runs after Edit/Write operations and checks if ACTIVE.md was modified
 * If so, automatically reindexes the project numbers
 */

const { execSync } = require('child_process');
const path = require('path');

// Read hook arguments from stdin if available
let hookData = {};
if (!process.stdin.isTTY) {
  try {
    const input = require('fs').readFileSync(0, 'utf-8');
    if (input.trim()) {
      hookData = JSON.parse(input);
    }
  } catch (err) {
    // Silent fail - not all hooks provide JSON input
  }
}

// Check if ACTIVE.md was modified
const filePath = hookData.file_path || hookData.filePath || '';
const isActiveMd = filePath.includes('ACTIVE.md') || filePath.endsWith('/ACTIVE.md');

if (isActiveMd) {
  try {
    const projectRoot = path.join(__dirname, '../..');
    const result = execSync('npm run projects:reindex', {
      cwd: projectRoot,
      encoding: 'utf-8',
      stdio: 'pipe'
    });

    // Only output if there were changes
    if (result.includes('Successfully reindexed')) {
      console.log('✅ Auto-reindexed project numbers');
    }
  } catch (error) {
    console.error('⚠️  Auto-reindex failed:', error.message);
  }
}

// Always exit successfully (don't block the main operation)
process.exit(0);
