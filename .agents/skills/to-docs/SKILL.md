---
name: to-docs
description: Updates product docs and glossary after a feature implementation so the repository contract matches the shipped behavior. Use when a feature, bug fix, refactor, or PRD-driven implementation is complete and the user wants docs, roadmap, README, PRD status, or ubiquitous language refreshed.
---

# To Docs

## Quick Start

After implementation, inspect the actual code diff and update only the docs whose contracts changed. Then use the `ubiquitous-language` skill workflow to refresh `UBIQUITOUS_LANGUAGE.md` with any new or changed domain terms.

## Workflow

1. **Inspect implementation**
   - Run `git status --short`.
   - Read the relevant diff with `git diff -- <paths>` or targeted file reads.
   - Identify the user-facing, domain, architecture, settings, export, workflow, and testing contracts that changed.
   - Do not rely only on the original plan if the implementation evolved.

2. **Choose docs to update**
   - Update feature PRDs when acceptance criteria, status, scope, or implementation decisions changed.
   - Update `docs/PRD.md` when current product behavior or non-goals changed.
   - Update README when install, usage, architecture, exported formats, or repo-facing claims changed.
   - Update roadmap docs when priority, sequencing, or shipped status changed.
   - Update architecture docs when module boundaries, data flow, workers, storage, or public contracts changed.
   - Leave unrelated docs untouched.

3. **Write docs from shipped behavior**
   - State what is now true, not what was hoped for.
   - Keep wording compact and operational.
   - Prefer stable domain terms over implementation nicknames.
   - Include exact option names, ids, limits, commands, and file paths when they are part of the contract.
   - Mark completed PRDs as `Status: done` and update `Last updated` when appropriate.
   - Keep non-goals honest if the implementation intentionally did not include adjacent features.

4. **Refresh ubiquitous language**
   - Load and follow the `ubiquitous-language` skill after doc updates.
   - Read the existing `UBIQUITOUS_LANGUAGE.md`.
   - Add new canonical terms introduced by the feature.
   - Update definitions whose meaning changed.
   - Flag ambiguous or overloaded wording found during implementation.
   - Keep glossary terms domain-focused; avoid listing generic class, function, or file names unless they are also product language.

5. **Verify**
   - For markdown-only updates, do not run the full code gate unless the repo instructions require it.
   - If code changed in the same turn and has not been verified yet, run the repository's standard verification command.
   - Re-check `git status --short`.
   - If files were already staged, do not unstage them.

## Documentation Checklist

- [ ] Docs describe current behavior, not stale intent.
- [ ] PRD status and dates are correct where touched.
- [ ] README claims still match the app.
- [ ] Roadmap items reflect completed or newly discovered work.
- [ ] Architecture boundaries match the code.
- [ ] `UBIQUITOUS_LANGUAGE.md` includes new domain terms and ambiguity notes.
- [ ] No unrelated docs were rewritten.
- [ ] Verification matched the type of change.

## Output

In the final response, summarize:

- docs updated
- glossary terms added or changed
- verification run or intentionally skipped
- any remaining docs risk or follow-up
