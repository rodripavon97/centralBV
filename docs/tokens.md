# Tokens y reglas de diseño

Espejo de la página "Notas para desarrollo" del archivo 0 (System Design) de Figma. La implementación vive en `src/styles/tokens.css`. Si un valor cambia en un lado, cambia en el otro el mismo día.

## 1. Tema

- Solo modo oscuro. No hay variante light ni clase `dark` en el `<html>`.
- Sin sombras. La elevación se resuelve con `bg-raised` + `border-strong`. Las sombras de Tailwind están desactivadas (`--shadow-*: initial`).
- Fondo de la app: `bg-base`. Paneles, tarjetas y formularios: `bg-surface`. Elementos elevados, hover e inputs: `bg-raised`.
- No usar blanco ni negro puros para texto o fondos. Texto principal: `text-primary`.
- La paleta por defecto de Tailwind (slate, red, etc.) está desactivada. Solo existen los colores definidos abajo.

## 2. Colores

Los nombres con barra de Figma pasan directo a variables CSS. En Tailwind v4 la clase sale del nombre completo de la variable, así que el prefijo se repite (`--color-bg-base` da `bg-bg-base`). Es redundante, pero coincide 1 a 1 con Figma.

### Neutros

| Figma | Variable CSS | Hex | Clase de ejemplo |
|---|---|---|---|
| bg/base | `--color-bg-base` | `#1B1A18` | `bg-bg-base` |
| bg/surface | `--color-bg-surface` | `#252422` | `bg-bg-surface` |
| bg/raised | `--color-bg-raised` | `#302E2B` | `bg-bg-raised` |
| border/subtle | `--color-border-subtle` | `#302E2B` | `border-border-subtle` |
| border/strong | `--color-border-strong` | `#4D4944` | `border-border-strong` |
| border/input | `--color-border-input` | `#847D75` | `border-border-input` |
| text/primary | `--color-text-primary` | `#EDE8E3` | `text-text-primary` |
| text/secondary | `--color-text-secondary` | `#C6BEB6` | `text-text-secondary` |
| text/muted | `--color-text-muted` | `#A39A92` | `text-text-muted` |
| text/disabled | `--color-text-disabled` | `#6E655E` | `text-text-disabled` |
| line/schematic | `--color-line-schematic` | `#A39A92` | `stroke-line-schematic` |

### Rojo de marca

El rojo es acento, no fondo. Uso: botón principal, elementos activos y selección.

| Figma | Variable CSS | Hex | Uso |
|---|---|---|---|
| red-400 (accent/text) | `--color-accent-text` | `#F0625A` | Texto e íconos rojos sobre fondo oscuro, anillo de foco |
| red-500 (accent/fill-hover) | `--color-accent-fill-hover` | `#D0342C` | Hover del botón principal |
| red-600 (accent/fill) | `--color-accent-fill` | `#C8281E` | Botón principal, con texto blanco (5.56:1) |
| red-700 (accent/fill-pressed) | `--color-accent-fill-pressed` | `#A61F17` | Botón presionado |
| red-900 (accent/subtle) | `--color-accent-subtle` | `#5C130E` | Fondo tenue de selección o resaltado |

La escala completa (`red-50` a `red-900`) está disponible como `--color-red-*`.

Contraste a tener en cuenta: `accent-text` sobre `bg-raised` y sobre `accent-subtle` da 4.25:1, levemente bajo 4.5:1. Evitar texto rojo largo sobre esas superficies.

### Estados

| Estado | Texto, borde e ícono | Fondo tenue | Glifo (Lucide) | Texto |
|---|---|---|---|---|
| Operativo | `state-ok` `#5FD3A0` | `state-ok-bg` `#0F3B2C` | `circle-check` | Operativo |
| Observaciones | `state-warn` `#F2B84B` | `state-warn-bg` `#4A3208` | `triangle-alert` | Con observaciones |
| Fuera de servicio | `state-danger` `#FF8A8A` | `state-danger-bg` `#5A1A22` | `octagon-x` | Fuera de servicio |
| Mantenimiento | `state-info` `#6CB8F0` | `state-info-bg` `#12365A` | `wrench` | En mantenimiento |
| Pausada (proceso) | `text-secondary` | `bg-raised` | `circle-pause` | En curso 4/11 |

Reglas:

