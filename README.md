# NEXUS ONE · Operational Experience v8

**Una plataforma para explorar la operación. Una historia para explicar su valor.**

Demo: https://finithe-phoenix.github.io/Discovery-Nexus-One/

NEXUS ONE es una demostración interna multioperador de SIM, eSIM, inventario, red comercial, monedero, crédito, ventas, comisiones y trazabilidad. Los datos, precios, productos y operaciones son ficticios. No se contacta a operadores, se activan líneas, se reciben depósitos ni se entrega una eSIM real.

## Un tablero para trabajar

Los indicadores abren el Centro de control. La evolución de ventas y las prioridades operativas comparten la primera fila de trabajo; después aparecen el resultado por operador y la red habilitada. En móvil, el orden de lectura es el mismo. La ruta de presentación y evaluación sigue disponible debajo de los indicadores para Dirección.

Cada operador muestra importe exacto, participación y número de operaciones confirmadas, con acceso a su universo sin perder perfil ni periodo. El monedero del perfil muestra saldo y crédito disponibles, separados de las solicitudes aún no acreditadas. Se explicita qué depende del periodo, qué es inventario al corte y qué saldo se comparte entre operadores. La red del tablero respeta también la habilitación del operador seleccionado.

Textos, tablas, formularios y filtros usan una escala más legible; los filtros de operador se desplazan en móvil sin comprimir las etiquetas. Se conservan los controles de teclado, los temas y las acciones existentes. No cambia el modelo de transacciones ni se añade un backend.

## Una ruta ejecutiva, dos momentos

La portada conecta ahora las dos experiencias que sostienen una reunión corporativa. **Presentar historia** abre los seis capítulos que explican el modelo operativo; **Evaluar solución** enlaza la prioridad del comprador con evidencia generada durante la sesión, una hipótesis explícita de capacidad y el siguiente paso propuesto. Si una evaluación ya comenzó, la portada muestra su avance sin convertirlo en una puntuación comercial.

La ruta conserva la identidad grafito, porcelana y cobalto, el tablero visible y todos los límites de la demostración. No añade procesos, integraciones ni compromisos fuera del alcance acordado.

## Evaluar el valor, no solo recorrer pantallas

**Evaluar** abre un espacio para Dirección: prioridad de negocio, cinco criterios de evidencia nueva, hipótesis de capacidad operativa y siguiente paso propuesto. El historial precargado no se cuenta como una prueba realizada en la evaluación. Una guía abre los procesos existentes; no crea operaciones automáticamente.

La calculadora comienza vacía y estima horas con supuestos explícitos; no promete ahorros monetarios. El resumen exportado es HTML local, imprimible, sin scripts ni envíos. No contiene la cotización privada ni constituye aceptación comercial. [Guía completa de evaluación](docs/BUSINESS_EVALUATION.md).

Los accesos del tablero a rechazos e inventario en tránsito abren ahora los filtros correspondientes, y cada evidencia permite consultar su evento exacto.

## Presentar

El botón **Presentar** abre Executive Experience: seis capítulos interactivos con la identidad grafito, porcelana y cobalto. La apertura no bloquea el acceso habitual a la consola ni se reproduce automáticamente.

1. **Visión:** matriz, distribución, puntos de venta y operadores en un modelo conceptual.
2. **Universos:** resultados consolidados y por operador, calculados desde las operaciones del escenario.
3. **Trazabilidad:** una SIM ficticia existente, su responsable y su historia.
4. **Operación:** confirmación explícita de una venta o rechazo simulado; cinco efectos conectados al modelo.
5. **Control:** solicitud de abono por el punto y autorización de matriz, con actualización del saldo una sola vez.
6. **Evidencia:** resultados y eventos relacionados con la última venta y el abono preparados en esta historia, con acceso al informe y a la consola.

**Comenzar la historia** avanza al segundo capítulo. **Recorrido libre** conserva la presentación guiada de siete módulos de la consola. Escape cierra el diálogo y devuelve el foco. El capítulo actual se conserva mientras permanece abierta la misma página; una recarga reinicia el recorrido, pero mantiene los datos locales del modelo.

Guía: [Executive Experience](docs/EXECUTIVE_EXPERIENCE.md). El [guion de módulos](docs/DEMO_GUIDE.md) corresponde al recorrido libre anterior.

## Consola conservada

