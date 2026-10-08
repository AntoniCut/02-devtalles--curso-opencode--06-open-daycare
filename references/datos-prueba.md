# Datos de prueba — OpenDayCare

> **Estado: NO aplicados a ninguna base de datos.** Este archivo es el catálogo de cuentas y contenido de prueba, listo para usar cuando lo pidas en un proyecto Supabase de **desarrollo**.
> **⚠️ Nunca ejecutar este seed contra producción** (`OpenDayCare-Prod`, ref `mdoftqngmqmijmowqqak`). Ver regla dura en `AGENTS.md`.
> **Contraseña de todas las cuentas:** `Test1234!`
> **Prerrequisito del SQL de recreación:** el proyecto de desarrollo debe tener el daycare `Guardería Sala Soles`, las salas Soles/Estrellas/Luna y los niños base (mismos datos que producción). El SQL es idempotente: omite las cuentas que ya existan y no duplica contenido.

## Cuentas

| Email | Contraseña | Nombre | Rol | Sala | Hijos vinculados | Útil para probar |
| --- | --- | --- | --- | --- | --- | --- |
| `staff@opendaycare.com` | `Test1234!` | Antonio Cutillas | staff | Soles | — | Flujo principal de staff en Soles |
| `staff.estrellas@opendaycare.com` | `Test1234!` | Lucía Ramos | staff | Estrellas | — | Feed de otra sala y aislamiento RLS entre salas (no debe ver publicaciones de Soles) |
| `admin@opendaycare.com` | `Test1234!` | Carla Domínguez | admin | — | — | Feed de toda la guardería (Soles + Estrellas + Luna), publicar a cualquier niño, header con los 13 niños |
| `madre.prueba@opendaycare.com` | `Test1234!` | María Prueba | parent | — | Mateo Fernández, Sofía Méndez | Feed multi-hijo y pills por hijo |
| `padre.soles@opendaycare.com` | `Test1234!` | Pablo Herrera | parent | — | Tomás Díaz | Familia de Soles (ve el anuncio de la sala) |
| `antonikut@gmail.com` | `Test1234!` | Gabriel Ballester | parent | — | Alba Ballester Cutillas | Familia de Soles con hijo propio |
| `padre.estrellas@opendaycare.com` | `Test1234!` | Diego Torres | parent | — | Nicolás Gómez, Luis | Familia de Estrellas con contenido propio |
| `madre.luna@opendaycare.com` | `Test1234!` | Ana Beltrán | parent | — | Pedro Jimenez | Familia de Luna |

Notas:

- `staff@opendaycare.com` y `antonikut@gmail.com` suelen existir ya en clones de datos de producción y su `app_metadata` puede no traer `role`; la app resuelve el rol desde `public.users` (fallback de `resolveUserRole`). El resto de cuentas lo trae en el token.
- El SQL del apéndice asigna `Test1234!` a las 8 cuentas, existan o no de antes (solo en el proyecto de desarrollo donde lo ejecutes).

## Contenido del seed

Publicaciones que agrega (las 6 existentes de Soles se mantienen):

| Autor | Tipo | Destino | Texto |
| --- | --- | --- | --- |
| Lucía Ramos (staff Estrellas) | activity | Nicolás Gómez, Luis | "Armamos una torre gigante con bloques y después la derribamos entre todos. ¡Se rieron muchísimo!" |
| Lucía Ramos (staff Estrellas) | announcement | Toda la sala Estrellas | "Recuerden que el viernes hacemos la muestra de arte. Pueden venir a las 15:30 a ver los trabajos de la sala." |
| Carla Domínguez (admin) | achievement | Pedro Jimenez | "Pedro ayudó a guardar los juguetes sin que se lo pidamos. ¡Gran trabajo en equipo!" |

Feed esperado por cuenta (para validar RLS):

| Cuenta | Publicaciones esperadas |
| --- | --- |
| `staff@opendaycare.com` (Soles) | 6: 2 de Mateo, siesta (Sofía + Lucas), Benjamín, Alba + anuncio de Soles. **No** debe ver las de Estrellas |
| `staff.estrellas@opendaycare.com` (Estrellas) | 2: actividad de Nicolás/Luis + anuncio de Estrellas |
| `admin@opendaycare.com` | 9: todas las de la guardería |
| `madre.prueba@opendaycare.com` | 4: 2 de Mateo, siesta (Sofía) + anuncio de Soles |
| `padre.soles@opendaycare.com` | 1: anuncio de Soles |
| `antonikut@gmail.com` | 2: "Hola" (Alba) + anuncio de Soles |
| `padre.estrellas@opendaycare.com` | 2: actividad (Nicolás + Luis) + anuncio de Estrellas |
| `madre.luna@opendaycare.com` | 1: logro de Pedro |

