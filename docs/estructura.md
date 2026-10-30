# Estructura del proyecto

Guía para ubicar código y saber dónde agregar cosas nuevas. La estructura se organiza **por feature** (funcionalidad), no por tipo de archivo: todo lo que hace falta para una pantalla o un flujo vive junto.

> Este documento describe el estado **real** del repositorio. La estructura objetivo a futuro se arma agregando features, no reordenando carpetas.

## Árbol actual

```
centralBV/
├─ docs/                        Documentación del proyecto
│  ├─ README.md                 Visión, stack, herramientas y convenciones
│  ├─ estructura.md             Este archivo
│  ├─ flujos.md                 Recorridos de usuario y reglas de negocio
│  ├─ roles.md                  Roles, permisos y navegación
│  └─ tokens.md                 Tokens y reglas de diseño
│
├─ public/                      Archivos estáticos servidos tal cual
│  ├─ favicon.svg
│  └─ icons.svg
│
├─ src/
│  ├─ app/
│  │  ├─ router.tsx             Rutas, guards de sesión y árbol de TanStack Router
│  │  ├─ AppLayout.tsx          Riel lateral de las pantallas con sesión
│  │  └─ configurarHttp.ts      Interceptores: token en cada pedido y 401 → login
│  │
│  ├─ assets/                   Imágenes y recursos importados desde código
│  │  ├─ hero.png
│  │  ├─ react.svg              Sin uso (resto del template)
│  │  └─ vite.svg               Sin uso (resto del template)
│  │
│  ├─ components/               Componentes reutilizables entre features
│  │  └─ centralbv/             Componentes propios de la app
│  │     ├─ Alert.tsx           Aviso con tono danger/info/ok/neutral
│  │     ├─ BrandMark.tsx       Logo y nombre de CentralBV
│  │     ├─ Button.tsx          Button y ButtonLink (Link con aspecto de botón)
│  │     ├─ EmptyState.tsx      Panel de vacío, sin resultados y error
│  │     ├─ Field.tsx           Field, Input, Select y Textarea
│  │     └─ estilos.ts          Clases compartidas (foco, variantes de botón)
│  │
│  ├─ features/                 Una carpeta por funcionalidad
│  │  ├─ auth/                  Login, recuperación de contraseña y sesión
│  │  │  ├─ api/
│  │  │  │  └─ authApi.ts       Llamadas HTTP del login y de la recuperación (US03)
│  │  │  ├─ components/
│  │  │  │  ├─ AuthLayout.tsx   Estructura de dos columnas de las pantallas públicas
│  │  │  │  ├─ CampoAuth.tsx    Campo con etiqueta y error de las pantallas públicas
│  │  │  │  ├─ EnlaceInvalido.tsx  Estado "el enlace ya no es válido"
│  │  │  │  └─ estilos.ts       Clases compartidas por las pantallas públicas
│  │  │  ├─ domain/
│  │  │  │  ├─ credenciales.ts  Validación y normalización de credenciales
│  │  │  │  └─ recuperacion.ts  Validación del correo y de la nueva contraseña
│  │  │  ├─ pages/
│  │  │  │  ├─ LoginPage.tsx                 Pantalla de login
│  │  │  │  ├─ LoginPage.test.tsx            Tests de la pantalla de login
│  │  │  │  ├─ LoginRoutePage.tsx            Adaptador entre la ruta y LoginPage
│  │  │  │  ├─ RecuperarContrasenaPage.tsx   Pedir el enlace
│  │  │  │  ├─ RecuperarEnviadoPage.tsx      Confirmación del envío
│  │  │  │  ├─ RestablecerContrasenaPage.tsx Formulario de nueva contraseña
│  │  │  │  ├─ ContrasenaRestablecidaPage.tsx Confirmación final
│  │  │  │  └─ RecuperacionContrasenaPage.test.tsx Tests del flujo US03
│  │  │  ├─ recuperacion.ts     Token y correo que viajan entre las pantallas
│  │  │  └─ session.ts          Lectura, guardado y borrado del token
│  │  │
│  │  ├─ constancias/           Solicitudes de constancia (M4 · US08, US09, US13)
│  │  │  ├─ api/
│  │  │  │  └─ solicitudesApi.ts    Llamadas a /solicitudes y traducción front ↔ back
│  │  │  ├─ domain/
│  │  │  │  ├─ busqueda.ts          Parámetros de la URL del listado
│  │  │  │  ├─ formato.ts           Etiquetas, DNI y fechas
│  │  │  │  └─ validacion.ts        Validación del formulario de solicitud
│  │  │  ├─ components/             EstadoBadge, SolicitudForm, CancelarSolicitudDialog,
│  │  │  │                          HojaConstancia, HojaEscalada, ImprimirConstanciaDialog
│  │  │  ├─ hooks/
│  │  │  │  └─ useConsulta.ts       Carga asíncrona con estados cargando/error/listo
│  │  │  └─ pages/                  Listado, alta, detalle, edición y generación
│  │  │
│  │  └─ dashboard/
│  │     └─ pages/
│  │        └─ DashboardPage.tsx    Pantalla posterior al login
│  │
│  ├─ lib/
│  │  └─ http.ts                Cliente Axios compartido y ErrorApi
│  │
│  ├─ styles/
│  │  ├─ index.css              Entrada de estilos: Tailwind + fuentes + tokens
│  │  └─ tokens.css             Única fuente de verdad de los tokens
│  │
│  ├─ test/
│  │  └─ setup.ts               Configuración global de Vitest
│  │
│  ├─ types/
│  │  └─ dominio.ts             Modelo de datos compartido del dominio
│  │
│  ├─ main.tsx                  Punto de entrada: monta el RouterProvider
│  ├─ Cad.tsx                   Prototipo del configurador de móviles
│  ├─ guia.tsx                  Página /guia (design system / prototipo)
│  ├─ App.css                   Sin uso (resto del template)
│  └─ index.css                 Sin uso (resto del template)
│
├─ index.html                   HTML raíz de Vite
├─ package.json                 Scripts y dependencias
├─ vite.config.ts               Vite + Tailwind + alias @ → src
├─ vitest.config.ts             Vitest (jsdom + alias @)
├─ tsconfig.json                Referencias a los tsconfig de app y node
├─ tsconfig.app.json            Configuración de TypeScript de src
├─ tsconfig.node.json           Configuración de TypeScript de Vite/Vitest
├─ eslint.config.js             Reglas de lint
└─ .gitignore                   node_modules, dist y archivos locales
```

