# Phase 5.3 PRD: Halftone Screen Controls

Status: implemented
Last updated: 2026-05-03

## Problem Statement

IMDITHER has a `halftone-dot` Dither Algorithm, but halftone output is currently
a fixed pattern rather than a controllable print-like screen. The roadmap calls
for dot shape, angle, frequency, pattern size, and possible pseudo-CMYK or
channel-separated screening. Those controls are settings and workflow work, not
just more Dither Algorithm Ids.

## Solution

Introduce Halftone Screen controls as settings-backed parameters for halftone
screening. Keep `halftone-dot` as the stable Dither Algorithm Id while evolving
screen behavior through a separate settings object.

The first Halftone Screen controls cover dot shape, angle, frequency, and
pattern size. Pseudo-CMYK or channel-separated screening is explored as an
advanced print mode and ships only if it remains deterministic and clear.

## User Stories

1. As a visual maker, I want to change halftone dot shape, so that the print
   texture matches the look I am building.
2. As a visual maker, I want to rotate the Halftone Screen angle, so that I can
   control visible screen direction.
3. As a visual maker, I want to tune screen frequency, so that halftone texture
   can be coarse or fine.
4. As a visual maker, I want to tune pattern size, so that screen structure can
   match output scale.
5. As a visual maker, I want halftone controls near algorithm controls, so that
   selecting Halftone reveals relevant parameters without crowding other modes.
6. As a user sharing looks, I want Halftone Screen settings to copy through
   Settings JSON and Look Payloads, so that print-like looks are repeatable.
7. As a user with old looks, I want existing `halftone-dot` settings to keep
   working, so that fixed halftone output remains compatible.
8. As a maintainer, I want screen parameters separate from Dither Algorithm Ids,
   so that the algorithm selector stays clean.
9. As a maintainer, I want deterministic halftone fixtures, so that changes to
   screen math do not silently drift.
10. As an advanced user, I want pseudo-CMYK or channel-separated screening
    evaluated, so that IMDITHER can support stronger print aesthetics if the
    model stays understandable.

## Implementation Decisions

- Halftone Screen is the canonical domain term for print-like screening
  parameters.
- `halftone-dot` remains the stable Dither Algorithm Id.
- Dot shape, angle, frequency, and pattern size are settings parameters, not
  separate algorithm ids.
- A later settings schema bump is allowed if the screen parameters become part
  of Editor Settings.
- Existing halftone behavior must normalize into default Halftone Screen
  settings.
- Controls should appear only when a Halftone family algorithm is selected.
- Pseudo-CMYK or channel-separated screening is an advanced mode candidate, not
  mandatory first-slice behavior.
- No imported texture images or binary screen assets are introduced.

## Testing Decisions

- Good tests verify output behavior for changed screen parameters and
  compatibility for old halftone settings.
- Settings contract tests verify defaulting, validation, and round trip through
  Settings JSON and Look Payloads.
- Process tests verify dot shape, angle, frequency, and pattern size affect
  output deterministically.
- Component tests verify Halftone Screen controls appear only for Halftone
  family algorithms.
- Golden or visual contract fixtures cover at least one default halftone screen
  and one non-default screen.
- Prior art exists in settings contract tests, process tests, process golden
  tests, Control Panel tests, Manual tab tests, and Look Snapshot tests.

## Out of Scope

- No new algorithm ids for every dot shape or screen mode.
- No full print-production color-management system.
- No imported texture files.
- No animation, motion, or temporal halftone controls.
- No GPU, WASM, or WebGL screen renderer.
- No Auto-Tune or recipe updates unless a later PRD chooses them.

## Further Notes

This slice changed Editor Settings to schema version 4 by adding
`halftoneScreen`. Pseudo-CMYK or channel-separated screening remains a future
advanced print-mode exploration and is not part of the shipped MVP.
