# Export Action Dependency Hardening PRD

Status: done

## Problem Statement

Export Action Application is now the browser-side seam for applying an Export
Action, but the seam must not allow a loaded-source Export Action to become a
silent no-op because an implementation dependency was omitted.

From the user's perspective, pressing Export with a current Source Image should
either produce an Export File or show an explicit error. The only accepted safe
no-op is an Export Action without a current Source Image, because the UI normally
disables that path.

From the maintainer's perspective, a missing Export Job adapter is a wiring
mistake, not domain behavior. The module interface should make that mistake hard
to express and easy to catch in tests.

## Solution

Harden Export Action Application so a current-source Export Action requires an
Export Job dependency. The module should preserve the accepted no-source no-op,
then run the normal Export Action flow for loaded sources.

The desired contract is narrow:

- no Source Image: no-op with no status, error, metadata, job, encoder, or
  download side effects
- Source Image present: Export Job dependency is required
- Export Job failure: error state, no Browser Encoder, no download, no metadata
- Browser Encoder failure: error state, no download, no metadata
- success: exporting status, Export Job, Browser Encoder, Export File download,
  metadata with selected Export Format label, clear error, ready status

## User Stories

1. As an IMDITHER user, I want Export to never fail silently when a Source Image
   exists, so that I can trust the Export button.
2. As an IMDITHER user, I want an unavailable export implementation to surface as
   an error, so that I know why no Export File was produced.
3. As an IMDITHER user, I want Export without a Source Image to remain quiet, so
   that disabled UI paths do not create noisy global errors.
4. As an IMDITHER user, I want successful Export Actions to keep downloading the
   selected Export Format, so that existing PNG, WebP, and JPEG behavior is
   unchanged.
5. As an IMDITHER user, I want Encoder Failures to remain explicit, so that
   browser export problems are visible.
6. As a maintainer, I want Export Action Application dependencies to be explicit,
   so that wiring mistakes are caught by type checking or tests.
7. As a maintainer, I want no-source no-op behavior tested separately from
   missing dependency behavior, so that the two concepts cannot drift together.
8. As a maintainer, I want Export Job and Browser Encoder dependencies to remain
   injectable, so that Export Action Application tests stay DOM-free.
9. As a maintainer, I want the module interface to preserve the deep seam, so
   that App Shell does not regain Export Action ordering.
10. As a maintainer, I want the App Shell to pass the real Export Job adapter, so
    that production export remains wired through the processing worker.
11. As a maintainer, I want test coverage for missing or invalid Export Job
    wiring where type-level protection is not enough, so that runtime refactors
    fail loudly.
12. As a maintainer, I want export metadata unchanged on failure, so that failed
    exports do not claim a successful last Export Format.

## Implementation Decisions

- Keep Export Action Application as the owner of Export Action orchestration.
- Keep the existing Export Layer as the Browser Encoder and Export Format helper
  module.
- Keep no-source Export Action as the only safe no-op.
- Make the Export Job dependency required at the Export Action Application
  interface for any loaded-source path.
- Preserve Browser Encoder injection for tests while defaulting to the real
  Browser Encoder in production.
- Do not move Export Job execution into the Export Layer.
- Do not change Export Format, Export Quality, filename, metadata, or download
  behavior.
- Do not change the shared Job Status model.
- Do not add Browser MIME fallback detection in this slice.

## Testing Decisions

- Good tests should assert module behavior through Export Action Application's
  public interface, not internal helper calls.
- Test no Source Image no-op explicitly.
- Test loaded Source Image success with injected Export Job and Browser Encoder.
- Test Export Job failure skips Browser Encoder, download, and metadata.
- Test Browser Encoder failure skips download and metadata.
- Test the missing-dependency contract if it can still be represented at
  runtime; otherwise rely on type-level protection and App Shell wiring tests.
- Test App Shell wiring only enough to ensure the real Export Job adapter is
  supplied to Export Action Application.
- Existing Export Action Application tests are prior art for command plus runtime
  adapter shape.
- Existing Export Layer tests are prior art for Browser Encoder behavior.
- Run `bun check` after implementation.

## Out of Scope

- Adding new Export Formats.
- Changing Export Drawer UI.
- Changing Browser Encoder internals.
- Adding MIME fallback detection.
- Splitting preview and export into separate status models.
- Changing Export Job protocol or Processing Jobs behavior.
- Changing Settings JSON, Look Payload, Export Preferences, or persistence.

## Further Notes

This is a small hardening PRD. If the working tree already makes the Export Job
dependency required, implementation may only need tests and acceptance
verification.