`dist/` y `node_modules/` se generan y no se versionan.

## Responsabilidades por carpeta

| Carpeta | Qué va | Qué no va |
|---|---|---|
| `src/app` | Router, guards, providers y layouts por rol | Componentes de pantalla |
| `src/components/centralbv` | Componentes propios reutilizables entre features | Lógica de un feature puntual |
| `src/components/ui` | Componentes base de shadcn (se crea al sumar el primero) | Componentes con reglas del dominio |
| `src/features/<feature>` | Todo lo de una funcionalidad: API, dominio, páginas y componentes propios | Código compartido entre features |
| `src/lib` | Utilidades e infraestructura sin dominio (HTTP, helpers) | Lógica de negocio |
| `src/types` | Tipos compartidos del dominio | Tipos internos de un solo feature |
| `src/styles` | Tailwind, tokens y fuentes | Estilos sueltos por componente |
| `docs` | Documentación funcional y técnica | Código |

## Anatomía de un feature

Cada feature crece con esta forma. No hace falta crear todas las carpetas desde el principio: se agregan cuando aparecen archivos.

```
src/features/<feature>/
├─ api/              Llamadas al backend (axios + http)
├─ domain/           Tipos, validaciones y reglas puras (sin React)
├─ components/       Componentes usados solo por este feature
├─ pages/            Pantallas asociadas a una ruta
├─ hooks/            Hooks propios del feature (si hacen falta)
└─ <nombre>.test.tsx Tests, junto al código que prueban
```

