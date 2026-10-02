---
description: Audits and fixes Supabase security (RLS, roles, policies, grants) prioritizing data leaks between children, parents, and staff, via the db-security-auditor agent.
agent: db-security-auditor
---

Audit the security of: `$ARGUMENTS` (table/function names, `specs/supabase/NN-slug.md`, or empty for a full audit of the public schema and the app queries).

Follow your workflow completely: load the `supabase` and `supabase-postgres-best-practices` skills, audit the repo migrations and the remote project (`supabase_list_tables`, `supabase_list_migrations`, `supabase_get_advisors`, catalog queries), prove the real access with role impersonation tests (`set local role` + `request.jwt.claims`, always rolled back), review the app queries in `app/` and `utils/`, and report in Spanish with severity, evidence, and the proposed fix. Fix only when the request asks for it: create the versioned migration with `supabase migration new`, apply it with `supabase_apply_migration`, and re-verify.
