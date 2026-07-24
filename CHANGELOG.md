# Changelog

## 1.17.1 - 2026-07-24

### Fixed

- Prevented duplicate `retry`, `resetTask`, and `resize` EventDispatcher
  listener registration after repeated resets.

### Added

- Added reproducible production-build and artifact verification.
- Added H5P runtime contract tests covering public registration, prototype
  composition, EventDispatcher behavior, xAPI helpers, attach, and reset.
- Added manual regression-suite documentation and a representative H5P
  regression fixture.

### Changed

- Documented editable source files, generated artifacts, test usage, and the
  modernization checkpoints.
- Removed an obsolete top-level stylesheet copy.

### Compatibility

- Requires H5P Core API 1.28.
- Tested successfully on current WordPress and Moodle installations supporting
  H5P Core API 1.28.
- Current Lumi releases are not supported because they do not yet provide H5P
  Core API 1.28. This is a host-platform compatibility limitation, not a
  defect in this release.

### Known tooling baseline

- Stylelint reports 58 pre-existing CSS errors. No rules are disabled and the
  CSS is unchanged for this release. This debt is deferred to a future
  modernization phase requiring focused visual and behavioral regression
  testing.