Ejemplo actual: `auth` separa `api/authApi.ts` (HTTP), `domain/credenciales.ts` (validación pura), `pages/LoginPage.tsx` (UI) y `session.ts` (persistencia del token).

## Reglas de dependencia

```
pages / components  →  hooks  →  domain
        │
        └────────────→  api  →  lib/http
```

- `domain` no importa React, axios ni nada de infraestructura.
- `api` no importa páginas ni componentes.
- Un feature **no importa** archivos internos de otro feature. Si necesita algo compartido, se mueve a `components`, `lib` o `types`.
- `app` puede importar páginas de cualquier feature (es el punto de composición).
- Los imports entre carpetas usan el alias `@/` (ej. `@/features/auth/session`). Dentro de una misma carpeta se puede usar ruta relativa.

## Cómo agregar una funcionalidad nueva

1. Crear `src/features/<nombre>/` con `pages/`, `api/` y `domain/` según lo que necesite.
2. Sumar los tipos compartidos a `src/types/dominio.ts` solo si los usan varias features; si no, dejarlos en `domain/`.
3. Registrar la ruta en `src/app/router.tsx`.
4. Si hay que protegerla, usar `beforeLoad` con `leerSesion()` (ver rutas existentes).
5. Agregar el test junto a la página (`*.test.tsx`).
6. Documentar reglas de negocio en `docs/flujos.md` y permisos en `docs/roles.md`.

## Rutas y sesión

| Ruta | Acceso | Componente |
|---|---|---|
| `/` | Redirige según sesión | — |
| `/login` | Pública; si hay sesión activa redirige a `/dashboard` | `LoginRoutePage` |
| `/recuperar-contrasena` | Pública; si hay sesión activa redirige a `/dashboard` | `RecuperarContrasenaPage` |
| `/recuperar-contrasena/enviado` | Pública; si hay sesión activa redirige a `/dashboard` | `RecuperarEnviadoPage` |
| `/restablecer-contrasena` | Pública; recibe el token del correo | `RestablecerContrasenaPage` |
| `/update-password` | Alias de `/restablecer-contrasena` para el enlace del back | `RestablecerContrasenaPage` |
| `/restablecer-contrasena/lista` | Solo después de restablecer | `ContrasenaRestablecidaPage` |
| `/dashboard` | Requiere sesión activa | `DashboardPage` |
| `/solicitudes` | Requiere sesión activa | `SolicitudesPage` (`?q=&estado=&orden=&pagina=`) |
| `/solicitudes/nueva` | Requiere sesión activa | `NuevaSolicitudPage` |
| `/solicitudes/$id` | Requiere sesión activa | `SolicitudDetallePage` |
| `/solicitudes/$id/editar` | Requiere sesión activa | `EditarSolicitudPage` |
| `/solicitudes/$id/generar` | Requiere sesión activa | `GenerarConstanciaPage` (formulario o visor del PDF) |
| `/guia` | Pública (demo de diseño y prototipo) | `Guia` |

Las rutas con sesión cuelgan de una ruta sin path (`id: "app"`) que tiene el guard y el `AppLayout`; por eso sus ids son `/app/...` (por ejemplo, `getRouteApi("/app/solicitudes")`).

Flujo de autenticación:

1. `main.tsx` monta `RouterProvider` con el router de `app/router.tsx` e importa `app/configurarHttp.ts`.
2. `beforeLoad` llama a `leerSesion()`, que lee el token de `localStorage` y revisa su `exp`.
3. `LoginPage` valida credenciales, llama a `iniciarSesion()` en `authApi`, guarda el `access_token` y navega a `/dashboard`.
4. Cada pedido lleva `Authorization: Bearer <token>`. Si el back responde 401, se borra el token y se vuelve a `/login` con el aviso de sesión vencida (viaja en el estado del historial, no en la URL). Los endpoints de `/auth` quedan afuera de ese redirect: manejan sus propios errores.
5. El botón "Cerrar sesión" del riel borra el token.
6. Recuperación (US03): `/recuperar-contrasena` llama a `POST /auth/forgot-password`; el correo trae un enlace que cae en `/restablecer-contrasena` (o `/update-password`) con el token en el hash. El token se guarda en `sessionStorage` y se limpia de la URL; al restablecer se llama a `POST /auth/reset-password` y se marca como usado para que reabrir el enlace muestre "El enlace ya no es válido".

