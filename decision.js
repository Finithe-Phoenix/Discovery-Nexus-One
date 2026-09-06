/* NEXUS ONE / Decision Workspace. Real demo evidence, explicit assumptions.
 * This layer never creates transactions, accepts an offer, or schedules a meeting.
 */
(() => {
  'use strict';
  const S=window.NexusStore,A=window.NexusApp,C=window.NexusDecisionCore;
  if(!S||!A||!C)return;
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const format=n=>new Intl.NumberFormat('es-MX',{maximumFractionDigits:1}).format(n);
  const KEY='nexus-decision-v1';
  let review=C.blank(),tab='priority',coach=null,restoreFocus=null;
  try{review=C.restore(JSON.parse(localStorage.getItem(KEY)||'null'));}catch(_){}
  const tabs=[['priority','Prioridad'],['proof','Evidencia'],['impact','Impacto'],['next','Siguiente paso']];
  const glyphs={inventory:'<rect x="5" y="3" width="14" height="18" rx="2"/><rect x="9" y="11" width="6" height="6" rx="1"/><path d="M9 6h5M12 11v6"/>',balance:'<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M21 10h-6v5h6M7 9h3"/>',network:'<path d="M12 8v4M5 16v-4h14v4"/><rect x="9" y="3" width="6" height="5" rx="1"/><rect x="2" y="16" width="6" height="5" rx="1"/><rect x="16" y="16" width="6" height="5" rx="1"/>',arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',close:'<path d="m6 6 12 12M6 18 18 6"/>',check:'<path d="m5 12 4 4L19 6"/>',export:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>'};
  const icon=n=>`<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${glyphs[n]||glyphs.arrow}</svg>`;
  const button=(label,action,kind='',attrs='')=>`<button type="button" class="dc-btn ${kind}" data-decision="${action}" ${attrs}>${label}${icon(action==='download'?'export':'arrow')}</button>`;
  const badge=(text,good=false)=>`<span class="dc-badge ${good?'observed':''}">${text}</span>`;
  const notice=text=>`<p class="dc-note">${text}</p>`;
  const state=()=>C.evidence(review,S);
  function save(){try{localStorage.setItem(KEY,JSON.stringify(review));}catch(_){$('#dc-error')?.replaceChildren(document.createTextNode('El navegador no permitió guardar la revisión. Sus cambios son temporales.'));}}
  const d=document.createElement('dialog');d.id='decision';d.setAttribute('aria-labelledby','dc-title');document.body.append(d);
  function open(section='priority') {
    if(A.context().role!=='director')return;
    for(const id of ['experience','dialog'])if($('#'+id)?.open)$('#'+id).close();
    restoreFocus=document.activeElement;
    tab=tabs.some(([t])=>t===section)?section:'priority';
    render();if(!d.open)d.showModal();
    document.documentElement.classList.add('decision-open');$('#dc-title').focus({preventScroll:true});
  }
  function close(){if(d.open)d.close();}
  function chooseTab(next){tab=next;render();$('#dc-title').focus({preventScroll:true});}
  function priorityView(){
    const p=C.PRIORITIES[review.priority];
    return `<div class="dc-intro"><div><span class="dc-eyebrow">01 / ENTENDER EL VALOR</span><h2 id="dc-title" tabindex="-1">Primero el problema.<br><em>Después, la plataforma.</em></h2><p>Elige qué necesita comprobar tu equipo. La demostración debe responder a esa prioridad, no a una lista de pantallas.</p></div><div class="dc-art" aria-hidden="true"><i></i><b>N<span>↗</span></b><small>CONTROL / EVIDENCIA / DECISIÓN</small></div></div>
    <div class="dc-priorities" role="group" aria-label="Elegir prioridad de negocio">${Object.entries(C.PRIORITIES).map(([id,p])=>`<button type="button" data-decision="priority" data-id="${id}" class="dc-priority ${review.priority===id?'selected':''}" aria-pressed="${review.priority===id}">${icon(id)}<span><strong>${p.name}</strong><small>${p.outcome}</small></span><i>${review.priority===id?'✓':'↗'}</i></button>`).join('')}</div>
    <div class="dc-question"><span>LA PREGUNTA QUE VAMOS A RESPONDER</span><h3>${p.question}</h3><div class="dc-contrast"><div><small>RIESGO QUE SE BUSCA EVITAR</small><p>${{inventory:'Decidir con registros dispersos y sin una ubicación verificable.',balance:'Confundir una solicitud de saldo con una acreditación autorizada.',network:'Ver un total sin poder identificar operador, punto y operación de origen.'}[review.priority]}</p></div><div><small>QUÉ MOSTRAMOS EN LA DEMO</small><p>${{inventory:'Una unidad, su responsable y los eventos que registran su recorrido.',balance:'Una solicitud, la decisión de matriz y el saldo resultante.',network:'Filtros por operador y perfil, con detalle de operaciones y comisiones.'}[review.priority]}</p></div></div></div>
    <div class="dc-section-actions">${button('Comprobar en la operación','tab','primary','data-tab="proof"')}<p>Estos riesgos son hipótesis para conversar, no un diagnóstico del cliente.</p></div>`;
  }
  function proofView(){
    const e=state(),count=e.checks.filter(c=>c.observed).length;
    return `<div class="dc-section-heading"><span class="dc-eyebrow">02 / PROBAR, NO PROMETER</span><h2 id="dc-title" tabindex="-1">La evidencia no se marca.<br><em>Se genera al operar.</em></h2><p>Inicia una evaluación y realiza los procesos en la consola. Los criterios se actualizan con los nuevos eventos de la demo; el historial precargado no cuenta.</p></div>
    <div class="dc-progress"><div><strong>${count}<span> / 5</span></strong><p>Criterios con evidencia local<br><small>${!review.started?'La evaluación aún no ha comenzado.':e.stale?'El escenario cambió: inicia una evaluación nueva.':'Seguimiento activo en este navegador.'}</small></p></div>${!review.started||e.stale?button('Iniciar evaluación','start','primary'):button('Revisar desde cero','restart','quiet')}</div>
    <div class="dc-proof-list">${e.checks.map((c,i)=>`<article class="dc-proof ${c.observed?'is-observed':''}"><span class="dc-proof-index">${c.observed?'✓':String(i+1).padStart(2,'0')}</span><div><h3>${c.name}</h3><p>${c.description}</p>${c.event?`<small class="dc-proof-reference">${esc(c.event.reference)} · ${esc(c.event.id)} · Evento de demostración</small>`:''}</div><div class="dc-proof-action">${badge(c.observed?'Evento observado':'Pendiente de demostrar',c.observed)}${button(c.observed?'Ver evento':'Probar proceso',c.observed?'event':'try','quiet',`data-id="${c.id}" ${!review.started||e.stale?'disabled':''}`)}</div></article>`).join('')}</div>
    ${notice('Esto verifica relaciones entre registros de la demo local. No certifica seguridad, permisos en servidor, rendimiento ni una integración productiva. El rechazo mostrado tiene cargo y comisión en cero; la validación integral de no afectación pertenece también a la suite técnica.')}
    <div class="dc-section-actions">${button('Estimar capacidad operativa','tab','primary','data-tab="impact"')}</div>`;
  }
  function impactResult(){
    const x=review.estimate;
    if(!x)return `<div class="dc-impact-empty">${icon('network')}<h3>Sin supuestos, no hay una cifra.</h3><p>Completa los cinco campos para explorar una hipótesis. No precargamos volúmenes ni tiempos que no nos has confirmado.</p></div>`;
    return `<div class="dc-impact-kpi"><span>CAPACIDAD POTENCIALMENTE RECUPERABLE</span><strong>${format(x.recoverable)}<small> h / mes</small></strong><p>Hipótesis calculada con ${format(x.inputs.adoption)}% de adopción efectiva.</p></div><div class="dc-bars"><div><span>Proceso actual</span><b>${format(x.current)} h</b><i><u style="width:100%"></u></i></div><div><span>Proceso objetivo ponderado</span><b>${format(x.remaining)} h</b><i><u style="width:${Math.min(100,x.remaining/x.current*100)}%"></u></i></div></div><div class="dc-formula"><strong>Así se calcula</strong><p>${format(x.inputs.volume)} operaciones/día × ${format(x.inputs.days)} días × (${format(x.inputs.before)} − ${format(x.inputs.after)}) min × ${format(x.inputs.adoption)}% ÷ 60.</p><small>${format(x.monthly)} operaciones al mes. Se asume que el resto conserva el tiempo actual.</small></div>${notice('Capacidad de trabajo, no ahorro monetario, rentabilidad ni reducción de personal garantizados. El tiempo objetivo debe medirse en un piloto; esta demo no lo ha acreditado.')}`;
  }
  function impactView(){
    const fields=[['volume','Operaciones diarias','1–1,000,000',1,1000000,1],['days','Días de operación al mes','1–31 días',1,31,1],['before','Tiempo actual por operación','Minutos medidos',.1,480,.1],['after','Tiempo objetivo por operación','Minutos por validar en piloto',.1,480,.1],['adoption','Adopción efectiva esperada','0–100% del volumen',0,100,.1]];
    return `<div class="dc-section-heading"><span class="dc-eyebrow">03 / DIMENSIONAR LA OPORTUNIDAD</span><h2 id="dc-title" tabindex="-1">Un caso de negocio.<br><em>No una promesa de ahorro.</em></h2><p>Modela únicamente tiempo operativo con supuestos explícitos. No se solicita el precio del proyecto ni información personal.</p></div><div class="dc-impact-grid"><form id="dc-impact-form"><h3>Tus supuestos de trabajo</h3><div class="dc-fields">${fields.map(([id,label,hint,min,max,step])=>`<label for="dc-${id}" class="dc-field"><span>${label}</span><input id="dc-${id}" name="${id}" type="number" inputmode="decimal" min="${min}" max="${max}" step="${step}" value="${esc(review.inputs[id])}" required><small>${hint}</small></label>`).join('')}</div><button type="submit" class="dc-btn primary">Calcular hipótesis ${icon('arrow')}</button><p class="dc-validation" id="dc-impact-error" role="alert"></p><small>Valores guardados solo en este navegador. Modificarlos invalida el resultado anterior.</small></form><section class="dc-impact-result" id="dc-impact-result" aria-live="polite">${impactResult()}</section></div><div class="dc-section-actions">${button('Definir el siguiente paso','tab','primary','data-tab="next"')}</div>`;
  }
  const FAQ=[
    ['¿Se conecta ya a los operadores?','No. Hoy se demuestran procesos locales. En la implementación se revisarán documentación, credenciales, ambientes, errores y confirmaciones del conector expresamente contratado. Multioperador configurable no significa conectores ilimitados.'],
    ['¿Qué ocurre sin conexión?','La demo puede funcionar localmente después de una primera carga. En producción, una operación dependiente de terceros no se considera completada hasta recibir su confirmación.'],
    ['¿Quién puede ver o cambiar los saldos?','Los tres perfiles ilustran responsabilidades. En producción se requieren autenticación, permisos en servidor, separación de funciones y auditoría. La demo estática no acredita esos controles.'],
    ['¿Tenemos que cambiar toda la operación de golpe?','Proponemos validar primero reglas y datos, después un piloto acotado y finalmente el arranque acordado. No hay un piloto ya contratado ni un calendario aprobado dentro de esta demo.']
  ];
  function nextView(){const e=state(),p=C.PRIORITIES[review.priority];
    return `<div class="dc-section-heading"><span class="dc-eyebrow">04 / DAR UN PASO CONCRETO</span><h2 id="dc-title" tabindex="-1">Del interés al acuerdo.<br><em>Con los pendientes a la vista.</em></h2><p>La reunión puede cerrar con un siguiente paso claro, sin confundir una demo aprobada con una plataforma lista para producción.</p></div><div class="dc-next-grid"><section><div class="dc-roadmap"><h3>Ruta propuesta de implementación</h3>${[['01','Acordar las reglas','Responsables, jerarquía, operadores, comisiones, layouts y criterios de aceptación.'],['02','Validar la integración','Revisar un conector, sus ambientes y confirmaciones. Delimitar dependencias y excepciones.'],['03','Probar un piloto acotado','Medir el proceso completo con datos autorizados y resolver observaciones antes del arranque.'],['04','Acompañar el arranque','Migración delimitada, capacitación, aceptación y esquema de soporte contratado.']].map(([n,a,b])=>`<div><span>${n}</span><div><strong>${a}</strong><p>${b}</p></div></div>`).join('')}</div><div class="dc-faq"><h3>Preguntas que no dejamos abiertas</h3>${FAQ.map(([q,a])=>`<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</div></section><aside class="dc-decision-card"><span class="dc-eyebrow">RESUMEN DE LA REVISIÓN</span><h3>${p.name}</h3><div class="dc-statline"><strong>${e.checks.filter(c=>c.observed).length} / 5</strong><span>Criterios con evidencia de esta evaluación</span></div><label class="dc-field" for="dc-verdict"><span>Valoración del proceso</span><select id="dc-verdict">${Object.entries(C.VERDICTS).map(([id,name])=>`<option value="${id}" ${review.verdict===id?'selected':''}>${name}</option>`).join('')}</select><small>Se registra manualmente; no se infiere de las pruebas.</small></label><label class="dc-field" for="dc-next"><span>Próximo paso propuesto</span><select id="dc-next">${Object.entries(C.NEXT).map(([id,name])=>`<option value="${id}" ${review.next===id?'selected':''}>${name}</option>`).join('')}</select></label>${button('Guardar resumen de evaluación','download','primary')}${notice('Genera un archivo HTML local, imprimible. No envía correos, agenda reuniones, acepta contratos ni modifica la cotización.')}<div class="dc-scope"><strong>Se conserva el alcance</strong><p>PWA interna, tres perfiles y multioperador. Sin tienda pública, WhatsApp Business ni aplicaciones nativas.</p><small>Precio, plazos y condiciones: propuesta comercial privada.</small></div></aside></div>`;
  }
  function render(){
    const total=state().checks.filter(c=>c.observed).length;
    d.innerHTML=`<div class="dc-shell"><header class="dc-header"><div><b class="dc-logo">N↗</b><span>NEXUS <strong>ONE</strong><small>ESPACIO DE EVALUACIÓN</small></span></div><button class="dc-exit" data-decision="close" aria-label="Cerrar evaluación y volver a la consola">Volver a la consola ${icon('close')}</button></header><div class="dc-layout"><nav class="dc-nav" aria-label="Pasos de la evaluación">${tabs.map(([id,label],i)=>`<button data-decision="tab" data-tab="${id}" ${tab===id?'aria-current="step"':''}><span>0${i+1}</span><strong>${label}</strong>${id==='proof'?`<small>${total}/5</small>`:''}</button>`).join('')}<p>Datos locales.<br>Decisiones explícitas.<br>Sin compromisos automáticos.</p></nav><div class="dc-main">${{priority:priorityView,proof:proofView,impact:impactView,next:nextView}[tab]()}<p id="dc-error" class="dc-validation" role="alert"></p></div></div><footer class="dc-footer"><span>DEMO / SIN OPERACIONES REALES</span><span>Las condiciones comerciales permanecen fuera del sitio público.</span></footer></div>`;
  }
  const instructions={
    inventory:'Recibe un lote nuevo. Abre una de sus unidades, asígnala a un punto autorizado y confirma la recepción de esa misma unidad.',
    sale:'Selecciona una SIM o eSIM disponible, revisa los importes y confirma la venta. No se activa un servicio real.',
    reject:'En Nueva venta, elige «Simular rechazo». Revisa y confirma el intento para comprobar cargo y comisión en cero.',
    topup:'Crea una solicitud de abono. Después entra a Autorizaciones para revisar y autorizar esa misma solicitud.',
    cut:'Confirma primero una venta en esta evaluación. Después prepara el corte del operador que la contiene.'
  };
  function tryProcess(id){
    const e=state(),c=e.checks.find(c=>c.id===id);if(!c||!review.started||e.stale)return;
    coach=id;close();A.navigate(c.module);mount();
    const target={inventory:'batch',sale:'new-sale',reject:'new-sale',topup:'topup',cut:'settle'}[id];
    $(`#heading-actions [data-action="${target}"]`)?.click();
    if(id==='reject'){const input=$('#sale-outcome');if(input){input.value='reject';input.dispatchEvent(new Event('change',{bubbles:true}));}}
  }
  function startReview(){review=C.start(review,S.logs({role:'director',operator:'all'}));save();chooseTab('proof');mount();}
  function makePacket(){
    const e=state(),x=review.estimate;
    const lines=e.checks.map(c=>`<tr><td>${c.name}</td><td>${c.observed?'Evento observado':'Pendiente de demostrar'}</td><td>${c.event?esc(c.event.reference)+' · '+esc(c.event.id):'—'}</td></tr>`).join('');
    const html=`<!doctype html><html lang="es-MX"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NEXUS ONE / Resumen de evaluación</title><style>body{font:15px/1.65 system-ui,sans-serif;margin:40px auto;max-width:850px;padding:0 25px;color:#152039}h1{font-size:32px;line-height:1.2}h2{font-size:21px;margin-top:30px}small{color:#57677e}table{width:100%;border-collapse:collapse}td,th{text-align:left;border-bottom:1px solid #d4dce9;padding:11px 8px;font-size:13px}header{border-bottom:3px solid #2864ef;padding-bottom:20px}article{background:#f1f5fd;padding:20px;margin:24px 0}footer{margin-top:35px;border-top:1px solid #d4dce9;padding-top:20px;font-size:12px}li{margin:8px 0}@media print{body{margin:0;max-width:none}article,table{break-inside:avoid}}</style></head><body><header><small>NEXUS ONE / EVALUACIÓN LOCAL</small><h1>Decidir con evidencia.</h1><p>Resumen exportado desde una demostración con datos ficticios.</p></header><h2>Prioridad de negocio</h2><p>${C.PRIORITIES[review.priority].name}</p><p>${C.PRIORITIES[review.priority].question}</p><h2>Procesos observados en esta evaluación</h2><p>${review.started?'Inicio de revisión (UTC): '+esc(review.started):'No se inició una revisión de evidencia.'}${e.stale?' El escenario cambió; la evidencia requiere una nueva evaluación.':''}</p><table><thead><tr><th>Criterio</th><th>Estado</th><th>Referencia de demo</th></tr></thead><tbody>${lines}</tbody></table><h2>Hipótesis de capacidad operativa</h2>${x?`<article><strong>${format(x.recoverable)} horas potencialmente recuperables al mes.</strong><p>${format(x.inputs.volume)} operaciones/día × ${format(x.inputs.days)} días × (${format(x.inputs.before)} − ${format(x.inputs.after)}) minutos × ${format(x.inputs.adoption)}% de adopción ÷ 60.</p><p>Actual: ${format(x.current)} h/mes. Objetivo ponderado: ${format(x.remaining)} h/mes. Volumen mensual: ${format(x.monthly)} operaciones.</p><small>Supuestos ingresados manualmente. No equivalen a ahorro monetario, rentabilidad ni reducción de personal garantizados. Medir el objetivo en piloto.</small></article>`:'<p>Sin cálculo: no se han confirmado los cinco supuestos. No se estima un ahorro por defecto.</p>'}<h2>Valoración y próximo paso</h2><p><strong>Valoración manual:</strong> ${C.VERDICTS[review.verdict]}</p><p><strong>Siguiente paso propuesto:</strong> ${C.NEXT[review.next]}</p><p>No constituye aceptación comercial ni una reunión agendada.</p><h2>Pendientes antes de producción</h2><ul><li>Reglas de negocio, jerarquía, layouts y criterios de aceptación.</li><li>Revisión del conector expresamente contratado y sus dependencias.</li><li>Autenticación, permisos y auditoría en servidor; migración y piloto.</li><li>Plan de arranque, capacitación y soporte acordado.</li></ul><h2>Alcance preservado</h2><p>PWA interna, tres perfiles y multioperador. Sin tienda pública, WhatsApp Business ni aplicaciones nativas. Los precios, plazos y compromisos son los de la propuesta comercial privada.</p><footer>Solo datos y eventos de demostración. Un evento observado no certifica controles productivos. Archivo local: no enviado a terceros ni al repositorio por la aplicación.</footer></body></html>`;
    const url=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='NEXUS_ONE_Resumen_Evaluacion.html';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
  }
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-decision]');if(!b||b.disabled)return;
    const action=b.dataset.decision;
    if(action==='open'){open(b.dataset.tab||'priority');return;}
    if(action==='return-proof'){open('proof');return;}
    if(action==='hide-coach'){coach=null;$('#decision-coach')?.remove();return;}
    if(action==='approvals'){A.navigate('approvals');return;}
    try{
      if(action==='close'){close();return;}
      if(action==='tab'){if(tabs.some(([t])=>t===b.dataset.tab))chooseTab(b.dataset.tab);return;}
      if(action==='priority'){if(Object.hasOwn(C.PRIORITIES,b.dataset.id)){review.priority=b.dataset.id;save();render();$(`[data-decision="priority"][data-id="${review.priority}"]`,d).focus();}return;}
      if(action==='start'){startReview();return;}
      if(action==='restart'){const section=$('.dc-main');section.innerHTML=`<div class="dc-section-heading"><span class="dc-eyebrow">NUEVA EVALUACIÓN</span><h2 id="dc-title" tabindex="-1">¿Revisar desde este momento?</h2><p>Se reinicia únicamente el seguimiento de evidencia y la valoración manual. No se borran ventas, inventario, solicitudes ni saldos.</p></div><div class="dc-section-actions">${button('Mantener evaluación actual','tab','quiet','data-tab="proof"')}${button('Iniciar evaluación nueva','start','primary')}</div>`;$('#dc-title').focus();return;}
      if(action==='try'){tryProcess(b.dataset.id);return;}
      if(action==='event'){const c=state().checks.find(c=>c.id===b.dataset.id);if(c?.event){close();A.openFiltered('audit',{query:c.event.id});}return;}
      if(action==='download'){makePacket();return;}
    }catch(err){if($('#dc-error'))$('#dc-error').textContent=err.message;}
  });
  d.addEventListener('input',e=>{
    if(e.target.closest('#dc-impact-form')&&Object.hasOwn(review.inputs,e.target.name)){
      review.inputs[e.target.name]=e.target.value;review.estimate=null;save();$('#dc-impact-result').innerHTML=impactResult();
    }
  });
  d.addEventListener('submit',e=>{
    if(e.target.id!=='dc-impact-form')return;e.preventDefault();
    try{review.estimate=C.capacity(review.inputs);save();$('#dc-impact-error').textContent='';$('#dc-impact-result').innerHTML=impactResult();}
    catch(err){review.estimate=null;save();$('#dc-impact-error').textContent=err.message;$('#dc-impact-result').innerHTML=impactResult();}
  });
  d.addEventListener('change',e=>{
    if(e.target.id==='dc-verdict'&&Object.hasOwn(C.VERDICTS,e.target.value))review.verdict=e.target.value;
    if(e.target.id==='dc-next'&&Object.hasOwn(C.NEXT,e.target.value))review.next=e.target.value;
    save();
  });
  d.addEventListener('keydown',e=>{
    if(e.key==='Tab'){
      const items=$$('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),summary',d).filter(el=>el.getClientRects().length);
      const first=items[0],last=items.at(-1);
      if(e.shiftKey&&(document.activeElement===first||document.activeElement.id==='dc-title')){e.preventDefault();last?.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
    }
  });
  d.addEventListener('close',()=>{document.documentElement.classList.remove('decision-open');(restoreFocus?.isConnected?restoreFocus:$('.decision-launch'))?.focus({preventScroll:true});});
  function mount(){
    const context=A.context(),director=context.role==='director';
    let launch=$('.decision-launch');
    if(!launch){launch=document.createElement('button');launch.className='decision-launch';launch.dataset.decision='open';launch.innerHTML=icon('check')+'<span>Evaluar</span>';launch.setAttribute('aria-label','Evaluar la solución');$('.presentation-launch').before(launch);}
    launch.hidden=!director;
    $('#decision-band')?.remove();
    if(context.page==='overview'&&director){
      const band=document.createElement('section');band.id='decision-band';band.className='decision-band';
      band.innerHTML=`<div><span>VALIDACIÓN DE NEGOCIO</span><strong>Del dato a la operación. De la operación a la decisión.</strong></div><button data-decision="open" aria-label="Abrir evaluación de negocio">Evaluar la solución ${icon('arrow')}</button>`;
      $('#view > .kpi-grid')?.before(band);
    }
    $('#decision-coach')?.remove();
    if(coach&&director&&review.started){
      const item=state().checks.find(c=>c.id===coach);const box=document.createElement('section');box.id='decision-coach';
      const newRequests=state().events.filter(e=>e.action==='Solicitud de abono');
      box.innerHTML=`<div><small>EVALUACIÓN EN CURSO · ${item.observed?'EVENTO OBSERVADO':'PROCESO POR DEMOSTRAR'}</small><strong>${item.name}</strong><p>${instructions[coach]}</p></div><div>${coach==='topup'&&newRequests.length&&!item.observed?button('Revisar autorizaciones','approvals','primary'):''}${button('Ver evaluación','return-proof','quiet')}<button class="dc-coach-close" data-decision="hide-coach" aria-label="Ocultar guía del proceso">${icon('close')}</button></div>`;
      $('#main').prepend(box);
    }
  }
  document.addEventListener('nexus:view',mount);
  document.addEventListener('nexus:reset',()=>{review=C.blank();coach=null;save();mount();});
  window.NexusDecision=Object.freeze({open,clear:()=>{review=C.blank();coach=null;save();mount();}});
  mount();
})();
