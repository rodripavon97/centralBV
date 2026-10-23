# centralBV

App web de gestión para un cuartel de bomberos voluntarios. Proyecto universitario.

## Herramientas

1. **Constancias de actuación.** Formulario para usuarios administrativos (desktop, PC de la guardia). Certifica la actuación del cuerpo de bomberos en incendios de vehículos y de viviendas. Los campos varían según el caso (una vivienda no tiene patente) y la constancia puede ser para un seguro (requiere póliza) o para acción social (viviendas). Se genera un PDF A4 con membrete a partir de una plantilla Handlebars.
2. **Gestión de móviles de emergencia.** ABM de vehículos (autobombas, unidades de rescate, transporte de personal, etc.) con kilometraje, cambio de aceite y mantenimientos. Cada vehículo tiene zonas y compartimentos configurables, y una inspección guiada (checklist) desde el celular.

Roles y permisos: ver [roles.md](./roles.md). Flujos: ver [flujos.md](./flujos.md).

## Stack

- Vite + React + TypeScript
- Tailwind CSS v4 (plugin `@tailwindcss/vite`, configuración en CSS, sin `tailwind.config`)
- shadcn/ui (componentes base, copiados a `src/components/ui`)
- Lucide (íconos, trazo de 1.5 px)
- Fuentes: Inter y JetBrains Mono (`@fontsource-variable/*`)
- Requisito: Node 20.19+ o 22.12+

## Cómo arrancar

```bash
npm install
npm run dev      # servidor de desarrollo
npm run build    # build de producción
```

## Estructura

```
src/
├─ app/                 router, guards de sesión y composición de rutas
├─ components/
│  ├─ ui/               shadcn (se crea al sumar el primer componente)
│  └─ centralbv/        componentes propios reutilizables
├─ features/            una carpeta por funcionalidad
│  ├─ auth/             login y sesión
│  ├─ dashboard/        pantalla inicial
│  └─ …                 inspeccion, vehiculos, constancias, usuarios
├─ lib/                 infraestructura compartida (HTTP)
├─ styles/
│  ├─ index.css         entrada de Tailwind y fuentes
│  └─ tokens.css        única fuente de verdad de los tokens en código
└─ types/dominio.ts     modelo de datos
docs/                   esta documentación
```

Se organiza por `features` y no por tipo de archivo, para que tocar la inspección no obligue a saltar entre cinco carpetas.

Árbol completo, responsabilidades por carpeta, reglas de dependencia y guía para agregar features: [estructura.md](./estructura.md).

## Diseño (Figma)

| Archivo | Contenido | Link |
|---|---|---|
| 0. System Design | Tokens, tipografía, colores, notas para desarrollo | https://www.figma.com/design/l6SvU2FntQsTLhVVO5kH0X/CentralBV?node-id=0-1&p=f&t=7iRTNU1LqRaWZGHj-0 |
| 1. Componentes | Lectura, botones del checklist, plano de compartimentos, navegación | _pegar link_ |
| 2. Inspector | Flujo completo del inspector (mobile) | _pegar link_ |
| 3. Admin de móviles | Lista, alta y edición, editor de plantilla (desktop y tablet) | _pegar link_ |
| 4. Constancias | Formulario de constancia (desktop) | _pegar link_ |
| 5. Usuarios y roles | Gestión de usuarios, roles y permisos (desktop) | _pegar link_ |

## Convenciones

- **Tokens:** los nombres de Figma y de `tokens.css` son los mismos (`bg/base` en Figma es `--color-bg-base` en CSS). Detalle en [tokens.md](./tokens.md).
- **Regla de sincronía:** si un valor cambia en Figma (archivo 0), cambia el mismo día en `tokens.css` y en `tokens.md`, y viceversa.
- **Componentes:** lo que shadcn ya resuelve (botón, input, select, tabla, modal, toast, checkbox, badge) se usa desde `components/ui`. Lo que no, vive en `components/centralbv`.
- **No usar colores ni medidas sueltas.** Todo con los tokens. La paleta por defecto de Tailwind está desactivada a propósito.
- **Idioma de la interfaz:** español argentino, con voseo.
- **Idioma del código:** los nombres del dominio están en español (`Vehiculo`, `Compartimento`, `Inspeccion`) para coincidir con el lenguaje del cuartel; la infraestructura y las utilidades, en inglés.