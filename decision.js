/* NEXUS ONE / Decision Room. No network requests and no edits to business records.
   Inputs and reviewer notes live in memory; downloads require a user gesture. */
(() => {
  'use strict';
  const S = window.NexusStore, A = window.NexusApp, M = window.NexusDecisionModel;
  if (!S || !A || !M) return;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = n => new Intl.NumberFormat('es-MX', {style:'currency',currency:'MXN',maximumFractionDigits:0}).format(n);
  const number = n => new Intl.NumberFormat('es-MX', {maximumFractionDigits:1}).format(n);
  const svg = n => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${{
    arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>', close:'<path d="m6 6 12 12M6 18 18 6"/>',
    check:'<path d="m5 12 4 4L19 6"/>', proof:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z"/><path d="m8 12 3 3 5-6"/>',
    value:'<path d="M4 3v17h17M8 15l4-5 4 2 5-7"/>', plan:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M7 14h2M13 14h2"/>',
    download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
    focus:'<path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/><circle cx="12" cy="12" r="4"/>',
    play:'<path d="m8 5 11 7-11 7Z"/>'
  }[n] || ''}</svg>`;
  const actions = (text, action, cls='', extra='') => `<button type="button" class="dr-btn ${cls}" data-dr="${action}" ${extra}>${text}${svg(action==='export'?'download':'arrow')}</button>`;
  const F = Object.freeze({role:'director', operator:'all', period:30});
  const fingerprint = l => [l.id,l.at,l.reference,l.action].join('|');
  const startEvents = new Set(S.logs(F).map(fingerprint));
  const requirements = [
    ['unit','Identificar al responsable de cada SIM','inventory',2,'Abrir una unidad DEMO y revisar su ubicación, estado e historia.','Trazabilidad unitaria','Asignaciones, recepción y responsabilidad visibles.'],
    ['sale','Evitar ventas desconectadas del saldo','sales',3,'Confirmar una venta y comprobar inventario, cargo, comisión y referencia.','Operación conectada','Una confirmación actualiza los registros relacionados.'],
    ['reject','Revisar qué pasa cuando una operación falla','sales',3,'Simular un rechazo: el intento queda registrado sin cargo ni comisión.','Control de excepciones','La respuesta negativa también forma parte del proceso.'],
    ['funds','Separar solicitud y autorización de abonos','wallet',4,'Crear un abono de prueba y autorizarlo después; verificar ambos eventos.','Responsabilidades separadas','Solicitar no incrementa el monedero. Autorizar sí.']
  ];
  const scope = [
    ['Inventario, ventas y comisiones','Recorridos operables con datos sintéticos.','Definir reglas reales, excepciones y criterios de aceptación.'],
    ['Perfiles y separación de datos','Vistas de matriz, distribución y punto de venta.','Implementar autenticación, permisos y controles en servidor.'],
    ['Conexión con operadores','Simulador local. No se llama a APIs reales.','Revisar documentación y acceso del conector contratado.'],
    ['Resiliencia y operación sin conexión','Caché de la demo local después de una primera carga.','Validar disponibilidad, recuperación y confirmaciones externas.'],
    ['Bitácora y seguridad','Eventos de prueba consultables en el navegador.','Persistencia, controles de acceso y protección de auditoría.'],
    ['Migración e implementación','Secuencia de trabajo para discutir con el cliente.','Acordar datos, volúmenes, ambientes, calendario y responsables.']
  ];
  const gates = [
    ['Definir','Operadores, jerarquía, reglas de saldo y comisiones.','Responsable de decisión y archivos ficticios representativos.','Flujos y criterios de aceptación acordados.'],
    ['Construir y validar','Base empresarial y procesos priorizados.','Revisión funcional en cada entrega.','Evidencia de los procesos aceptados en pruebas.'],
    ['Integrar','Conector contratado, errores y conciliación.','Documentación, convenio, credenciales y ambiente de pruebas.','Confirmaciones del tercero y excepciones verificadas.'],
    ['Preparar el arranque','Migración delimitada, capacitación y despliegue.','Datos depurados y aprobación de responsables.','Plan de salida y aceptación final acordados.']
  ];
  const items = ['Responsable que autoriza el proyecto','Proceso prioritario y criterio de aceptación','Operadores y conector de la primera fase','Ejemplos ficticios de lotes y reglas de comisiones','Volumen y calidad de datos por migrar','Próxima validación y responsables'];
  const state = {tab:'proof', selected:'sale', raw:Object.fromEntries(Object.keys(M.fields).map(k=>[k,''])),
    example:false, checks:new Set(), notes:'', lastResult:null};
  const room = document.createElement('dialog'); room.id='decision-room';room.setAttribute('aria-labelledby','dr-title');
  document.body.append(room);
  let opener;
  function freshEvents() {return S.logs(F).filter(l=>!startEvents.has(fingerprint(l)));}
  function evidenceFor(id) {
    const logs=freshEvents();
    if(id==='sale'||id==='reject') {
      const wanted=id==='sale'?'Confirmada':'Rechazada';
      return logs.filter(l=>{const t=S.transaction(l.reference);return t?.status===wanted &&
        (id==='sale'?t.cost>0&&t.commission>0:t.cost===0&&t.commission===0);}).slice(0,3);
    }
    if(id==='funds') {
      return logs.filter(l=>l.action==='Abono autorizado' && logs.some(s=>s.action==='Solicitud de abono'&&s.reference===l.reference)).slice(0,3);
    }
    return logs.filter(l=>['Inventario asignado','Inventario recibido','Recepción de lote'].includes(l.action)).slice(0,3);
  }
  function close(){if(room.open)room.close();}
  function open(tab) {
    if(A.context().role!=='director')return;
    if(['proof','value','plan'].includes(tab))state.tab=tab;
    opener=document.activeElement;
    if($('#experience')?.open)$('#experience').close();
    if($('#dialog')?.open)$('#dialog').close();
    render();room.showModal();document.documentElement.classList.add('decision-open');$('#dr-title').focus({preventScroll:true});
  }
  function proof() {
    const chosen=requirements.find(r=>r[0]===state.selected);
    const events=evidenceFor(state.selected);
    return `<div class="dr-proof-grid"><section class="dr-question-panel"><div class="dr-kicker">PRIMERO, EL PROBLEMA</div><h2>¿Qué necesita controlar<br>mejor la operación?</h2><p>Elige una prioridad. Después recorre el proceso y vuelve aquí para revisar su evidencia.</p><div class="dr-choices" role="group" aria-label="Prioridad de evaluación">${requirements.map(([id,title],i)=>`<button type="button" data-dr="priority" data-id="${id}" class="dr-choice ${state.selected===id?'active':''}" aria-pressed="${state.selected===id}"><span>0${i+1}</span><strong>${title}</strong>${svg('arrow')}</button>`).join('')}</div><small>Prioridades para discutir. No describen un diagnóstico confirmado del cliente.</small></section>
    <section class="dr-proof-panel"><div class="dr-panel-top"><span class="dr-kicker">DEL PROBLEMA A LA PRUEBA</span><span class="dr-chip">DEMO FUNCIONAL</span></div><div class="dr-proof-icon">${svg('proof')}</div><h2>${chosen[5]}</h2><p class="dr-lead">${chosen[6]}</p><div class="dr-expected"><span>QUÉ COMPROBAR EN LA REUNIÓN</span><p>${chosen[4]}</p></div><div class="dr-proof-actions">${actions('Recorrer este proceso','story','primary',`data-chapter="${chosen[2]==='inventory'?2:chosen[2]==='wallet'?4:3}"`)}${actions('Abrir módulo','module','',`data-page="${chosen[2]}"`)}</div>
    <div class="dr-evidence"><div><h3>Evidencia de esta sesión</h3><span class="dr-chip ${events.length?'ready':''}">${events.length?'Disponible':'Todavía sin eventos'}</span></div>${events.length?events.map(l=>`<button type="button" data-dr="event" data-ref="${esc(l.reference)}"><span>${svg('check')}</span><span><strong>${esc(l.action)}</strong><small>${esc(l.reference)} · ${esc(l.actor)}</small></span>${svg('arrow')}</button>`).join(''):'<p>No hay evidencia nueva de este proceso desde que cargaste esta página. Navegar por los capítulos no crea operaciones.</p>'}<small>La evidencia es local y ficticia. No representa una aceptación contractual ni una auditoría productiva.</small></div></section></div>
    <section class="dr-boundary"><div><span class="dr-kicker">PARA LA CONVERSACIÓN CON TI</span><h2>Demostrar no es lo mismo que<br>estar en producción.</h2><p>Estas diferencias deben quedar claras antes de comprometer el proyecto.</p></div><div class="dr-scope-table"><table><caption class="sr-only">Qué existe en la demostración y qué debe validarse en producción</caption><thead><tr><th>Capacidad</th><th>Hoy, en la demo</th><th>Para producción</th></tr></thead><tbody>${scope.map(r=>`<tr>${r.map((cell,i)=>`<${i?'td':'th'} ${i?'': 'scope="row"'}>${cell}</${i?'td':'th'}>`).join('')}</tr>`).join('')}</tbody></table></div></section>`;
  }
  const hints={operations:'Un solo proceso comparable. Evita contar la misma tarea dos veces.',before:'Tiempo observado hoy, no una cifra inferida por la demo.',after:'Estimación a validar con una prueba del proceso.',hourly:'Costo de trabajo por hora, en MXN.',realization:'0% si solo liberas capacidad sin reducir pagos. De 0 a 100%.',monthly:'Incluye operación incremental: soporte, nube, licencias y terceros. Captura 0 si no aplica.',investment:'Importe privado acordado, en MXN. No viene publicado en la demo.'};
  function value(){return `<div class="dr-value-heading"><div><span class="dr-kicker">CONVERSACIÓN CON DIRECCIÓN</span><h2>Que la inversión se discuta<br>con cifras, no con adjetivos.</h2><p>Evalúa un proceso repetitivo. El tiempo liberado y el ahorro de caja se calculan por separado.</p></div>${actions('Cargar ejemplo hipotético','example','','aria-label="Cargar valores ficticios de ejemplo"')}</div>
    <div class="dr-value-grid"><form id="dr-value-form" novalidate><div class="dr-form-title"><span>01</span><div><h3>Construir el escenario</h3><p>Completa todos los campos. Las cifras permanecen solo en esta página.</p></div></div><div class="dr-input-grid">${Object.entries(M.fields).map(([k,f])=>`<label class="dr-field ${['operations','realization','monthly','investment'].includes(k)?'wide':''}"><span>${f.label}${['hourly','monthly','investment'].includes(k)?' · MXN':''}${k==='realization'?' · %':''}</span><input id="dr-${k}" name="${k}" type="number" inputmode="decimal" min="0" max="${f.max}" step="${f.integer?'1':'0.01'}" value="${esc(state.raw[k])}" placeholder="Por definir" aria-describedby="hint-${k}"><small id="hint-${k}">${hints[k]}</small></label>`).join('')}</div><p id="dr-input-error" role="alert"></p><div class="dr-form-actions">${actions('Vaciar campos','clear-value')}<span id="dr-example-label">${state.example?'Ejemplo ficticio cargado':'Sin valores predeterminados'}</span></div></form><section class="dr-results" id="dr-results" aria-label="Resultados del escenario">${results()}</section></div>`;}
  function resultChart(r){
    const values=r.series.map(s=>s.value),lo=Math.min(0,...values),hi=Math.max(0,...values),span=Math.max(hi-lo,1);
    const y=v=>140-(v-lo)/span*110;
    const points=r.series.map(s=>`${48+s.month*37},${y(s.value)}`).join(' ');
    return `<div class="dr-cash-chart"><div><span>FLUJO SIMPLE ACUMULADO</span><small>Inversión inicial + 12 meses de operación</small></div><svg viewBox="0 0 525 180" role="img" aria-label="${esc(`Flujo desde ${money(r.series[0].value)} en el mes cero hasta ${money(r.series[12].value)} en el mes doce.`)}"><line x1="48" x2="492" y1="${y(0)}" y2="${y(0)}" class="zero"/><polyline points="${points}"/><circle cx="48" cy="${y(r.series[0].value)}" r="4"/><circle cx="492" cy="${y(r.series[12].value)}" r="4"/><text x="48" y="166">Mes 0</text><text x="492" y="166" text-anchor="end">Mes 12</text></svg><div class="dr-chart-numbers"><span>${money(r.series[0].value)}</span><strong>${money(r.series[12].value)}</strong></div><details><summary>Ver tabla mensual y fórmula</summary><p>Saldo acumulado = −inversión inicial + (mes × ahorro de caja neto mensual). No incluye impuestos, inflación, financiamiento ni descuento de flujos.</p><table><thead><tr><th>Mes</th><th>Flujo acumulado MXN</th></tr></thead><tbody>${r.series.map(s=>`<tr><td>${s.month}</td><td>${money(s.value)}</td></tr>`).join('')}</tbody></table></details></div>`;
  }
  function results(){
    const r=M.calculate(state.raw);state.lastResult=r;
    if(!r.ready)return `<div class="dr-result-empty">${svg('value')}<span class="dr-kicker">SIN SUPONER EL RETORNO</span><h2>Primero los datos.<br>Después la conclusión.</h2><p>${r.errors.length?'Corrige los campos señalados para calcular el escenario.':`Faltan ${r.missing.length} campos. No se calcula un retorno con valores incompletos.`}</p><div><strong>Tiempo liberado ≠ ahorro de caja.</strong><p>Una mejora operativa puede aumentar capacidad sin reducir desembolsos. Aquí no se cuentan como si fueran lo mismo.</p></div></div>`;
    const label=r.payback===null?(r.hasInvestment?'Sin recuperación bajo estos supuestos':'No aplica: inversión inicial cero'):number(r.payback)+' meses';
    return `<div class="dr-result-hero"><span>ESCENARIO ILUSTRATIVO · NO ES UNA PROMESA</span><small>Ahorro de caja neto mensual</small><strong class="${r.cashNet<0?'negative':''}">${money(r.cashNet)}</strong><p>${r.cashNet>0?'Resultado positivo bajo las cifras capturadas. Debe validarse con la operación real.':'Los supuestos actuales no producen un ahorro de caja neto positivo.'}</p></div><div class="dr-result-metrics"><div><span>${r.negativeTime?'Tiempo adicional':'Capacidad liberada'}</span><strong>${number(Math.abs(r.hours))} h/mes</strong></div><div><span>Recuperación simple</span><strong>${label}</strong></div></div><div class="dr-result-breakdown"><div><span>Valor del tiempo ${r.negativeTime?'adicional':'liberado'}</span><strong>${money(r.capacityValue)}</strong></div><div><span>Conversión a caja asumida</span><strong>${number(r.inputs.realization)}%</strong></div><div><span>Ahorro de caja bruto</span><strong>${money(r.cashGross)}</strong></div><div><span>Costo mensual incremental</span><strong>− ${money(r.inputs.monthly)}</strong></div><small>Horas = operaciones × (minutos actuales − minutos estimados) ÷ 60.<br>Ahorro de caja neto = horas × costo/hora × porcentaje de conversión − costo mensual incremental.</small></div>${resultChart(r)}<p class="dr-model-note">${r.negativeTime?'El tiempo estimado es mayor que el actual: el modelo conserva ese efecto negativo. ':''}No es una evaluación financiera completa. La adopción, el periodo de implementación y los costos no capturados pueden cambiar el resultado. El mes 1 supone operación estable, no el mes de firma.</p>`;
  }
  function plan(){return `<div class="dr-plan-intro"><span class="dr-kicker">PASAR DE LA DEMO A UN PROYECTO ACORDADO</span><h2>Un arranque con condiciones claras.<br>No un salto de fe.</h2><p>Define qué debe existir para avanzar y quién lo valida. La secuencia no sustituye el calendario ni el alcance del contrato.</p></div><div class="dr-gates">${gates.map(([name,work,input,exit],i)=>`<article><span class="dr-gate-number">0${i+1}</span><h3>${name}</h3><p>${work}</p><div><small>INSUMO DEL CLIENTE</small><p>${input}</p></div><div><small>CONDICIÓN PARA AVANZAR</small><p>${exit}</p></div></article>`).join('')}</div><div class="dr-plan-bottom"><section class="dr-meeting"><span class="dr-kicker">CIERRE DE LA REUNIÓN</span><h3>¿Qué ya quedó conversado?</h3><p>Marca temas revisados, no entregables aprobados.</p><div>${items.map((item,i)=>`<label><input type="checkbox" name="meeting-${i}" ${state.checks.has(i)?'checked':''}><span>${item}</span></label>`).join('')}</div><label class="dr-field"><span>Próximo paso acordado o pendiente</span><textarea id="dr-notes" maxlength="700" rows="3" placeholder="Describe el siguiente paso sin nombres, correos ni datos confidenciales.">${esc(state.notes)}</textarea><small>No se envía ni se guarda en un servidor.</small></label>${actions('Descargar resumen de evaluación','export','primary')}</section><aside class="dr-questions"><h3>Preguntas que merecen<br>una respuesta directa.</h3>${[
      ['¿La demo ya está conectada a los operadores?','No. El escenario usa respuestas simuladas. La integración productiva depende de documentación, credenciales y revisión del conector contratado.'],
      ['¿El cambio de perfil ya es seguridad productiva?','No. Ilustra responsabilidades y vistas. La autenticación, autorización y segregación reales se implementan y prueban en servidor.'],
      ['¿Puede operar activaciones sin Internet?','No se puede dar por completada una operación externa sin confirmación del tercero. El modo sin conexión de esta demo solo sirve para la simulación local.'],
      ['¿Se puede cargar nuestra información aquí?','No conviene introducir datos reales en una demostración pública. Para el levantamiento se acuerda un intercambio seguro y se empieza con muestras anonimizadas.'],
      ['¿El ahorro mostrado está garantizado?','No. Depende de las cifras capturadas y de supuestos por validar. El modelo no confunde tiempo liberado con disminución de pagos.'],
      ['¿Incluye tienda, WhatsApp o aplicaciones nativas?','No forman parte del alcance interno trabajado. El contrato y sus anexos delimitan funciones, conectores, entregables y cambios.']
    ].map(([q,a])=>`<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</aside></div>`;}
  function render(){
    const count=requirements.filter(r=>evidenceFor(r[0]).length).length;
    room.innerHTML=`<div class="dr-shell"><header class="dr-header"><div class="dr-brand"><span>N<span>↗</span></span><div><strong>NEXUS ONE</strong><small>SALA DE DECISIÓN</small></div></div><div class="dr-header-actions">${actions('Resumen','export','ghost')}<button class="dr-close" type="button" data-dr="close" aria-label="Cerrar evaluación y volver a la consola">${svg('close')}</button></div></header><div class="dr-scroll"><div class="dr-room-heading"><div><span class="dr-kicker">EVALUAR LA SOLUCIÓN</span><h1 id="dr-title" tabindex="-1">Del interés a una<br><em>decisión informada.</em></h1><p>Qué problema resolvemos. Qué podemos demostrar.<br>Qué falta acordar para implementarlo.</p></div><aside class="dr-session-summary"><span>ESTA SESIÓN</span><strong>${count}<small>/ 4</small></strong><p>Procesos con evidencia nueva</p><span class="dr-chip">Sin datos del cliente publicados</span></aside></div><nav class="dr-tabs" aria-label="Áreas de evaluación">${[['proof','proof','Prueba de negocio'],['value','value','Caso económico'],['plan','plan','Alcance y arranque']].map(([id,ic,label],i)=>`<button type="button" data-dr="tab" data-tab="${id}" aria-current="${state.tab===id?'page':'false'}" class="${state.tab===id?'active':''}">${svg(ic)}<span>${label}</span><small>0${i+1}</small></button>`).join('')}</nav><div id="dr-content">${({proof,value,plan})[state.tab]()}</div><footer class="dr-footer"><span>DEMO LOCAL · SIN CONEXIÓN A OPERADORES</span><p>Los resultados del escenario no son resultados de un cliente real. Los datos de evaluación se pierden al recargar; el resumen se descarga solo al solicitarlo.</p></footer></div></div>`;
  }
  function downloadSummary(){
    const r=M.calculate(state.raw), chosen=requirements.find(r=>r[0]===state.selected);
    const rows=Object.entries(M.fields).map(([k,f])=>`<tr><th>${esc(f.label)}</th><td>${state.raw[k]===''?'Por definir':esc(state.raw[k])}</td></tr>`).join('');
    const evidence=requirements.map(([id,title])=>`<h3>${esc(title)}</h3><p>${evidenceFor(id).length?evidenceFor(id).map(l=>esc(l.action+' · '+l.reference)).join('<br>'):'Sin evidencia nueva en esta sesión.'}</p>`).join('');
    const html=`<!doctype html><html lang="es-MX"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NEXUS ONE · Resumen de evaluación</title><style>body{font:15px/1.65 Arial,sans-serif;color:#17243e;max-width:920px;margin:40px auto;padding:0 24px}h1{font-size:34px}h2{border-top:1px solid #cbd5e1;padding-top:22px;margin-top:30px}small{color:#50627d}table{width:100%;border-collapse:collapse}td,th{border-bottom:1px solid #dbe2ed;padding:10px;text-align:left}aside{background:#edf3ff;padding:16px;border-radius:8px}p{white-space:pre-wrap}@media print{body{margin:0;font-size:11px}h2{break-after:avoid}table,aside{break-inside:avoid}}</style><body><small>NEXUS ONE / EVALUACIÓN DE SOLUCIÓN / ${esc(new Date().toISOString().slice(0,10))}</small><h1>Resumen de conversación</h1><aside>Documento de trabajo local. No es una cotización, contrato, aceptación de entregables ni garantía de ahorro. Los eventos son ficticios.</aside><h2>Prioridad seleccionada</h2><p>${esc(chosen[1])}</p><h2>Prueba de negocio</h2>${evidence}<h2>Caso económico: supuestos</h2><p>${state.example?'Se cargó un ejemplo ficticio; las cifras pueden haberse editado.':'Cifras capturadas en la página, no verificadas con el cliente.'}</p><table>${rows}</table>${r.ready?`<h3>Resultado ilustrativo</h3><p>Capacidad liberada: ${number(r.hours)} h/mes.<br>Ahorro de caja neto mensual: ${money(r.cashNet)}.<br>Recuperación simple: ${r.payback===null?'No calculable con estos supuestos':number(r.payback)+' meses'}.<br>Saldo acumulado a 12 meses: ${money(r.annualNet)}.</p><p>Horas = operaciones × (minutos actuales − estimados) / 60.<br>Caja neta = horas × costo/hora × conversión a caja / 100 − costo mensual.<br>El mes 1 supone operación estable. No incluye impuestos, inflación, financiamiento ni descuento de flujos.</p>`:'<p>Sin cálculo válido: hay datos pendientes o fuera de rango.</p>'}<h2>Alcance y producción</h2><table><thead><tr><th>Capacidad</th><th>Demo</th><th>Por implementar o validar</th></tr></thead><tbody>${scope.map(row=>`<tr>${row.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table><h2>Temas de la reunión</h2>${items.map((v,i)=>`<p>${state.checks.has(i)?'Conversado':'Pendiente'} — ${esc(v)}</p>`).join('')}<h2>Próximo paso</h2><p>${esc(state.notes||'Por acordar.')}</p><small>No cargar datos reales en la demo pública. Comparte este archivo únicamente con los destinatarios autorizados; puede contener los importes que hayas capturado.</small></body></html>`;
    const link=document.createElement('a'),url=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'}));link.href=url;link.download='NEXUS_ONE_Resumen_de_evaluacion.html';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  room.addEventListener('click',e=>{
    const b=e.target.closest('[data-dr]');if(!b)return;
    const a=b.dataset.dr;
    if(a==='close'){close();return;}
    if(a==='export'){downloadSummary();return;}
    if(a==='story'){close();window.NexusExperience.open();$(`.exp-chapters [data-index="${Number(b.dataset.chapter)}"]`)?.click();return;}
    if(a==='module'||a==='event'){
      const page=a==='event'?'audit':b.dataset.page;close();A.navigate(page);
      if(a==='event'){const input=$('#table-search');input.value=b.dataset.ref;input.dispatchEvent(new Event('input',{bubbles:true}));}return;
    }
    if(a==='priority'){state.selected=b.dataset.id;render();$(`[data-dr="priority"][data-id="${state.selected}"]`,room)?.focus({preventScroll:true});return;}
    if(a==='tab'){state.tab=b.dataset.tab;render();$(`[data-dr="tab"][data-tab="${state.tab}"]`,room)?.focus({preventScroll:true});return;}
    if(a==='example'){
      // Arbitrary example, unrelated to the confidential negotiated quotation.
      state.raw={operations:'3000',before:'8',after:'4',hourly:'150',realization:'0',monthly:'5000',investment:'100000'};state.example=true;render();return;
    }
    if(a==='clear-value'){state.raw=Object.fromEntries(Object.keys(M.fields).map(k=>[k,'']));state.example=false;render();$('#dr-operations')?.focus();}
  });
  room.addEventListener('input',e=>{
    if(e.target.closest('#dr-value-form')&&Object.hasOwn(M.fields,e.target.name)){
      state.raw[e.target.name]=e.target.value;$('#dr-results').innerHTML=results();
      const r=state.lastResult;$('#dr-input-error').textContent=r.errors?.join(' ')||'';
      return;
    }
    if(e.target.id==='dr-notes')state.notes=e.target.value;
  });
  room.addEventListener('change',e=>{if(/^meeting-\d+$/.test(e.target.name)){const id=Number(e.target.name.split('-')[1]);e.target.checked?state.checks.add(id):state.checks.delete(id);}});
  room.addEventListener('submit',e=>e.preventDefault());
  room.addEventListener('close',()=>{document.documentElement.classList.remove('decision-open');(opener?.isConnected?opener:$('#decision-launch'))?.focus({preventScroll:true});});
  // A native modal must be the only active command surface, including legacy
  // Ctrl+K / presentation-arrow listeners on the document.
  document.addEventListener('keydown',e=>{
    if(!room.open)return;
    if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();return;}
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();e.stopImmediatePropagation();return;}
    if(e.key==='Tab'){
      const visible=[...room.querySelectorAll('button:not(:disabled),input,textarea,select,summary,a[href]')].filter(n=>n.getClientRects().length);
      const first=visible[0],last=visible.at(-1),focus=document.activeElement;
      if(e.shiftKey&&(focus===first||focus.id==='dr-title')){e.preventDefault();last?.focus();}
      else if(!e.shiftKey&&focus===last){e.preventDefault();first?.focus();}
    }
    e.stopPropagation();
  },true);
  function installEntry(){
    let launch=$('#decision-launch');
    if(!launch){launch=document.createElement('button');launch.id='decision-launch';launch.setAttribute('aria-label','Evaluar solución');launch.className='decision-launch';launch.innerHTML=svg('focus')+'<span>Evaluar solución</span>';launch.addEventListener('click',()=>open());$('.top-actions').prepend(launch);}
    launch.hidden=A.context().role!=='director';
    const nav=$('#nav');
    if(A.context().role==='director'&&!$('#decision-nav')){
      const b=document.createElement('button');b.id='decision-nav';b.className='nav-item dr-nav-entry';b.innerHTML=svg('focus')+'<span>Evaluar solución</span>';b.addEventListener('click',()=>open());nav.prepend(b);
    }
  }
  document.addEventListener('nexus:view',installEntry);installEntry();
  window.NexusDecisionRoom=Object.freeze({open});
})();
