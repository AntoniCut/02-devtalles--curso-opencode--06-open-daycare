-- SPEC 10 — Fix: las policies de INSERT de `post_children` y `post_photos`
-- comprobaban la autoría consultando `public.posts` con RLS; un post recién
-- creado en la misma transacción todavía no es visible (no tiene etiquetas ni
-- sala), así que el insert fallaba. Se reemplaza por un helper SECURITY DEFINER
-- de autoría que no depende de las policies de SELECT.
-- Depends on: 20261003153247_create_posts_tables, 20261003154907_create_post_rpc.

create or replace function private.is_post_author(p_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.posts p
    where p.id = p_post_id
      and p.author_id = (select auth.uid())
  )
$$;

revoke all on function private.is_post_author(uuid) from public, anon;
grant execute on function private.is_post_author(uuid) to authenticated;

drop policy if exists "post_children_insert_own_post" on public.post_children;
create policy "post_children_insert_own_post"
  on public.post_children
  for insert
  to authenticated
  with check (
    private.is_post_author(post_id)
    and private.can_tag_child(child_id)
  );

drop policy if exists "post_photos_insert_own_post" on public.post_photos;
create policy "post_photos_insert_own_post"
  on public.post_photos
  for insert
  to authenticated
  with check (
    private.is_post_author(post_id)
    and starts_with(path, private.current_user_daycare_id()::text || '/')
  );
