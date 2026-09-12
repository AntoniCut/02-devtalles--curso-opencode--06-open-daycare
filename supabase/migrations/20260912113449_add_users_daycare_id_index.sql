-- SPEC SUPABASE 02 — Covering index for the `users.daycare_id` foreign key
-- Resolves the Supabase performance advisor `unindexed_foreign_keys` (lint 0001).

create index if not exists users_daycare_id_idx on public.users (daycare_id);
