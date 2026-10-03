-- SPEC 10 — Publicaciones del staff: enum `post_type`, `users.room_id`, tablas
-- `posts` / `post_children` / `post_photos`, helpers RLS, policies y grants.
-- Reference schema: 07-db-Schema/opendaycare-database-schema.md (tablas 8–10), con los
-- ajustes acordados: `posts.daycare_id`, `post_photos.path`/`alt` y `mood` en `post_type`.
-- Depends on: SPEC SUPABASE 02 (users), SPEC SUPABASE 03 (rooms), SPEC SUPABASE 04 (children).

--  -----  enums  -----
do $$ begin
  create type public.post_type as enum ('meal', 'nap', 'activity', 'achievement', 'mood', 'photo', 'announcement');
exception when duplicate_object then null; end $$;

--  -----  users.room_id (sala del staff)  -----
alter table public.users
  add column if not exists room_id uuid references public.rooms(id);

create index if not exists users_room_id_idx on public.users (room_id);

--  -----  posts  -----
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null references public.daycares(id),
  author_id uuid not null references public.users(id),
  room_id uuid references public.rooms(id),
  type public.post_type not null,
  title text,
  body text not null,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index posts_daycare_id_idx on public.posts (daycare_id);
create index posts_author_id_idx on public.posts (author_id);
create index posts_room_id_idx on public.posts (room_id);
create index posts_published_at_idx on public.posts (published_at desc);

create trigger set_posts_updated_at
  before update on public.posts
  for each row
  execute function public.set_updated_at();

alter table public.posts enable row level security;

--  -----  post_children  -----
create table public.post_children (
  post_id uuid not null references public.posts(id) on delete cascade,
  child_id uuid not null references public.children(id),
  primary key (post_id, child_id)
);

create index post_children_child_id_idx on public.post_children (child_id);

alter table public.post_children enable row level security;

--  -----  post_photos  -----
create table public.post_photos (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  path text not null,
  alt text,
  width int,
  height int,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index post_photos_post_id_idx on public.post_photos (post_id);

alter table public.post_photos enable row level security;

--  -----  helpers RLS (schema private, SECURITY DEFINER)  -----
create or replace function private.current_user_room_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select u.room_id
  from public.users u
  where u.id = (select auth.uid())
$$;

create or replace function private.post_tags_child_of_room(p_post_id uuid, p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.post_children pc
    join public.children c on c.id = pc.child_id
    where pc.post_id = p_post_id
      and c.room_id = p_room_id
  )
$$;

create or replace function private.post_tags_parent_child(p_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.post_children pc
    join public.parent_children pcl on pcl.child_id = pc.child_id
    where pc.post_id = p_post_id
      and pcl.parent_id = (select auth.uid())
  )
$$;

create or replace function private.can_tag_child(p_child_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.children c
    join public.rooms r on r.id = c.room_id
    where c.id = p_child_id
      and c.status = 'active'
      and r.daycare_id = private.current_user_daycare_id()
      and (
        private.is_admin()
        or (
          private.current_user_role() = 'staff'
          and (
            private.current_user_room_id() is null
            or c.room_id = private.current_user_room_id()
          )
        )
      )
  )
$$;

revoke all on function private.current_user_room_id() from public, anon;
revoke all on function private.post_tags_child_of_room(uuid, uuid) from public, anon;
revoke all on function private.post_tags_parent_child(uuid) from public, anon;
revoke all on function private.can_tag_child(uuid) from public, anon;

grant execute on function private.current_user_room_id() to authenticated;
grant execute on function private.post_tags_child_of_room(uuid, uuid) to authenticated;
grant execute on function private.post_tags_parent_child(uuid) to authenticated;
grant execute on function private.can_tag_child(uuid) to authenticated;

--  -----  policies: posts  -----
create policy "posts_select_scoped"
  on public.posts
  for select
  to authenticated
  using (
    daycare_id = private.current_user_daycare_id()
    and (
      private.is_admin()
      or (
        private.current_user_role() = 'staff'
        and (
          private.current_user_room_id() is null
          or room_id = private.current_user_room_id()
          or private.post_tags_child_of_room(id, private.current_user_room_id())
        )
      )
      or (
        private.current_user_role() = 'parent'
        and (
          private.post_tags_parent_child(id)
          or private.is_parent_of_room(room_id)
        )
      )
    )
  );

create policy "posts_insert_staff_own_daycare"
  on public.posts
  for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and daycare_id = private.current_user_daycare_id()
    and private.current_user_role() in ('staff', 'admin')
    and (
      room_id is null
      or room_id = private.current_user_room_id()
    )
  );

--  -----  policies: post_children  -----
create policy "post_children_select_visible_post"
  on public.post_children
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.posts p
      where p.id = post_id
    )
  );

create policy "post_children_insert_own_post"
  on public.post_children
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.posts p
      where p.id = post_id
        and p.author_id = (select auth.uid())
    )
    and private.can_tag_child(child_id)
  );

--  -----  policies: post_photos  -----
create policy "post_photos_select_visible_post"
  on public.post_photos
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.posts p
      where p.id = post_id
    )
  );

create policy "post_photos_insert_own_post"
  on public.post_photos
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.posts p
      where p.id = post_id
        and p.author_id = (select auth.uid())
    )
    and starts_with(path, private.current_user_daycare_id()::text || '/')
  );

--  -----  policy: users (staff/admin pueden leer perfiles staff/admin de su guardería)  -----
drop policy if exists "users_select_self_or_admin" on public.users;

create policy "users_select_scoped"
  on public.users
  for select
  to authenticated
  using (
    id = (select auth.uid())
    or private.is_admin()
    or (
      role in ('staff', 'admin')
      and daycare_id = private.current_user_daycare_id()
      and private.current_user_role() in ('staff', 'admin')
    )
  );

--  -----  grants (Data API no expone tablas nuevas automáticamente)  -----
revoke all on public.posts from anon;
revoke all on public.post_children from anon;
revoke all on public.post_photos from anon;

grant select, insert on public.posts to authenticated;
grant select, insert on public.post_children to authenticated;
grant select, insert on public.post_photos to authenticated;

grant all on public.posts to service_role;
grant all on public.post_children to service_role;
grant all on public.post_photos to service_role;
