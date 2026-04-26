# Phase 3.2 PRD: Look Payloads

Status: done
Last updated: 2026-04-26

## Problem Statement

IMDITHER can copy and paste Settings JSON, but Settings JSON is a low-level
processing contract rather than a user-facing share artifact. Users need a
clear way to capture and share a repeatable look without exporting source image
data, transient UI state, or browser encoding preferences.

This feature also needs to prepare the contract that Auto-Tune can return later:
recommended looks should be the same kind of immutable payload that users can
copy, paste, and apply.

## Solution

Add immutable Look Snapshots and a shared URL-safe payload codec.

A Look Snapshot wraps normalized Editor Settings with light metadata: snapshot
schema version, app identity, kind identity, creation timestamp, and optional
name. It excludes source image data, source file name, compare mode, preview
viewport, export preferences, runtime metadata, status, notices, and recipe id.

The same payload format is used for clipboard and URL hash flows:
`#look=<payload>`. The payload is compact JSON, gzip-compressed with `fflate`,
and base64url encoded. Clipboard import accepts both a full URL containing the
look hash and a bare payload.

The slice exit criterion is that users can copy, paste, and URL-apply
repeatable looks while Settings JSON remains a separate processing-only
contract.

## User Stories

1. As an IMDITHER user, I want a Look Snapshot to capture the current processing
   look, so that I can reuse it later.
2. As an IMDITHER user, I want a Look Snapshot to include custom palette colors
   when active, so that palette-dependent output is reproducible.
3. As an IMDITHER user, I want a Look Snapshot to preserve color depth and
   matching mode, so that Phase 2 quality choices survive sharing.
4. As an IMDITHER user, I want a Look Snapshot to preserve output size and
   preprocessing settings, so that the visible processing result is repeatable.
5. As an IMDITHER user, I want a Look Snapshot to exclude source image data, so
   that sharing a look does not share private image content.
6. As an IMDITHER user, I want a Look Snapshot to exclude source file names, so
   that shared looks do not leak local file details.
7. As an IMDITHER user, I want a Look Snapshot to exclude compare mode, so that
   shared looks stay focused on processing.
8. As an IMDITHER user, I want a Look Snapshot to exclude zoom, pan, and
   pixel inspector state, so that shared looks do not move another user's
   workspace.
9. As an IMDITHER user, I want a Look Snapshot to exclude export format and
   export quality, so that browser encoding preferences remain independent.
10. As an IMDITHER user, I want a Look Snapshot to exclude runtime metadata, so
    that old processing timing and status are not mistaken for settings.
11. As an IMDITHER user, I want a Look Snapshot to exclude recipe id, so that
    recipes remain derived from actual settings.
12. As an IMDITHER user, I want Look Snapshots to validate before they apply, so
    that broken shared payloads do not corrupt the editor state.
13. As an IMDITHER user, I want copied looks to be clipboard-safe, so that I can
    send a repeatable look through chat or notes.
14. As an IMDITHER user, I want shared looks to be URL-safe, so that I can open
    an IMDITHER link that applies a look locally.
15. As an IMDITHER user, I want the app to accept a full URL or a bare look
    payload from clipboard, so that importing a shared look is forgiving.
16. As an IMDITHER user, I want look payloads in the URL hash, so that static
    hosting and local-first behavior stay simple.
17. As an IMDITHER user, I want importing a look from the URL to apply only
    processing settings, so that the current image remains local and unchanged.
18. As an IMDITHER user, I want importing a look to respect current source image
    aspect rules, so that applied output dimensions remain valid for the
    current source.
19. As an IMDITHER user, I want invalid look payloads to fail clearly, so that I
    know the link or clipboard text cannot be used.
20. As an IMDITHER user, I want Settings JSON copy and paste to remain
    available, so that the existing processing contract stays usable.
21. As an IMDITHER user, I want copied Settings JSON to remain focused on
    processing settings, so that it does not become a larger app-state export.
22. As an IMDITHER user, I want applying a shared look to be undoable, so that
    importing someone else's look is safe to try.
