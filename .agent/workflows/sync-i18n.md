---
description: Check and sync i18n translation keys between Vietnamese and English locales
---

## Steps

1. Find i18n locale files
```bash
Get-ChildItem -Path "packages" -Recurse -Include "vi.ts","en.ts" | Select-Object -ExpandProperty FullName
```

2. Extract keys from Vietnamese locale
```powershell
Select-String -Path (Get-ChildItem -Path "packages" -Recurse -Include "vi.ts" | Select-Object -First 1).FullName -Pattern "^\s+'([^']+)':" | ForEach-Object { $_.Matches[0].Groups[1].Value } | Sort-Object > $env:TEMP\vi_keys.txt
```

3. Extract keys from English locale
```powershell
Select-String -Path (Get-ChildItem -Path "packages" -Recurse -Include "en.ts" | Select-Object -First 1).FullName -Pattern "^\s+'([^']+)':" | ForEach-Object { $_.Matches[0].Groups[1].Value } | Sort-Object > $env:TEMP\en_keys.txt
```

4. Compare and find missing keys
```powershell
Compare-Object (Get-Content $env:TEMP\vi_keys.txt) (Get-Content $env:TEMP\en_keys.txt) | Format-Table -Property SideIndicator, InputObject
```

5. Review differences
- `<=` means key exists in Vietnamese but missing in English
- `=>` means key exists in English but missing in Vietnamese
- Add missing keys to the appropriate locale file
