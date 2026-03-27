# Changelog

## 0.2.0 (2026-03-27)

### Changed

- Split single `KirimEmailSmtp` node into two separate nodes:
  - **KirimEmail Validation** - Email validation operations (validate, validateStrict, validateBulk, validateBulkStrict)
  - **KirimEmail Quota** - Quota checking operation (get)
- Renamed credential from `KirimEmailSmtpApi` to `KirimEmailSmtpUserApi`

## 0.1.0 (2026-03-27)

- Initial release with combined `KirimEmailSmtp` node
