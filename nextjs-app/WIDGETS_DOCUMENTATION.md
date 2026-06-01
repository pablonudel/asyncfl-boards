# Widgets Documentation

Esta documentación describe los tipos de widgets disponibles en la plataforma AsyncFL Board, sus características y opciones de configuración.

## Tipos de Widgets

La plataforma ofrece tres tipos de widgets:

1. **Scatter Plots** - Gráficos de líneas/dispersión para visualizar métricas (accuracy, loss, etc.)
2. **Pareto Plots** - Gráficos para visualizar fronteras óptimas de Pareto
3. **Notes** - Editor de texto enriquecido para documentación

---

## Scatter Plots

Widgets para visualizar datos de simulaciones con soporte para múltiples traces (líneas/marcadores).

### Tipos de Scatter Plots

- **Rounds** - Visualización por rondas de entrenamiento
- **Time** - Visualización por tiempo de ejecución

### Configuración Básica

#### Graph Config (Pestaña Principal)

**Título y Dimensiones:**

- `Title` - Título del gráfico
- `Height (px)` - Altura del gráfico en píxeles (default: 400)

**Traces (Añadir múltiples):**

Cada trace representa una línea/conjunto de marcadores en el gráfico.

- **Trace Name** - Nombre identificativo del trace
- **Source** - Archivo `.npy` fuente (debe tener shape 3D: [simulations, rounds/time, results])
- **Normalize results** - Normaliza los valores entre 0 y 1

**Configuración de Datos:**

- **Y Data (Results)** - Índice de la dimensión de resultados a visualizar
- **Sims Aggregation** - Cómo agregar los datos de múltiples simulaciones:
  - `average` - Promedio de todas las simulaciones
  - `min` - Valor mínimo
  - `max` - Valor máximo
  - `median` - Mediana
- **Show Band** - Mostrar banda de confianza (solo con `average`):
  - `none` - Sin banda
  - `std` - Desviación estándar
  - `minmax` - Rango mínimo-máximo

**Modo de Visualización:**

- **Trace Mode** - Tipo de visualización:
  - `lines` - Solo líneas
  - `markers` - Solo marcadores
  - `lines+markers` - Líneas y marcadores

**Configuración de Línea** (si el modo incluye `lines`):

- **Shape** - Forma de la línea:
  - `linear` - Líneas rectas
  - `spline` - Curvas suaves
  - `hv`, `vh`, `hvh`, `vhv` - Escalones
- **Dash** - Estilo de línea:
  - `solid`, `dot`, `dash`, `longdash`, `dashdot`, `longdashdot`
- **Width** - Grosor de la línea (1-10)
- **Color** - Color de la línea (selector de color)

**Configuración de Marcadores** (si el modo incluye `markers`):

- **Symbol** - Forma del marcador:
  - `circle`, `square`, `diamond`, `cross`, `x`, `triangle-up`, `triangle-down`, `pentagon`, `hexagon`, `star`
- **Size** - Tamaño del marcador (3-20)
- **Color** - Color del marcador (selector de color)

**Hover Information:**

- **Hover Info** - Información al pasar el cursor:
  - `all` - Toda la información
  - `name` - Solo el nombre
  - `x` - Solo valor X
  - `y` - Solo valor Y
  - `x+y` - Valores X e Y
  - `template` - Plantilla personalizada
  - `none` - Sin información
- **Hover Template** - Plantilla personalizada (si se selecciona `template`):
  - Ejemplo: `Y Title %{y} | X Title %{x}`

#### Advanced Layout Config (Pestaña Avanzada)

**X-Axis (Eje X):**

- **Visible** - Mostrar/ocultar el eje
- **Axis Title** - Título del eje
- **Side** - Posición del eje: `bottom` o `top`
- **Grid**:
  - **Show Grid** - Mostrar/ocultar líneas de cuadrícula
  - **Grid Dash** - Estilo de cuadrícula: `solid`, `dot`, `dash`
- **Ticks**:
  - **Tick Angle** - Ángulo de rotación de las etiquetas (-90 a 90 grados)
  - **Tick Prefix** - Prefijo para las etiquetas (ej: "$")
  - **Tick Suffix** - Sufijo para las etiquetas (ej: "ms", "%")

**Y-Axis (Eje Y):**

- Mismas opciones que X-Axis
- **Side** - Posición: `left` o `right`

**Legend (Leyenda):**

- **Visible** - Mostrar/ocultar la leyenda
- **Orientation** - Orientación:
  - `h` - Horizontal
  - `v` - Vertical
- **X Position** - Posición horizontal (-2 a 3, donde 0 es izquierda, 1 es derecha)
- **Y Position** - Posición vertical (-2 a 3, donde 0 es abajo, 1 es arriba)

---

## Pareto Plots

Widgets para visualizar fronteras óptimas de Pareto (trade-off entre tiempo y energía).

### Configuración Básica

#### Graph Config

**Título y Dimensiones:**

- `Title` - Título del gráfico
- `Height (px)` - Altura del gráfico en píxeles (default: 400)

**Configuración de Datos:**

- **Source** - Archivo fuente procesado (sin shape definida, resultados del script `pareto_opt.py`)

**Nota:** El gráfico Pareto viene preconfigurado con:

- Modo: `lines+markers`
- Ejes por defecto: X = "Time τ", Y = "Energy E"
- Estilo predefinido optimizado para fronteras de Pareto

#### Advanced Layout Config

