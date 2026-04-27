# Inspector Deep Editors PRD

Status: planned
Slice: 3 of 3
Last updated: 2026-04-27

## Problem Statement

Even after controls are reachable and repartitioned, some workflows are too deep for the main inspector. Auto-Tune recommendation details and custom palette color editing can consume a large amount of vertical space. If they stay expanded inside the primary flow, the app risks recreating the original problem: discovery and deep editing crowd out daily controls.

From the user's perspective, Auto-Tune and custom palette editing should be easy to enter and exit. They should not permanently take over the inspector or make the mobile flow feel like one long form.

## Solution

Convert deep workflows into compact entry points with focused overlays or secondary panels.

Auto-Tune recommendations become a compact rail or grid inside `Looks`, with short labels, applied/recommended state, and concise chips. Detailed intent text moves behind an on-demand inline expansion, using a lightweight collapsible interaction rather than a Drawer. The `Auto` action stays visible in the `Looks` header, and applying a recommendation returns the user to a normal editing posture.

Custom Palette editing moves out of the main inspector content. The `Palette` tab shows palette selection, swatch summary, extraction/import/export entry points, and an `Edit colors` action. The color list, add/delete actions, hex inputs, and dense import/export operations open in a shadcn Drawer. Drawer is the single accepted overlay primitive for this editor on both desktop and mobile.

## User Stories

1. As an IMDITHER user, I want Auto-Tune recommendations to be compact, so that they do not consume the whole inspector.
2. As an IMDITHER user, I want the `Auto` action to remain easy to find, so that I can rerun recommendations quickly.
3. As an IMDITHER user, I want recommended and applied states to stay visible, so that I understand which look is active.
4. As an IMDITHER user, I want recommendation cards to show concise chips, so that I can compare algorithm, palette, and tone without reading long text.
5. As an IMDITHER user, I want recommendation details available on demand, so that I can inspect intent when needed.
6. As an IMDITHER user, I want applying a recommendation to preserve output dimensions, so that Auto-Tune does not surprise my export target.
7. As an IMDITHER user, I want applying a recommendation to leave me able to continue manual adjustments, so that Auto-Tune is a starting point, not a mode.
8. As a mobile IMDITHER user, I want recommendations in a rail or compact grid, so that Looks remains usable in a short viewport.
9. As a desktop IMDITHER user, I want the compact recommendation layout to fit the right inspector, so that desktop does not need a wider sidebar just for Auto-Tune.
10. As an IMDITHER user, I want the Palette tab to show a swatch summary, so that I can understand the active palette at a glance.
11. As an IMDITHER user, I want custom palette color editing to open in a focused overlay, so that dense color editing does not crowd normal controls.
12. As a mobile IMDITHER user, I want color editing to use a touch-friendly overlay, so that hex inputs and delete actions are reachable.
13. As a desktop IMDITHER user, I want color editing in a side overlay, so that I can edit colors while keeping preview context.
14. As an IMDITHER user, I want the overlay to have an accessible title, so that screen readers and keyboard navigation understand the panel.
15. As an IMDITHER user, I want the overlay to close without losing already committed palette changes, so that editing feels predictable.
16. As an IMDITHER user, I want palette extraction to remain quick from the Palette tab, so that creating a custom palette from the source image is not hidden.
17. As an IMDITHER user, I want palette import and export utilities to remain available, so that custom palette workflows stay complete.
18. As an IMDITHER user, I want the active custom palette to remain canonical settings data, so that exported looks and Settings JSON stay compatible.
19. As an IMDITHER user, I want deleting palette colors to remain disabled at the minimum valid color count, so that I cannot create invalid settings.
20. As an IMDITHER user, I want adding palette colors to respect the maximum valid color count, so that the UI stays inside supported limits.
21. As an IMDITHER user, I want invalid color input to be clear and local, so that palette editing errors do not feel like app-wide failures.
22. As a maintainer, I want overlay primitives to come from shadcn, so that accessibility and composition follow the project UI system.
23. As a maintainer, I want to avoid duplicating the palette editor's validation rules, so that UI and settings constraints cannot drift.
24. As a maintainer, I want Auto-Tune compact rendering to remain separate from recommendation generation, so that ranking logic stays in core.
25. As a maintainer, I want overlay state to stay UI-only, so that Editor Settings remain the processing contract.
26. As a maintainer, I want tests around recommendation and palette editor behavior, so that compact layouts do not hide broken actions.
27. As a maintainer, I want the quality gate to pass after implementation, so that deep editor changes do not regress existing flows.

