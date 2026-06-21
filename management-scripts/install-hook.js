#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const GIT_DIR = path.join(ROOT_DIR, '.git');
const HOOKS_DIR = path.join(GIT_DIR, 'hooks');
const PRE_COMMIT_PATH = path.join(HOOKS_DIR, 'pre-commit');

function main() {
  if (!fs.existsSync(GIT_DIR)) {
    console.log('No .git directory found. Skipping pre-commit hook installation.');
    process.exit(0);
  }

  if (!fs.existsSync(HOOKS_DIR)) {
    fs.mkdirSync(HOOKS_DIR, { recursive: true });
  }

  const hookContent = `#!/bin/sh
# Automatically bump cache-busting version on relevant changes
node management-scripts/bump-version.js --git-hook
`;

  fs.writeFileSync(PRE_COMMIT_PATH, hookContent, { encoding: 'utf8', mode: 0o755 });
  console.log('Git pre-commit hook installed successfully.');

  // Ensure executable permissions on Unix systems
  if (process.platform !== 'win32') {
    try {
      execSync(`chmod +x "${PRE_COMMIT_PATH}"`);
      console.log('Pre-commit hook marked as executable.');
    } catch (err) {
      console.warn('Warning: Could not make pre-commit hook executable via chmod:', err.message);
    }
  }
}

if (require.main === module) {
  main();
}
