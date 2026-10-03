-- SPEC 10 — RPC `create_post`: inserta `posts` + `post_children` + `post_photos`
-- en una sola transacción (todo o nada; si algo falla, no queda ninguna fila).
-- SECURITY INVOKER: las policies RLS del llamador se aplican a cada insert.
-- Depends on: 20261003153247_create_posts_tables.

create or replace function public.create_post(
  p_type public.post_type,
  p_body text,
  p_room_id uuid,
  p_child_ids uuid[],
  p_photos jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_post_id uuid := gen_random_uuid();
  v_photo jsonb;
  v_position int := 0;
begin
  insert into public.posts (id, daycare_id, author_id, room_id, type, body)
  values (
    v_post_id,
    private.current_user_daycare_id(),
    (select auth.uid()),
    p_room_id,
    p_type,
    p_body
  );

  if p_child_ids is not null and array_length(p_child_ids, 1) > 0 then
    insert into public.post_children (post_id, child_id)
    select v_post_id, child_id
    from unnest(p_child_ids) as child_id;
  end if;

  if jsonb_typeof(p_photos) = 'array' and jsonb_array_length(p_photos) > 0 then
    for v_photo in select value from jsonb_array_elements(p_photos) loop
      insert into public.post_photos (post_id, path, alt, width, height, position)
      values (
        v_post_id,
        v_photo ->> 'path',
        nullif(v_photo ->> 'alt', ''),
        nullif(v_photo ->> 'width', '')::int,
        nullif(v_photo ->> 'height', '')::int,
        v_position
      );
      v_position := v_position + 1;
    end loop;
  end if;

  return v_post_id;
end;
$$;

revoke all on function public.create_post(public.post_type, text, uuid, uuid[], jsonb) from public, anon;
grant execute on function public.create_post(public.post_type, text, uuid, uuid[], jsonb) to authenticated;
