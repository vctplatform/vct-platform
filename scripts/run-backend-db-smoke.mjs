import assert from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const defaultBackendPath = 'backend'

const parseBackendPath = (argv) => {
  const index = argv.findIndex((arg) => arg === '--backend-path')
  if (index === -1) {
    return defaultBackendPath
  }
  return argv[index + 1] ?? ''
}

const printHelp = () => {
  process.stdout.write(
    [
      'Usage: node scripts/run-backend-db-smoke.mjs [--backend-path backend]',
      '',
      'Required environment:',
      '- VCT_POSTGRES_URL (or DATABASE_URL fallback)',
    ].join('\n')
  )
}

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  printHelp()
  process.exit(0)
}

const backendPath = parseBackendPath(process.argv.slice(2)).trim() || defaultBackendPath
const backendAbsPath = resolve(root, backendPath)
const backendGoMod = resolve(backendAbsPath, 'go.mod')
assert.ok(
  existsSync(backendGoMod),
  `Backend path is invalid or missing go.mod: ${backendPath}`
)

const dbURL =
  process.env.VCT_POSTGRES_URL?.trim() || process.env.DATABASE_URL?.trim() || ''
assert.ok(
  dbURL,
  'Missing database url: set VCT_POSTGRES_URL (or DATABASE_URL)'
)

const env = {
  ...process.env,
  VCT_POSTGRES_URL: dbURL,
}

const run = (label, command) => {
  process.stdout.write(`\n==> ${label}\n`)
  execSync(command, {
    cwd: root,
    stdio: 'inherit',
    env,
  })
}

run('Initial migration status', `go -C ${backendPath} run ./cmd/migrate status`)
run('Apply migrations', `go -C ${backendPath} run ./cmd/migrate up`)
run('Seed after up', `go -C ${backendPath} run ./cmd/migrate seed`)

run('Rollback latest migration', `go -C ${backendPath} run ./cmd/migrate down`)
run(
  'Seed after first rollback (relational seed should skip safely)',
  `go -C ${backendPath} run ./cmd/migrate seed`
)

run('Rollback base migration', `go -C ${backendPath} run ./cmd/migrate down`)
run(
  'Seed after second rollback (all seeds should skip safely)',
  `go -C ${backendPath} run ./cmd/migrate seed`
)

run('Re-apply migrations', `go -C ${backendPath} run ./cmd/migrate up`)
run('Seed after re-apply', `go -C ${backendPath} run ./cmd/migrate seed`)

process.stdout.write('\n==> Final migration status\n')
const finalStatus = execSync(`go -C ${backendPath} run ./cmd/migrate status`, {
  cwd: root,
  stdio: 'pipe',
  encoding: 'utf8',
  env,
})
process.stdout.write(`${finalStatus}\n`)

assert.match(
  finalStatus,
  /\[applied\]\s+0001_entity_records\.sql/,
  'Expected 0001_entity_records.sql to be applied at the end of smoke flow'
)
assert.match(
  finalStatus,
  /\[applied\]\s+0002_relational_schema\.sql/,
  'Expected 0002_relational_schema.sql to be applied at the end of smoke flow'
)

process.stdout.write('Backend DB smoke test passed\n')
