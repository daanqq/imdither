# IMDITHER Design System Direction

Status: done
Last updated: 2026-04-26

## 1. Direction

IMDITHER should move from a dark-first Nothing-inspired interface toward a
light-first compact raster workstation.

The target mood is:

- old computer clarity
- early Mac document discipline
- CLI terseness without literal terminal cosplay
- dots, grids, raster marks, and measurement surfaces
- dense controls that leave room for a growing settings model

The core metaphor is:

> A raster proofing desk built by someone who likes old computers.

This is not a clone of the provided CLI/dotted UI references. The references
define mood, density, typography, and surface behavior. IMDITHER should develop
its own language around image proofing, raster inspection, and compact controls.

## 2. Product Fit

IMDITHER is a local image-processing workstation. The design system must support
one-screen work, repeated adjustment, visual comparison, and export. It should
prioritize the image and keep controls small, predictable, and scannable.

The interface should feel like a tool, not a landing page, dashboard, or
decorative retro website.

## 3. Reference Interpretation

Use the references for these qualities:

- CLI: terse language, visible state, fast command recognition
- old Mac: document-like surfaces, low-color discipline, clear control rhythm
- dots and grids: raster sampling, preview measurement, image-processing context
- old computer spec sheets: compact data layout, inverted labels, fixed-width rhythm
- modern compact tools: stable inspectors, compact rows, strong preview priority

Do not copy these literal patterns:

- bracket checkbox syntax as the main UI language
- full terminal navigation as the app shell
- dotted borders everywhere
- fake operating-system chrome
- decorative grid backgrounds unrelated to preview or measurement
- pure monochrome with no semantic hierarchy

## 4. Chosen Language

The working language is Raster Desk plus Proof Sheet.

Raster Desk gives the app a compact technical surface: settings behave like
calibration rows, not cards. Proof Sheet gives the preview a document/output
quality: marks, grids, metadata, and comparison affordances should feel tied to
image inspection.

The result should be:

- light theme by default
- compact but not cramped
- precise without becoming sterile
- retro-informed without becoming nostalgic UI cosplay
- distinctive without replacing the existing component foundation

## 5. Theme Principles

### Light Default

Light mode is the primary theme. It should use off-white and warm neutral paper
tones instead of pure white.

Target roles:

- app background: off-white work surface
- panel surface: slightly raised paper or instrument surface
- preview surface: functional grid/checker surface
- border: visible but quiet gray
- foreground: off-black, never pure black as a broad surface
- accent: one proof or signal color, used sparingly

### Dark Secondary

Dark mode should exist as a secondary terminal-like workstation mode, not as the
main product identity. It can take more cues from CLI status displays, but it
should keep the same layout and density rules.

### Accent

Use one accent color across the system. Prefer a proof/signal orange for the
light theme because it fits image proofing without becoming a terminal clone.

The accent should be used for:

- active compare handles
- selected segmented values
- focused high-value actions
- sparse processing/status marks
- destructive states only when mapped to a separate destructive token

The accent should not flood section headers, borders, or large backgrounds.

## 6. Typography

Typography should become more technical and compact, but not all text needs to
be mono.

Recommended roles:

- display: product mark, large numeric readouts, rare status moments
- UI: normal readable control text
- data: dimensions, values, algorithm metadata, palette labels, file details

Rules:

- use mono for numbers and dense data
- keep labels short and concrete
- avoid uppercase letter spacing that wastes width in dense controls
- avoid oversized headings inside panels
- reserve distinctive bitmap/dot display type for memorable moments only

## 7. Layout

The app should keep a one-screen workstation structure:

- preview remains the dominant region
- controls live in compact inspectors
- settings grow vertically in dense rows
- mobile collapses into a single-column flow without horizontal scroll
- no marketing-style hero or centered intro screen

Desktop layout should favor CSS Grid over fragile flex math. Main regions should
have stable dimensions so sliders, labels, status changes, and metadata do not
shift the layout.

## 8. Component Rules

Keep the current shadcn-based components, but restyle them through Tailwind v4
tokens and shared component rules.

### Buttons