23. As a maintainer, I want Look Snapshot encoding and decoding in a pure module,
    so that share payload behavior is testable without React or browser APIs.
24. As a maintainer, I want the web app to own clipboard and URL wiring, so that
    browser APIs stay out of the core package.
25. As a maintainer, I want Look Snapshots to become the payload type used by
    future Auto-Tune recommendations, so that Phase 3 uses one look artifact.

## Implementation Decisions

- This is Phase 3 slice 2: `look-payloads`.
- This slice depends on `history-core` so applying a look can be undone.
- Look Snapshot is an immutable shareable artifact, not a second settings
  model.
- Look Snapshot versioning is separate from Editor Settings schema versioning.
- Look Snapshot contains a snapshot schema version, app identity, kind identity,
  creation timestamp, optional name, and normalized Editor Settings.
- Look Snapshot stores normalized Editor Settings schema version 2 as its
  processing payload.
- Look Snapshot excludes source image data, source file name, compare mode,
  preview viewport, export preferences, runtime metadata, job status, source
  notices, and recipe id.
- Recipe identity remains derived from settings and is not serialized in Look
  Snapshots.
- Look Snapshot decoding validates the wrapper and the nested Editor Settings
  before returning settings for application.
- Look payload transport uses a single compact URL-safe codec for clipboard and
  URL hash flows.
- The v1 payload codec stores a compact transport object with short keys:
  `f`, `v`, `k`, `t`, optional `n`, and `s`.
- The transport `s` field stores a diff from `DEFAULT_SETTINGS`; decoding
  normalizes that diff back into schema version 2 Editor Settings.
- The v1 payload codec gzip-compresses the compact JSON with `fflate` and then
  base64url encodes the compressed bytes.
- URL sharing uses the hash form `#look=<payload>` so static hosting and
  local-first behavior remain simple.
- URL look import applies once after a source image is available and clears the
  look hash with `history.replaceState` after successful application.
- Clipboard import accepts both a full URL containing a look hash and a bare
  payload.
- Visible web controls are separate actions: `Copy look`, `Paste look`, `Copy
settings`, and `Paste settings`.
- Applying a look uses the existing settings application transition and current
  source image context.
- Existing Settings JSON copy and paste remains separate from Look Snapshot
  copy and paste.
- Copied Settings JSON remains focused on processing settings and does not gain
  transient UI state.
- Pure look snapshot domain logic belongs in the core package so future package,
  CLI, or automation surfaces can reuse it.
- Browser clipboard, URL hash parsing, user notifications, and visible controls
  belong in the web app.

## Testing Decisions

- Good tests should assert payload compatibility and application behavior rather
  than implementation details of the encoder.
- Look Snapshot tests should verify valid snapshot creation from settings,
  nested settings normalization, payload encoding, payload decoding, wrapper
  version validation, app/kind validation, and invalid payload rejection.
- Look Snapshot tests should verify that transient UI state and recipe identity
  are excluded.
- Look Snapshot tests should verify that custom palettes, color depth, matching
  mode, output size, and preprocessing settings are preserved.
- Settings contract tests are prior art for public schema acceptance and
  rejection behavior.
- Palette codec tests are prior art for small pure JSON/text codecs.
- Store history tests are prior art for applying settings changes through public
  actions.
- Web clipboard and URL tests should verify that full URLs and bare payloads
  route to the same look application behavior where practical.
- Component tests, if added, should assert visible copy/paste affordances and
  emitted intents, not internal React state.

## Out of Scope

- No Auto-Tune analysis or recommendations.
- No persistent library of named user looks.
- No cloud sync, accounts, backend processing, or shared look catalog.
- No recipe marketplace.
- No custom recipe editor.
- No source image embedding in look payloads.
- No source file name embedding in look payloads.
- No export format or quality in Look Snapshots.
- No compare mode, zoom, pan, or pixel inspector state in Look Snapshots.
- No processing recipe id in Look Snapshots.
- No URL routing library.
- No live hash routing or continuous URL state sync.
- No new Editor Settings schema version.

## Further Notes

The core invariant is that a Look is still processing settings. This slice adds
a shareable wrapper around those settings, not a parallel state model.
