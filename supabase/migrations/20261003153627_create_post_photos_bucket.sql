-- SPEC 10 — Bucket privado `post-photos` y sus policies de Storage.
-- Path de los archivos: `{daycare_id}/{uuid}.{ext}`; subida directa navegador→Storage
-- y lectura con URLs firmadas para miembros de la guardería.
-- Depends on: 20261003153247_create_posts_tables (helpers RLS en schema `private`).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-photos',
  'post-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

--  -----  policies: storage.objects  -----
drop policy if exists "post_photos_select_daycare_members" on storage.objects;
create policy "post_photos_select_daycare_members"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'post-photos'
    and (storage.foldername(name))[1] = private.current_user_daycare_id()::text
  );

drop policy if exists "post_photos_insert_staff_own_daycare" on storage.objects;
create policy "post_photos_insert_staff_own_daycare"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'post-photos'
    and (storage.foldername(name))[1] = private.current_user_daycare_id()::text
    and private.current_user_role() in ('staff', 'admin')
  );
