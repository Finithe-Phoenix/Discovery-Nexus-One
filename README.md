# NEXUS ONE · Decision Edition v6

Demo: https://finithe-phoenix.github.io/Discovery-Nexus-One/

Una plataforma para explorar la operación. Una historia para explicar su valor. Una sala para evaluar la decisión.

## Evaluar solución

La consola y la historia v5 se conservan. **Evaluar solución** abre una sala de decisión disponible desde la vista de matriz, con tres áreas:

- **Prueba de negocio:** elegir un problema, recorrer el proceso y consultar eventos nuevos de esa sesión. La evidencia se enlaza a una referencia concreta de la bitácora. Una solicitud sin autorización no se etiqueta como un abono autorizado. Esta lectura no es aceptación contractual.
- **Caso económico:** capturar operaciones mensuales, minutos actuales/estimados, costo de trabajo por hora, porcentaje convertible en caja, costos mensuales e inversión inicial. No hay importes predeterminados ni precio negociado publicado. El ejemplo solo se carga mediante una acción explícita y empieza con conversión a caja del 0%.
- **Alcance y arranque:** separar la demo de lo pendiente de producción, discutir insumos y condiciones por etapa y descargar un resumen HTML imprimible de la evaluación.

Las cifras y notas de evaluación viven **solo en memoria de esta página**. No se envían, no se guardan en localStorage y se pierden al recargar. El archivo descargado sí puede incluir los valores que se hayan capturado: compartirlo solo con destinatarios autorizados. No introducir datos personales o confidenciales. Los datos operativos ficticios de la consola mantienen su persistencia anterior.

El cálculo diferencia horas liberadas de ahorro de caja. Puede mostrar caja negativa y ausencia de recuperación. No oculta tiempos estimados superiores a los actuales ni inventa una recuperación cuando la inversión es cero. El flujo de 12 meses es simple, desde operación estable: excluye impuestos, inflación, financiamiento y descuento; no es una proyección ni asesoría financiera.

## Consola y presentación conservadas

Once áreas: Centro de control, Operadores, Inventario SIM/eSIM, Red comercial, Ventas, Monedero, Comisiones, Autorizaciones, Reportes, Trazabilidad y Configuración. Tres vistas: Dirección, Distribuidor y Punto de venta. Incluye temas claro/oscuro, búsqueda Ctrl/Cmd K, exportación CSV, comprobantes, informe imprimible y adaptación móvil.

**Presentar** conserva Executive Experience: seis capítulos interactivos sobre visión, universos, trazabilidad, operación, control y evidencia. **Recorrido libre** mantiene los siete módulos guiados de la consola. El gráfico ejecutivo compara el periodo seleccionado con el anterior de igual duración; el deslizador permite consultar cada día con teclado o toque y la tabla muestra ambas fechas y valores.

## Escenario y límites

Corte fijo: 05 de septiembre de 2026. Sesenta días de historial sintético, 24 puntos, seis distribuidores y cuatro universos: Movistar, AT&T, Bait y Otros. Las marcas no implican acuerdos ni integración. Precios, reglas y operaciones son ficticios. Los importes del modelo operativo se guardan en centavos enteros.

Inventario y saldos de apertura son una fotografía; no se recalculan con el periodo. Cada punto tiene un monedero compartido entre sus operadores. Nuevas ventas, abonos, recepciones y cortes modifican los registros ficticios, guardados en localStorage en ese navegador, sin sincronización entre dispositivos. Navegar o abrir la evaluación no crea operaciones ni restablece datos.

El selector de perfil no es autenticación y la bitácora local no es inmutable. Backend, seguridad en servidor, integraciones, conciliación, disponibilidad, cumplimiento y rendimiento productivos requieren implementación y validación separadas. No se activan líneas, se reciben depósitos, se entregan eSIM reales ni se contacta a operadores. No incluye tienda pública, checkout, WhatsApp Business ni apps nativas.

## Desarrollo

Sin npm, compilación, backend, CDN ni claves:

```bash
python -m http.server 8000
```

Abrir http://localhost:8000/. La PWA requiere HTTPS o localhost y una carga inicial completa para la simulación sin conexión.

`decision-model.js` contiene la aritmética pura, `decision.js` la evaluación y `decision.css` la composición y mejoras puntuales de legibilidad. Estas funcionalidades usan el puente público `NexusApp`, el recorrido existente y consultas al modelo; no reemplazan ni escriben registros de ventas. `enterprise.js`, `experience.js` y `demo-store.js` se conservan sin cambios en v6.

Publicación: **gh-pages / raíz**. El workflow de validación no publica. Probar una rama antes de integrar en main y gh-pages; nunca volver al constructor antiguo de payloads. Versiones previas disponibles en el historial.

## Validación

```bash
node --test tests/model.test.cjs tests/decision.test.cjs
python -m pip install -r requirements-test.txt
python -m playwright install --with-deps chromium
python tests/browser_smoke.py
python tests/experience_smoke.py
python tests/decision_smoke.py
```

El workflow ejecuta las cuatro suites sobre HTTP, conserva reportes y adjunta código y capturas del commit probado. `NEXUS_INLINE_TEST=1` sirve solo para un laboratorio sin acceso HTTP y no prueba la PWA; los reportes marcan esas omisiones. No se afirma certificación WCAG ni compatibilidad con todos los navegadores. Las capturas deben revisarse además de las aserciones automáticas.

Guías: [Sala de decisión](docs/DECISION_ROOM.md), [Executive Experience](docs/EXECUTIVE_EXPERIENCE.md), [Recorrido libre](docs/DEMO_GUIDE.md).
