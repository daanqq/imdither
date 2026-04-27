# Inspector Tabs Shell PRD

Status: planned
Slice: 1 of 3
Last updated: 2026-04-27

## Problem Statement

The editor gained an Auto-Tune panel that sits above the existing controls. This makes the right-side desktop inspector tighter and makes the mobile controls hard or impossible to reach because the overall app shell is locked to the viewport and the Auto-Tune block is not part of a scrollable control flow.

From the user's perspective, Auto-Tune should help find a starting look, not take permanent vertical ownership of the workstation. Desktop users still need the single-screen image workstation, while mobile users need a control flow that can be reached and scrolled comfortably.

## Solution

Introduce a shared inspector shell built around shadcn tabs. The shell replaces the current `Auto-Tune above Controls` stack with a tabbed inspector model that works on desktop and mobile.

Desktop remains a single-screen workstation: preview stays dominant on the left, the inspector stays on the right, and tab content scrolls inside the inspector. Mobile becomes a scrollable workstation: preview stays first and tall enough to be useful, while the inspector below it exposes a sticky tab list and independently scrollable tab content.

The first slice focuses on shell, reachability, and scroll model. It does not fully repartition every control yet. The accepted top-level tabs are `Adjust`, `Looks`, `Palette`, and `Output`, with `Adjust` selected by default. In this slice, `Adjust` keeps the existing Control Panel intact, `Looks` contains Auto-Tune, and `Palette` and `Output` are visible but only show compact empty states until the repartition slice gives them control ownership.

## User Stories

1. As a mobile IMDITHER user, I want controls to remain reachable after Auto-Tune is added, so that I can keep editing on small screens.
2. As a mobile IMDITHER user, I want the control area to scroll, so that long inspector content does not become trapped below the viewport.
3. As a mobile IMDITHER user, I want the preview to remain first in the flow, so that I can see the image before changing settings.
4. As a mobile IMDITHER user, I want the preview to keep a practical height, so that it does not collapse into a tiny strip.
5. As a mobile IMDITHER user, I want tab navigation to remain visible while using controls, so that I can switch between editing areas without scrolling back to the top.
6. As a mobile IMDITHER user, I want tabs to live inside the inspector region, so that controls do not float over the image.
7. As a mobile IMDITHER user, I want Auto-Tune to stop blocking access to manual controls, so that generated looks do not prevent manual editing.
8. As a desktop IMDITHER user, I want the app to remain a single-screen workstation, so that preview and controls stay side by side.
9. As a desktop IMDITHER user, I want the preview to remain the dominant region, so that the image stays central to the workflow.
10. As a desktop IMDITHER user, I want inspector content to scroll internally, so that the full page does not move while I edit.
11. As a desktop IMDITHER user, I want the inspector to use the same conceptual tabs as mobile, so that the interface is predictable across devices.
12. As a desktop IMDITHER user, I want `Adjust` to open by default, so that daily tuning starts in the most common workspace.
13. As an IMDITHER user, I want `Looks` to be a clear place for Auto-Tune and recipe discovery, so that automated starting points are easy to find.
14. As an IMDITHER user, I want `Palette` to be a clear place for palette work, so that color choices are not mixed into every other section.
15. As an IMDITHER user, I want `Output` to be a clear place for output and export preferences, so that file decisions are separated from look tuning.
16. As an IMDITHER user, I want the shell to avoid huge permanent cards, so that the inspector feels like a tool surface rather than a stack of panels.
17. As an IMDITHER user, I want compact tab labels, so that navigation fits on mobile without horizontal page scroll.
18. As an IMDITHER user, I want tab content to preserve current control behavior, so that the first shell change does not change image processing semantics.
19. As an IMDITHER user, I want upload, preview, export, and editing state to continue working, so that layout work does not regress the existing editor.
20. As a maintainer, I want the shell to use shadcn components, so that it follows the existing UI system.
21. As a maintainer, I want the shell to avoid new global state unless needed, so that tab UI does not pollute processing settings.
22. As a maintainer, I want the tab choice to be UI state, so that Editor Settings remain focused on image processing.
23. As a maintainer, I want the scroll model to be explicit, so that future controls cannot accidentally become unreachable.
24. As a maintainer, I want desktop and mobile shell behavior covered by component tests where practical, so that reachability does not regress.
25. As a maintainer, I want the quality gate to pass after implementation, so that the shell change does not break existing behavior.

## Implementation Decisions

- Build a shared Inspector Shell as the top-level container for editor controls.
- Use shadcn Tabs as the primary navigation primitive.
- Add the Tabs component through the project's shadcn setup if it is not already present.
- Keep the icon library aligned with the project configuration.
- Use the accepted tabs: `Adjust`, `Looks`, `Palette`, and `Output`.
- Select `Adjust` by default.
- Keep the current Control Panel intact inside the `Adjust` tab in this slice so the shell can land before deeper repartitioning.
- Move Auto-Tune into the `Looks` tab in this slice without the compact recommendation redesign.
- Render `Palette` and `Output` as visible tabs with compact empty states, not hidden future tabs.
- Avoid duplicating controls into `Palette` or `Output` before the repartition slice.
- Keep existing image processing, settings transitions, preview jobs, source intake, export jobs, and settings persistence unchanged.
- Keep desktop as a fixed-height workstation with internal inspector scrolling.
- Make mobile a reachable scroll model with preview first and inspector below it.
- Avoid floating bottom controls over the preview.
- Keep the tab list sticky inside the mobile inspector area.
- Avoid `h-screen`; use dynamic viewport-safe sizing where a fixed viewport shell is still needed.
- Avoid page-level overflow traps on mobile.
- Do not introduce a router for this flow.
- Do not stage files.

## Testing Decisions

- Good tests should verify externally visible shell behavior and wiring, not private layout implementation details.
- Test that all four tabs render with stable labels.
- Test that `Adjust` is the default active tab.
- Test that switching tabs exposes the expected panel content.
- Test that `Palette` and `Output` are reachable tabs even before they own controls.
- Test that Auto-Tune is no longer rendered as a permanent block above the main control area.
- Test that existing callbacks still reach the underlying controls after being placed inside the shell.
- Test that tab state does not alter Editor Settings.
- Test that preview stage rendering remains independent from inspector tab switching.
- Existing Control Panel tests are prior art for callback wiring and settings transitions.
- Existing Auto-Tune Panel tests are prior art for source availability, loading, empty, error, and recommendation states.
- Existing Preview Stage tests are prior art for keeping preview actions behind callbacks.
- Run `bun verify` after implementation because this slice changes code.

## Out of Scope

- No full repartition of every control into final semantic tabs.
- No duplicated temporary controls in `Palette` or `Output`.
- No custom palette editor overlay.
- No Drawer or Sheet implementation.
- No recipe gallery redesign beyond placing Auto-Tune into the tabbed shell.
- No changes to dithering algorithms.
- No changes to palette semantics.
- No changes to Auto-Tune ranking.
- No changes to export encoding.
- No new route library.
- No backend or cloud behavior.

## Further Notes

This slice should solve the immediate usability failure first: controls must be reachable on mobile and the desktop inspector must stop being a vertical stack where Auto-Tune permanently consumes the top of the control column.

The shell should be conservative. It creates the structure that later slices can fill without rewriting the entire editor at once.
