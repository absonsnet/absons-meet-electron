#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const excludedDirs = new Set([
    '.git',
    'node_modules',
    'dist',
    'build'
]);

const excludedFiles = new Set([
    'package-lock.json'
]);

const excludedRelativePaths = new Set([
    'app/features/conference/external_api.js',
    'CLAUDE.md',
    'scripts/check-branding.cjs'
]);

const allowedExtensions = new Set([
    '.js',
    '.cjs',
    '.mjs',
    '.json',
    '.md',
    '.txt',
    '.yml',
    '.yaml',
    '.html',
    '.css',
    '.plist'
]);

const explicitFiles = new Set([
    '.eslintignore',
    '.eslintrc.js',
    '.gitignore',
    'package.json'
]);

const checks = [
    {
        label: 'Jitsi Meet',
        regex: /Jitsi Meet/g
    },
    {
        label: 'jitsi-meet',
        regex: /jitsi-meet/g
    },
    {
        label: 'org.jitsi',
        regex: /org\.jitsi/g
    },
    {
        label: 'jitsi-protocol',
        regex: /jitsi-protocol/g
    }
];

function shouldScanFile(relativePath) {
    if (excludedFiles.has(path.basename(relativePath))) {
        return false;
    }

    if (excludedRelativePaths.has(relativePath)) {
        return false;
    }

    if (explicitFiles.has(relativePath)) {
        return true;
    }

    return allowedExtensions.has(path.extname(relativePath));
}

function collectFiles(currentDir, collected = []) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        const relativePath = path.relative(rootDir, fullPath);

        if (entry.isDirectory()) {
            if (excludedDirs.has(entry.name)) {
                continue;
            }
            collectFiles(fullPath, collected);
            continue;
        }

        if (!entry.isFile()) {
            continue;
        }

        if (!shouldScanFile(relativePath)) {
            continue;
        }

        collected.push(relativePath);
    }

    return collected;
}

function getLineNumber(source, matchIndex) {
    return source.slice(0, matchIndex).split('\n').length;
}

function run() {
    const files = collectFiles(rootDir);
    const results = [];

    for (const file of files) {
        const absolutePath = path.join(rootDir, file);
        const content = fs.readFileSync(absolutePath, 'utf8');

        for (const check of checks) {
            const regex = new RegExp(check.regex.source, check.regex.flags);
            let match;

            while ((match = regex.exec(content)) !== null) {
                results.push({
                    file,
                    line: getLineNumber(content, match.index),
                    pattern: check.label
                });
            }
        }
    }

    if (results.length === 0) {
        console.log('No remaining branding matches were found for:');
        for (const check of checks) {
            console.log(`- ${check.label}`);
        }

        return;
    }

    console.log('Remaining branding matches:');
    for (const result of results) {
        console.log(`- ${result.file}:${result.line} -> ${result.pattern}`);
    }

    const totals = checks.map(check => {
        const count = results.filter(result => result.pattern === check.label).length;

        return `${check.label}: ${count}`;
    });

    console.log('Summary:');
    for (const total of totals) {
        console.log(`- ${total}`);
    }
}

run();