- compact default height, roughly 30-36px
- rectangular or lightly rounded, not pill-shaped by default
- primary action may be stronger, but still tool-like
- icon buttons should be square and stable
- active press feedback should use transform or opacity, not layout movement

### Inputs and Selects

- compact height, roughly 30-34px
- strong text alignment and predictable value width
- no soft marketing-style fields
- labels above fields only where needed; dense rows may place label, control,
  and value on one line

### Sliders

- row-based: label, current value, control
- thin track
- stable value column
- no large vertical form spacing

### Cards and Panels

- avoid card stacks for main settings
- use sections, dividers, and inspector surfaces
- cards are allowed for framed tools, modals, repeated items, or preview-adjacent
  artifacts
- radius should be low, usually 0-6px
- borders and dividers should carry hierarchy instead of shadows

### Badges and Status

- small rectangular tags, not pills by default
- status text must not cause header or panel jitter
- processing states should be visible on the watched surface, not only in a badge

### Preview Surface

- grid, checker, dots, and ruler marks are allowed when they explain raster,
  scale, crop, comparison, or output
- preview should not become a decorative poster area
- comparison controls must remain clear at desktop and mobile sizes

## 9. Token Direction

The implementation should stay aligned with Tailwind CSS v4 and the current
CSS-first theme structure in `packages/ui/src/styles/globals.css`.

Use the existing semantic token names so current shadcn components keep working:

- `--background`
- `--foreground`
- `--card`
- `--popover`
- `--primary`
- `--secondary`
- `--muted`
- `--accent`
- `--destructive`
- `--border`
- `--input`
- `--ring`
- `--radius`

Add component-level custom tokens only when semantic tokens are too broad, for
example:

- `--surface-workbench`
- `--surface-inspector`
- `--surface-preview`
- `--grid-line`
- `--proof-accent`
- `--control-height`
- `--control-height-sm`
- `--panel-gutter`

Prefer OKLCH for new palette work if the color pass becomes large. For a narrow
first pass, hex values are acceptable if they remain mapped through semantic
tokens.

## 10. Density Targets

The visual density target is higher than a normal web app because settings will
grow.

Use these working numbers during implementation:

- app gutter: 8-16px depending on viewport
- inspector section gap: 10-14px
- dense row height: 28-34px
- default control height: 32px
- small control height: 28px
- panel radius: 0-6px
- main surface border: 1px
- no broad shadows in the main editor

Density should not reduce accessibility. Click and touch targets that are likely
to be used on mobile still need enough area, even if their visible chrome is
compact.

## 11. Interaction and Motion

Motion should be restrained and functional.

Allowed:

- hover and active feedback on controls
- opacity transitions for processing previews
- transform-only press feedback
- short CSS transitions for panels and status changes
- subtle processing indicators tied to the active preview or output state

Avoid:

- perpetual decorative motion
- animated grid backgrounds
- glow effects
- cursor tricks
- layout-changing animations
- React state loops for continuous motion

## 12. Implementation Scope

The first implementation pass should avoid rewriting product logic.

Recommended order:

1. update `packages/ui/src/styles/globals.css` tokens for light-default Raster
   Desk direction
2. lower shared component radius and control heights
3. restyle buttons, badges, cards, labels, fields, sliders, inputs, selects, and
   toggles through shared component rules
4. update app-level layout spacing in `apps/web/src/App.tsx`,
   `apps/web/src/components/control-panel.tsx`, and preview components only
   where global styling cannot express the design
5. verify responsive behavior and layout stability

Do not introduce a new component library. Keep the current shadcn/Radix component
foundation and make the design language live in tokens, shared primitives, and
small app-level layout adjustments.

## 13. Acceptance Criteria

The design system update is successful when:

- light theme feels primary and complete
- the app no longer reads as generic shadcn or Nothing-inspired
- controls are visibly more compact
- the settings panel can absorb more controls without feeling like a form page
- preview remains the main focus
- dots and grids feel tied to raster work, not decoration
- dark mode still works as a secondary mode
- no broad component rewrite was required
- `bun verify` passes