- **Un estado nunca se comunica solo con color.** Siempre color + glifo + texto.
- "Pausada" es neutra a propósito: es un proceso de la inspección, no un estado del vehículo.
- Badge: basado en el `Badge` de shadcn. Fondo `state-*-bg`, borde de 1 px `state-*`, ícono y texto `state-*`.
- Los colores de estado van en superficies chicas (íconos, badges, trazos), no en áreas grandes.

## 3. Tipografía

- Base: 16 px = 1rem. Los tamaños se definen en `rem`.
- **Inter:** títulos, cuerpo, botones y formularios.
- **JetBrains Mono:** códigos de compartimento (`BL-1`), patentes, pólizas, n.° de constancia, kilometraje y fechas dentro de tablas.
- Usar `tabular-nums` en números que se alinean en columnas.

### Escala de Inter

| Clase | px (tamaño / interlineado) | rem |
|---|---|---|
| `text-xs` | 12 / 16 | 0.75 / 1 |
| `text-sm` | 14 / 20 | 0.875 / 1.25 |
| `text-base` | 16 / 24 | 1 / 1.5 |
| `text-lg` | 20 / 28 | 1.25 / 1.75 |
| `text-xl` | 24 / 32 | 1.5 / 2 |
| `text-2xl` | 32 / 40 | 2 / 2.5 |
| `text-3xl` | 40 / 48 | 2.5 / 3 |

**Atención:** `text-lg`, `text-xl`, `text-2xl` y `text-3xl` no coinciden con los valores por defecto de Tailwind. Están sobrescritos en `tokens.css`.

Pesos: 400 y 500 en tamaños chicos, 600 en títulos.

### Estilos mono (fuera de la escala)

| Clase | Tamaño / interlineado | Peso | Extra |
|---|---|---|---|
| `text-eyebrow` | 12 / 16 | 500 | MAYÚSCULAS, tracking 8%, color `text-muted` |
| `text-code` | 14 / 20 | 400 | Patentes, pólizas, códigos |
| `text-readout` | 32 / 40 | 500 | Lecturas numéricas |
| `text-readout-lg` | 40 / 48 | 500 | Lecturas del dashboard |

### Responsive de texto

Pendiente de definir. Propuesta: solo cambian los títulos de página (`text-xl` en mobile, `text-2xl` desde `md`); el cuerpo y los datos se mantienen fijos.

En mobile, los inputs siempre a 16 px (`text-base`), para evitar el zoom automático de iOS.

## 4. Espaciado, radios y trazos

**Espaciado.** Escala de 4 px, igual que Tailwind.

| Figma | px | Clase |
|---|---|---|
| space/1 | 4 | `p-1`, `gap-1` |
| space/2 | 8 | `p-2`, `gap-2` |
| space/3 | 12 | `p-3`, `gap-3` |
| space/4 | 16 | `p-4`, `gap-4` |
| space/6 | 24 | `p-6`, `gap-6` |
| space/8 | 32 | `p-8`, `gap-8` |
| space/12 | 48 | `p-12`, `gap-12` |
| space/16 | 64 | `p-16`, `gap-16` |

**Radios.** Sobrescriben a los de Tailwind.

| Figma | px | Clase | Uso |
|---|---|---|---|
| radius/sm | 4 | `rounded-sm` | Compartimentos del plano |
| radius/md | 6 | `rounded-md` | Inputs, badges |
| radius/lg | 10 | `rounded-lg` | Botones, tarjetas |
| radius/xl | 16 | `rounded-xl` | Modales, sheets |
| radius/full | 999 | `rounded-full` | Chips, indicadores redondos |

**Trazos.**

| Figma | px | Implementación | Uso |
|---|---|---|---|
| stroke/schematic | 1 | `border` | Plano técnico, bordes |
| stroke/icon | 1.5 | `strokeWidth={1.5}` en Lucide | Íconos |
| stroke/emphasis | 2 | `border-2` | Compartimento con faltantes o dañado, botón seleccionado |

## 5. Layout y breakpoints

- Mobile first. Mobile = base (sin prefijo), tablet = `md` (768 px), desktop = `lg` (1024 px).
- Los frames de Figma (390, 768 y 1440) son anchos de referencia de diseño, no puntos de corte.
- Mobile: barra inferior de navegación. Tablet y desktop: riel lateral.
- Formularios: ancho máximo de 720 px.

Variables de layout (colección `layout` de Figma), definidas en `:root` con `@media` por breakpoint:

