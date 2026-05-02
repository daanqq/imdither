# PRD Index

This is the navigation index for IMDITHER Product Requirements Documents.

The current product contract lives in [Product PRD](PRD.md). Feature PRDs are
subordinate historical or active contracts. Do not move a PRD only because its
feature shipped; update its status and keep this index current.

## Status Vocabulary

- `done` - implemented and reflected in the current product/code contract.
- `planned` - accepted planning artifact, not fully implemented.
- `ready-for-agent` - local issue-tracker PRD accepted for implementation.
- `needs-triage` - local issue-tracker PRD that still needs human or agent
  triage before promotion.
- `superseded` - retained historical PRD replaced by a newer planning artifact.

## Product Contract

| Status  | PRD                    | Scope                                               |
| ------- | ---------------------- | --------------------------------------------------- |
| current | [IMDITHER PRD](PRD.md) | Current product behavior and architecture contract. |

## Implemented Feature PRDs

| Status | PRD                                                                             | Scope                                                                     |
| ------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| done   | [Dither Algorithm Registry](dither-algorithm-registry/PRD.md)                   | Registry-driven algorithm metadata and UI options.                        |
| done   | [Editor Settings Transition Module](editor-settings-transition-module/PRD.md)   | Domain-safe settings transitions.                                         |
| done   | [Import and Processing Responsiveness](import-processing-responsiveness/PRD.md) | Source intake and preview processing responsiveness.                      |
| done   | [Editor Runtime Responsiveness](editor-runtime-responsiveness/PRD.md)           | Render boundaries and hot drag path protection.                           |
| done   | [Slide Before/After Preview](slide-before-after-preview/PRD.md)                 | Initial slide comparison behavior.                                        |
| done   | [Slide Compare Preview Module](slide-compare-preview-module/PRD.md)             | Dedicated slide compare surface module.                                   |
| done   | [Screen-Sized Preview](screen-sized-preview/PRD.md)                             | Fit View renders screen-sized previews instead of CSS-scaled Full Output. |
| done   | [Mobile Preview Gestures](mobile-preview-gestures/PRD.md)                       | Touch pinch and pan behavior for preview inspection.                      |
| done   | [Processing Presets](processing-presets/PRD.md)                                 | Curated processing recipes.                                               |
| done   | [Export Layer](export-layer/PRD.md)                                             | Browser-side export format and encoder behavior.                          |
| done   | [Preview Action Repartition](preview-action-repartition/PRD.md)                 | Preview-surface action ownership and export entry placement.              |
| done   | [Preview Presentation Module](preview-presentation-module/PRD.md)               | Pure preview presentation calculations and shell extraction.              |
| done   | [Preview Presentation Shell](preview-presentation-shell/PRD.md)                 | React shell, surface adapters, and interaction ownership.                 |
| done   | [Preview Cycle Module](preview-cycle-module/PRD.md)                             | Screen Preview target and Preview Job lifecycle hook seam.                |
| done   | [Auto-Tune Worker](auto-tune-worker/PRD.md)                                     | Worker-owned recommendation generation after first preview.               |
| done   | [Auto-Tune Quality Ranking](auto-tune-quality-ranking/PRD.md)                   | Deterministic recommendation quality ranking.                             |
| done   | [Auto-Tune Scoring Hardening](auto-tune-scoring-hardening/PRD.md)               | Dedicated scoring modules and scoring safeguards.                         |
| done   | [Auto-Tune Candidate Variants](auto-tune-candidate-variants/PRD.md)             | Bounded hidden candidate variant expansion.                               |
| done   | [Market Impact Roadmap Phase 0](market-impact-roadmap/phase-0/PRD.md)           | Public hardening baseline.                                                |
| done   | [Market Impact Roadmap Phase 1](market-impact-roadmap/phase-1/PRD.md)           | Palette platform MVP.                                                     |
| done   | [Phase 2.1 Color Quality](market-impact-roadmap/phase-2-color-quality/PRD.md)   | Color quality roadmap slice.                                              |
| done   | [Phase 2.2 Inspection UX](market-impact-roadmap/phase-2-inspection-ux/PRD.md)   | Inspection UX roadmap slice.                                              |
| done   | [Phase 3.1 History Core](market-impact-roadmap/phase-3-history-core/PRD.md)     | Settings History core.                                                    |
| done   | [Phase 3.2 Look Payloads](market-impact-roadmap/phase-3-look-payloads/PRD.md)   | Look Snapshot and Look Payload sharing.                                   |
| done   | [Phase 3.3 Auto-Tune](market-impact-roadmap/phase-3-auto-tune/PRD.md)           | Auto-Tune roadmap feature slice.                                          |

## Planned PRDs

| Status  | PRD                                                                   | Scope                                                 |
| ------- | --------------------------------------------------------------------- | ----------------------------------------------------- |
| planned | [Inspector Tabs Shell](inspector-tabs-shell/PRD.md)                   | Inspector tab shell structure.                        |
| planned | [Inspector Deep Editors](inspector-deep-editors/PRD.md)               | Deeper inspector editing controls.                    |
| planned | [Inspector Control Repartition](inspector-control-repartition/PRD.md) | Control ownership repartition across inspector areas. |
| planned | [Phase 4.1 Effect Stack Core](market-impact-roadmap/phase-4-effect-stack-core/PRD.md) | Serializable Effect Stack in Editor Settings. |
| planned | [Phase 4.2 Effect Stack UI](market-impact-roadmap/phase-4-effect-stack-ui/PRD.md) | Inspector Stack tab and stage editing workflow. |
| planned | [Phase 4.3 First Effects](market-impact-roadmap/phase-4-first-effects/PRD.md) | First deterministic pre and post effects. |

## Local Scratch PRDs

| Status     | PRD                                                                                       | Scope                                                                 |
| ---------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| done       | [Export Action Application](../.scratch/export-action-application/PRD.md)                 | Browser-side seam for applying an Export Action to editor runtime.    |
| done       | [Export Action Dependency Hardening](../.scratch/export-action-dependency-hardening/PRD.md) | Required Export Job dependency for loaded-source Export Actions.     |
| done       | [Source Intake Application Command](../.scratch/source-intake-application-command/PRD.md)   | Source Load Command and Runtime Adapter deepening.                   |
| done       | [App Shell Command Seams](../.scratch/app-shell-command-seams/PRD.md)                     | Clipboard Settings, Palette Action, Editor Settings Command, and Auto-Tune Apply applications. |
| done       | [Preview Viewport Interaction](../.scratch/preview-viewport-interaction/PRD.md)           | Session-style outcome module for Preview Viewport gesture policy.     |
| done       | [Preview Presentation Surface Interface](../.scratch/preview-presentation-surface-interface/PRD.md) | Narrower semantic surface interface for preview adapters.        |
| done       | [Preview Stage Shell Modules](../.scratch/preview-stage-shell-modules/PRD.md)             | Deep submodules for Preview Stage controls, drawer, action strip, overlays, and display measurement. |
| superseded | [Viewport Interaction Controller](../.scratch/viewport-interaction-controller/PRD.md)     | Replaced by Preview Viewport Interaction.                             |

## Maintenance Rules

- Add new feature PRDs to this index when they are created.
- Change `planned` to `done` only after implementation and verification.
- Keep `docs/PRD.md` aligned with implemented feature contracts.
- Keep `CONTEXT.md` aligned with domain terms introduced by implemented PRDs.
- Keep `.scratch/**/PRD.md` entries under "Local Scratch PRDs" until promoted.
