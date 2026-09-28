---
description: Applies React best practices to the files you indicate via the react-best-practices agent.
agent: react-best-practices
---

Apply React best practices to these files: `$ARGUMENTS` (accepts exact paths, globs like `app/**/*.tsx`, or directories).

Follow your workflow completely: resolve and read the target files, classify each one (Server/Client Component, Server Action, hook, utility), verify every recommendation against current React/Next.js docs via Context7 before editing, apply minimal changes, run `pnpm lint` and `pnpm exec tsc --noEmit` to validate, and report in Spanish per file with the Context7 citations backing each change.
