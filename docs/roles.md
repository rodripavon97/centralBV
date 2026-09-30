# Roles

Qué rol usa qué herramienta y con qué dispositivo. Lo marcado como **pendiente** no fue decidido todavía.

## Roles

| Rol | Identificador | Qué hace | Dispositivo principal |
|---|---|---|---|
| Administrador general | `admin_general` | Gestiona usuarios y roles | Desktop |
| Administrativo | `administrativo` | Usa la herramienta de constancias de actuación | Desktop (PC de la guardia) |
| Inspector ("general") | `inspector` | Revisa los móviles, detecta fallas, informa cambios y mantenimientos | Celular |
| Administrador de móviles | `admin_moviles` | Da de alta, gestiona y configura los vehículos | Desktop y tablet |

## Acceso por herramienta

| Herramienta | admin_general | administrativo | inspector | admin_moviles |
|---|---|---|---|---|
| Usuarios y roles | Sí | No | No | No |
| Constancias de actuación | Pendiente | Sí | No | No |
| Lista y detalle de vehículos (lectura) | Pendiente | No | Sí | Sí |
| Inspección (checklist) | Pendiente | No | Sí | Pendiente |
| Informar novedad | Pendiente | No | Sí | Pendiente |
| Alta, edición y configuración de vehículos | Pendiente | No | No | Sí |
| Editor de plantilla de vehículo | Pendiente | No | No | Sí |

**Pendiente de decidir:**

1. Si el administrador general puede acceder a todas las herramientas o solo a usuarios y roles.
2. Si el administrador de móviles también puede hacer inspecciones.
3. Qué ve cada rol en el historial de inspecciones y novedades.

## Navegación por rol

Un solo componente de navegación (riel lateral en tablet y desktop, barra inferior en mobile) con variantes por rol. En mobile, máximo 4 o 5 destinos y área táctil de 48 px.

| Rol | Destinos |
|---|---|
| admin_general | Usuarios y roles |
| administrativo | Constancias |
| inspector | Vehículos, Novedades |
| admin_moviles | Vehículos, Plantillas |

Los destinos son una propuesta inicial y se ajustan cuando se definan los permisos cruzados.

## Contexto de uso

- **Constancias:** PC de la guardia, uso de escritorio.
- **Móviles:** celular, a veces con guantes, con apuro o con poca luz. Por eso el área táctil mínima es de 48 px, las acciones principales van abajo y la interfaz es oscura.
- La app se usa todo el día y también de noche, durante la guardia.

## Notas de implementación

- El rol viaja con el usuario autenticado y determina el layout y la navegación (`src/app`).
- Los permisos se validan del lado del servidor. Ocultar un destino en la interfaz no reemplaza esa validación.
- Tipo en código: `Rol` en `src/types/dominio.ts`.