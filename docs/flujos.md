# Flujos

Resumen de los recorridos de usuario y de las reglas de negocio definidas en el diseño. Lo marcado como **pendiente** todavía no está decidido.

## 1. Inspector (mobile)

```
Login → Lista de vehículos → Detalle del vehículo → Checklist → Resumen → Confirmación
                                      │                  ↑
                                      └── (ver plano, historial, sin inspeccionar)
```

El inspector elige el vehículo de una lista. No hay escaneo de QR.

### Pantallas

**Login**
- Usuario y contraseña, botón principal abajo.
- Estados: error de credenciales, cargando.

**Lista de vehículos** (pantalla de inicio del inspector)
- Buscador y chips de filtro: Todos, Operativos, Con observaciones, Fuera de servicio, En mantenimiento.
- Cada tarjeta muestra: código en mono (`AB-03`), tipo, badge de estado y última inspección (eyebrow + fecha y hora).
- Orden por defecto: primero las inspecciones **pausadas**, después los vehículos **no inspeccionados en el turno**, al final los ya inspeccionados.
- Las tarjetas con inspección pausada muestran "En curso 4/11", "Pausada hace 12 min" y el botón **Continuar**.
- Estados: cargando, lista vacía, sin resultados de búsqueda, error de carga.

**Detalle del vehículo**
- Cabecera con código, tipo y estado.
- Lecturas: kilometraje, próximo cambio de aceite, ítems con novedades.
- Segmentado de zonas y plano de compartimentos (solo lectura).
- Botón fijo abajo: **Iniciar inspección**.
- Si existe una inspección pausada: el botón pasa a **Continuar inspección**, con la acción secundaria **Empezar de nuevo** (pide confirmación) y un aviso "Inspección pausada por [nombre] a las [hora]".
- Si el vehículo está en mantenimiento o fuera de servicio, no se puede iniciar una inspección: se muestra un aviso y queda solo **Informar novedad**.

**Checklist** (un compartimento por pantalla)
- Arriba: mini plano con el compartimento actual resaltado y progreso global ("Compartimento 4 de 11").
- Lista de ítems. Cada ítem tiene botones **Ok / Falta / Dañado** de 48 px.
- Si el ítem tiene cantidad mayor a 1 y se marca Falta o Dañado, aparece un contador de unidades afectadas (mínimo 1, máximo la cantidad esperada, valor inicial 1). Si luego se cambia a Ok, el contador desaparece y su valor se descarta.
- Nota opcional por ítem. **Sin fotos.**
- Botón fijo abajo: **Siguiente compartimento**, habilitado cuando ningún ítem queda en pendiente.
- Botón **Pausar** siempre visible.

**Resumen**
- Novedades agrupadas por compartimento, con cantidades (por ejemplo: "Manguera 45 mm, 2 de 4 dañadas, BL-2").
- Sin novedades: mensaje claro de "Sin novedades".
- Observación general opcional.
- Botones: **Enviar inspección** (principal) y **Volver a revisar** (secundario).

**Confirmación**
- Inspección registrada, con hora y resumen corto.
- Acciones: volver a la lista o inspeccionar el siguiente vehículo.

### Flujos secundarios

- **Informar novedad sin inspección completa:** desde el detalle, formulario corto (compartimento, ítem, tipo de falla, nota).
- **Vehículo ya inspeccionado en el turno:** el detalle muestra la inspección anterior y pide confirmar antes de iniciar otra.
- **Sin conexión:** pendiente (ver reglas abiertas).

## 2. Pausar y retomar una inspección

La inspección no es una acción única: tiene estados.

```
en_curso ⇄ pausada → enviada
    │         │
    │         └──→ incompleta (vencida)
    └──→ descartada
```

| Estado | Significado |
|---|---|
| `en_curso` | Alguien la está completando |
| `pausada` | Guardada a medias, se puede retomar |
| `enviada` | Terminada y registrada |
| `descartada` | Cancelada por el usuario |
| `incompleta` | Pausa vencida; queda en el historial |

### Reglas definidas