## Implementation Decisions

- Treat this slice as a deep-workflow refinement after shell and repartitioning are complete.
- Use shadcn Drawer rather than custom modal markup or Sheet for the custom palette editor.
- Add Drawer through the project's shadcn setup if it is not already present.
- Add the required Drawer dependency, such as `vaul`, to the workspace package that owns shared UI primitives.
- Use Drawer as the single overlay primitive for the custom palette editor across desktop and mobile, with responsive sizing/direction where the primitive supports it.
- Give every overlay an accessible title.
- Keep Auto-Tune recommendations inside `Looks` as a compact rail or compact grid.
- Remove always-visible long recommendation intent copy from the primary recommendation item.
- Keep recommendation intent available through an on-demand inline collapsible detail interaction.
- Do not use Drawer for Auto-Tune recommendation details.
- Keep the `Auto` action in the `Looks` header.
- Preserve loading, empty, error, recommended, and applied states.
- Keep applying a recommendation routed through the existing Auto-Tune application path.
- Keep recipe identity derived from settings; do not persist Auto-Tune or recipe ids in Editor Settings.
- Keep `Palette` as the main palette workspace, but move dense custom color list editing into an overlay.
- Keep palette selection, swatches, extraction, and high-level import/export entry points visible in `Palette`.
- Preserve existing palette import, export, parsing, extraction, add, delete, and color draft behavior.
- Keep palette settings canonical as `paletteId` plus optional custom palette data.
- Avoid changing Settings JSON shape.
- Avoid changing Look payload shape.

## Testing Decisions

- Good tests should verify the user-facing behavior of compact recommendations and palette overlays.
- Test Auto-Tune empty, loading, error, recommendation, recommended, and applied states in compact form.
- Test that applying a compact recommendation calls the same apply handler as before.
- Test that recommendation details are available through the selected on-demand interaction.
- Test that recommendation details do not open the custom palette Drawer.
- Test that long recommendation intent text is not permanently rendered in the primary rail/grid item.
- Test that the Palette tab opens the custom palette editor overlay when requested.
- Test that the custom palette editor uses Drawer semantics rather than Sheet-specific composition.
- Test that the overlay has an accessible title.
- Test that add, edit, and delete color actions still call the expected palette transitions.
- Test minimum and maximum palette color constraints through visible disabled/action behavior.
- Test import, export, copy, and extract actions still call existing handlers from the new entry points.
- Test overlay open/close state without asserting private component internals.
- Existing Auto-Tune Panel tests are prior art for recommendation states and apply wiring.
- Existing Control Panel palette tests are prior art for palette editing, import, export, and extraction behavior.
- Existing shadcn composition rules are prior art for overlay accessibility requirements.
- Run `bun verify` after implementation because this slice changes code.

## Out of Scope

- No changes to Auto-Tune recommendation ranking.
- No changes to the candidate look list.
- No persistent Auto-Tune mode.
- No new palette file formats.
- No full palette library or saved palette collection.
- No undo history redesign.
- No batch color editing.
- No drag-and-drop color reordering unless already supported by existing controls.
- No new settings schema.
- No new sharing payload version.
- No backend storage.
- No route-level editor modes.

## Further Notes

This slice protects the new shell from future vertical bloat. Deep workflows should be easy to enter, but the default inspector should stay compact enough for mobile and focused enough for desktop.

The main product rule is that Auto-Tune and custom palette editing are tools inside the workstation, not permanent layout owners.
