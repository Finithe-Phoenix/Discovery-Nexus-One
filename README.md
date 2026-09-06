# NEXUS ONE · Enterprise demo v3

**Una consola empresarial multioperador para demostrar operación, no solo pantallas.**

Demo: https://finithe-phoenix.github.io/Discovery-Nexus-One/

La experiencia reúne dirección, distribución y puntos de venta en una aplicación estática. El escenario es completamente ficticio; ninguna operación activa líneas, recibe depósitos, entrega perfiles eSIM reales o contacta a un operador.

## Experiencia

Once áreas de trabajo: Centro de control, Operadores, Inventario SIM/eSIM, Red comercial, Ventas y activaciones, Monedero y crédito, Comisiones y liquidación, Autorizaciones, Reportes, Trazabilidad y Configuración. Los perfiles restringen las vistas según el contexto de demostración.

El diseño incluye temas claro y oscuro, navegación móvil, tablas adaptadas a tarjetas, búsqueda global con Ctrl/Cmd K, exportación CSV, detalle lateral, comprobantes y un informe ejecutivo imprimible. **Presentar** abre un recorrido de siete momentos con una superficie ampliada para exposición; las flechas avanzan y retroceden, y Escape termina el recorrido.

## Procesos conectados

- **Venta:** selección de punto, operador y producto; revisión; confirmación o rechazo simulado. Una confirmación afecta inventario, saldo/crédito, venta, comisión y bitácora. Una misma referencia no se procesa dos veces.
- **Inventario:** recepción de un lote ficticio en matriz, asignación a un punto habilitado, estado en tránsito y confirmación de recepción. Una unidad específica puede venderse desde su detalle.
- **Monedero:** solicitud de abono con referencia DEMO, revisión por matriz y autorización o rechazo. El saldo solo aumenta al autorizar y no se acredita dos veces.
- **Comisiones:** cálculo por venta confirmada, corte según perfil/operador/periodo y exportación. El corte no realiza dispersión bancaria.

## Escenario reproducible

El corte es **05 de septiembre de 2026**, con 60 días de historial generado determinísticamente, 24 puntos de venta y seis distribuidores. Los cuatro universos son Movistar, AT&T, Bait y Otros. Los nombres de operadores no implican convenios ni integración. Productos, precios, reglas y comisiones son ficticios.

Los importes del modelo se guardan en centavos enteros. Los indicadores se calculan desde las operaciones, no mediante números independientes por pantalla. El inventario representa una fotografía inicial; los saldos son saldos de apertura del escenario y los nuevos movimientos los modifican. Inventario y monederos no se recalculan al cambiar de periodo. Cada punto tiene un monedero compartido entre sus operadores.

La información se guarda en `localStorage` únicamente en ese navegador. No existe sincronización entre dispositivos. En Configuración, **Restablecer escenario** elimina los cambios locales de esta demo y conserva el tema elegido.

## Ejecutar localmente

No requiere npm, build, backend, CDN ni claves:

```bash
python -m http.server 8000
```

Abrir http://localhost:8000/. La PWA y el service worker requieren HTTPS o localhost. El modo sin conexión sirve exclusivamente para la simulación, después de una primera carga completa. La instalación depende del navegador y del dispositivo.

## Código y publicación

| Archivo | Responsabilidad |
|---|---|
| `index.html` | Estructura semántica de la consola |
| `enterprise.css` | Sistema visual, responsive, temas y estilos de impresión |
| `demo-store.js` | Escenario, filtros, reglas e integridad de operaciones |
| `enterprise.js` | Vistas, navegación, formularios y presentación |
| `sw.js` | Caché limitada a los recursos de esta demo |
| `manifest.webmanifest` | Identidad e instalación PWA |
| `tests/` | Pruebas del modelo y aceptación de navegador |
| `docs/DEMO_GUIDE.md` | Guion para una presentación corporativa |

La publicación existente utiliza **`gh-pages` / raíz**. `main` conserva la misma base de código tras la entrega. Las mejoras deben probarse primero en una rama de trabajo y después integrarse en `main` y `gh-pages` sin reescribir el historial. El workflow de validación **no publica**: evita que un push al origen vuelva a reconstruir los antiguos payloads. El despliegue de Pages sigue siendo el de la rama configurada.

Los antiguos archivos `payload/*` y `v2.*` se retiran de la nueva base; continúan disponibles en el historial anterior. No volver a desplegar el antiguo constructor de payloads.

## Pruebas

```bash
node --check demo-store.js
node --check enterprise.js
node --check sw.js
node --test tests/model.test.cjs
python -m pip install -r requirements-test.txt
python -m playwright install --with-deps chromium
python tests/browser_smoke.py
```

El workflow `Validate NEXUS ONE Enterprise` ejecuta estas pruebas sobre HTTP en GitHub Actions y adjunta evidencia en `test-results/`. La suite de navegador comprueba módulos, filtros, procesos, descargas, ocho anchos de pantalla, diálogo y teclado, persistencia real y recarga sin conexión. Los resultados exactos pertenecen a cada ejecución; una marca verde de despliegue no sustituye estas pruebas.

`NEXUS_INLINE_TEST=1` habilita un modo explícito de renderizado sin red para laboratorios restringidos. Utiliza un doble de almacenamiento y **omite** HTTP, persistencia real y service worker. No debe utilizarse como evidencia de funcionamiento PWA.

## Límites

Es una demo comercial, no una plataforma productiva ni una prueba de rendimiento. El selector de perfil no es autenticación y la bitácora local no es inmutable. Seguridad en servidor, APIs, reversos externos, conciliación bancaria, alta disponibilidad, cumplimiento normativo y carga real requieren una implementación productiva y validación específica. No se afirma certificación de accesibilidad ni validación en todos los navegadores.

No incluye tienda pública, checkout, WhatsApp Business, aplicaciones nativas Android/iOS ni información confidencial. No introducir datos reales en el escenario.
