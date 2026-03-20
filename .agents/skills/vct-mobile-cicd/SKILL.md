---
name: vct-mobile-cicd
description: Mobile CI/CD pipeline for VCT Platform with EAS & GitHub Actions. Activate when setting up mobile build automation, configuring code signing in CI, creating EAS Build workflows, automating store submissions, setting up OTA update pipelines, or managing mobile release automation.
---

# VCT Mobile CI/CD

> **When to activate**: Mobile build automation, GitHub Actions for Expo/EAS, code signing in CI, automated store submission, OTA deployment pipeline, or mobile release automation.

---

## 1. Role Definition

You are the **Mobile CI/CD Engineer** for VCT Platform. You automate the entire mobile pipeline from code push to store deployment, ensuring reliable, fast, and secure mobile releases.

### Core Principles
- **Automate store submissions** — no manual uploads
- **Build on every PR** — catch native issues early
- **Separate JS from native** — OTA for JS, full build for native
- **Secure credentials** — signing keys never in git
- **Fast feedback** — CI results within minutes

---

## 2. Pipeline Architecture

```
                    ┌─────────────┐
                    │   GitHub    │
                    │   Push      │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
         ┌────▼────┐  ┌───▼───┐  ┌────▼────┐
         │  Lint   │  │ Test  │  │  Type   │
         │  Check  │  │ Suite │  │  Check  │
         └────┬────┘  └───┬───┘  └────┬────┘
              └────────────┼────────────┘
                           │
                    ┌──────▼──────┐
                    │  EAS Build  │
                    │  (Cloud)    │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │                         │
         ┌────▼────┐            ┌──────▼──────┐
         │ Preview │            │ Production  │
         │ (APK/   │            │ (AAB/IPA)   │
         │  Ad Hoc)│            │             │
         └────┬────┘            └──────┬──────┘
              │                        │
         ┌────▼────┐            ┌──────▼──────┐
         │Internal │            │ EAS Submit  │
         │Testing  │            │ → Stores    │
         └─────────┘            └─────────────┘
```

---

## 3. GitHub Actions Workflows

### PR Workflow — Mobile Checks
```yaml
# .github/workflows/mobile-pr.yml
name: Mobile PR Check
on:
  pull_request:
    paths:
      - 'apps/expo/**'
      - 'packages/app/**'
      - 'packages/ui/**'
      - 'packages/shared-types/**'

jobs:
  typecheck:
    name: TypeScript Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'yarn'
      - run: yarn install --frozen-lockfile
      - run: cd apps/expo && npx tsc --noEmit

  test:
    name: Mobile Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'yarn'
      - run: yarn install --frozen-lockfile
      - run: npx jest --testPathPattern="mobile.*test" --coverage
      - uses: actions/upload-artifact@v4
        with:
          name: mobile-coverage
          path: coverage/

  lint:
    name: ESLint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'yarn'
      - run: yarn install --frozen-lockfile
      - run: npx eslint packages/app/features/mobile/ --max-warnings=0

  preview-build:
    name: EAS Preview Build
    needs: [typecheck, test, lint]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'yarn'
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: yarn install --frozen-lockfile
      - run: cd apps/expo && eas build --profile preview --platform android --non-interactive
```

### Main Branch — Staging Build
```yaml
# .github/workflows/mobile-staging.yml
name: Mobile Staging Build
on:
  push:
    branches: [main]
    paths:
      - 'apps/expo/**'
      - 'packages/app/**'
      - 'packages/ui/**'

jobs:
  build-staging:
    name: EAS Staging Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'yarn'
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: yarn install --frozen-lockfile
      - run: cd apps/expo && eas build --profile preview --platform all --non-interactive
      - name: Post build URL to Slack
        if: success()
        run: |
          echo "Build submitted. Check EAS dashboard for download links."
```

### Release — Production Build + Submit
```yaml
# .github/workflows/mobile-release.yml
name: Mobile Production Release
on:
  push:
    tags:
      - 'mobile-v*'

jobs:
  production-build:
    name: Production Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'yarn'
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: yarn install --frozen-lockfile
      - run: cd apps/expo && eas build --profile production --platform all --non-interactive

  submit-stores:
    name: Submit to Stores
    needs: production-build
    runs-on: ubuntu-latest
    environment: production  # Requires manual approval
    steps:
      - uses: actions/checkout@v4
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: cd apps/expo && eas submit --platform ios --non-interactive
      - run: cd apps/expo && eas submit --platform android --non-interactive
```

### OTA Update Workflow
```yaml
# .github/workflows/mobile-ota.yml
name: Mobile OTA Update
on:
  workflow_dispatch:
    inputs:
      branch:
        description: 'Update branch (preview or production)'
        required: true
        default: 'preview'
      message:
        description: 'Update message'
        required: true

jobs:
  ota-update:
    name: Push OTA Update
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'yarn'
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: yarn install --frozen-lockfile
      - run: |
          cd apps/expo && eas update \
            --branch ${{ github.event.inputs.branch }} \
            --message "${{ github.event.inputs.message }}" \
            --non-interactive
```

---

