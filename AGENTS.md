# Rules

1. Do not run `bun run dev` on your own, the maintainer is going to run it by himself.
2. Use `bun verify` to verify the code quality after changes (except for markdown files).
3. If some files became staged, do not return them to unstaged mode.
4. Do not stage any files.
5. If you've decided that a feature/refactor/task would require more than 1 slice, describe every slice's requirements in PRD for that feature/refactor/task
6. For work, state the outcome, acceptance criteria, allowed side effects, and verification evidence before making broad edits. Prefer repo-specific success criteria over step-by-step process prompts.
7. Keep migrations narrow: update active model strings and directly related prompts only. Leave historical docs, examples, eval baselines, low-cost fallbacks, and ambiguous model references unchanged unless the user explicitly asks to upgrade them.
8. Preserve existing reasoning, verbosity, structured-output, and tool schemas when they are already present.
