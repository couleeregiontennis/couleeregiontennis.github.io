#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const ROOT_DIR = path.resolve(__dirname, '..');
const INDEX_HTML_PATH = path.join(ROOT_DIR, 'index.html');

// Directories to scan and update
const TARGET_PATHS = [
  INDEX_HTML_PATH,
  path.join(ROOT_DIR, 'pages'),
  path.join(ROOT_DIR, 'partials'),
  path.join(ROOT_DIR, 'scripts')
];

// Regex to match cache-buster query parameter (matches e.g. ?v=2026, ?v=2026.6, ?v=2026.12)
// Restricts to 20XX years to avoid matching external URLs or youtube video parameters (e.g. ?v=dQw4w9WgXcQ)
const VERSION_REGEX = /\?v=(20\d{2}(?:\.\d+)?)/g;

function getFilesRecursively(dirOrFile, fileList = []) {
  const stat = fs.statSync(dirOrFile);
  if (stat.isFile()) {
    const ext = path.extname(dirOrFile);
    if (ext === '.html' || ext === '.js') {
      fileList.push(dirOrFile);
    }
  } else if (stat.isDirectory()) {
    const basename = path.basename(dirOrFile);
    if (basename !== 'node_modules' && basename !== '.git' && basename !== 'management-scripts') {
      const files = fs.readdirSync(dirOrFile);
      for (const file of files) {
        getFilesRecursively(path.join(dirOrFile, file), fileList);
      }
    }
  }
  return fileList;
}

function getStagedFiles() {
  try {
    const stdout = execSync('git diff --cached --name-only', { encoding: 'utf8', cwd: ROOT_DIR });
    return stdout.split('\n').map(f => f.trim()).filter(Boolean);
  } catch (err) {
    console.error('Error checking staged files:', err.message);
    return [];
  }
}

function shouldTriggerBump(stagedFiles) {
  const triggerPatterns = [
    /^teams\//,
    /^styles\//,
    /^scripts\//,
    /^pages\/.*\.html$/,
    /^partials\/.*\.html$/,
    /^index\.html$/
  ];

  return stagedFiles.some(file => {
    // Normalize path separators
    const normalized = file.replace(/\\/g, '/');
    return triggerPatterns.some(pattern => pattern.test(normalized));
  });
}

function getNewVersion(currentVersion) {
  const parts = currentVersion.split('.');
  if (parts.length === 1) {
    return `${parts[0]}.1`;
  }
  const major = parts[0];
  const minor = parseInt(parts[1], 10);
  if (isNaN(minor)) {
    return `${major}.1`;
  }
  return `${major}.${minor + 1}`;
}

function main() {
  const args = process.argv.slice(2);
  const isGitHook = args.includes('--git-hook');

  if (isGitHook) {
    const stagedFiles = getStagedFiles();
    if (!shouldTriggerBump(stagedFiles)) {
      console.log('No relevant files staged for cache-busting. Skipping version bump.');
      process.exit(0);
    }
  }

  // 1. Read index.html to find current version
  if (!fs.existsSync(INDEX_HTML_PATH)) {
    console.error(`Error: index.html not found at ${INDEX_HTML_PATH}`);
    process.exit(1);
  }

  const indexContent = fs.readFileSync(INDEX_HTML_PATH, 'utf8');
  // Reset regex index
  VERSION_REGEX.lastIndex = 0;
  const match = VERSION_REGEX.exec(indexContent);
  if (!match) {
    console.error('Error: Could not find a version parameter matching "?v=20XX.X" or "?v=20XX" in index.html.');
    process.exit(1);
  }

  const currentVersion = match[1];
  let newVersion = '';

  // Check if manual version was provided as argument
  const manualVersionArg = args.find(arg => !arg.startsWith('--'));
  if (manualVersionArg) {
    if (!/^20\d{2}(?:\.\d+)?$/.test(manualVersionArg)) {
      console.error(`Error: Invalid manual version "${manualVersionArg}". Must be in format 20XX or 20XX.X.`);
      process.exit(1);
    }
    newVersion = manualVersionArg;
  } else {
    newVersion = getNewVersion(currentVersion);
  }

  if (currentVersion === newVersion) {
    console.log(`Version is already at ${newVersion}. No changes needed.`);
    process.exit(0);
  }

  console.log(`Bumping cache-busting version: ${currentVersion} -> ${newVersion}`);

  // 2. Gather all files to update
  const filesToUpdate = [];
  for (const targetPath of TARGET_PATHS) {
    if (fs.existsSync(targetPath)) {
      getFilesRecursively(targetPath, filesToUpdate);
    }
  }

  // Deduplicate files
  const uniqueFiles = [...new Set(filesToUpdate)];
  const updatedFiles = [];

  // 3. Replace version in all files
  for (const file of uniqueFiles) {
    const content = fs.readFileSync(file, 'utf8');
    VERSION_REGEX.lastIndex = 0;
    if (VERSION_REGEX.test(content)) {
      const updatedContent = content.replace(VERSION_REGEX, `?v=${newVersion}`);
      fs.writeFileSync(file, updatedContent, 'utf8');
      updatedFiles.push(file);
    }
  }

  if (updatedFiles.length > 0) {
    console.log(`Updated version in ${updatedFiles.length} files:`);
    for (const file of updatedFiles) {
      const relPath = path.relative(ROOT_DIR, file);
      console.log(`  - ${relPath}`);
      if (isGitHook) {
        // Stage the updated file
        try {
          execSync(`git add "${file}"`, { cwd: ROOT_DIR });
        } catch (addErr) {
          console.error(`Failed to git add ${relPath}:`, addErr.message);
        }
      }
    }
  } else {
    console.log('No version occurrences found to update.');
  }
}

if (require.main === module) {
  main();
}