El token se guarda en `localStorage` con la clave `centralbv.token`. La API se configura con `VITE_API_URL` y por defecto apunta a `http://localhost:3000`.

## Datos y backend

- `src/lib/http.ts` es el único lugar donde se crea el cliente Axios.
- Cada feature tiene su `api/` y llama a `http`, sin crear clientes propios.
- El modelo de datos del cuartel (vehículos, zonas, compartimentos, inspecciones) está en `src/types/dominio.ts`.
- Los nombres del dominio van en español (`Vehiculo`, `Compartimento`, `Inspeccion`); la infraestructura y utilidades, en inglés.

## Estilos

- `src/styles/index.css` es la entrada: importa Tailwind, las fuentes y `tokens.css`. La importa solo `main.tsx`.
- `src/styles/tokens.css` es la única fuente de verdad de colores, tipografía, radios y tamaños. No usar colores ni medidas sueltas.
- Tailwind v4 se configura en CSS: no existe `tailwind.config`. La paleta por defecto está desactivada.
- Detalle de tokens y reglas visuales: [tokens.md](./tokens.md).

## Tests

- Runner: Vitest con `jsdom` y Testing Library.
- Configuración: `vitest.config.ts`; setup global en `src/test/setup.ts` (limpia el DOM y `localStorage` después de cada test).
- Los tests viven junto al código, con sufijo `.test.tsx`.
- Para rutas conviene usar `crearRouter(createMemoryHistory(...))`, como en `LoginPage.test.tsx`.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Chequeo de tipos (`tsc -b`) y build de producción |
| `npm run preview` | Sirve el build de producción |
| `npm run lint` | ESLint sobre todo el repo |
| `npm test` | Corre los tests una vez |
| `npm run test:watch` | Tests en modo watch |

Requiere Node 20.19+ o 22.12+.

## Convenciones de nombres

| Tipo | Convención | Ejemplo |
|---|---|---|
| Componentes y páginas | `PascalCase.tsx` | `LoginPage.tsx` |
| Páginas de ruta | sufijo `Page` | `DashboardPage.tsx` |
| Hooks | prefijo `use` | `useSesion.ts` |
| Módulos de lógica/API | `camelCase.ts` | `authApi.ts`, `credenciales.ts` |
| Tipos e interfaces | `PascalCase` | `Vehiculo`, `EstadoSesion` |
| Funciones y variables | `camelCase` en español para dominio | `leerSesion`, `validarCredenciales` |
| Tests | mismo nombre + `.test.tsx` | `LoginPage.test.tsx` |

## Estructura objetivo (features planificadas)

Según [flujos.md](./flujos.md) y [roles.md](./roles.md), faltan estas features. Se agregan con la misma anatomía, sin mover lo existente:

```
src/features/
├─ auth/            Login y sesión (existe)
├─ dashboard/       Pantalla inicial (existe)
├─ constancias/     Solicitudes (existe); falta entrega y pago (M4 2/2)
├─ vehiculos/       Lista, detalle y ABM de móviles
├─ inspeccion/      Checklist, pausa/retoma y envío
└─ usuarios/        Gestión de usuarios, roles y permisos
```

Además, cuando se sume el primer componente de shadcn se crea `src/components/ui/`.

## Pendientes de orden

- `src/App.css` y `src/index.css` no se importan en ningún lado: se pueden eliminar.
- `src/assets/react.svg` y `src/assets/vite.svg` son del template y no se usan.
- `src/Cad.tsx` y `src/guia.tsx` son un prototipo/demo accesible en `/guia`; no forman parte del flujo productivo. Si el prototipo se convierte en feature, moverlo a `features/vehiculos`.
