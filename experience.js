/* NEXUS ONE / Executive Experience v5.
 * Progressive presentation layer. Only explicit confirmation buttons write to
 * NexusStore. Navigation, filters and animations never create transactions.
 */
(() => {
  'use strict';
  const S = window.NexusStore, App = window.NexusApp;
  if (!S || !App) return;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const mxn = (v, decimals = 0) => new Intl.NumberFormat('es-MX', {style:'currency',currency:'MXN',minimumFractionDigits:decimals,maximumFractionDigits:decimals}).format(v / 100);
  const num = v => new Intl.NumberFormat('es-MX').format(v);
  const short = v => v >= 100000 ? '$' + (v/100000).toFixed(1) + ' mil' : mxn(v);
  const day = t => new Intl.DateTimeFormat('es-MX',{day:'2-digit',month:'short',timeZone:'America/Mexico_City'}).format(new Date(t));
  const F = Object.freeze({role:'director',operator:'all',period:30});
  const paths = {
    arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>', back:'<path d="m14 5-7 7 7 7"/>',
    close:'<path d="m6 6 12 12M6 18 18 6"/>', check:'<path d="m5 12 4 4L19 6"/>',
    sim:'<path d="M7 3h8l5 5v13H4V3Z"/><rect x="8" y="10" width="8" height="7" rx="1"/><path d="M12 10v7M8 13.5h8"/>',
    wallet:'<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M21 10h-6v5h6M16 12.5h1"/>',
    shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z"/><path d="m8 12 3 3 5-6"/>',
    network:'<rect x="9" y="3" width="6" height="5" rx="1"/><rect x="2" y="16" width="6" height="5" rx="1"/><rect x="16" y="16" width="6" height="5" rx="1"/><path d="M12 8v4M5 16v-4h14v4"/>',
    chart:'<path d="M4 3v17h17M8 15l4-5 4 2 5-7"/>', play:'<path d="m8 5 11 7-11 7Z"/>'
  };
  const icon = n => `<svg viewBox="0 0 24 24" class="ic" aria-hidden="true">${paths[n] || paths.arrow}</svg>`;
  const btn = (label, action, kind = '', disabled = false) => `<button type="button" class="exp-btn ${kind}" data-exp="${action}" ${disabled?'disabled':''}>${label}${icon(action==='prev'?'back':action==='close'?'close':'arrow')}</button>`;
  const CHAPTERS = [
    ['Visión','Toda tu red.<br>Una sola <em>operación.</em>','Una plataforma para seguir cada unidad, cada venta y cada decisión. De la matriz al punto de venta, con una lectura común.'],
    ['Universos','La visión conjunta.<br>El detalle <em>independiente.</em>','Compara el negocio completo y entra a cada telefonía sin mezclar sus inventarios ni resultados.'],
    ['Trazabilidad','No es una SIM.<br>Es una <em>responsabilidad.</em>','Antes de vender, conoce la unidad, su operador, su ubicación y su estado. La historia acompaña al inventario.'],
    ['Operación','Una venta.<br>Cinco efectos.<br><em>Cero saltos.</em>','Confirma una operación de prueba y observa su efecto en inventario, monedero, venta, comisión y bitácora.'],
    ['Control','Solicitar no<br>es <em>autorizar.</em>','El punto de venta solicita un abono. Matriz lo revisa. El saldo cambia únicamente cuando la decisión queda registrada.'],
    ['Evidencia','Una experiencia<br>que se puede <em>demostrar.</em>','Termina donde empieza la confianza: en el detalle de las operaciones, los saldos y la evidencia que acabas de generar.']
  ];
  const model = {chapter:0,operator:'all',sale:null,request:null,quote:null,input:null,previousWallet:null};
  const dialog = document.createElement('dialog');
  dialog.id = 'experience'; dialog.setAttribute('aria-labelledby','exp-title');
  document.body.append(dialog);
  let restoreFocus = null;
  function prepare() {
    // Validate references against the current local scenario after a user reset.
    if (model.sale && !S.transaction(model.sale.id)) model.sale = model.input = model.quote = null;
    if (model.request && !S.requests(F).some(r=>r.id===model.request.id)) model.request = null;
    if (model.input) {
      if(!model.sale) { try { model.quote=S.quote(model.input); } catch (_) { model.quote=null; } }
      return;
    }
    const asset = S.assets({role:'pos',operator:'movistar'}).find(a=>a.type==='SIM' && a.status==='Disponible');
    model.input = {role:'pos',owner:'PDV-001',operator:'movistar',product:'sim',assetId:asset?.id || 'DEMO-NO-STOCK',nonce:'STORY-'+(crypto.randomUUID?.() || Date.now().toString(36)+'-'+Array.from(crypto.getRandomValues(new Uint8Array(12)),b=>b.toString(16).padStart(2,'0')).join(''))};
    try { model.quote = S.quote(model.input); } catch (_) { model.quote = null; }
  }
  function open() {
    if ($('#dialog').open) $('#dialog').close();
    restoreFocus = document.activeElement;
    prepare(); renderStory();
    if (!dialog.open) dialog.showModal();
    document.documentElement.classList.add('experience-open');
    $('#exp-title').focus({preventScroll:true});
  }
  function close() { if(dialog.open) dialog.close(); }
  function goApp(page, reference = null) {
    close();
    if (App.context().role !== 'director') App.setRole('director');
    App.navigate(page);
    if (page==='audit' && reference) {
      const input=$('#table-search');
      if(input){input.value=reference;input.dispatchEvent(new Event('input',{bubbles:true}));}
    }
    if (page==='reports') App.showBriefing();
  }
  function orbit() {
    return `<div class="exp-orbit" aria-label="Matriz, operadores y red comercial, conectados en un escenario ficticio">
      <div class="exp-orbit-grid" aria-hidden="true"></div><div class="exp-orbit-ring ring-a" aria-hidden="true"></div><div class="exp-orbit-ring ring-b" aria-hidden="true"></div>
      <div class="exp-orbit-core"><span class="exp-mark">N<span>↗</span></span><strong>NEXUS ONE</strong><small>Un punto de control.</small></div>
      <div class="exp-node node-a">${icon('shield')}<span><small>GOBIERNO</small><strong>Dirección & matriz</strong></span></div>
      <div class="exp-node node-b">${icon('network')}<span><small>DISTRIBUCIÓN</small><strong>6 redes comerciales</strong></span></div>
      <div class="exp-node node-c">${icon('sim')}<span><small>OPERACIÓN</small><strong>24 puntos de venta</strong></span></div>
      <div class="exp-operator-line">${S.OPERATORS.map(o=>`<span><i style="--op:${o.color}"></i>${o.name}</span>`).join('')}</div>
      <span class="exp-orbit-caption">Arquitectura conceptual · escenario de demostración</span>
    </div>`;
  }
  function universe() {
    const m=S.metrics({...F,operator:model.operator}), all=S.metrics(F);
    return `<div class="exp-universes"><div class="exp-surface-title"><span>LECTURA DEL NEGOCIO</span><button data-exp="operator" data-id="all" class="exp-text-btn" aria-pressed="${model.operator==='all'}">Consolidado ↗</button></div>
      <div class="exp-universe-total"><small>${model.operator==='all'?'Venta consolidada':S.op(model.operator).name} · últimos 30 días</small><strong>${mxn(m.revenue)}</strong><span>${num(m.count)} operaciones confirmadas · datos ficticios</span></div>
      <div class="exp-op-grid">${S.OPERATORS.map(o=>{const v=S.metrics({...F,operator:o.id});const pct=all.revenue?v.revenue/all.revenue*100:0;return `<button class="exp-op ${model.operator===o.id?'selected':''}" data-exp="operator" data-id="${o.id}" aria-pressed="${model.operator===o.id}"><div><i style="--op:${o.color}"></i>${o.name}<span>↗</span></div><strong>${mxn(v.revenue)}</strong><div class="exp-op-track"><span style="width:${pct}%;--op:${o.color}"></span></div><small>${pct.toFixed(1)}% de la venta consolidada</small></button>`;}).join('')}</div><p class="exp-small-note">Selecciona una telefonía. Los resultados se calculan desde el mismo registro de operaciones.</p></div>`;
  }
  function assetScene() {
    const a=model.sale?.asset?S.asset(model.sale.asset):S.asset(model.quote?.asset);
    if(!a)return `<div class="exp-empty">${icon('sim')}<h3>No hay una SIM disponible para este ejemplo.</h3><p>Asigna inventario Movistar a Conecta Alameda desde la consola y vuelve a preparar la operación.</p>${btn('Abrir inventario de matriz','inventory')}</div>`;
    return `<div class="exp-asset"><div class="exp-asset-card"><div class="exp-surface-title"><span>SIM FÍSICA / MOVISTAR</span><span class="exp-status">${esc(a.status)}</span></div><div class="exp-chip">${icon('sim')}</div><h3>Una unidad.<br>Un responsable.</h3><code>${esc(a.id)}</code><div class="exp-asset-owner"><small>UBICACIÓN ACTUAL</small><strong>${esc(S.point(a.owner)?.name || 'Almacén matriz')}</strong><span>${a.owner || 'Matriz'} · escenario ficticio</span></div></div><div class="exp-asset-history"><span class="exp-label">HISTORIA REGISTRADA</span>${a.history.slice(-3).map(h=>`<div><i></i><span><strong>${esc(h.title)}</strong><small>${esc(h.detail)} · ${day(h.at)}</small></span></div>`).join('')}</div><p class="exp-small-note">El identificador DEMO no es un ICCID real.</p></div>`;
  }
  const row=(label,value)=>`<div class="exp-ledger-row"><span>${label}</span><strong>${value}</strong></div>`;
  function saleScene() {
    const t=model.sale;
    if(!t && model.input){try{model.quote=S.quote(model.input);}catch(_){model.quote=null;}}
    const q=model.quote;
    if(t){
      const ok=t.status==='Confirmada';
      const effects=[['sim','Inventario',ok?`${t.asset} · Vendida`:'Unidad conservada'],['wallet','Monedero',ok?`Cargo aplicado: ${mxn(t.cost,2)}`:'Sin cargo aplicado'],['chart','Venta',ok?`Confirmada: ${mxn(t.amount,2)}`:'Rechazada en el simulador'],['network','Comisión',mxn(t.commission,2)+' devengados'],['shield','Bitácora',t.id+' · '+t.status]];
      return `<div class="exp-effects"><div class="exp-surface-title"><span>RESULTADO DE LA OPERACIÓN</span><span class="exp-status ${ok?'':'rejected'}">${esc(t.status)}</span></div><h3>${ok?'Una confirmación.<br>Todo actualizado.':'Rechazo controlado.<br>Sin efectos financieros.'}</h3><div class="exp-effect-list">${effects.map(([i,a,b],n)=>`<div class="exp-effect" style="--delay:${n*50}ms">${icon(i)}<span><strong>${a}</strong><small>${esc(b)}</small></span>${icon(ok?'check':i==='shield'?'check':'close')}</div>`).join('')}</div><div class="exp-inline-actions"><button class="exp-text-btn" data-exp="again">Preparar otra venta</button><button class="exp-text-btn" data-exp="audit">Ver evidencia ↗</button></div><p class="exp-small-note">No se activó ninguna línea ni se contactó a un operador.</p></div>`;
    }
    if(!q)return `<div class="exp-empty"><h3>La operación necesita inventario o saldo.</h3><p>Revisa el escenario en la consola. Abrir la historia nunca restablece tus datos.</p>${btn('Abrir inventario','inventory')}${btn('Volver a comprobar','again','quiet')}</div>`;
    return `<div class="exp-ledger"><div class="exp-ledger-head"><span>OPERACIÓN DE PRUEBA</span>${icon('sale')}<h3>SIM + paquete inicial</h3><p>Conecta Alameda · Movistar</p></div><div class="exp-ledger-body">${row('Unidad disponible',`<code>${esc(q.asset)}</code>`)}${row('Comisión de la red',mxn(q.commission,2))}${row('Cargo al monedero',mxn(q.cost,2))}${row('Saldo actual',mxn(S.wallet('PDV-001').balance,2))}<div class="exp-ledger-total"><span>Venta al público</span><strong>${mxn(q.amount,2)}</strong></div><p>Precio y comisión ficticios. La siguiente acción modifica solo este escenario local.</p><div class="exp-write-actions">${btn('Confirmar venta de prueba','confirm','primary')}${btn('Simular rechazo','reject','quiet')}</div></div></div>`;
  }
  function walletScene() {
    const r=model.request&&S.requests(F).find(x=>x.id===model.request.id),approved=r?.status==='Aprobada';
    return `<div class="exp-control"><div class="exp-surface-title"><span>SEPARACIÓN DE RESPONSABILIDADES</span>${icon('shield')}</div><div class="exp-control-step"><span class="exp-step-number">01</span><div><small>PUNTO DE VENTA / CONECTA ALAMEDA</small><h3>Solicita el abono.</h3><p>${r?esc(r.id)+' · '+esc(r.reference):'Una solicitud por $2,500 MXN. No es un depósito real.'}</p>${r?`<span class="exp-status">Solicitud registrada</span>`:btn('Crear solicitud de prueba','request','primary')}</div></div><div class="exp-control-step"><span class="exp-step-number">02</span><div><small>DIRECCIÓN Y MATRIZ</small><h3>Decide la autorización.</h3><p>${approved?'La decisión quedó registrada en la bitácora.':'Sin autorización, el monedero conserva su saldo.'}</p>${approved?'<span class="exp-status">Abono autorizado · una sola vez</span>':btn('Autorizar abono de prueba','approve','primary',!r)}</div></div><div class="exp-control-balance"><span>MONEDERO DE CONECTA ALAMEDA</span><strong>${mxn(S.wallet('PDV-001').balance,2)}</strong><small>${approved?`${mxn(250000,2)} acreditados en la demo`:r?'Solicitud pendiente. El saldo no ha aumentado.':'Saldo actual del escenario'}</small></div><p class="exp-small-note">Las dos responsabilidades se simulan aquí. No es autenticación de usuarios ni una transferencia bancaria.</p></div>`;
  }
  function evidence() {
    const refs=[model.sale?.id,model.request?.id].filter(Boolean);
    const logs=S.logs(F).filter(l=>refs.includes(l.reference));
    const m=S.metrics(F);
    return `<div class="exp-proof"><div class="exp-surface-title"><span>CIERRE EJECUTIVO / 05 SEP 2026</span><span class="exp-status">Escenario local</span></div><div class="exp-proof-total"><small>Ventas confirmadas · últimos 30 días</small><strong>${mxn(m.revenue)}</strong><span>${num(m.count)} confirmaciones · ${mxn(m.commission,2)} de comisión</span></div><div class="exp-proof-list"><span class="exp-label">EVIDENCIA DE ESTE RECORRIDO</span>${logs.length?logs.map(l=>`<div>${icon('check')}<span><strong>${esc(l.action)}</strong><small>${esc(l.reference)} · ${esc(l.actor)}</small></span></div>`).join(''):'<p>Exploraste sin crear operaciones. Confirma una venta o solicita un abono para generar evidencia en esta sesión.</p>'}</div><div class="exp-inline-actions">${btn('Abrir informe ejecutivo','report','primary')}${btn('Ver bitácora','audit','quiet')}</div><p class="exp-small-note">PWA interna · sin tienda pública, WhatsApp Business ni apps nativas. Integraciones productivas fuera de la demostración.</p></div>`;
  }
  function renderStory() {
    const [chapter,title,desc]=CHAPTERS[model.chapter];
    const visual=[orbit,universe,assetScene,saleScene,walletScene,evidence][model.chapter]();
    dialog.innerHTML=`<div class="exp-shell"><header class="exp-header"><div class="exp-brand"><span class="exp-brand-mark">N<span>↗</span></span><strong>NEXUS <b>ONE</b></strong><i></i><span>EXECUTIVE EXPERIENCE</span></div><button type="button" class="exp-exit" data-exp="close" aria-label="Cerrar historia y volver a la consola">Volver a la consola ${icon('close')}</button></header>
      <div class="exp-main" data-chapter="${model.chapter}"><section class="exp-copy"><div class="exp-eyebrow"><span>${String(model.chapter+1).padStart(2,'0')}</span> / ${chapter.toUpperCase()}</div><h1 id="exp-title" tabindex="-1">${title}</h1><p class="exp-description">${desc}</p><div class="exp-copy-actions">${model.chapter===0?btn('Comenzar la historia','next','primary')+btn('Recorrido libre','free','quiet'):model.chapter===5?btn('Explorar la plataforma','console','primary'):btn('Ver en la consola','module','quiet')}</div><div class="exp-context"><span></span><p>Demostración interactiva · perspectiva de matriz<br><small>Datos ficticios. Sin operaciones reales.</small></p></div></section><section class="exp-visual" aria-label="${esc(chapter)}">${visual}<p class="exp-error" id="exp-error" role="alert"></p></section></div>
      <footer class="exp-footer"><nav class="exp-chapters" aria-label="Capítulos de la historia">${CHAPTERS.map(([label],i)=>`<button data-exp="chapter" data-index="${i}" ${i===model.chapter?'aria-current="step"':''}><span>${String(i+1).padStart(2,'0')}</span>${label}</button>`).join('')}</nav><div class="exp-navigation"><button data-exp="prev" ${model.chapter===0?'disabled':''} aria-label="Capítulo anterior">${icon('back')}</button><span>${model.chapter+1} / ${CHAPTERS.length}</span><button data-exp="next" ${model.chapter===5?'disabled':''} aria-label="Capítulo siguiente">${icon('arrow')}</button></div></footer></div>`;
  }
  function refresh(redrawConsole = false) {
    renderStory();
    $('#exp-title').focus({preventScroll:true});
    $('.exp-main').scrollTop=0;
    if(redrawConsole)App.render();
  }
  dialog.addEventListener('click',e=>{
    const b=e.target.closest('[data-exp]');if(!b||b.disabled)return;
    const a=b.dataset.exp;
    try {
      if(a==='close'){close();return;}
      if(a==='free'){close();App.present();return;}
      if(a==='console'){close();return;}
      if(a==='module'){goApp(['overview','operators','inventory','sales','wallet','audit'][model.chapter]);return;}
      if(a==='report'){goApp('reports');return;}
      if(a==='audit'){goApp('audit',model.sale?.id);return;}
      if(a==='inventory'){goApp('inventory');return;}
      if(a==='operator'){
        if(b.dataset.id!=='all'&&!S.op(b.dataset.id))return;
        model.operator=b.dataset.id;renderStory();
        $(`[data-exp="operator"][data-id="${model.operator}"]`,dialog)?.focus({preventScroll:true});return;
      }
      if(a==='next')model.chapter=Math.min(5,model.chapter+1);
      if(a==='prev')model.chapter=Math.max(0,model.chapter-1);
      if(a==='chapter')model.chapter=Math.max(0,Math.min(5,Number(b.dataset.index)));
      if(a==='again'){model.sale=model.input=model.quote=null;prepare();}
      if(a==='confirm'||a==='reject'){
        if(model.sale)return;
        b.disabled=true;
        model.sale=S.sale({...model.input,outcome:a==='reject'?'reject':'confirm'});
      }
      if(a==='request'){
        if(model.request)return;
        b.disabled=true;
        model.previousWallet=S.wallet('PDV-001').balance;
        model.request=S.requestTopup({role:'pos',owner:'PDV-001',amount:250000,reference:'DEMO-STORY-'+Date.now().toString(36).toUpperCase()});
      }
      if(a==='approve'){
        b.disabled=true;
        if(!model.request)return;
        const r=S.requests(F).find(r=>r.id===model.request.id);
        if(r?.status==='Pendiente')S.resolveTopup(r.id,true,'director');
      }
      refresh(['confirm','reject','request','approve'].includes(a));
    } catch(err){b.disabled=false;$('#exp-error').textContent=err.message || 'No se pudo completar la operación de prueba.';}
  });
  dialog.addEventListener('keydown',e=>{
    if(e.key==='Tab') {
      const items=[...dialog.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(el=>el.getClientRects().length);
      const first=items[0],last=items.at(-1);
      if(e.shiftKey&&(document.activeElement===first||document.activeElement.id==='exp-title')){e.preventDefault();last?.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
    }
    // Native dialog handles Tab and Escape. Direction keys navigate only from
    // chapter controls or the title, never while manipulating a form control.
    if(['ArrowRight','ArrowLeft'].includes(e.key)&&!e.target.closest('.exp-visual')&&!['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)){
      e.preventDefault();e.stopPropagation();model.chapter=Math.max(0,Math.min(5,model.chapter+(e.key==='ArrowRight'?1:-1)));refresh();
    }
  });
  dialog.addEventListener('close',()=>{
    document.documentElement.classList.remove('experience-open');
    const target=restoreFocus?.isConnected?restoreFocus:$('.presentation-launch');
    target?.focus({preventScroll:true});
  });
  function chartEnhancement() {
    const context=App.context(); if(context.page!=='overview')return;
    const host=$('#view .sales-chart');if(!host)return;
    const period=Number(context.period), rows=S.sales(context).filter(t=>t.status==='Confirmada'), prior=S.sales(context,true).filter(t=>t.status==='Confirmada');
    const totalFor=(source,end)=>source.filter(t=>Date.parse(t.at)<=end&&Date.parse(t.at)>end-S.DAY).reduce((s,t)=>s+t.amount,0);
    const values=Array.from({length:period},(_,i)=>{const at=S.ANCHOR-(period-1-i)*S.DAY;return {at,current:totalFor(rows,at),previous:totalFor(prior,at-period*S.DAY)};});
    const max=Math.max(10000,...values.flatMap(v=>[v.current,v.previous]))*1.18;
    const point=(value,i)=>`${60+i*625/Math.max(1,period-1)},${180-value/max*150}`;
    const current=values.map((v,i)=>point(v.current,i)).join(' '),previous=values.map((v,i)=>point(v.previous,i)).join(' ');
    const labels=[...new Set([0,Math.floor((period-1)/3),Math.floor((period-1)*2/3),period-1])];
    host.innerHTML=`<svg viewBox="0 0 720 225" preserveAspectRatio="none" role="img" aria-label="Ventas confirmadas del periodo frente al periodo anterior. Datos completos debajo."><defs><linearGradient id="exp-chart-fill" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#477cff" stop-opacity=".2"/><stop offset="1" stop-color="#477cff" stop-opacity="0"/></linearGradient></defs>${[0,1,2,3].map(i=>`<line class="chart-grid" x1="60" y1="${30+i*50}" x2="685" y2="${30+i*50}"/><text class="chart-text" x="49" y="${34+i*50}" text-anchor="end">${short(Math.round(max*(3-i)/3))}</text>`).join('')}<polyline class="ep-prior-line" points="${previous}"/><polygon points="60,180 ${current} ${60+(period-1)*625/Math.max(1,period-1)},180" fill="url(#exp-chart-fill)"/><polyline class="chart-line" points="${current}"/><line id="ep-marker" class="ep-marker" y1="25" y2="180"/><circle id="ep-dot" class="chart-dot" r="4"/>${labels.map(i=>`<text class="chart-text" x="${60+i*625/Math.max(1,period-1)}" y="211" text-anchor="${i===0?'start':i===period-1?'end':'middle'}">${day(values[i].at)}</text>`).join('')}</svg>`;
    const panel=host.closest('.panel');
    const legend=$('.chart-legend',panel);if(legend)legend.innerHTML='<span class="legend-key"><i></i> Periodo seleccionado</span><span class="legend-key ep-prior-key"><i></i> Periodo anterior equivalente</span>';
    const details=$('.chart-access',panel);
    if(details)details.innerHTML=`<summary>Ver datos y fechas comparables</summary><table><caption class="sr-only">Ventas diarias y fecha equivalente del periodo anterior, en MXN</caption><thead><tr><th>Fecha</th><th>Venta</th><th>Fecha anterior</th><th>Venta anterior</th></tr></thead><tbody>${values.map(v=>`<tr><td>${day(v.at)}</td><td>${mxn(v.current)}</td><td>${day(v.at-period*S.DAY)}</td><td>${mxn(v.previous)}</td></tr>`).join('')}</tbody></table>`;
    panel.querySelector('.ep-chart-reader')?.remove();
    const reader=document.createElement('div');reader.className='ep-chart-reader';reader.innerHTML=`<label for="ep-chart-day">Explorar por día</label><input id="ep-chart-day" type="range" min="0" max="${period-1}" value="${period-1}" ${period===1?'disabled':''}><output id="ep-chart-value" for="ep-chart-day"></output>`;host.after(reader);
    function select(i){const v=values[i],x=60+i*625/Math.max(1,period-1);$('#ep-marker').setAttribute('x1',x);$('#ep-marker').setAttribute('x2',x);$('#ep-dot').setAttribute('cx',x);$('#ep-dot').setAttribute('cy',180-v.current/max*150);$('#ep-chart-value').innerHTML=`<strong>${day(v.at)} · ${mxn(v.current)}</strong><span>vs. ${day(v.at-period*S.DAY)} · ${mxn(v.previous)}</span>`;$('#ep-chart-day').setAttribute('aria-valuetext',`${day(v.at)}: ${mxn(v.current)}; comparado con ${day(v.at-period*S.DAY)}: ${mxn(v.previous)}`);}
    $('#ep-chart-day').addEventListener('input',e=>select(Number(e.target.value)));select(period-1);
  }
  function polish() {
    chartEnhancement();
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const first=$('#view > .kpi-grid');
    if(first?.animate)first.animate([{opacity:.55,transform:'translateY(5px)'},{opacity:1,transform:'none'}],{duration:220,easing:'ease-out'});
  }
  document.addEventListener('nexus:view',polish);
  window.NexusExperience=Object.freeze({open});
  polish();
})();