Mismas opciones que Scatter Plots (configuración de ejes X, Y y leyenda).

---

## Notes

Editor de texto enriquecido para documentación y notas del proyecto.

### Características

**Formato de Texto:**

- **Negrita** - Texto en negrita
- **Cursiva** - Texto en cursiva
- **Subrayado** - Texto subrayado
- **Tachado** - Texto tachado
- **Color** - Color de texto personalizado
- **Resaltado** - Resaltar texto con color de fondo

**Estructura:**

- **Encabezados** - H1, H2, H3, H4, H5, H6
- **Párrafos** - Texto normal
- **Listas ordenadas** - Listas numeradas
- **Listas de tareas** - Checkboxes interactivos

**Elementos Avanzados:**

- **Enlaces** - Hipervínculos a URLs externas
- **Tablas** - Tablas editables con filas y columnas
- **Ecuaciones matemáticas (KaTeX)** - Fórmulas matemáticas renderizadas
- **Callouts** - Bloques destacados para notas/advertencias
- **Línea horizontal** - Separadores visuales
- **Imágenes** - Soporte para insertar imágenes

**Utilidades:**

- **Altura de línea** - Espaciado entre líneas
- **Familia de fuente** - Diferentes tipografías
- **Tamaño de fuente** - Ajustar tamaño del texto
- **Alineación** - Izquierda, centro, derecha, justificado
- **Indentación** - Sangría de párrafos
- **Deshacer/Rehacer** - Historial de cambios

### Comandos de Barra (Slash Commands)

Presiona `/` en el editor para acceder a un menú de comandos rápidos.

### Autoguardado

El widget de notas muestra un badge de estado:

- **Saved** (Verde) - Los cambios están guardados
- **Unsaved** (Rojo) - Hay cambios sin guardar

Los cambios se guardan automáticamente con un debounce de 300ms durante la edición, pero debes hacer clic en "Save" para confirmar los cambios definitivamente.

---

## Requisitos de Archivos

### Para Scatter Plots

- Formato: `.npy` (NumPy array)
- Shape requerida: **3 dimensiones** `[n_simulations, n_rounds_or_time, n_results]`
- Ejemplo: `[10, 100, 2]` → 10 simulaciones, 100 rondas, 2 métricas (accuracy, loss)

### Para Pareto Plots

- Formato: Archivo procesado por `pareto_opt.py`
- Shape: Sin dimensiones específicas (archivo plano con coordenadas de la frontera óptima)

---

## Flujo de Trabajo

### Crear un Widget

1. Desde la vista del proyecto, haz clic en "Add Widget"
2. Selecciona el tipo de widget (Scatter, Pareto, Notes)
3. Configura las opciones en las pestañas disponibles
4. Haz clic en "Save" para crear el widget

### Editar un Widget

1. Haz clic en el ícono de edición (⚙️) en el widget
2. Modifica la configuración deseada
3. Haz clic en "Save" para aplicar los cambios
4. El widget se actualizará automáticamente en el proyecto

### Consideraciones

- **Múltiples Traces:** Los Scatter Plots pueden tener múltiples traces para comparar diferentes métricas o experimentos
- **Eliminación de Traces:** Los traces se pueden eliminar individualmente con el botón "Remove Trace" (requiere al menos 1 trace)
- **Validación:** Los formularios validan automáticamente los datos ingresados antes de guardar
- **Actualización:** Los widgets se actualizan en tiempo real al cambiar la configuración

---

## Ejemplos de Uso

### Ejemplo 1: Comparar Accuracy de Múltiples Experimentos

1. Crear Scatter Plot tipo "Rounds"
2. Añadir trace "Experiment A":
   - Source: `exp_a_results.npy`
   - Y Data: 0 (accuracy)
   - Aggregation: average
   - Show Band: std
3. Añadir trace "Experiment B":
   - Source: `exp_b_results.npy`
   - Y Data: 0 (accuracy)
   - Aggregation: average
   - Show Band: std
4. Configurar ejes:
   - X-Axis Title: "Training Rounds"
   - Y-Axis Title: "Accuracy"

### Ejemplo 2: Visualizar Frontera de Pareto

1. Ejecutar script `pareto_opt.py` con tus datos de tiempo/energía
2. Subir el archivo resultante al proyecto
3. Crear Pareto Plot
4. Seleccionar el archivo procesado como Source
5. Los ejes ya están preconfigurados para Time/Energy

### Ejemplo 3: Documentar Experimentos

1. Crear Notes widget
2. Usar encabezados para estructurar:
   - H1: Título del experimento
   - H2: Hipótesis
   - H3: Metodología
3. Añadir ecuaciones con KaTeX para fórmulas
4. Usar callouts para destacar resultados clave
5. Insertar tablas para comparar métricas

---

## Tips y Mejores Prácticas

1. **Organización:** Usa títulos descriptivos para los widgets y traces
2. **Colores:** Asigna colores consistentes para facilitar la comparación
3. **Normalización:** Usa normalización cuando compares métricas con diferentes escalas
4. **Bandas de Confianza:** Muestra bandas cuando tengas múltiples simulaciones para visualizar variabilidad
5. **Hover Templates:** Personaliza los hover templates para mostrar información relevante
6. **Notes:** Documenta tus experimentos y configuraciones en widgets de notas para referencia futura
7. **Layout:** Ajusta la posición de la leyenda si esta cubre datos importantes del gráfico
