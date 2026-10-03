---
description: Ensures a database change exists as a versioned migration and applies it to the remote project via the db-migrator agent.
agent: db-migrator
---

Ensure the following database change exists as a versioned migration and is applied to the remote project: `$ARGUMENTS` (accepts a spec like `specs/supabase/05-slug.md`, raw SQL, or a description).

Follow your workflow completely: load the `supabase` and `supabase-postgres-best-practices` skills, audit the current state (`supabase/migrations/` + `supabase_list_migrations` + `supabase_list_tables`), create the missing migration with `supabase migration new`, apply it with `supabase_apply_migration`, verify with `supabase_list_migrations`/`supabase_list_tables`/`supabase_get_advisors`, and report in Spanish.