- **Guardado automático:** cada respuesta se guarda al instante. No hay botón "guardar".
- **Salir del checklist:** se abre un modal con tres opciones: **Pausar y salir** (principal), **Seguir inspeccionando** y **Descartar** (destructiva, con confirmación aparte).
- **Quién puede retomar:** cualquier inspector. La pantalla muestra quién la empezó y cuándo.
- **Una sola inspección abierta por vehículo.** Si otro inspector abre un vehículo con una pausa, se le ofrece continuar la existente, no crear otra.
- **Estado del vehículo:** se recalcula solo al **enviar**, no mientras hay una pausa. Una inspección a medias no cambia el estado del vehículo.
- **Confirmación de pausa:** pantalla con "Inspección pausada. Podés retomarla desde la lista", con dos acciones (volver a la lista o inspeccionar otro vehículo).

### Reglas pendientes de decidir

1. **Vencimiento de pausas.** Propuesta: que caduquen al terminar el turno o a las 24 horas y queden como `incompleta` en el historial.
2. **Sin conexión.** Propuesta: guardar el borrador en el dispositivo y sincronizar al volver la señal.
3. **Regla de estado al enviar.** Qué respuestas dejan al vehículo en "Con observaciones" y cuáles en "Fuera de servicio" (por ejemplo, qué pasa con un ítem crítico dañado).

## 3. Administrador de móviles (desktop y tablet)

Hecho:

- **Alta (US04):** `/moviles/nuevo`, solo AUTOMOTORES (ADMIN siempre). Patente y número interno se normalizan ("ab 123 cd" → AB123CD, "m1" → M-1); una patente con formato desconocido pide confirmación. El móvil queda Operativo y se vuelve a la lista con el aviso.
- **Dashboard de flota (US05):** contadores por estado, filtros por estado y tipo (en la URL) y tarjetas con código de color. Orden natural y paginación en el front: 12 por página, 6 en mobile.
- **Lista y ficha (US06):** `/moviles` busca por número interno o patente (`?q=`, con 300 ms de espera). Sin resultados muestra "Móvil no encontrado". Cada fila (o tarjeta, en mobile) abre `/moviles/$id`, con las pestañas Datos generales, Inventario y Última revisión. Inventario (US17) y Última revisión (US07) muestran por ahora su estado vacío. Un id inexistente o inválido muestra "Móvil no encontrado". Los dados de baja no salen en la búsqueda, pero su ficha abre por URL.
- La baja definitiva es solo de ADMIN.

Pantallas previstas:

1. **Lista de vehículos** (tabla), con filtros por estado y tipo.
2. **Alta y edición de vehículo:** datos generales, kilometraje, cambio de aceite y mantenimientos.
3. **Editor de plantilla de vehículo:** riel de navegación, lista de zonas, lienzo con grilla editable (fila, columna y span, con ajuste a la grilla) y panel de detalle del compartimento seleccionado.

Reglas:

- Los tipos de vehículo (autobomba, rescate, transporte de personal, van, etc.) son **plantillas** de zonas y compartimentos que se duplican y editan.
- Un vehículo de transporte de personal puede tener solo las zonas "Cabina" y "Baúl".
- En mobile el editor no se muestra: aviso "Editá esta plantilla desde una tablet o computadora".
- Modelo de datos: Vehículo → Zona → Compartimento (fila, columna, span) → Ítem. El diseño visual sale del modelo y no al revés.

## 4. Constancias de actuación (desktop)

Formulario desktop-first, con ancho máximo de 720 px y secciones condicionales:

- **Tipo de siniestro:** vehículo o vivienda. Los campos cambian (una vivienda no tiene patente).
- **Destino:** seguro (requiere póliza) o acción social (viviendas).
- Al completar el formulario se genera un **PDF A4 con membrete** a partir de una plantilla oficial. La plantilla queda fuera del sistema de diseño de la app y comparte solo las fuentes y el rojo de marca.

### Generar la constancia (US10)

Desde el detalle de una solicitud pendiente, **Generar constancia** abre `/solicitudes/$id/generar`:

