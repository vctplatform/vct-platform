# App Assets

Required image assets for the Expo mobile app.
These are referenced by `app.json` configuration.

## Required Files

| File | Size | Purpose |
|------|------|---------|
| `icon.png` | 1024×1024 | App icon (iOS & Android) |
| `adaptive-icon.png` | 1024×1024 | Android adaptive icon foreground |
| `splash.png` | 1284×2778 | Splash screen |
| `favicon.png` | 48×48 | Web favicon |

## Guidelines

- **icon.png**: No transparency (iOS requirement). Keep logo in center 80%.
- **adaptive-icon.png**: Keep logo in inner 66% safe zone. Background set in `app.json` as `#0b1120`.
- **splash.png**: Use VCT branding with dark background `#0b1120`.
- **favicon.png**: Simple version of logo for browser tabs.

## Generating Assets

Use the VCT wing logo with the cyan accent color (`#0ea5e9`) on the dark background (`#0b1120`).

```bash
# After placing assets, verify with:
npx expo config --type public | grep -A2 icon
npx expo config --type public | grep -A4 splash
```