| Variable CSS | Mobile | Tablet (`md`) | Desktop (`lg`) | Uso |
|---|---|---|---|---|
| `--layout-margin` | 16 | 24 | 32 | Margen lateral: `px-(--layout-margin)` |
| `--layout-gutter` | 16 | 16 | 24 | Espacio entre columnas: `gap-(--layout-gutter)` |
| `--size-control` | 48 | 44 | 40 | Alto de botones e inputs: `h-(--size-control)` |
| `--size-row` | 56 | 48 | 40 | Alto de fila de tablas y listas: `h-(--size-row)` |
| `--nav-rail` | 64 | 64 | 64 | Ancho del riel (no se usa en mobile) |
| `--nav-panel` | 0 | 0 | 240 | Segunda columna de zonas |
| `--nav-bottom` | 64 | 0 | 0 | Barra inferior (solo mobile) |
| `--content-form-max` | 720 | 720 | 720 | Ancho máximo de formularios |

Columnas de referencia: mobile 4 (margen 16), tablet 8 (margen 24), desktop 12 (margen 32).

## 6. Accesibilidad y uso en guardia

- Área táctil mínima en mobile: 48 px (guantes, apuro, poca luz).
- Acciones principales abajo, en la zona del pulgar.
- Anillo de foco visible siempre: 2 px `accent-text`, con 2 px de separación (`ring-2 ring-ring ring-offset-2 ring-offset-bg-base`).
- Contraste mínimo de texto: 4.5:1.
- Borde de inputs: `border-input` (3:1 o más).
- El texto deshabilitado (`text-disabled`) está exento del mínimo de contraste.

## 7. Interacción

- Acciones destructivas siempre con modal de confirmación.
- Toda lista o pantalla tiene versión de carga, vacío y error.
- Checklist de inspección: un compartimento por pantalla, botones Ok / Falta / Dañado por ítem, nota opcional. Sin fotos.
- Si un ítem tiene cantidad mayor a 1 y se marca Falta o Dañado, aparece un contador de unidades afectadas (mínimo 1, máximo la cantidad esperada).
- La inspección se puede pausar y retomar. Detalle en [flujos.md](./flujos.md).

## 8. Idioma

Solo español argentino, con voseo en los textos de interfaz. Separador de miles con punto (`17.389`).

## 9. Componentes

- Base: shadcn/ui. Se adapta con los tokens de este documento.
- Propios (no existen en shadcn):
  - **Lectura (`Readout`):** eyebrow + valor en mono.
  - **Botones del checklist (`Check item`):** Ok / Falta / Dañado con glifos.
  - **Plano de compartimentos:** generado desde los datos.
  - **Navegación:** barra inferior mobile y riel, con variantes por rol.

### Plano de compartimentos

- Se genera desde los datos (SVG o CSS Grid), no se ilustra un camión por tipo.
- Posición de cada compartimento: `fila`, `columna` y `span` del modelo. Sugerido: grilla de 12 columnas con `gap-2`.
- Un solo lado a la vez, con un segmentado de zonas.
- Al tocar un compartimento, la persiana se recoge (~200 ms) y aparece el contenido.
- Estado por trazo + glifo (nunca solo color):

| Estado | Trazo | Glifo |
|---|---|---|
| Operativo | Continuo 1 px | `circle-check` |
| Con observaciones | Discontinuo 1 px (dash `6 4`) | `triangle-alert` |
| Faltantes o dañado | Continuo 2 px | `octagon-x` |
| En mantenimiento | Punteado 1 px (dash `1 3`, extremos redondeados) | `wrench` |

- Seleccionado: borde de 2 px `accent-text`. El estado se sigue leyendo por el glifo de la esquina.
- En el plano, el código del compartimento va en `text-code`; el nombre completo se muestra en el panel de detalle.

## 10. Adaptación de shadcn

- Los componentes de `src/components/ui` usan variables (`--background`, `--primary`, `--border`, etc.) mapeadas a nuestros tokens al final de `tokens.css`. No se cambian colores dentro de los componentes: se cambia el mapeo.
- Inputs: fondo `bg-raised` y borde `border-input`.
- Foco: anillo de 2 px con 2 px de separación (ver sección 6).
- Las sombras de los componentes no se ven porque están desactivadas a nivel de tema. Un contorno de foco hecho con `ring` no cuenta como sombra de elevación.