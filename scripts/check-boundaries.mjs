#!/usr/bin/env node
/**
 * VCT Platform — Architecture Boundary Checker
 * 
 * Validates package dependency rules:
 * - shared-types: KHÔNG import packages khác
 * - shared-utils: KHÔNG import ui hoặc app
 * - packages/ui:  KHÔNG import packages/app
 * - packages/app: KHÔNG import apps/*
 * 
 * Usage: node scripts/check-boundaries.mjs
 */

import { execSync } from 'child_process'

const RED = '\x1b[31m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const RESET = '\x1b[0m'

let violations = 0

function check(label, grepPattern, searchPath) {
  try {
    const result = execSync(
      `grep -rn "${grepPattern}" ${searchPath} --include="*.ts" --include="*.tsx" 2>/dev/null || true`,
      { encoding: 'utf-8', shell: true }
    )
    if (result.trim()) {
      console.log(`${RED}❌ VIOLATION: ${label}${RESET}`)
      console.log(result.trim())
      violations++
    } else {
      console.log(`${GREEN}✅ ${label}${RESET}`)
    }
  } catch {
    console.log(`${GREEN}✅ ${label}${RESET}`)
  }
}

console.log(`${YELLOW}╔═══════════════════════════════════════════════════╗${RESET}`)
console.log(`${YELLOW}║  VCT Platform — Architecture Boundary Checker    ║${RESET}`)
console.log(`${YELLOW}╚═══════════════════════════════════════════════════╝${RESET}`)
console.log()

// Rule F1: shared-types must not import other packages
check(
  'F1: shared-types không import packages khác',
  '@vct/app\\|@vct/ui\\|@vct/shared-utils',
  'packages/shared-types/src/'
)

// Rule F2: shared-utils must not import ui or app  
check(
  'F2: shared-utils không import ui hoặc app',
  '@vct/app\\|@vct/ui',
  'packages/shared-utils/src/'
)

// Rule F3: packages/ui must not import packages/app
check(
  'F3: packages/ui không import packages/app',
  '@vct/app\\|packages/app\\|features/',
  'packages/ui/src/'
)

// Rule F4 (partial): packages/app must not import from apps
check(
  'F4: packages/app không import từ apps/',
  'apps/next\\|apps/expo\\|next-app\\|expo-app',
  'packages/app/'
)

console.log()
if (violations > 0) {
  console.log(`${RED}══════════════════════════════════════════════════${RESET}`)
  console.log(`${RED}  ${violations} violation(s) found! Fix before committing.${RESET}`)
  console.log(`${RED}══════════════════════════════════════════════════${RESET}`)
  process.exit(1)
} else {
  console.log(`${GREEN}══════════════════════════════════════════════════${RESET}`)
  console.log(`${GREEN}  All package boundaries are clean!${RESET}`)
  console.log(`${GREEN}══════════════════════════════════════════════════${RESET}`)
}
