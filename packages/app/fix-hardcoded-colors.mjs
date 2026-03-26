/**
 * Fix Hardcoded Colors → Design Token CSS Variables
 * 
 * Scans .tsx files in features/ and replaces hardcoded hex colors in:
 * 1. Tailwind arbitrary values: text-[#hex] → text-(--vct-token)    
 *                                bg-[#hex]  → bg-(--vct-token)
 * 2. Inline style literals:     color: '#hex' → color: 'var(--vct-token)'
 *                                '#hex'       → 'var(--vct-token)'
 * 
 * Skips:
 * - CSS var fallbacks like var(--vct-xxx,#hex) — already using tokens
 * - Hex with alpha like #ef444420 — used for bg overlays
 * - mobile/, __tests__/, test files
 * 
 * Run: node fix-hardcoded-colors.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Color mapping: hex → token name (no var() wrapper) ──
const HEX_TO_TOKEN = {
  // Text
  '#f1f5f9': '--vct-text-primary',
  '#0f172a': '--vct-text-primary',
  '#cbd5e1': '--vct-text-secondary',
  '#334155': '--vct-text-secondary',
  '#94a3b8': '--vct-text-tertiary',
  '#64748b': '--vct-text-tertiary',
  '#6b7280': '--vct-text-tertiary',
  '#9ca3af': '--vct-text-secondary',
  '#475569': '--vct-text-secondary',
  '#111827': '--vct-text-primary',
  // Accent
  '#22d3ee': '--vct-accent-cyan',
  '#0ea5e9': '--vct-accent-cyan',
  '#06b6d4': '--vct-accent-cyan',
  // Success / Green
  '#10b981': '--vct-success',
  '#34d399': '--vct-success',
  '#22c55e': '--vct-success',
  '#16a34a': '--vct-success',
  '#059669': '--vct-success',
  // Danger / Red
  '#ef4444': '--vct-danger',
  '#f87171': '--vct-danger',
  '#dc2626': '--vct-danger',
  '#b91c1c': '--vct-danger',
  // Warning / Amber
  '#f59e0b': '--vct-warning',
  '#fbbf24': '--vct-warning',
  '#d97706': '--vct-warning',
  '#f97316': '--vct-warning',
  '#b45309': '--vct-warning',
  // Info / Blue
  '#3b82f6': '--vct-info',
  '#60a5fa': '--vct-info',
  '#2563eb': '--vct-info',
  '#6366f1': '--vct-info',
  '#818cf8': '--vct-info',
  '#8b5cf6': '--vct-info',
  '#a78bfa': '--vct-info',
  // Pink
  '#ec4899': '--vct-accent-pink',
  // Gold
  '#eab308': '--vct-gold',
  '#facc15': '--vct-gold',
  // Surfaces
  '#ffffff': '--vct-bg-elevated',
  '#0b1120': '--vct-bg-base',
  '#162032': '--vct-bg-elevated',
  '#1e293b': '--vct-bg-input',
  '#1f2937': '--vct-bg-input',
  '#f0f4f8': '--vct-bg-base',
  '#f8fafc': '--vct-bg-glass-heavy',
  '#f5f5f5': '--vct-bg-base',
  '#000000': '--vct-text-primary',
  '#1a1a1a': '--vct-bg-base',
  '#888888': '--vct-text-tertiary',
  '#666666': '--vct-text-tertiary',
  // Borders
  '#dde3ec': '--vct-border-subtle',
  '#c1c9d6': '--vct-border-strong',
  '#e2e8f0': '--vct-border-subtle',
  // Light backgrounds for badges
  '#fee2e2': '--vct-danger-muted',
  '#dbeafe': '--vct-info-muted',
};

// Build case-insensitive lookup
const tokenLookup = {};
for (const [hex, token] of Object.entries(HEX_TO_TOKEN)) {
  tokenLookup[hex.toLowerCase()] = token;
}

const EXCLUDE_DIRS = new Set(['mobile', '__tests__', 'node_modules', '.next']);
const SKIP_PATTERNS = ['.test.', '.spec.', 'mock-data', 'design-tokens.ts'];

const featuresDir = path.join(__dirname, 'features');
let totalReplacements = 0;
let filesChanged = 0;
const unmapped = new Map();
const changeLog = [];

function shouldSkip(filePath) {
  const parts = filePath.split(path.sep);
  if (parts.some(p => EXCLUDE_DIRS.has(p))) return true;
  if (SKIP_PATTERNS.some(p => filePath.includes(p))) return true;
  return false;
}

function normalizeHex(hex) {
  let h = hex.toLowerCase();
  if (h.length === 4) {
    h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
  }
  return h;
}

function processFile(filePath) {
  if (shouldSkip(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let replacements = 0;
  const relative = path.relative(__dirname, filePath);

  // ─── Pattern 1: Tailwind arbitrary classes ───
  // text-[#hex] → text-(--vct-token)
  // bg-[#hex] → bg-(--vct-token)
  // border-[#hex] → border-(--vct-token)
  // BUT skip hex with alpha: #ef444420 (8 chars after #)
  content = content.replace(
    /(text|bg|border|ring|shadow|from|to|via|outline|decoration|caret|accent|fill|stroke)-\[#([0-9a-fA-F]{3,6})\]/g,
    (match, prefix, hexBody) => {
      const hex = normalizeHex('#' + hexBody);
      const token = tokenLookup[hex];
      if (token) {
        replacements++;
        return `${prefix}-(${token})`;
      }
      unmapped.set(hex, (unmapped.get(hex) || 0) + 1);
      return match;
    }
  );

  // ─── Pattern 2: Inline style object values ───
  // color: '#hex' → color: 'var(--vct-token)'
  // Handles: color: stat.failed > 0 ? '#ef4444' : '#10b981'
  // Handles: { color: '#hex' }
  content = content.replace(
    /(['"])#([0-9a-fA-F]{6})\1/g,
    (match, quote, hexBody) => {
      const hex = normalizeHex('#' + hexBody);
      const token = tokenLookup[hex];
      if (token) {
        // Check if this is inside a var() fallback — skip if so
        // Look back in the content for "var(--" before this match
        const idx = content.indexOf(match);
        const before = content.substring(Math.max(0, idx - 30), idx);
        if (before.includes('var(')) {
          return match; // Already a CSS var fallback, skip
        }
        replacements++;
        return `${quote}var(${token})${quote}`;
      }
      unmapped.set(hex, (unmapped.get(hex) || 0) + 1);
      return match;
    }
  );

  if (replacements > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✅ ${relative} (${replacements} replacements)`);
    changeLog.push({ file: relative, count: replacements });
    totalReplacements += replacements;
    filesChanged++;
  }
}

function traverse(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!EXCLUDE_DIRS.has(entry.name)) traverse(full);
    } else if (entry.name.endsWith('.tsx')) {
      processFile(full);
    }
  }
}

console.log('🎨 Fixing hardcoded hex colors → design tokens\n');
console.log('Patterns: Tailwind text-[#hex], bg-[#hex] + inline \'#hex\'');
console.log('Excluded: mobile/, __tests__/, test files\n');

traverse(featuresDir);

console.log(`\n${'─'.repeat(55)}`);
console.log(`✅ COMPLETED: ${totalReplacements} replacements across ${filesChanged} files\n`);

if (changeLog.length) {
  console.log('Changed files:');
  for (const { file, count } of changeLog) {
    console.log(`  ${file}: ${count}`);
  }
}

if (unmapped.size > 0) {
  console.log(`\n⚠️  Unmapped hex colors (${unmapped.size} unique, need manual review):`);
  const sorted = [...unmapped.entries()].sort((a, b) => b[1] - a[1]);
  for (const [hex, count] of sorted.slice(0, 15)) {
    console.log(`   ${hex} × ${count}`);
  }
  if (sorted.length > 15) {
    console.log(`   ... +${sorted.length - 15} more`);
  }
}
