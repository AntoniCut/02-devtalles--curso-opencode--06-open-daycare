# Prompts del proyecto

Registro de prompts usados durante el desarrollo de OpenDayCare (copiado de `prompts.txt`, que está gitignored). La API key de Resend se redactó para no exponerla en el repositorio.

## Ubicación del proyecto

```
opencode /home/antonydev/antonydev-desarrollos/02-devtalles-desarrollos/devtalles.antonydev.tech/opencode/06-open-daycare
```

## Nombre del repositorio

```
02-devtalles--curso-opencode--06-open-daycare
```

---

> Utiliza el MCP de Playwright y mira lo que tenemos en el home (/).
>
> Necesito que investigues cual es la manera de proteccion de rutas en Next.js.
> Usa el MCP de context7

---

## SPEC DRIVEN DEVELOPMENT — Fernando Herrera SKILLs

### spec/01-feed-home.md

> Ocupamos implementar la plantilla @references/pantallas/feed.dc.html como nuestro home /.
> No tenemos autenticación. Aun no tenemos Base de datos. Solo necesito que el estilo luzca
> identico al proporcionado.

---

> Necesito que creemos un agente especializado.
>
> - Eres un agente verificador de los criterios de aceptación de un archivo de especificación (spec).
> - Tu labor es revisar, corregir y marcar los checks del "Acceptance criteria" de un spec.
> - Usa Context7 Para asegurarte de que se usaron las recomendaciones de next.js
> - Usa el MCP de Playwright para verificar cuando tiene que ver con pantallas creadas.
> - Debe de funcionar a nivel de proyecto y usar el modelo con visión [ejemplo: DeepSeek V4 Flash Vision Exp,
>   ya que soporta visión para comparar screenshots.
> - Este agente tiene que estar a nivel de proyecto, no global.

---

### spec/02-kids-perfil-kid.md

> Ocupamos implementar unicamente el diseño de las pantallas @references/pantallas/ninos.dc.html y @references/pantallas/perfil-nino.dc.html
> las rutas serian /kids para ninos y cuando pincho en un enlace de niño la ruta seria /kids/[id] o /kids[slug]
> en el que el slug seria el nombre de un niño.

---

> Recuerda que los links no tienen que ser anchor tags tradicionales,
> tienen que ser Next.js links

---

### spec/03-login-and-activate.md

> /spec
> Ocupamos implementar la plantilla @references/pantallas/login.dc.html y @references/activar-cuenta.dc.html.
> En la parte de login no ocupamos la opción de personal o família.

---

### spec/04-agregar-nino.md

> /spec
>
> Ocupamos implementar la plantilla @references/pantallas/agregar-nino.dc.html.
> Los campos Nombre, Fecha de Nacimiento y Sala son requeridos.
> Definir 2 o 3 salas de manera harcodeada.
> Colocar una mascara para escribir la fecha.

---

### spec/05-vincular-padre.md

> /spec
>
> ocupamos implementar la pantalla @references/pantallas/vincular-padre.dc.html
> esta pantalla se accede desde el enlace vincular otro padre desde niños

---

### spec/06-crear-publicacion.md

> /spec
>
> ocupamos implementar la pantalla @references/pantallas/crear-publicacion.dc.html
> esta pantalla se accede desde el sidebar.

---

> - Revisa las tablas de supabase y dime cuantas tablas existen actualmente en mi proyecto.
> - Probemos creando 2 tablas de prueba.
> - Añade 10 registros a cada tabla.
> - Elimina las 2 Tablas.

---

### spec/supabase/01-crear-tabla-daycare.md

> /spec
>
> Vamos a crear la primera tabla de daycares reemplaza la anterior, Puedes ver la referencia en @docs
> y ocupamos aplicar el patron de migraciones para impactar supabase.
> Crea una carpeta dentro de specs para supabase y guardar ahi las specs relacionadas
> con supabase.
>
> Actualiza el AGENTS.md y aclara de que siempre ocupamos con las migraciones cada
> vez que se manipule la base de datos.

---

### spec/supabase/02-crear-tabla-users.md

> /spec
>
> Ocupamos implementar la tabla de usuarios, y sus enumeraciones respectivas.
> Revisa @db-schema para tener las relaciones de lo que tenemos que crear.
> Un usuario puede tener un daycare, pero un daycare puede tener muchos usuarios.
> Ocuparemos un usuario staff para poder probar.
>
> staff@opendaycare.com => Test1234!

---

> Actualiza el AGENTS.md con las referencias de que vamos a utilizar los paquetes propios de supabase
> de nextjs para interactuar con la base de datos desde nuestra aplicación.

---

### spec/07-auth-and-route-protection.md

> /spec
>
> Ocupamos implementar la parte de autenticación de nuestra aplicación, recordando que solo es
> email y password.
> Una vez creada la autenticación, tambien ocupamos hacer la protección de rutas.
> Usa context7 para determinar cómo protegemos las rutas.
> Esto ya es real contra supabase.

---

### spec/supabase/03-crear-tabla-rooms.md

> /spec
>
> Necesito crear las siguiente tabla de rooms, ver en @db-schema.

---

### spec/supabase/04-crear-tabla-children.md

> /spec
>
> Necesito crear las siguiente tabla de children, ver en @db-schema.

---

### spec/08-agregar-nino.md

> /spec
>
> Necesito la funcionalidad de agregar niños desde la app

---

### spec/09-vincular-padre-email-activacion.md

> /spec
>
> Vamos a trabajar en la vinculacion de un padre a un niño (Imagen),
> Vamos a generar un correo electronico que va a ser enviado utilizando resend.com,
> el paquete de node, Necesitamos haced la parte del registro de usuario utilizando
> el código y la invitacion que vamos a enviar por correo.
>
> resend.com => API_KEY: re_****REDACTADA**** (está en `.env`, no se commitea)
>
> ----- Flujo de la app para esta spec -----------
>
> 1. Staff (logueado): niño → "Vincular otro padre" → escribes nombre + tu email + parentesco (⚠️ la contraseña NO se pone aquí) → "Enviar invitación"
> 2. Se genera un código de 5 caracteres que aparece en pantalla y llega por email a antonicut@gmail.com
> 3. Logout (staff)
> 4. /login → enlace "Activá tu cuenta" → /activate
> 5. Rellenas: el CÓDIGO (el que te llegó en el email), tu email (debe coincidir con el de la invitación) y la contraseña nueva del padre → "Activar mi cuenta"
> 6. Cuenta creada + vinculado → ya puedes hacer logout y entrar por /login con ese email + contraseña

---

> - Necesito que me ayudes a actualizar el README.md para que explique como levantar el proyecto.
>
> - Tambien si estamos utilizando el MCP de supabase, hay que decir como es que se autentica uno
>   con el CLI de supabase para hacer el login y autenticar mi equipo.
>
> - Necesito validar el MCP con el siguiente comando "opencode mcp auth supabase",
>   este debe ser parte del README.md.

---

> - Ocupamos de crear un pequeño componente de React que sea un contador y que ese valor
>   del contador aparezca en pantalla.
>
> - Necesito que crees un componente en React que haga una peticion HTTP para traer cual es el
>   Pokémon actual, el componente ya esta creado.
>
> - añade en el aside el enlace para la pantalla del pokemon.
>
>   Adicionalmente quiero que muestres el componente del pokemon en pantalla y pon un par de botones adicionales para
>   regresar y navegar entre ellos.

---

> Muse Spark 1.3 Contributor
>
> Vamos a crear un nuevo agente llamado "react-best-practices".
> Va a aplicar las mejores prácticas de React en todos los archivos que nosotros
> le indiquemos y vas a usar context7 para verificar si estas siguiendo las buenas practicas
> y las ultimas recomendaciones de la documentación.

---

> Necesito crear un agente llamado db-migrator.
> Este es un agente que se va a encargar de asegurarse de que existan las migraciones y de aplicarlas.
> Una vez creado añadir al AGENTS.md

---

> Necesito crear un agente accesibility-checker.
> La idea es que nos ayude con la accesibilidad y seguir las buenas practicas de WCAG 2.2 AA.
> Yo te voy a indicar que archivo es el que debes de revisar.
> Una vez creado añadir al AGENTS.md

---

> Necesito crear un agente nuevo el cual se va a llamar "db-security-auditor".
> Previene fugaz de datos entre niños y padres por role of security mal configurado
> y demas buenas prácticas de base de datos especializados en supabase.

---

> OpenCode tiene algo para poder ejecutar agentes de manera periodica, similar a un cron job ???
>
> Necesitamos ejecutar un cron job que haga `opencode run /db-security-auditor`
> todos los viernes a las 22:00 de la noche.
>
> Necesito ejemplos de como se implementaria con cada una de las opciones.
> Ver en /references/cron-jobs.md
> Si no puedes hacerlo con el de GitHub, no te preocupes, saltatelo.

---

## GRILL-ME — Metodología de Matt Pocock SKILLs

> /grilling Necesito que creemos la publicación de nuevas entradas como miembros
> del staff, con imágenes o sin imágenes.

---

## OPENSPEC — Metodología

> pnpm add -g @fission-ai/openspec@latest
>
> Necesito que expliques a @openspec/config.yaml, Cual es el objetivo de esta aplicación, de forma corta

---

> /opsx-explore Necesitamos hacer una separacion entre el panel del staff y la parte de la familia
>
> /opsx-apply separacion-staff-familia
>
> Usuario de prueba: madre.prueba@opendaycare.com / Test1234!

---

> Instalación del /opsx-verify
> openspec config profile --> Both (skills + commands) --> Commands only --> Verify change --> Y

---

> /opsx-archive separacion-staff-familia

---

## Producción — Vercel

> Ocupamos migrar nuestra base de datos de Supabase actualmente a otra instancia de Supabase
> en producción. ¿Qué puedo hacer?

---

## Base de datos en producción (Supabase)

> password: \*\*\*\*REDACTADA\*\*\*\* (vive en el dashboard de Supabase; no se commitea)
>
> APIKeys:
> service_role Secret ==> \*\*\*\*REDACTADA\*\*\*\*
>
> Proyecto en Vercel
>
> NEXT_PUBLIC_SUPABASE_URL=https://mdoftqngmqmijmowqqak.supabase.co
> NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_1WSBHQBgKFe--SC_T8zhhw_dYzA138R (clave publicable: se expone al navegador por diseño)

---

> Vamos a hacer el volcado de nuestra base de datos de desarrollo con los usuarios, trigger o lever security, básicamente todo,
> inclusive la data de la instancia actual que tú tienes acceso mediante un MCP a una instancia nueva en produccion.
>
> La instancia de producción es un green field. No hay absolutamente nada pero ya la tengo creada y aprovisionada.
>
> La instancia de produccion la vamos a hacer mediante el CLI de Supabase.