## Invitaciones pendientes del seed

| Código | Niño | Email de la invitación | Parentesco | Uso |
| --- | --- | --- | --- | --- |
| `TEST2` | Valentina Soto (Soles) | `familia.soto@opendaycare.com` | Madre (Laura Soto) | Probar `/activate` end-to-end: `/activate?code=TEST2`, email `familia.soto@opendaycare.com` y contraseña a elección. **Un solo uso**: al activar pasa a `accepted` y crea la cuenta parent |
| `TEST3` | Luis (Estrellas) | `tia.gomez@opendaycare.com` | Tutor/a (Marta Gómez) | Ver badge PENDIENTE en el perfil de Luis y "2 padres vinculados" en la lista. También activable (un solo uso) |

En clones de producción también existe la invitación vencida `QRS5E` (niño Benjamín Ruiz) para probar el error de código expirado en `/activate`.

## Cómo probar sin depender del email

- `onboarding@resend.dev` (remitente de prueba de Resend) **solo entrega al correo dueño de la cuenta Resend**; para una prueba real de email usá ese correo.
- Alternativa sin email: en `/staff/vincular-padre` el código se muestra en pantalla **antes** de enviar, así que se puede leer y usar directo en `/activate`.
- Los códigos `TEST2` y `TEST3` permiten probar la activación sin enviar ningún correo.

## Datos para casos borde

- **Consentimiento de fotos:** por defecto todos los niños tienen `photo_consent = true`. Para probar el bloqueo, poné un niño de Soles en `false` y revertí después:
  ```sql
  update public.children set photo_consent = false where full_name = 'Olivia Vega';
  -- ...probar /staff/crear-publicacion...
  update public.children set photo_consent = true where full_name = 'Olivia Vega';
  ```
- **Niños sin padres** (para probar "sin padres vinculados" / badge VINCULAR): Benjamín Ruiz, Lucas Romero, Emma Castro, Olivia Vega, Martina López y Valentina Soto.
- **Admin sin sala:** en `/staff/crear-publicacion` no puede elegir "Toda la sala" y ve todos los niños de la guardería.

## Apéndice — SQL de recreación (solo desarrollo)

> Probado el 2026-10-08 (aplicado y revertido en un proyecto Supabase; no volver a aplicarlo en producción).

