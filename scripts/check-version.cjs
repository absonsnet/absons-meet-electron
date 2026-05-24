#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const packagePath = path.join(rootDir, 'package.json');
const lockPath = path.join(rootDir, 'package-lock.json');

const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const version = pkg.version;

const numericIdentifier = '(0|[1-9][0-9]*)';
const prereleaseIdentifier = '(?:0|[1-9][0-9]*|[0-9A-Za-z-]*[A-Za-z-][0-9A-Za-z-]*)';
const semverPattern = new RegExp(
  `^${numericIdentifier}\\.${numericIdentifier}\\.${numericIdentifier}` +
  `(?:-${prereleaseIdentifier}(?:\\.${prereleaseIdentifier})*)?` +
  `(?:\\+[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?$`
);

if (typeof version !== 'string' || !semverPattern.test(version)) {
  console.error(`Invalid package.json version: ${JSON.stringify(version)}`);
  console.error('Use strict semver without leading zeros, for example: 1.0.9');
  process.exit(1);
}

if (fs.existsSync(lockPath)) {
  const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  const lockRootVersion = lock.packages && lock.packages[''] && lock.packages[''].version;

  if (lock.version !== version || lockRootVersion !== version) {
    console.error('package-lock.json version does not match package.json.');
    console.error(`package.json: ${version}`);
    console.error(`package-lock.json root: ${lock.version}`);
    console.error(`package-lock.json packages[""]: ${lockRootVersion}`);
    console.error('Run: npm install --package-lock-only');
    process.exit(1);
  }
}

console.log(`Package version is valid semver: ${version}`);