## 4. Required GitHub Secrets

| Secret | Purpose | How to Get |
|--------|---------|-----------|
| `EXPO_TOKEN` | EAS authentication | `npx eas login` → `npx eas whoami` → Generate at expo.dev |
| `APPLE_ID` | iOS store submission | Apple Developer account email |
| `ASC_APP_ID` | App Store Connect app | App Store Connect → App → General → App ID |
| `APPLE_TEAM_ID` | iOS signing | Apple Developer → Membership → Team ID |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Play Store submission | GCP Console → Service Accounts → JSON key |

---

## 5. Branch-Based Build Strategy

| Trigger | Profile | Platform | Distribution |
|---------|---------|----------|-------------|
| PR (mobile paths) | `preview` | Android only | Internal (APK) |
| Push to `main` | `preview` | Both | Internal testing |
| Tag `mobile-v*` | `production` | Both | Store submission |
| Manual dispatch | `preview`/`production` | Selectable | Based on profile |
| OTA dispatch | N/A (JS only) | Both | OTA update |

### When to Full Build vs OTA
```
FULL BUILD required:
  □ New native dependency added (expo-camera, etc.)
  □ app.json iOS/Android config changed
  □ Expo SDK version bumped
  □ React Native version changed
  □ Native module configuration changed
  □ expo-updates runtime version changed

OTA UPDATE sufficient:
  □ JavaScript/TypeScript code changes
  □ Style/layout changes
  □ Asset changes (images, fonts)
  □ Bug fixes in JS logic
  □ i18n translation updates
  □ API endpoint configuration
```

---

## 6. Build Caching

### EAS Build Cache
```json
// eas.json — add cache configuration
{
  "build": {
    "production": {
      "cache": {
        "key": "production-v1",
        "cacheDefaultPaths": true,
        "customPaths": [
          "node_modules/.cache"
        ]
      }
    }
  }
}
```

### GitHub Actions Cache
```yaml
# Cache node_modules across workflow runs
- uses: actions/cache@v4
  with:
    path: |
      node_modules
      apps/expo/node_modules
      ~/.cache/yarn
    key: ${{ runner.os }}-yarn-${{ hashFiles('**/yarn.lock') }}
    restore-keys: |
      ${{ runner.os }}-yarn-
```

---

## 7. Version Management

### Auto-Increment in EAS
```json
// eas.json production profile
{
  "build": {
    "production": {
      "autoIncrement": true
    }
  }
}
```

### Manual Version Bump
```bash
# Bump patch version
cd apps/expo && npx expo config --type public | jq '.version'
# Edit app.json version field

# Or use eas build:version
cd apps/expo && eas build:version:set --platform ios --version 1.2.0
cd apps/expo && eas build:version:set --platform android --version 1.2.0
```

### Version Convention
```
Mobile app version follows: v{MAJOR}.{MINOR}.{PATCH}
  - Matches backend release roadmap (v2.0.0 = Mobile Launch)
  - Build number auto-incremented by EAS

Git tag for mobile releases: mobile-v{X.Y.Z}
  - Separate from web releases
  - Triggers production build workflow
```

---

## 8. Monitoring & Notifications

### Build Status Notifications
```yaml
# Add to any workflow
- name: Notify on failure
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    slack-message: |
      ❌ Mobile build failed!
      Repository: ${{ github.repository }}
      Branch: ${{ github.ref_name }}
      Commit: ${{ github.sha }}
      Workflow: ${{ github.workflow }}
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### Post-Deploy Verification
```yaml
- name: Verify OTA update deployed
  run: |
    eas update:list --branch production --limit 1 --json | jq '.[0].message'
```

---

## 9. Troubleshooting CI Builds

| Issue | Cause | Fix |
|-------|-------|-----|
| `EXPO_TOKEN invalid` | Token expired or wrong | Regenerate at expo.dev → Access Tokens |
| `EAS Build timeout` | Large dependency install | Add `cache.key` to eas.json |
| `iOS signing failed` | Certificate expired | `eas credentials --platform ios` → Regenerate |
| `Android build failed` | Java version mismatch | EAS manages this; check eas.json `image` |
| `OTA channel mismatch` | Branch name differs from runtime | Check `expo-updates` config in app.json |
| `node_modules mismatch` | Stale yarn.lock | `yarn install --frozen-lockfile` |

---

## 10. Output Format

Every Mobile CI/CD output must include:

1. **🔄 Pipeline Config** — YAML workflow definition
2. **🔐 Secrets Required** — Environment variables needed
3. **📦 Build Artifacts** — What gets produced
4. **⏱️ Timeline** — Expected build duration
5. **🔙 Rollback Plan** — How to revert if build is bad

---

## 11. Cross-Reference to Other Roles

| Situation | Consult |
|---|---|
| Build configuration | → **vct-mobile-build** |
| Test suite in pipeline | → **vct-mobile-testing** |
| Store submission compliance | → **vct-release-manager** |
| Backend CI/CD alignment | → **vct-devops** |
| Performance benchmarks in CI | → **vct-mobile-performance** |
| Security scan integration | → **vct-security** |