```sql
-- Seed de datos de prueba — SOLO para un proyecto Supabase de DESARROLLO.
-- NO ejecutar contra producción (OpenDayCare-Prod, ref mdoftqngmqmijmowqqak).
-- Requiere: daycare "Guardería Sala Soles", salas Soles/Estrellas/Luna y los
-- niños base (mismos datos que producción). Idempotente.

do $$
declare
  v_daycare_id constant uuid := '38fdf77c-7adf-4720-b0a9-08ad8c72c134';
  v_password constant text := 'Test1234!';
  v_room_soles uuid;
  v_room_estrellas uuid;
  v_user record;
  v_new_id uuid;
begin
  select id into v_room_soles
  from public.rooms
  where daycare_id = v_daycare_id and name = 'Soles';

  select id into v_room_estrellas
  from public.rooms
  where daycare_id = v_daycare_id and name = 'Estrellas';

  --  -----  8 cuentas de prueba (se omiten las que ya existen)  -----
  --  El trigger handle_new_user crea el perfil en public.users tomando
  --  rol, daycare y nombre de raw_app_meta_data.
  for v_user in
    select * from (values
      ('staff@opendaycare.com', 'Antonio Cutillas', 'staff'),
      ('staff.estrellas@opendaycare.com', 'Lucía Ramos', 'staff'),
      ('admin@opendaycare.com', 'Carla Domínguez', 'admin'),
      ('madre.prueba@opendaycare.com', 'María Prueba', 'parent'),
      ('padre.soles@opendaycare.com', 'Pablo Herrera', 'parent'),
      ('antonikut@gmail.com', 'Gabriel Ballester', 'parent'),
      ('padre.estrellas@opendaycare.com', 'Diego Torres', 'parent'),
      ('madre.luna@opendaycare.com', 'Ana Beltrán', 'parent')
    ) as t(email, full_name, user_role)
  loop
    --  -----  la cuenta ya existe: no duplicar  -----
    if exists (select 1 from auth.users where email = v_user.email) then
      continue;
    end if;

    v_new_id := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_new_id,
      'authenticated',
      'authenticated',
      v_user.email,
      extensions.crypt(v_password, extensions.gen_salt('bf')),
      now(),
      jsonb_build_object(
        'provider', 'email',
        'providers', jsonb_build_array('email'),
        'role', v_user.user_role,
        'daycare_id', v_daycare_id,
        'full_name', v_user.full_name
      ),
      jsonb_build_object('full_name', v_user.full_name),
      now(),
      now(),
      '', '', '', ''
    );

    insert into auth.identities (
      provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      v_new_id::text,
      v_new_id,
      jsonb_build_object(
        'sub', v_new_id::text,
        'email', v_user.email,
        'full_name', v_user.full_name,
        'role', v_user.user_role,
        'daycare_id', v_daycare_id,
        'email_verified', false,
        'phone_verified', false
      ),
      'email',
      now(),
      now(),
      now()
    );
  end loop;

  --  -----  contraseña documentada para las 8 cuentas  -----
  update auth.users
  set encrypted_password = extensions.crypt(v_password, extensions.gen_salt('bf')),
      updated_at = now()
  where email in (
    'staff@opendaycare.com',
    'staff.estrellas@opendaycare.com',
    'admin@opendaycare.com',
    'madre.prueba@opendaycare.com',
    'padre.soles@opendaycare.com',
    'antonikut@gmail.com',
    'padre.estrellas@opendaycare.com',
    'madre.luna@opendaycare.com'
  );

  --  -----  sala del staff  -----
  update public.users u
  set room_id = v_room_soles
  from auth.users au
  where au.id = u.id
    and au.email = 'staff@opendaycare.com';

  update public.users u
  set room_id = v_room_estrellas
  from auth.users au
  where au.id = u.id
    and au.email = 'staff.estrellas@opendaycare.com';

  --  -----  vínculos familia → niño  -----
  insert into public.parent_children (parent_id, child_id, relationship)
  select au.id, c.id, v.relationship::public.relationship_type
  from (values
    ('madre.prueba@opendaycare.com', 'Mateo Fernández', 'mother'),
    ('madre.prueba@opendaycare.com', 'Sofía Méndez', 'mother'),
    ('antonikut@gmail.com', 'Alba Ballester Cutillas', 'father'),
    ('padre.soles@opendaycare.com', 'Tomás Díaz', 'father'),
    ('padre.estrellas@opendaycare.com', 'Nicolás Gómez', 'father'),
    ('padre.estrellas@opendaycare.com', 'Luis', 'father'),
    ('madre.luna@opendaycare.com', 'Pedro Jimenez', 'mother')
  ) as v(parent_email, child_name, relationship)
  join auth.users au on au.email = v.parent_email
  join public.children c on c.full_name = v.child_name
  on conflict (parent_id, child_id) do nothing;

  --  -----  publicación de actividad en Estrellas (Nicolás y Luis)  -----
  with new_post as (
    insert into public.posts (daycare_id, author_id, room_id, type, body)
    select v_daycare_id,
           (select id from auth.users where email = 'staff.estrellas@opendaycare.com'),
           null,
           'activity',
           'Armamos una torre gigante con bloques y después la derribamos entre todos. ¡Se rieron muchísimo!'
    where not exists (
      select 1 from public.posts
      where body = 'Armamos una torre gigante con bloques y después la derribamos entre todos. ¡Se rieron muchísimo!'
    )
    returning id
  )
  insert into public.post_children (post_id, child_id)
  select new_post.id, c.id
  from new_post
  join public.children c on c.full_name in ('Nicolás Gómez', 'Luis')
  on conflict (post_id, child_id) do nothing;

  --  -----  anuncio de sala en Estrellas  -----
  insert into public.posts (daycare_id, author_id, room_id, type, body)
  select v_daycare_id,
         (select id from auth.users where email = 'staff.estrellas@opendaycare.com'),
         v_room_estrellas,
         'announcement',
         'Recuerden que el viernes hacemos la muestra de arte. Pueden venir a las 15:30 a ver los trabajos de la sala.'
  where not exists (
    select 1 from public.posts
    where body = 'Recuerden que el viernes hacemos la muestra de arte. Pueden venir a las 15:30 a ver los trabajos de la sala.'
  );

  --  -----  publicación de logro en Luna (admin sin sala, etiqueta a Pedro)  -----
  with new_post as (
    insert into public.posts (daycare_id, author_id, room_id, type, body)
    select v_daycare_id,
           (select id from auth.users where email = 'admin@opendaycare.com'),
           null,
           'achievement',
           'Pedro ayudó a guardar los juguetes sin que se lo pidamos. ¡Gran trabajo en equipo!'
    where not exists (
      select 1 from public.posts
      where body = 'Pedro ayudó a guardar los juguetes sin que se lo pidamos. ¡Gran trabajo en equipo!'
    )
    returning id
  )
  insert into public.post_children (post_id, child_id)
  select new_post.id, c.id
  from new_post
  join public.children c on c.full_name = 'Pedro Jimenez'
  on conflict (post_id, child_id) do nothing;

  --  -----  invitaciones pendientes para probar /activate y el badge PENDIENTE  -----
  insert into public.invitations (child_id, invited_by, full_name, email, relationship, code, status, expires_at)
  select c.id,
         (select id from auth.users where email = 'staff@opendaycare.com'),
         'Laura Soto',
         'familia.soto@opendaycare.com',
         'mother',
         'TEST2',
         'pending',
         now() + interval '7 days'
  from public.children c
  where c.full_name = 'Valentina Soto'
    and not exists (select 1 from public.invitations where code = 'TEST2');

  insert into public.invitations (child_id, invited_by, full_name, email, relationship, code, status, expires_at)
  select c.id,
         (select id from auth.users where email = 'staff.estrellas@opendaycare.com'),
         'Marta Gómez',
         'tia.gomez@opendaycare.com',
         'guardian',
         'TEST3',
         'pending',
         now() + interval '7 days'
  from public.children c
  where c.full_name = 'Luis'
    and not exists (select 1 from public.invitations where code = 'TEST3');
end $$;
```

