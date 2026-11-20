#!/usr/bin/env node
/**
 * Automated Pre-Delivery Self-Audit for QuanLyThietBiCNTT v3.0 (PROJECT-RULES.md Mục 13)
 * Checks:
 *  1. Zero hardcoded LAN IPs / passwords / real SQL login patterns in code & docs
 *  2. Zero external CDN / Google Fonts URLs in client/ (index.html, src/**) and views/public/
 *  3. Zero dangerouslySetInnerHTML or localStorage/sessionStorage auth token usage in client/src/
 *  4. Strict isolation: client/src/design-system/ MUST NOT import from features/
 *  5. Mandatory .js/.mjs/.json extension on relative ES Module imports in server/src/ & scripts/
 *
 * Usage:
 *   node .agents/skills/qltb-task-execution/scripts/self-audit.mjs --files "server/src/app.js,client/src/App.tsx"
 *   node .agents/skills/qltb-task-execution/scripts/self-audit.mjs --all
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const IGNORE_DIRS = new Set([
  'node_modules', '.git', 'logs', 'temp', 'dist', 'build', 'coverage',
  'public/vendor', 'db/sql/baseline', 'client/dist', 'client/node_modules', 'server/node_modules'
]);

const args = process.argv.slice(2);
let targetFiles = [];
let scanAll = false;

for (let i = 0; i < args.length; i += 1) {
  if (args[i] === '--all') {
    scanAll = true;
  } else if (args[i] === '--files' && args[i + 1]) {
    targetFiles = args[i + 1]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    i += 1;
  }
}

if (!scanAll && targetFiles.length === 0) {
  console.error('Usage: node self-audit.mjs --files "file1,file2" | --all');
  process.exit(2);
}

function walkDir(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name) || IGNORE_DIRS.has(rel)) continue;
      walkDir(abs, acc);
    } else if (entry.isFile()) {
      if (rel === '.env' || rel.endsWith('.env') || /\.(?:png|jpg|jpeg|gif|webp|woff2?|ttf|eot|docx|pdf|ico)$/i.test(rel)) continue;
      if (rel.startsWith('.agents/')) continue;
      acc.push(rel);
    }
  }
  return acc;
}

const filesToCheck = scanAll
  ? walkDir(ROOT)
  : targetFiles.map((f) => path.relative(ROOT, path.resolve(ROOT, f)).replace(/\\/g, '/'));

const findings = [];

function addFinding(rule, file, lineNo, detail) {
  findings.push({ rule, file, lineNo, detail });
}

const SECRET_PATTERNS = [
  { name: 'Hardcoded private IPv4', regex: /\b(?:192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})\b/ },
  { name: 'Possible hardcoded SQL sa credential', regex: /\b(?:user|uid)\s*[:=]\s*['"]?sa['"]?/i },
  { name: 'Possible hardcoded password literal', regex: /\b(?:DB_PASSWORD|SESSION_SECRET|password)\s*[:=]\s*['"][^'"${}\s]{4,}['"]/i }
];

const CDN_REGEX = /https?:\/\/(?:cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com|code\.jquery\.com|unpkg\.com|stackpath\.bootstrapcdn\.com|maxcdn\.bootstrapcdn\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)/i;
const DANGEROUS_HTML_REGEX = /\bdangerouslySetInnerHTML\b/;
const TOKEN_STORAGE_REGEX = /\b(?:localStorage|sessionStorage)\.setItem\s*\(\s*['"][^'"]*(?:token|auth|session|csrf|jwt|password)[^'"]*['"]/i;
const DESIGN_SYSTEM_FEATURE_IMPORT_REGEX = /\bfrom\s+['"][^'"]*features\//;
const RELATIVE_IMPORT_REGEX = /\b(?:import|export)\s+(?:[^'"]+\s+from\s+)?['"](\.\.?\/[^'"]+)['"]/;

let checkedCount = 0;

for (const rel of filesToCheck) {
  const abs = path.resolve(ROOT, rel);
  if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
    addFinding('MISSING_FILE', rel, 0, 'File does not exist');
    continue;
  }
  if (rel === '.env' || rel.endsWith('.env')) continue;

  checkedCount += 1;
  const content = fs.readFileSync(abs, 'utf8');
  const lines = content.split(/\r?\n/);

  const isClientFile = rel.startsWith('client/') && /\.(?:html|ts|tsx|js|jsx|css)$/i.test(rel);
  const isDesignSystemFile = rel.startsWith('client/src/design-system/') && /\.(?:ts|tsx)$/i.test(rel);
  const isServerEsm =
    (rel.startsWith('server/src/') || rel.startsWith('scripts/')) &&
    /\.(?:js|mjs)$/i.test(rel);

  lines.forEach((line, idx) => {
    const lineNo = idx + 1;

    // 1. Secret & private IP hygiene (skip example placeholders containing <...> or your_ or change_me)
    if (!/(?:<[^>]+>|your_|change_me|example|placeholder)/i.test(line)) {
      for (const pat of SECRET_PATTERNS) {
        if (pat.regex.test(line)) {
          addFinding('SECRET_HYGIENE', rel, lineNo, `${pat.name}: ${line.trim().slice(0, 100)}`);
        }
      }
    }

    // 2. Zero external CDN or Google Fonts in client/
    if (isClientFile && CDN_REGEX.test(line)) {
      addFinding('EXTERNAL_CDN', rel, lineNo, line.trim().slice(0, 120));
    }

    // 3. Zero dangerouslySetInnerHTML & auth token storage in client/src/
    if (rel.startsWith('client/src/') && /\.(?:ts|tsx|js|jsx)$/i.test(rel)) {
      if (DANGEROUS_HTML_REGEX.test(line)) {
        addFinding('DANGEROUS_INNER_HTML', rel, lineNo, line.trim().slice(0, 120));
      }
      if (TOKEN_STORAGE_REGEX.test(line)) {
        addFinding('AUTH_TOKEN_IN_WEB_STORAGE', rel, lineNo, line.trim().slice(0, 120));
      }
    }

    // 4. Design system must stay 100% decoupled from features/
    if (isDesignSystemFile && DESIGN_SYSTEM_FEATURE_IMPORT_REGEX.test(line)) {
      addFinding('DESIGN_SYSTEM_COUPLING', rel, lineNo, `design-system must not import from features/: ${line.trim()}`);
    }

    // 5. Mandatory .js/.mjs/.json extension on relative ESM imports in server/src/ & scripts/
    if (isServerEsm) {
      const m = line.match(RELATIVE_IMPORT_REGEX);
      if (m) {
        const spec = m[1];
        if (!/\.(?:js|mjs|cjs|json)$/.test(spec)) {
          addFinding('ESM_MISSING_EXTENSION', rel, lineNo, `Relative import missing .js: "${spec}"`);
        }
      }
    }
  });
}

console.log(`QLTB v3.0 Self-Audit checked ${checkedCount} file(s). Findings: ${findings.length}`);
if (findings.length > 0) {
  for (const f of findings) {
    console.log(`  [FAIL][${f.rule}] ${f.file}:${f.lineNo} — ${f.detail}`);
  }
  process.exit(1);
}
console.log('  [PASS] All automated checks passed (0 secrets/IPs, 0 external CDNs/Google Fonts, 0 dangerouslySetInnerHTML, 0 auth tokens in storage, 0 design-system coupling, 0 missing ESM .js extensions).');
process.exit(0);
