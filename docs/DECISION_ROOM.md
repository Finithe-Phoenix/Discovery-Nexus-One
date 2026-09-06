# Sala de decisión / guía para una reunión de evaluación

## El objetivo de la sesión

Acordar qué problema se quiere resolver, qué evidencia funcional satisface al comprador y qué falta para convertirlo en un proyecto. No intentar ganar la venta con cifras de ahorro inventadas ni con una lista de pantallas.

## Ruta sugerida

Abrir la demo HTTPS con la vista de matriz y pulsar **Evaluar solución**. No hace falta restaurar los datos: la evidencia de esta sala muestra eventos nuevos desde que cargó la página. Los registros anteriores siguen en la consola y no se atribuyen a esta sesión.

1. **Prueba de negocio.** Pedir al comprador que priorice una de las cuatro situaciones. El panel muestra qué comprobar. Abrir el recorrido correspondiente, ejecutar una operación ficticia y regresar a la evaluación. La referencia de evidencia lleva a la bitácora filtrada. Para inventario, una consulta no genera eventos: asignar o recibir una unidad desde el módulo produce un movimiento nuevo.
2. **Caso económico.** Completar con cifras que las partes hayan definido para un proceso comparable. No usar el ejemplo como si describiera al cliente. Comenzar con conversión a caja de 0% cuando no exista una reducción de desembolsos identificada; liberar tiempo no equivale a disminuir pagos. Capturar inversión y costos de la propuesta privada en la página, nunca en el código público. Una conclusión negativa es información para revisar supuestos, no una razón para cambiar arbitrariamente la calculadora.
3. **Alcance y arranque.** Recorrer la matriz de capacidades, las condiciones para avanzar y las preguntas técnicas. Marcar solo temas conversados. Definir el próximo paso y descargar el resumen como documento de trabajo, no como aceptación o contrato.

## Cómo leer los resultados

Horas mensuales = operaciones × (minutos actuales − minutos estimados) / 60.

Valor del tiempo = horas × costo por hora. Ahorro de caja bruto = valor del tiempo × conversión a caja. Ahorro de caja neto = ahorro bruto − costo mensual incremental. Caja se redondea a centavos. Recuperación simple = inversión / ahorro neto solo cuando ambos son positivos.

Flujo al mes n = −inversión + n × ahorro neto. Mes 1 presupone operación estable. El modelo no descuenta flujos ni incluye impuestos, inflación, financiamiento, curva de adopción o costos no capturados. Una inversión inicial de cero no produce un retorno infinito. El tiempo adicional mantiene su signo negativo.

## Manejo de la información

Los importes y notas permanecen en memoria y desaparecen al recargar. No existe guardado en servidor. El resumen descargado contiene lo que se haya capturado; debe tratarse según su contenido y compartirse de forma autorizada. No usar datos personales ni muestras productivas en la demo pública.

La selección de perfil es parte de una simulación y no autentica compradores. Los eventos locales no son inmutables. Una marca de tema conversado no acredita aprobación, certificación, firma ni validación productiva.

## Revisión técnica antes de presentar

Comprobar el navegador y proyector de la reunión. Probar navegación con teclado, referencia de una venta, resultado de un rechazo, solicitud pendiente y abono autorizado. Confirmar que un resumen descarga correctamente y que el precio privado no está precargado. La disponibilidad sin red requiere una primera carga completa; no representa activaciones o pagos reales sin conectividad.

Referencias de diseño usadas como criterios de revisión (no certificación):
- https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum
- https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html
