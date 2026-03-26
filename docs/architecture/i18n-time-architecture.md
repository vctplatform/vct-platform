# VCT Platform Time, i18n & Localization Architecture

This document outlines localization rules, guaranteeing that the platform can seamlessly support international tournaments, multiple timezones, and seamless multi-language translation without severe codebase rewrites.

## 1. The UTC-Zero Rule (Database & Server)
- **Absolute Time Law**: All `TIMESTAMP` values stored in PostgreSQL MUST use `TIMESTAMPTZ` (Timestamp with Time Zone) and MUST exclusively be saved in `UTC-0`.
- **Backend Time**: Go struct fields for datetime MUST only ever hold UTC values (`time.Now().UTC()`).
- **No Local Server Time**: The Go backend logic MUST NEVER assume that the server it runs on is located in the `Asia/Ho_Chi_Minh` timezone. Any offset calculation happens on the edge.

## 2. Client-Side Time Localization
- **UI Responsibility**: The React Native and Next.js applications receive `ISO-8601` UTC strings (e.g., `2026-03-26T07:12:00Z`). It is the absolute responsibility of the Frontend/Client UI to format this time into the user's localized timezone (`Asia/Ho_Chi_Minh` for VN users).

## 3. Ban on Hardcoded UI Strings (i18n)
- **No Static Text**: Hardcoding Vietnamese strings like `<div>Đăng ký thi đấu</div>` directly into `.tsx` components is BANNED.
- **i18n Dictionaries**: Developers MUST use the designated internationalization hook (e.g., `const { t } = useI18n()`) to inject text. 

## 4. Currency and Unit Formatting
- **Currency**: `VND` does not have decimal/cents formatting, whereas `USD` and `EUR` do. Financial displays MUST utilize `Intl.NumberFormat` in the browser or an equivalent highly robust locale formatter on mobile, leveraging the user's `Locale` context, avoiding manual string concatenation like `price + " VNĐ"`.
