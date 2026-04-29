---
name: imdither-flow
description: Guides IMDITHER repo work through PRD-first slicing, TDD implementation, docs sync, glossary sync, and verification. Use when working in /home/daanqq/imdither on product features, UI changes, architecture changes, bug fixes with unclear scope, roadmap work, or repo workflow changes.
---

# IMDITHER Development Flow

## Quick Start

Use this skill for work in `/home/daanqq/imdither`. Deliver the requested change as a repo-backed artifact or verified code change while preserving the current IMDITHER contract.

Before broad edits, state:

- outcome
- acceptance criteria
- allowed side effects
- verification evidence

## Product Contract

Preserve these defaults unless an accepted PRD explicitly widens scope:

- local-only, browser-first image processing
- dark-first, dense workstation UI
- single-screen editor
- DOM-free `packages/core` processing engine
- web-only source intake, preview, export, and worker orchestration in `apps/web`
- public docs for shipped behavior

## Workflow

1. Classify scope.
   - Tiny bug or copy/doc fix: make the narrow change directly.
   - Ambiguous product behavior: converge first, then write a PRD.
   - Feature/refactor requiring more than one slice: write every slice requirement in the PRD before implementation.
   - Roadmap or architecture work: read current docs and live files before relying on older memory.

2. Use the right repo contract.
   - Root product contract: `docs/PRD.md`
   - Roadmap: `docs/market-impact-roadmap/ROADMAP.md`
   - Feature contracts: `docs/<feature-or-slice>/PRD.md`
   - Domain language: `UBIQUITOUS_LANGUAGE.md`
   - Agent rules: `AGENTS.md`

3. Keep boundaries intact.
   - Put deterministic processing policy in `packages/core`.
   - Keep React components focused on user intent and presentation.
   - Route settings changes through Settings Transition helpers.
   - Keep Source Intake separate from preview jobs and export jobs.
   - Keep export preferences out of `EditorSettings`.
   - Keep runtime-only samples, worker caches, UI state, and notices out of persisted settings and Look Payloads.

4. Implement slice by slice.
   - For `$tdd`, start red-green-refactor from the PRD.
   - Add focused tests where behavior changes.
   - Avoid broad refactors unless the PRD accepts them.
   - Preserve existing reasoning, verbosity, structured-output, and tool schemas.
   - Do not upgrade ambiguous model references or historical examples during unrelated work.

5. Design UI in the local style.
   - Use shadcn primitives already present in the repo.
   - Keep the workstation compact and information-dense.
   - Put preview-owned controls on the preview surface.
   - Put output-forming controls such as Width, Resize Kernel, and Alpha Flatten under Adjust.
   - Keep Export visible near preview and put format/quality details in the Export Drawer.
   - Keep Undo and Redo visible in the preview action row unless explicitly removed.

6. Sync docs after shipped behavior changes.
   - Update feature PRD status or requirements when implementation changes the contract.
   - Update `docs/PRD.md` when current product behavior changes.
   - Update `UBIQUITOUS_LANGUAGE.md` when canonical terms change.
   - Keep docs compact and README-friendly.

7. Verify.
   - Run `bun verify` after code changes.
   - Skip `bun verify` for markdown-only changes unless the user asks.
   - Do not run `bun run dev`.
   - Report verification command and result.

## Repository Defaults

- Package manager: Bun.
- Quality gate: `bun verify`.
- Core engine: `packages/core`.
- Web app: `apps/web`.
- UI package: `packages/ui`.
- Settings source of truth: `packages/core/src/settings.ts`.
- Algorithm registry source of truth: `packages/core/src/algorithm-registry.ts`.
- Processing presets source of truth: `packages/core/src/processing-presets.ts`.

## Guardrails

- Do not stage files.
- Do not unstage files that were already staged.
- Do not run `bun run dev`.
- Do not silently downscale oversized sources.
- Do not persist recipe identity, Auto-Tune state, preview viewport state, export format, or export quality in `EditorSettings`.
- Do not turn IMDITHER into a generic photo editor.
- Do not add backend processing, accounts, cloud sync, batch processing, router, GPU/WebGPU pipeline, or motion export unless an accepted PRD explicitly widens scope.

## Final Response

For implementation work, finish with changed files, verification evidence, and known limits or skipped verification.

For planning work, finish with PRD path, slice list, acceptance criteria, and open decisions.