## Limpieza (solo desarrollo)

Borra las 5 cuentas nuevas del seed, el contenido y las invitaciones. Las cuentas base (`staff@`, `madre.prueba@`, `antonikut@gmail.com`) se dejan intactas (solo se les cambió la contraseña a `Test1234!`).

```sql
begin;

delete from public.post_children
where post_id in (
  select id from public.posts
  where body in (
    'Armamos una torre gigante con bloques y después la derribamos entre todos. ¡Se rieron muchísimo!',
    'Recuerden que el viernes hacemos la muestra de arte. Pueden venir a las 15:30 a ver los trabajos de la sala.',
    'Pedro ayudó a guardar los juguetes sin que se lo pidamos. ¡Gran trabajo en equipo!'
  )
);

delete from public.posts
where body in (
  'Armamos una torre gigante con bloques y después la derribamos entre todos. ¡Se rieron muchísimo!',
  'Recuerden que el viernes hacemos la muestra de arte. Pueden venir a las 15:30 a ver los trabajos de la sala.',
  'Pedro ayudó a guardar los juguetes sin que se lo pidamos. ¡Gran trabajo en equipo!'
);

delete from public.invitations where code in ('TEST2', 'TEST3');

delete from public.parent_children
where parent_id in (
  select id from auth.users
  where email in (
    'padre.soles@opendaycare.com',
    'padre.estrellas@opendaycare.com',
    'madre.luna@opendaycare.com'
  )
);

delete from public.users
where id in (
  select id from auth.users
  where email in (
    'admin@opendaycare.com',
    'staff.estrellas@opendaycare.com',
    'padre.soles@opendaycare.com',
    'padre.estrellas@opendaycare.com',
    'madre.luna@opendaycare.com'
  )
);

delete from auth.identities
where user_id in (
  select id from auth.users
  where email in (
    'admin@opendaycare.com',
    'staff.estrellas@opendaycare.com',
    'padre.soles@opendaycare.com',
    'padre.estrellas@opendaycare.com',
    'madre.luna@opendaycare.com'
  )
);

delete from auth.users
where email in (
  'admin@opendaycare.com',
  'staff.estrellas@opendaycare.com',
  'padre.soles@opendaycare.com',
  'padre.estrellas@opendaycare.com',
  'madre.luna@opendaycare.com'
);

commit;
```
