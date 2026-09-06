# NEXUS ONE / Evaluación de negocio v6

## Objetivo

Conectar una prioridad del comprador con una prueba del proceso y un próximo paso explícito. La v6 no sustituye la consola ni la historia v5; agrega un espacio de evaluación para Dirección y matriz, accesible desde **Evaluar**, el centro de control o el cierre de la historia.

## 1. Prioridad

Tres preguntas de negocio, no tres paquetes comerciales: ubicación de cada SIM; control de saldo y autorizaciones; crecimiento de la red sin perder visibilidad. La selección es una hipótesis para conversar, no un diagnóstico obtenido de datos del cliente.

## 2. Evidencia

**Iniciar evaluación** toma una referencia del historial existente, sin restablecer el escenario ni crear operaciones. Los cinco criterios solo observan nuevos eventos posteriores a esa referencia:

| Criterio | Relación observada |
|---|---|
| Unidad trazable | Recepción de lote nuevo, asignación y recepción de la misma unidad |
| Venta conectada | Venta confirmada de SIM/eSIM con unidad vendida, propietario y operador correspondientes; cargo + comisión = venta |
| Rechazo sin cargo | Intento rechazado con cargo y comisión en cero, sin unidad consumida en su registro |
| Abono autorizado | Solicitud creada durante la revisión y autorización posterior con la misma referencia |
| Comisión en corte | Venta nueva de esta evaluación incluida en un corte posterior del universo correspondiente |

El historial precargado no satisface los criterios. **Probar proceso** abre el formulario normal de la consola; el usuario revisa y confirma las operaciones. **Ver evento** abre la bitácora filtrada por el identificador exacto. La guía de proceso permite volver a la evaluación sin perder el avance.

El conteo mide relaciones entre registros locales, no la aceptación comercial del cliente ni una certificación de controles productivos. Los registros son editables en el navegador. La prueba técnica integral de no afectación por un rechazo también se encuentra en las suites del modelo y navegador.

**Revisar desde cero** pide confirmación y reinicia solo el seguimiento y la valoración, no ventas ni saldos. **Restablecer escenario** en Configuración también limpia la evaluación y sus supuestos. Si desaparecen eventos de la referencia inicial, se solicita comenzar otra evaluación.

## 3. Impacto

La calculadora comienza vacía. Pide volumen diario, días al mes, minutos actuales, minutos objetivo y porcentaje de adopción efectiva. Al editar cualquier dato, invalida el resultado anterior. No se cargan datos de operación ni resultados de una empresa real.

Capacidad potencialmente recuperable (h/mes) = operaciones/día × días/mes × (minutos actuales − minutos objetivo) × adopción / 100 / 60.

El resto del volumen conserva el tiempo actual. No se incluyen precios del proyecto, ingresos, tasa de descuento ni ahorro monetario. No se interpreta el resultado como rentabilidad, reducción de personal ni garantía de eficiencia. El objetivo se debe medir en piloto. No admite objetivos más lentos dentro de esta estimación de capacidad ni entradas inválidas.

## 4. Siguiente paso

La valoración del proceso (sin revisar, encaja, requiere adecuaciones) y el siguiente paso se eligen manualmente. Jamás se infieren de una puntuación técnica. La ruta de implementación es una propuesta para discutir: reglas, integración, piloto y arranque. No implica fechas, piloto contratado ni recursos ya asignados.

**Guardar resumen de evaluación** descarga un HTML imprimible sin JavaScript. Incluye prioridad, referencias de demo, pendientes, fórmula y supuestos, valoración manual y próximo paso propuesto. No envía un correo, agenda una reunión ni acepta un contrato. Precio, plazo y condiciones se mantienen en la propuesta comercial privada, fuera del sitio público.

## Correcciones de navegación

La prioridad de rechazos del tablero ahora abre Ventas con estado Rechazada. La prioridad de inventario abre las unidades En tránsito. Se preservan perfil, periodo y operador. El puente `NexusApp.openFiltered` valida la navegación permitida y las opciones de estado antes de aplicar un filtro.

## Datos y seguridad

La evaluación usa `nexus-decision-v1` en localStorage. Contiene únicamente elecciones, supuestos numéricos e identificadores del escenario. No tiene analítica, correo, backend ni telemetría. Los datos no se sincronizan entre dispositivos. La demo sigue sin autenticación productiva, operadores conectados ni activaciones reales.

Los formularios y diálogos toman como referencia los patrones WAI-ARIA de foco de entrada, recorrido de teclado, Escape y devolución al control que los abrió. Los controles de acciones nuevos tienen áreas táctiles explícitas. Esto no constituye una certificación WCAG ni una prueba con todos los lectores de pantalla.

Referencias de diseño: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/ y https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html

## Pruebas

`node --test tests/model.test.cjs tests/decision.test.cjs`

`python tests/browser_smoke.py`

`python tests/experience_smoke.py`

`python tests/decision_smoke.py`

Las suites se ejecutan sobre HTTP en Actions. El modo `NEXUS_INLINE_TEST=1` solo comprueba renderizado e interacciones con un doble de almacenamiento: omite recarga real y PWA. Los reportes separan esos modos y no deben confundirse. Los resultados incluyen evidencia funcional, ambos temas, móvil/escritorio, exportación de resumen y ausencia de efectos al navegar.
