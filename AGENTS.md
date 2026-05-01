# Rules

1. Do not run `bun run dev` on your own, the maintainer is going to run it by himself.
2. Use `bun verify` to verify code quality after changes (except for markdown files).
3. If some files became staged, do not return them to unstaged mode. Do not stage any files.
4. If you've decided that a feature/refactor/task would require more than 1 slice, describe every slice's requirements in PRD for that feature/refactor/task
5. For work, state the outcome, acceptance criteria, allowed side effects, and verification evidence before making broad edits. Prefer repo-specific success criteria over step-by-step process prompts.
6. Keep migrations narrow: update active model strings and directly related prompts only. Leave historical docs, examples, eval baselines, low-cost fallbacks, and ambiguous model references unchanged unless the user explicitly asks to upgrade them.
7. Preserve existing reasoning, verbosity, structured-output, and tool schemas when they are already present.

## Agent skills

### Issue tracker

Issues and PRDs are tracked as local markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

The default five-role triage vocabulary is used: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: root `CONTEXT.md` plus root `docs/adr/` when present. See `docs/agents/domain.md`.
