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
- Al completar el formulario se genera un **PDF A4 con membrete** a partir de una plantilla Handlebars. La plantilla queda fuera del sistema de diseño de la app y comparte solo las fuentes y el rojo de marca.

Pendiente: definir el listado exacto de campos por tipo y por destino.

## 5. Usuarios y roles (desktop)

Gestión de usuarios, asignación de roles y permisos por el administrador general. Ver [roles.md](./roles.md).

## 6. Estados que tiene que tener toda pantalla

Normal, cargando, vacío y error. En la lista de vehículos, además, "sin resultados de búsqueda".