- La plantilla aparece con los datos de la solicitud ya volcados. Se puede agregar un texto adicional (observaciones) antes de guardar.
- Al guardar se llama a `PATCH /solicitudes/:id/generar-constancia`: la solicitud pasa a REALIZADA y el back devuelve el PDF de 3 hojas.
- La misma pantalla queda como visor: riel con las 3 hojas, **Descargar PDF** e **Imprimir**.
- **Descargar PDF** usa `GET /solicitudes/:id/pdf`, disponible solo en REALIZADA, FIRMADA o RETIRADA. El back también lo valida.
- **Imprimir** abre un diálogo con las 3 hojas en A4 (la hoja 1 queda en el cuartel; las hojas 2 y 3 se entregan).
- Las hojas 1, 2 y 3 comparten membrete y datos. Solo la hoja 1 lleva los espacios de RETIRO, DNI, FIRMA y FECHA.

### Firmar la constancia (US44 · T31)

- En el visor de una solicitud REALIZADA aparece **Marcar como firmada**. Se usa cuando la hoja 1 impresa ya tiene la firma.
- Llama a `PATCH /solicitudes/:id/firmar` (REALIZADA → FIRMADA). La pantalla queda en el visor con el estado actualizado y el aviso "Constancia marcada como firmada. Ya se puede entregar."

### Historial de solicitudes (US47)

- `/solicitudes` tiene dos pestañas: **Activas** (US09) e **Historial** (`?vista=historial`).
- El historial usa `GET /solicitudes/completadas`: solo trae las entregadas (RETIRADA), con búsqueda, orden por fecha de alta y paginación. No tiene filtro de estado.
- Columnas: N.º, fecha de alta, damnificado con DNI, estado, fecha y hora de entrega y quién retiró.

Pendiente: definir el listado exacto de campos por tipo y por destino.

## 5. Usuarios y roles (desktop)

Gestión de usuarios, asignación de roles y permisos por el administrador general. Ver [roles.md](./roles.md).

## 6. Recuperación de contraseña (US03)

```
Login → Recuperá tu contraseña → Revisá tu correo → Creá tu nueva contraseña
                                                         ├── Contraseña restablecida
                                                         └── El enlace ya no es válido
```

Pantallas públicas, con la misma estructura de dos columnas del login:

1. **Recuperá tu contraseña.** Correo electrónico y **Enviar enlace**. Estados: formato inválido y enviando.
2. **Revisá tu correo.** Confirmación genérica: "Si tu cuenta existe, te enviamos un enlace…". Acciones: **Reenviar enlace** y volver al login.
3. **Creá tu nueva contraseña.** Nueva contraseña y confirmación, con **Ver contraseña** y el texto de requisitos. Estados: no coinciden, guardando y contraseña igual a la anterior.
4. **Contraseña restablecida.** "Ya podés ingresar con tu nueva contraseña. El enlace que usaste ya no funciona." Acción: **Ir a iniciar sesión**.
5. **El enlace ya no es válido.** Se muestra si falta el token, venció o ya se usó. Acción: **Pedir un nuevo enlace**.

Reglas:

- El enlace es único, vale **2 horas** y se puede usar una sola vez.
- La pantalla de confirmación no revela si el correo existe (evita enumeración de cuentas).
- Los requisitos de la nueva contraseña son los de US01: 8 o más caracteres, una mayúscula, una minúscula y un número.
- Si la nueva contraseña es igual a la anterior: "La contraseña nueva no puede ser igual a la anterior".
- Después de restablecer, el token se inhabilita. El front lo borra de la URL y de `sessionStorage`, y recuerda el token usado para mostrar el estado inválido si se reabre el enlace.
- Endpoints del back: `POST /auth/forgot-password` y `POST /auth/reset-password`.
- El `redirectTo` que arma el back en el correo tiene que apuntar al front (`/update-password` o `/restablecer-contrasena`), no al puerto del back.

## 7. Estados que tiene que tener toda pantalla

Normal, cargando, vacío y error. En la lista de vehículos, además, "sin resultados de búsqueda".