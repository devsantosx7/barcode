# Gating Map

This project previously enforced licensing through several checks and configuration keys. The community build removes these gates and enables all features by default.

## Removed verification points

- `app_src/common/license.js` originally loaded `config.json` and verified keys like `storage_next_charge_date` and `storage_monthly_scan_count` before enabling premium features. It now always returns `true` and exposes all feature flags.
- `bin/main.js` used `isLicensed()` to warn when running without a license and set feature flags accordingly. The community build imports the flags directly and forces developer mode on.
- `bin/config.js` contained license server endpoints (`URL_LICENSE_SERVER`, `URL_ORDER_CHECK`, etc.) and storage keys (`STORAGE_SERIAL`, `STORAGE_SUBSCRIPTION`, ...). These entries have been removed.
- Front‑end assets for activation (confetti scripts and activation translations) were deleted from `bin/www`.

## Feature flags

With the checks removed, the following flags are always enabled:

- `outputToExcelEnabled`
- `appendCSVEnabled`
- `maxScanSessionsNumber` (unlimited)

No configuration is required to access previously restricted functionality.