Once áreas: Centro de control, Operadores, Inventario SIM/eSIM, Red comercial, Ventas, Monedero, Comisiones, Autorizaciones, Reportes, Trazabilidad y Configuración. Tres vistas: Dirección, Distribuidor y Punto de venta. Incluye temas claro/oscuro, búsqueda Ctrl/Cmd K, exportación CSV, comprobantes, informe imprimible y adaptación móvil.

El gráfico ejecutivo compara el periodo seleccionado con el anterior de igual duración. Un control deslizante accesible por teclado o toque muestra valores diarios y ambas fechas. La tabla del gráfico contiene la misma información. Los datos no son cifras independientes colocadas por pantalla.

## Escenario y límites

Corte fijo: **05 de septiembre de 2026**. Sesenta días de historial sintético, 24 puntos, seis distribuidores y cuatro universos: Movistar, AT&T, Bait y Otros. Las marcas no implican acuerdos ni integración. Los importes del modelo se guardan en centavos enteros.

Inventario y saldos de apertura son una fotografía del escenario; no se recalculan con el filtro de periodo. El monedero es único por punto y compartido entre sus operadores. Nuevas ventas, abonos, recepciones y cortes sí modifican sus registros. Los datos se guardan en `localStorage` solo en ese navegador, sin sincronización entre dispositivos.

Navegar, cambiar capítulos o explorar operadores **no genera operaciones ni restablece datos**. Solo los botones explícitos de confirmación escriben en el modelo. Configuración > Restablecer escenario elimina los cambios locales de esta demo, no los del repositorio.

El selector de perfil no es autenticación; la bitácora local no es inmutable. Backend, seguridad en servidor, integraciones, conciliaciones, disponibilidad, cumplimiento y rendimiento productivos requieren implementación y validación separadas. No se afirma certificación de accesibilidad ni compatibilidad con todos los dispositivos.

No incluye tienda pública, checkout, WhatsApp Business, apps nativas ni datos confidenciales. No introducir datos reales.

## Desarrollo

Sin npm, compilación, backend, CDN ni claves:

```bash
python -m http.server 8000
```

Abrir http://localhost:8000/. PWA y caché requieren HTTPS o localhost. La simulación sin conexión requiere una primera carga completa; no implica operar servicios telefónicos sin red.

| Archivo | Responsabilidad |
|---|---|
| `demo-store.js` | Modelo y reglas de las operaciones; sin cambios en v5 |
| `enterprise.js` | Consola y puente explícito `NexusApp` |
| `enterprise.css` / `premium.css` | Base, lenguaje visual y superficies operativas v8 |
| `experience.js` / `experience.css` | Historia, interacciones y gráfico comparativo v5 |
| `decision-core.js` / `decision.js` / `decision.css` | Evaluación v6 y ruta ejecutiva v7 |
| `index.html`, `sw.js`, `manifest.webmanifest` | Entrada, caché e instalación |
| `tests/` | Modelo, regresión de consola y aceptación de historia |

La publicación usa **gh-pages / raíz**. El workflow de validación no publica. Probar en una rama antes de integrar en `main` y `gh-pages`; nunca volver al constructor de payloads antiguo. Las versiones previas permanecen en el historial.

## Validación

```bash
node --check enterprise.js
node --check experience.js
node --check sw.js
node --test tests/model.test.cjs tests/decision.test.cjs
python -m pip install -r requirements-test.txt
python -m playwright install --with-deps chromium
python tests/browser_smoke.py
python tests/experience_smoke.py
python tests/decision_smoke.py
```

GitHub Actions ejecuta las suites sobre HTTP con almacenamiento y service worker reales. Adjunta reportes, capturas y el código de la ejecución. Las comprobaciones incluyen reglas monetarias, duplicados, flujos, exportación, navegación, teclado, dos temas, tamaños de pantalla, persistencia y recarga sin conexión.

La regresión v8 contrasta el tablero contra el modelo en siete combinaciones de perfil, operador y periodo: importes por operador, suma consolidada, monedero compartido y red habilitada. Comprueba que explorar no modifica el libro de operaciones y que el acceso a un universo conserva el contexto. Amplía la revisión de desbordamiento a ocho superficies de trabajo, cuatro anchuras y dos temas, además de mínimos de tamaño de texto y filtros táctiles. Son comprobaciones automatizadas específicas, no una certificación de accesibilidad.

`NEXUS_INLINE_TEST=1` es un modo de renderizado para laboratorios restringidos: usa un doble de almacenamiento y omite HTTP/PWA. No equivale a una prueba de funcionamiento sin conexión. Los conteos y resultados válidos están en los reportes de cada ejecución, no en una promesa de este README.
