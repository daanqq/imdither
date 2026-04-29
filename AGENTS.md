# Rules

1. Do not run `bun run dev` on your own, the maintainer is going to run it by himself.
2. Use `bun check` to verify code quality after changes (except for markdown files). Use `bun verify` only when a full build pass is needed or when the change touches build-sensitive code. If a watch build is already running, do not rerun `build` just to duplicate that coverage.
3. If some files became staged, do not return them to unstaged mode. Do not stage any files.
4. If you've decided that a feature/refactor/task would require more than 1 slice, describe every slice's requirements in PRD for that feature/refactor/task
5. For work, state the outcome, acceptance criteria, allowed side effects, and verification evidence before making broad edits. Prefer repo-specific success criteria over step-by-step process prompts.
6. Keep migrations narrow: update active model strings and directly related prompts only. Leave historical docs, examples, eval baselines, low-cost fallbacks, and ambiguous model references unchanged unless the user explicitly asks to upgrade them.
7. Preserve existing reasoning, verbosity, structured-output, and tool schemas when they are already present.
