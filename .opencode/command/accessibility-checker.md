---
description: Audits and fixes WCAG 2.2 AA accessibility issues in the files you indicate via the accessibility-checker agent.
agent: accessibility-checker
---

Audit the accessibility (WCAG 2.2 AA) of these files: `$ARGUMENTS` (accepts exact paths, globs like `app/**/*.tsx`, or directories).

Follow your workflow completely: resolve and read the target files, classify them and map them to their routes, run the static review, verify in the browser with Playwright (accessibility snapshot, keyboard, contrast with computed styles, target size, reflow, reduced motion), fix every issue found — including contrast/color changes —, validate with `pnpm lint` and `pnpm exec tsc --noEmit`, and report in Spanish per finding with its WCAG criterion, evidence, and the applied change.
