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
│  │  └─ router.tsx             Rutas, guards de sesión y árbol de TanStack Router
│  │
│  ├─ assets/                   Imágenes y recursos importados desde código
│  │  ├─ hero.png
│  │  ├─ react.svg              Sin uso (resto del template)
│  │  └─ vite.svg               Sin uso (resto del template)
│  │
│  ├─ components/               Componentes reutilizables entre features
│  │  └─ centralbv/             Componentes propios de la app
│  │     ├─ Alert.tsx           Aviso con tono danger/info
│  │     └─ BrandMark.tsx       Logo y nombre de CentralBV
│  │
│  ├─ features/                 Una carpeta por funcionalidad
│  │  ├─ auth/                  Login y manejo de sesión
│  │  │  ├─ api/
│  │  │  │  └─ authApi.ts       Llamadas HTTP del login
│  │  │  ├─ domain/
│  │  │  │  └─ credenciales.ts  Validación y normalización de credenciales
│  │  │  ├─ pages/
│  │  │  │  ├─ LoginPage.tsx        Pantalla de login
│  │  │  │  ├─ LoginPage.test.tsx   Tests de la pantalla de login
│  │  │  │  └─ LoginRoutePage.tsx   Adaptador entre la ruta y LoginPage
│  │  │  └─ session.ts          Lectura, guardado y borrado del token
│  │  │
│  │  └─ dashboard/
│  │     └─ pages/
│  │        └─ DashboardPage.tsx    Pantalla posterior al login
│  │
│  ├─ lib/
│  │  └─ http.ts                Cliente Axios compartido (baseURL de la API)
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
| `/dashboard` | Requiere sesión activa | `DashboardPage` |
| `/guia` | Pública (demo de diseño y prototipo) | `Guia` |

Flujo de autenticación:

1. `main.tsx` monta `RouterProvider` con el router de `app/router.tsx`.
2. `beforeLoad` llama a `leerSesion()`, que lee el token de `localStorage` y revisa su `exp`.
3. `LoginPage` valida credenciales, llama a `iniciarSesion()` en `authApi`, guarda el token y navega a `/dashboard`.
4. `DashboardPage` borra el token al salir.

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
├─ vehiculos/       Lista, detalle y ABM de móviles
├─ inspeccion/      Checklist, pausa/retoma y envío
├─ constancias/     Formulario y generación de PDF
└─ usuarios/        Gestión de usuarios, roles y permisos
```

Además, cuando se sume el primer componente de shadcn se crea `src/components/ui/`.

## Pendientes de orden

- `src/App.css` y `src/index.css` no se importan en ningún lado: se pueden eliminar.
- `src/assets/react.svg` y `src/assets/vite.svg` son del template y no se usan.
- `src/Cad.tsx` y `src/guia.tsx` son un prototipo/demo accesible en `/guia`; no forman parte del flujo productivo. Si el prototipo se convierte en feature, moverlo a `features/vehiculos`.
