---
description: Manage a new version release — version bump, changelog, tag, and deploy
---

## Steps

1. Check current version and recent changes
```bash
git log --oneline -20
```

2. Review unreleased changes since last tag
```bash
git log $(git describe --tags --abbrev=0)..HEAD --oneline
```

3. Update CHANGELOG.md with new version section
- Group changes by: Added, Changed, Fixed, Removed
- Follow Keep a Changelog format

4. Bump version in package.json
```bash
npm version patch
```
> Use `patch` for bugfixes, `minor` for features, `major` for breaking changes

5. Create git tag
```bash
git tag -a v$(node -p "require('./package.json').version") -m "Release v$(node -p "require('./package.json').version")"
```

6. Run full health check before push
```bash
cd backend && go build ./... && go vet ./... && go test ./... -count=1 -short
```

7. TypeScript verification
```bash
npx tsc --noEmit
```

8. Push with tags
```bash
git push && git push --tags
```

9. (Optional) Create GitHub Release
- Go to GitHub Releases page
- Select the new tag
- Copy changelog section as release notes
- Mark as pre-release if not production-ready
