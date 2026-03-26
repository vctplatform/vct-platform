/**
 * Audit Hardcoded Strings (i18n Report)
 * 
 * Scans .tsx files for hardcoded Vietnamese and English text in JSX.
 * Generates a report — does NOT auto-fix (requires manual i18n key creation).
 * 
 * Detects:
 * 1. Vietnamese text (contains diacritical marks: ắ, ơ, ệ, etc.)
 * 2. Common hardcoded English text in JSX (capitalized strings > 2 words)
 * 
 * Excludes:
 * - Text already using t('key') pattern
 * - className strings
 * - console.log/error messages
 * - Comments
 * - Import/export statements
 * - mobile/ and __tests__/ directories
 * 
 * Run: node audit-hardcoded-strings.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXCLUDE_DIRS = new Set(['mobile', '__tests__', 'node_modules', '.next']);
const SKIP_PATTERNS = ['.test.', '.spec.', 'mock-data'];

// Vietnamese diacritical characters detection
const VIET_REGEX = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

const featuresDir = path.join(__dirname, 'features');
const findings = [];

function shouldSkip(filePath) {
  const parts = filePath.split(path.sep);
  if (parts.some(p => EXCLUDE_DIRS.has(p))) return true;
  if (SKIP_PATTERNS.some(p => filePath.includes(p))) return true;
  return false;
}

function isIgnoredLine(line) {
  const trimmed = line.trim();
  // Skip imports, comments, console, className, t() calls
  if (trimmed.startsWith('import ')) return true;
  if (trimmed.startsWith('export ')) return true;
  if (trimmed.startsWith('//')) return true;
  if (trimmed.startsWith('*')) return true;
  if (trimmed.startsWith('/*')) return true;
  if (trimmed.includes('console.')) return true;
  if (trimmed.includes('className=')) return true;
  // Skip type annotations and interfaces
  if (trimmed.match(/^(type|interface|const\s+\w+:\s)/)) return true;
  return false;
}

function processFile(filePath) {
  if (shouldSkip(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const relative = path.relative(__dirname, filePath);
  const fileFindings = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isIgnoredLine(line)) continue;

    // Find strings between JSX tags: >Vietnamese text<
    const jsxTextMatches = line.matchAll(/>([^<>{]*[a-zA-Zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ][^<>{}]*)</giu);
    for (const m of jsxTextMatches) {
      const text = m[1].trim();
      if (text.length < 2) continue;
      if (text.match(/^\{/)) continue; // Dynamic expression
      if (text.match(/^[0-9.%,]+$/)) continue; // Numbers only
      if (VIET_REGEX.test(text)) {
        fileFindings.push({ line: i + 1, type: 'vietnamese', text: text.slice(0, 80) });
      }
    }

    // Find hardcoded strings in props: label="Vietnamese text", title="text"
    const propMatches = line.matchAll(/(title|label|placeholder|description|message|header|subtitle|alt|aria-label)=["']([^"']+)["']/gi);
    for (const m of propMatches) {
      const text = m[2].trim();
      if (text.startsWith('{')) continue;
      if (text.length < 3) continue;
      if (VIET_REGEX.test(text)) {
        fileFindings.push({ line: i + 1, type: 'prop-viet', text: `${m[1]}="${text.slice(0, 60)}"` });
      } else if (text.split(' ').length > 1 && !text.startsWith('http') && !text.startsWith('data-')) {
        fileFindings.push({ line: i + 1, type: 'prop-en', text: `${m[1]}="${text.slice(0, 60)}"` });
      }
    }

    // Find standalone Vietnamese strings in JSX expressions: {'Vietnamese'}
    const exprMatches = line.matchAll(/['"]([^'"]{3,})['"](?!\s*[,;)\]}:])/g);
    for (const m of exprMatches) {
      const text = m[1];
      if (VIET_REGEX.test(text) && !line.includes("t('") && !line.includes('t("') && !line.includes('key:') && !line.includes('Key:')) {
        // Avoid duplicating findings from JSX text
        if (!fileFindings.some(f => f.line === i + 1 && f.text.includes(text.slice(0, 20)))) {
          fileFindings.push({ line: i + 1, type: 'string-viet', text: text.slice(0, 80) });
        }
      }
    }
  }

  if (fileFindings.length > 0) {
    findings.push({ file: relative, items: fileFindings });
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

console.log('🔍 Auditing hardcoded strings (i18n violations)...\n');

traverse(featuresDir);

// Summary
const totalItems = findings.reduce((sum, f) => sum + f.items.length, 0);
const vietCount = findings.reduce((sum, f) => sum + f.items.filter(i => i.type.includes('viet')).length, 0);
const enCount = findings.reduce((sum, f) => sum + f.items.filter(i => i.type.includes('en')).length, 0);

console.log(`${'─'.repeat(55)}`);
console.log(`📊 AUDIT REPORT`);
console.log(`${'─'.repeat(55)}`);
console.log(`Files with hardcoded strings: ${findings.length}`);
console.log(`Total hardcoded strings found: ${totalItems}`);
console.log(`  Vietnamese text: ${vietCount}`);
console.log(`  English text (props): ${enCount}`);
console.log(`${'─'.repeat(55)}\n`);

// Top files by violation count
const sortedFiles = findings.sort((a, b) => b.items.length - a.items.length);
console.log('Top 20 files by violation count:\n');
for (const { file, items } of sortedFiles.slice(0, 20)) {
  console.log(`  📄 ${file} — ${items.length} strings`);
  // Show first 3 examples
  for (const item of items.slice(0, 3)) {
    console.log(`     L${item.line} [${item.type}] ${item.text}`);
  }
  if (items.length > 3) {
    console.log(`     ... +${items.length - 3} more`);
  }
  console.log();
}

// Write detailed report to file
const reportPath = path.join(__dirname, 'i18n-audit-report.txt');
let report = `i18n Audit Report\nGenerated: ${new Date().toISOString()}\n\n`;
report += `Total: ${totalItems} hardcoded strings in ${findings.length} files\n`;
report += `Vietnamese: ${vietCount} | English: ${enCount}\n\n`;
report += '═'.repeat(60) + '\n\n';

for (const { file, items } of sortedFiles) {
  report += `📄 ${file} (${items.length} items)\n`;
  for (const item of items) {
    report += `  L${item.line} [${item.type}] ${item.text}\n`;
  }
  report += '\n';
}

fs.writeFileSync(reportPath, report, 'utf8');
console.log(`\n📝 Full report saved to: ${reportPath}`);
