/* NEXUS ONE Enterprise v3 / UI, accessible dialogs and connected demo workflows. */
(() => {
  'use strict';
  const S = window.NexusStore;
  if (!S) { document.getElementById('view').textContent = 'No se pudo cargar el escenario. Recarga esta página.'; return; }
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const money = (n, digits = 0) => new Intl.NumberFormat('es-MX', { style:'currency', currency:'MXN', minimumFractionDigits:digits, maximumFractionDigits:digits }).format(n / 100);
  const num = n => new Intl.NumberFormat('es-MX', { maximumFractionDigits:0 }).format(n);
  const compact = n => n >= 100000000 ? '$' + (n/100000000).toFixed(2) + ' M' : n >= 100000 ? '$' + (n/100000).toFixed(n>=10000000?0:1) + ' mil' : money(n);
  const date = value => new Intl.DateTimeFormat('es-MX',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'America/Mexico_City'}).format(new Date(value));
  const fold = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const paths = {
    grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    network:'<rect x="9" y="3" width="6" height="5" rx="1"/><rect x="2" y="16" width="6" height="5" rx="1"/><rect x="16" y="16" width="6" height="5" rx="1"/><path d="M12 8v4M5 16v-4h14v4"/>',
    sim:'<path d="M8 3h7l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><rect x="8" y="10" width="8" height="7" rx="1"/><path d="M12 10v7M8 13.5h8"/>',
    signal:'<path d="M4 19v-3M9 19v-7M14 19V8M19 19V4"/>',
    wallet:'<path d="M20 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h15v12H5a2 2 0 0 1-2-2V6"/><path d="M20 12h-5v5h5M16.5 14.5h.1"/>',
    chart:'<path d="M4 3v17h17M8 15l4-5 4 2 5-7"/>',
    sale:'<path d="M3 7h18v13H3zM2 3h20v4H2zM9 11h6M12 8v3"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z"/><path d="m8 12 3 3 5-6"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    settings:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="16" cy="17" r="3"/>',
    search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/>',
    play:'<path d="m8 4 12 8-12 8Z"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
    left:'<path d="m14 5-7 7 7 7"/>',
    right:'<path d="m10 5 7 7-7 7"/>',
    menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
    close:'<path d="m6 6 12 12M6 18 18 6"/>',
    download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M7 14h2M13 14h2"/>',
    document:'<path d="M5 3h9l5 5v13H5zM14 3v6h5M8 13h8M8 17h6"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
    user:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
    building:'<path d="M4 21V3h12v18M16 9h4v12M2 21h20M8 7h4M8 11h4M8 15h4M9 21v-3h2v3"/>',
    refresh:'<path d="M20 7v5h-5M4 17v-5h5M5 8a8 8 0 0 1 13-3l2 3M4 16l2 3a8 8 0 0 0 13-3"/>',
    empty:'<path d="m3 8 9-5 9 5v12H3ZM3 8l9 5 9-5M12 13v7"/>'
  };
  const icon = name => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.grid}</svg>`;
  const hydrate = (root = document) => $$('[data-icon]',root).forEach(el => { el.innerHTML = icon(el.dataset.icon); el.removeAttribute('data-icon'); });
  const button = (label, action, glyph='arrow', kind='', extra='') => `<button type="button" class="btn ${kind}" data-action="${action}" ${extra}>${icon(glyph)}${label}</button>`;
  const tag = (value, kind='') => `<span class="tag ${kind || (['Confirmada','Disponible','Aprobada'].includes(value)?'good dot':['Rechazada'].includes(value)?'bad dot':['Pendiente','En tránsito'].includes(value)?'warn dot':'')}">${esc(value)}</span>`;
  const operatorCell = id => `<span class="operator-cell"><i class="operator-dot" style="--op:${S.op(id)?.color || '#888'}"></i>${esc(S.op(id)?.name || 'Multiope­rador')}</span>`;
  const PAGES = {
    overview: ['Centro de control','grid','VISIÓN EJECUTIVA','Las decisiones importantes, en una sola vista.'],
    operators: ['Universos de operación','signal','MODELO MULTIOPERADOR','Cada telefonía, su operación. Toda la empresa, una sola dirección.'],
    inventory: ['Inventario SIM & eSIM','sim','CONTROL Y TRAZABILIDAD','De la recepción al punto de venta, sin perder una sola unidad.'],
    network: ['Red comercial','network','DISTRIBUCIÓN Y COBERTURA','Una visión completa de tu estructura y de cada punto de venta.'],
    sales: ['Ventas y activaciones','sale','OPERACIÓN COMERCIAL','Inventario, saldo y comisiones conectados en cada venta de prueba.'],
    wallet: ['Monedero y crédito','wallet','CONTROL FINANCIERO OPERATIVO','Saldos claros. Movimientos trazables. Crédito bajo control.'],
    commissions: ['Comisiones y liquidación','chart','RENTABILIDAD DE LA RED','Del devengado al corte, con detalle por operación y operador.'],
    approvals: ['Centro de autorizaciones','check','EXCEPCIONES Y DECISIONES','Atiende las solicitudes pendientes y deja evidencia de cada decisión.'],
    reports: ['Reportes ejecutivos','document','INFORMACIÓN PARA DECIDIR','Información estructurada para dirección, operación y seguimiento.'],
    audit: ['Bitácora de operaciones','shield','GOBIERNO Y TRAZABILIDAD','Quién hizo qué, sobre qué operación y con qué resultado.'],
    settings: ['Configuración del entorno','settings','ALCANCE Y EXPERIENCIA','Capacidades del escenario y límites explícitos de esta demostración.']
  };
  const permitted = () => Object.keys(PAGES).filter(p => !(state.role !== 'director' && ['approvals','settings'].includes(p)) && !(state.role === 'pos' && p === 'network'));
  const state = { role:'director', operator:'all', period:30, page:'overview', query:'', status:'all', type:'all', pageIndex:1, guide:-1 };
  const filter = () => ({role:state.role,operator:state.operator,period:state.period});
  let draft = null, lastTransaction = null, installPrompt = null;
  const TOUR = [
    ['overview','El negocio, en una sola vista','Compara ventas, actividad y comisiones. Cambia el periodo o el operador sin perder contexto.'],
    ['operators','Un universo por telefonía','Explora inventario, resultados y alcance comercial independientes para cada operador.'],
    ['inventory','Cada unidad tiene una historia','Abre un identificador DEMO. Recibe un lote, asigna una unidad y confirma su recepción.'],
    ['sales','Una venta que conecta la operación','Pulsa Nueva venta. La confirmación cambia inventario, monedero, comisión y bitácora.'],
    ['wallet','Control antes que conciliaciones','Consulta saldo y crédito. Una solicitud no incrementa el monedero hasta su autorización.'],
    ['commissions','De la operación al corte','Las comisiones nacen de ventas confirmadas. Prepara un corte y exporta su detalle.'],
    ['audit','Cierra con evidencia','Revisa la bitácora de lo que acabas de hacer. Todas las operaciones siguen siendo simuladas.']
  ];
  function notify(message) {
    const el = document.createElement('div'); el.className='toast'; el.innerHTML=icon('check')+`<span>${esc(message)}</span>`;
    const stack=$('#toasts'); while(stack.children.length>=2)stack.firstElementChild.remove();
    stack.append(el); setTimeout(()=>el.remove(),4000);
  }
  function fail(error) { const target=$('#form-error'); if(target)target.textContent=error.message || String(error);else notify(error.message || String(error)); }
  function closeDialog() { if($('#dialog').open)$('#dialog').close(); }
  function modal(title, subtitle, content, drawer=false) {
    const el=$('#dialog'); el.className=drawer?'drawer':'';
    el.innerHTML=`<div class="dialog-head"><div><h2 id="dialog-title">${esc(title)}</h2><p>${esc(subtitle)}</p></div><button class="icon-button" data-action="close" aria-label="Cerrar diálogo">${icon('close')}</button></div><div class="dialog-body">${content}</div>`;
    if(!el.open)el.showModal();
    setTimeout(()=>{ const focus=el.querySelector('[autofocus]')||el.querySelector('.dialog-body input,.dialog-body select,.dialog-body button')||el.querySelector('button');focus?.focus(); },0);
  }
  function go(page) {
    if(!permitted().includes(page))page='overview';
    state.page=page;state.query='';state.status='all';state.type='all';state.pageIndex=1;
    if(location.hash!==`#${page}`)history.replaceState(null,'',`#${page}`);
    $('#sidebar').classList.remove('open');$('#scrim').classList.remove('open');$('.menu-toggle').setAttribute('aria-expanded','false');
    render();window.scrollTo({top:0,behavior:'instant'});
  }
  function changeRole(role) {
    if(!S.ROLES[role])return;
    state.role=role;state.operator='all';state.query='';state.pageIndex=1;
    closeDialog();go(permitted().includes(state.page)?state.page:'overview');notify('Vista de demostración: '+S.ROLES[role].name+'.');
  }
  function kpi(label, value, foot, glyph, featured=false) {
    return `<article class="kpi ${featured?'featured':''}"><div class="kpi-head"><span>${label}</span><span class="kpi-icon">${icon(glyph)}</span></div><div class="kpi-value">${value}</div><div class="kpi-foot">${foot}</div></article>`;
  }
  const currencyValue = n => `<span class="wide-value">${money(n)}</span><span class="compact-value" aria-label="${esc(money(n))}">${compact(n)}</span>`;
  const trend = m => m.growth === null ? '<span>Sin base comparable</span>' : `<span class="trend ${m.growth<0?'down':''}">${m.growth>=0?'↗':'↘'} ${Math.abs(m.growth).toFixed(1)}%</span><span>vs. periodo anterior</span>`;
  function panelHeader(title, subtitle='', action='') { return `<div class="panel-header"><div><h2>${title}</h2>${subtitle?`<p>${subtitle}</p>`:''}</div>${action}</div>`; }
  function empty(title, text, action='') {return `<div class="empty">${icon('empty')}<h3>${title}</h3><p>${text}</p>${action}</div>`;}
  function notice(text, neutral=false) {return `<div class="notice ${neutral?'neutral':''}">${icon('info')}<p>${text}</p></div>`;}
  function overview() {
    const m=S.metrics(filter());const points=S.rolePoints(state.role);const f=S.finance(state.role);
    const allAssets=S.assets(filter());const rejected=m.rows.length-m.count;
    const grouped=S.allowedOperators(state.role).map(o=>({...o,value:m.confirmed.filter(t=>t.operator===o.id).reduce((s,t)=>s+t.amount,0)})).filter(o=>state.operator==='all'||o.id===state.operator);
    let acc=0;const gradient=grouped.map(o=>{const start=acc;acc+=m.revenue?o.value/m.revenue*100:0;return `${o.color} ${start}% ${acc}%`;}).join(',');
    const regionSales=S.REGIONS.map(region=>({region,value:m.confirmed.filter(t=>S.point(t.owner).region===region).reduce((s,t)=>s+t.amount,0)})).filter(r=>r.value>0).sort((a,b)=>b.value-a.value);
    return `<div class="kpi-grid">
      ${kpi('Ventas confirmadas',currencyValue(m.revenue),trend(m),'chart',true)}
      ${kpi('Operaciones exitosas',num(m.count),`<span class="trend">${m.success.toFixed(1)}%</span><span>del total de intentos</span>`,'sale')}
      ${kpi('Inventario disponible',num(m.stock),`<span>${num(allAssets.filter(a=>a.type==='SIM'&&a.status==='Disponible').length)} SIM</span><span>· ${num(allAssets.filter(a=>a.type==='eSIM'&&a.status==='Disponible').length)} eSIM</span>`,'sim')}
      ${kpi('Comisiones devengadas',currencyValue(m.commission),'<span>Calculadas por operación confirmada</span>','wallet')}
    </div><div class="dashboard-grid">
    <section class="panel">${panelHeader('Evolución de ventas',`Últimos ${state.period} días del escenario · ${state.operator==='all'?'Vista consolidada':esc(S.op(state.operator).name)}`,tag('MXN'))}${chart(m.confirmed)}<div class="chart-legend"><span class="legend-key"><i></i> Ventas confirmadas</span><span>05 sep 2026 · Cierre del escenario</span></div></section>
    <section class="panel">${panelHeader('Participación por operador','Cada universo aporta a un mismo resultado.')}
      <div class="mix-layout"><div class="donut" style="background:${m.revenue?`conic-gradient(${gradient})`:'var(--line)'}" role="img" aria-label="Participación por operador detallada a continuación"><div class="donut-hole"><strong>${grouped.length}</strong><small>${grouped.length===1?'operador':'operadores'}</small></div></div><div class="mix-legend">${grouped.map(o=>`<div class="mix-row"><i class="operator-dot" style="--op:${o.color}"></i><span>${esc(o.name)}</span><strong>${m.revenue?(o.value/m.revenue*100).toFixed(1):'0.0'}%</strong></div>`).join('')}</div></div>
      <div class="operator-summary"><div><span>Ticket promedio</span><strong>${money(m.count?Math.round(m.revenue/m.count):0)}</strong></div><div><span>Puntos con venta</span><strong>${m.activePoints} <small>/ ${points.filter(p=>state.operator==='all'||p.operators.includes(state.operator)).length} habilitados</small></strong></div></div>
    </section>
    <section class="panel">${panelHeader('Prioridades operativas','La atención donde realmente hace falta.',tag('Escenario'))}<div class="priority-list">
      ${priority('Solicitudes de monedero',`${m.pending} pendientes de autorización. Sin impacto en saldo hasta aprobarse.`,state.role==='director'?'approvals':'wallet','wallet','amber')}
      ${priority(rejected?'Operaciones por revisar':'Operaciones bajo control',`${num(rejected)} intentos rechazados en el periodo. Sin cargos ni comisión.`, 'sales','shield',rejected?'amber':'','Rechazada')}
      ${priority('Continuidad de inventario',`${num(allAssets.filter(a=>a.status==='En tránsito').length)} unidades en tránsito y ${num(m.stock)} disponibles.`, 'inventory','sim','','En tránsito')}
    </div></section>
    <section class="panel network-card">${panelHeader('Tu red, bajo control','Cobertura comercial del perfil seleccionado.',tag('Red de prueba'))}<div class="network-numbers"><div><strong>${points.length}</strong><span>Puntos de venta</span></div><div><strong>${new Set(points.map(p=>p.distributor)).size}</strong><span>Distribuidores</span></div></div><div class="region-bars">${regionSales.slice(0,4).map(r=>`<div class="region-row"><span>${r.region}</span><div class="region-track"><span style="width:${m.revenue?r.value/m.revenue*100:0}%"></span></div><strong>${m.revenue?Math.round(r.value/m.revenue*100):0}%</strong></div>`).join('')||'<p>Sin ventas en el periodo seleccionado.</p>'}</div>${button(state.role==='pos'?'Ver mis operaciones':'Explorar red comercial','go','arrow','',`data-page="${state.role==='pos'?'sales':'network'}"`)}</section>
    <section class="panel wide">${panelHeader('Actividad reciente','Operaciones del periodo y universo seleccionados.',button('Ver todas','go','arrow','link','data-page="sales"'))}<div class="section-gap">${salesTable(m.rows.slice(0,6),false)}</div></section>
    </div>`;
  }
  function priority(title,text,page,glyph,kind,status='all') {return `<div class="priority"><div class="priority-icon ${kind}">${icon(glyph)}</div><div class="priority-text"><strong>${title}</strong><p>${text}</p></div><button data-action="go" data-page="${page}" data-status="${esc(status)}" aria-label="Abrir ${esc(PAGES[page][0])}">${icon('arrow')}</button></div>`;}
  function chart(rows) {
    const data=Array.from({length:state.period},(_,i)=>{
      const end=S.ANCHOR-(state.period-1-i)*S.DAY;
      return {at:end,value:rows.filter(t=>Date.parse(t.at)<=end&&Date.parse(t.at)>end-S.DAY).reduce((s,t)=>s+t.amount,0)};
    });
    const max=Math.max(10000,...data.map(d=>d.value))*1.2;
    const pts=data.map((d,i)=>({x:60+i*625/Math.max(data.length-1,1),y:180-d.value/max*150,...d}));
    const line=pts.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const labels=[...new Set([0,Math.floor((data.length-1)/3),Math.floor((data.length-1)*2/3),data.length-1])];
    const shortDate=at=>new Intl.DateTimeFormat('es-MX',{day:'2-digit',month:'short',timeZone:'America/Mexico_City'}).format(new Date(at));
    return `<div class="sales-chart"><svg viewBox="0 0 720 225" preserveAspectRatio="none" role="img" aria-label="Ventas diarias en pesos mexicanos. Tabla de datos disponible debajo del gráfico."><defs><linearGradient id="chart-shade" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#3a78ed" stop-opacity=".20"/><stop offset="1" stop-color="#3a78ed" stop-opacity="0"/></linearGradient></defs>
    ${[0,1,2,3].map(i=>`<line class="chart-grid" x1="60" y1="${30+i*50}" x2="685" y2="${30+i*50}"/><text class="chart-text" x="49" y="${34+i*50}" text-anchor="end">${compact(Math.round(max*(3-i)/3))}</text>`).join('')}
    <path d="${line} L${pts.at(-1).x},180 L60,180Z" fill="url(#chart-shade)"/><path class="chart-line" d="${line}"/>
    ${pts.map(p=>`<circle class="chart-dot" cx="${p.x}" cy="${p.y}" r="${pts.length===1?5:2.6}"><title>${shortDate(p.at)}: ${money(p.value)}</title></circle>`).join('')}
    ${labels.map(i=>`<text class="chart-text" x="${pts[i].x}" y="211" text-anchor="${i===0?'start':i===data.length-1?'end':'middle'}">${shortDate(data[i].at)}</text>`).join('')}</svg></div>
    <details class="chart-access"><summary>Ver datos del gráfico</summary><table><caption class="sr-only">Ventas confirmadas por día, en MXN</caption><thead><tr><th>Fecha</th><th>Venta confirmada</th></tr></thead><tbody>${data.map(d=>`<tr><td>${shortDate(d.at)}</td><td>${money(d.value)}</td></tr>`).join('')}</tbody></table></details>`;
  }
  function table(headers,rows) {
    if(!rows.length)return empty('No hay resultados','Prueba otro filtro, periodo o término de búsqueda.');
    return `<div class="table-wrap"><table class="data-table"><thead><tr>${headers.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map((v,i)=>`<td data-label="${esc(headers[i])}"${['Importe','Comisión','Saldo','Venta'].includes(headers[i])?' class="numeric"':''}>${v}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  function salesTable(rows,commission=false) {
    return table(['Operación','Operador','Punto de venta',commission?'Comisión':'Producto','Importe','Estado'],rows.map(t=>[
      `<button class="table-link" data-action="transaction" data-id="${esc(t.id)}">${esc(t.id)}</button><small>${date(t.at)}</small>`,operatorCell(t.operator),`${esc(S.point(t.owner)?.name)}<small>${t.owner}</small>`,commission?money(t.commission,2):esc(S.product(t.product)?.name),`<strong>${money(t.amount,2)}</strong>`,commission?tag(S.isSettled(t.id)?'Incluida en corte':'Por liquidar',S.isSettled(t.id)?'good':'warn'):tag(t.status)
    ]));
  }
  function operatorsView() {
    const list=S.allowedOperators(state.role).filter(o=>state.operator==='all'||o.id===state.operator);
    return `<div class="operator-grid">${list.map(o=>{const m=S.metrics({...filter(),operator:o.id});return `<article class="operator-card"><div class="operator-card-top"><div class="operator-identity"><span class="operator-monogram" style="--op:${o.color}">${o.short}</span><div><h3>${o.name}</h3><small>Universo independiente</small></div></div>${tag('Simulador','good')}</div><div class="operator-revenue">${money(m.revenue)}</div><small>Venta confirmada · ${state.period} días</small><div class="mini-metrics"><div><span>Operaciones</span><strong>${num(m.count)}</strong></div><div><span>Inventario</span><strong>${num(m.stock)}</strong></div><div><span>Comisión demo</span><strong>${(o.rate/100).toFixed(1)}%</strong></div></div>${button('Explorar '+o.name,'universe','arrow','',`data-operator="${o.id}"`)}</article>`;}).join('')}</div><div class="section-gap">${notice('Los nombres identifican universos operativos de ejemplo. No existe conexión, convenio ni validación de precios con estas marcas. Las tarifas y comisiones de la demo son ficticias.',true)}</div>`;
  }
  function tableToolbar(kind) {
    const statuses=kind==='inventory'?['Disponible','En tránsito','Vendida']:kind==='sales'?['Confirmada','Rechazada']:kind==='commissions'?['Por liquidar','Incluida en corte']:[];
    return `<div class="table-toolbar"><div class="table-tools"><label class="search-field">${icon('search')}<span class="sr-only">Buscar en ${esc(PAGES[state.page][0])}</span><input id="table-search" value="${esc(state.query)}" placeholder="Buscar identificador, operador o punto..."></label>${statuses.length?`<select class="field-select" id="status-filter" aria-label="Filtrar por estado"><option value="all">Todos los estados</option>${statuses.map(s=>`<option ${state.status===s?'selected':''}>${s}</option>`).join('')}</select>`:''}${kind==='inventory'?`<select id="type-filter" class="field-select" aria-label="Filtrar por formato"><option value="all">SIM y eSIM</option><option ${state.type==='SIM'?'selected':''}>SIM</option><option ${state.type==='eSIM'?'selected':''}>eSIM</option></select>`:''}</div>${button('Exportar CSV','export','download')}</div>`;
  }
  function filtered(kind) {
    let rows=kind==='inventory'?S.assets(filter()):kind==='audit'?S.logs(filter()):S.sales(filter()).filter(t=>kind!=='commissions'||t.status==='Confirmada');
    return rows.filter(r=>{
      const status=kind==='commissions'?(S.isSettled(r.id)?'Incluida en corte':'Por liquidar'):r.status;
      const hay=[r.id,r.owner,r.operator,S.op(r.operator)?.name,S.point(r.owner)?.name,r.action,r.detail,r.reference].join(' ');
      return (!state.query||fold(hay).includes(fold(state.query)))&&(state.status==='all'||status===state.status)&&(state.type==='all'||r.type===state.type);
    });
  }
  function tableContent(kind) {
    const rows=filtered(kind),size=10,total=Math.max(1,Math.ceil(rows.length/size));
    state.pageIndex=Math.min(state.pageIndex,total);
    const page=rows.slice((state.pageIndex-1)*size,state.pageIndex*size);
    let content='';
    if(kind==='inventory') content=table(['Identificador demo','Operador','Formato','Ubicación','Estado','Trazabilidad'],page.map(a=>[
      `<button class="table-link" data-action="asset" data-id="${a.id}">${a.id}</button><small>Identificador ficticio · no es un ICCID</small>`,operatorCell(a.operator),tag(a.type),a.owner?`${esc(S.point(a.owner)?.name)}<small>${a.owner}</small>`:'Almacén matriz',tag(a.status),`<button class="table-link" data-action="asset" data-id="${a.id}">Ver historia ↗</button>`
    ]));
    else if(kind==='audit')content=table(['Evento','Acción','Responsable','Referencia','Resultado'],page.map(l=>[
      `<strong>${esc(l.id)}</strong><small>${date(l.at)}</small>`,`${esc(l.action)}<small>${esc(l.detail)}</small>`,esc(l.actor),esc(l.reference),tag(l.result)
    ]));
    else content=salesTable(page,kind==='commissions');
    return content+`<div class="table-footer"><span>${num(rows.length)} registros · ${rows.length?num((state.pageIndex-1)*size+1):0}–${Math.min(rows.length,state.pageIndex*size)} visibles</span><div class="pagination"><button data-action="paginate" data-direction="-1" ${state.pageIndex===1?'disabled':''} aria-label="Página anterior">${icon('left')}</button><span>${state.pageIndex} / ${total}</span><button data-action="paginate" data-direction="1" ${state.pageIndex===total?'disabled':''} aria-label="Página siguiente">${icon('right')}</button></div></div>`;
  }
  function inventoryView() {
    const rows=S.assets(filter());
    return `<div class="kpi-grid">${kpi('Unidades en el universo',num(rows.length),'<span>Inventario al corte del escenario</span>','sim',true)}${kpi('Disponibles para venta',num(rows.filter(a=>a.status==='Disponible').length),'<span>Stock listo para operación</span>','check')}${kpi('En tránsito',num(rows.filter(a=>a.status==='En tránsito').length),'<span>Recepción pendiente</span>','network')}${kpi('Perfiles eSIM',num(rows.filter(a=>a.type==='eSIM').length),'<span>Solo identificadores ficticios</span>','signal')}</div><section class="panel">${tableToolbar('inventory')}<div id="table-content">${tableContent('inventory')}</div></section><div class="section-gap">${notice('El inventario es una fotografía del escenario: no cambia con el filtro de periodo. Todos los identificadores empiezan por DEMO; no se utilizan ICCID, QR ni perfiles eSIM reales.',true)}</div>`;
  }
  function salesView() {
    const m=S.metrics(filter());
    return `<div class="kpi-grid">${kpi('Venta confirmada',currencyValue(m.revenue),trend(m),'chart',true)}${kpi('Confirmaciones',num(m.count),`<span>${m.success.toFixed(1)}% de los intentos</span>`,'check')}${kpi('Rechazos simulados',num(m.rows.length-m.count),'<span>Sin cargo ni comisión</span>','shield')}${kpi('Comisión devengada',currencyValue(m.commission),'<span>Reglas ficticias por operador</span>','wallet')}</div><section class="panel">${tableToolbar('sales')}<div id="table-content">${tableContent('sales')}</div></section>`;
  }
  function networkView() {
    const points=S.rolePoints(state.role).filter(p=>state.operator==='all'||p.operators.includes(state.operator));const m=S.metrics(filter());
    return `<div class="kpi-grid">${kpi('Puntos en la red',num(points.length),'<span>Visibles para este perfil</span>','building',true)}${kpi('Distribuidores',num(new Set(points.map(p=>p.distributor)).size),'<span>Jerarquía comercial del escenario</span>','network')}${kpi('Con ventas confirmadas',num(m.activePoints),`<span>Últimos ${state.period} días</span>`,'sale')}${kpi('Regiones',num(new Set(points.map(p=>p.region)).size),'<span>Cobertura comercial de ejemplo</span>','grid')}</div><div class="directory">${points.map(p=>{const rows=m.confirmed.filter(t=>t.owner===p.id);return `<article class="directory-card"><div class="directory-head"><span class="priority-icon">${icon('building')}</span>${tag(p.region)}</div><h3>${esc(p.name)}</h3><p>${p.id} · ${p.distributor}</p><div class="directory-stats"><div><span>Venta del periodo</span><strong>${money(rows.reduce((s,t)=>s+t.amount,0))}</strong></div><div><span>Saldo disponible</span><strong>${money(S.wallet(p.id).balance)}</strong></div></div><div class="mix-row">${p.operators.map(id=>`<i class="operator-dot" title="${esc(S.op(id).name)}" style="--op:${S.op(id).color}"></i>`).join('')}<small>${p.operators.length} operadores habilitados</small></div>${button('Abrir expediente','point','arrow','',`data-id="${p.id}"`)}</article>`;}).join('')}</div>`;
  }
  function walletView() {
    const f=S.finance(state.role);const requests=S.requests(filter());
    return `<div class="wallet-hero"><section class="balance-card"><div class="eyebrow">SALDO DISPONIBLE EN LA RED VISIBLE</div><div class="balance-value">${money(f.balance,2)}</div><p>Monedero único por punto de venta · Saldo al corte del escenario</p><div class="balance-bottom"><div><small>Puntos administrados</small><strong>${S.rolePoints(state.role).length}</strong></div><div><small>Solicitudes pendientes</small><strong>${requests.filter(r=>r.status==='Pendiente').length}</strong></div><div><small>Moneda</small><strong>MXN</strong></div></div></section><section class="panel credit-card"><h2>Exposición de crédito</h2><div class="credit-value"><strong>${money(f.creditUsed)}</strong><span>de ${money(f.creditLimit)}</span></div><div class="progress" role="meter" aria-label="Crédito utilizado" aria-valuemin="0" aria-valuemax="${f.creditLimit}" aria-valuenow="${f.creditUsed}"><span style="width:${Math.min(100,f.creditUsed/f.creditLimit*100)}%"></span></div><p>${(f.creditUsed/f.creditLimit*100).toFixed(1)}% de la línea utilizada. Una venta consume primero saldo y después crédito disponible.</p>${button('Solicitar abono','topup','plus','soft')}</section></div>
    <section class="panel">${panelHeader('Solicitudes y movimientos','Los abonos solo se reflejan después de su autorización.',state.role==='director'?button('Autorizar pendientes','go','arrow','link','data-page="approvals"'):'')}<div class="section-gap">${table(['Solicitud','Punto de venta','Referencia','Importe','Estado'],requests.map(r=>[`<strong>${r.id}</strong><small>${date(r.at)}</small>`,`${esc(S.point(r.owner)?.name)}<small>${r.owner}</small>`,esc(r.reference),money(r.amount,2),tag(r.status)]))}</div></section><div class="section-gap">${notice('Este escenario utiliza un monedero compartido entre operadores para cada punto de venta. Sus saldos y solicitudes no cambian al filtrar telefonía o periodo. No se reciben depósitos ni se hacen transferencias reales.',true)}</div>`;
  }
  function commissionsView() {
    const m=S.metrics(filter());return `<div class="kpi-grid">${kpi('Devengado del periodo',currencyValue(m.commission),'<span>Solo ventas confirmadas</span>','chart',true)}${kpi('Pendiente de corte',currencyValue(m.outstanding),'<span>En el universo seleccionado</span>','clock')}${kpi('Incluido en corte',currencyValue(m.commission-m.outstanding),'<span>No implica pago bancario</span>','check')}${kpi('Operaciones elegibles',num(m.count),'<span>Sin comisiones duplicadas</span>','sale')}</div><section class="panel">${tableToolbar('commissions')}<div id="table-content">${tableContent('commissions')}</div></section><div class="section-gap">${notice('Las tasas de 6% a 9% son exclusivamente demostrativas. Preparar un corte marca operaciones y permite exportarlas; no ejecuta una dispersión bancaria.',true)}</div>`;
  }
  function approvalsView() {
    const rows=S.requests(filter()).filter(r=>r.status==='Pendiente');
    return `${notice('Autorizar incrementa el monedero del punto de venta. Rechazar conserva el saldo. Una solicitud no puede acreditarse dos veces.')}<div class="section-gap">${rows.length?rows.map(r=>`<article class="approval-card"><span class="priority-icon amber">${icon('wallet')}</span><div class="approval-content"><h3>${esc(S.point(r.owner)?.name)}</h3><p>${r.id} · ${esc(r.reference)}<br>${date(r.at)} · ${r.owner}</p></div><div class="approval-amount">${money(r.amount)}</div><div class="approval-actions">${button('Rechazar','review-topup','close','',`data-id="${r.id}" data-approve="false"`)}${button('Autorizar','review-topup','check','primary',`data-id="${r.id}" data-approve="true"`)}</div></article>`).join(''):empty('Todo al día','No hay solicitudes pendientes. Genera un abono desde Monedero para recorrer el flujo.',button('Ir a monedero','go','wallet','primary','data-page="wallet"'))}</div>`;
  }
  function reportsView() {
    const m=S.metrics(filter());return `<div class="kpi-grid">${kpi('Venta del periodo',currencyValue(m.revenue),trend(m),'chart',true)}${kpi('Operaciones',num(m.count),'<span>Confirmadas y trazables</span>','sale')}${kpi('Puntos con actividad',num(m.activePoints),'<span>Dentro del alcance del perfil</span>','network')}${kpi('Comisiones',currencyValue(m.commission),'<span>Devengado del periodo</span>','wallet')}</div><div class="report-grid">
    ${[['Briefing de dirección','Lectura ejecutiva del escenario, con ventas por operador, indicadores y límites de la demostración.','document','briefing','Abrir informe'],['Detalle de operaciones','Archivo CSV con folio, fecha, operador, punto de venta, estado, monto y comisión. Respeta los filtros actuales.','sale','export-sales','Exportar operaciones'],['Inventario y trazabilidad','Exporta el inventario visible por unidad, telefonía, formato, ubicación y estado. Sin identificadores reales.','sim','export-inventory','Exportar inventario'],['Corte de comisiones','Detalle de devengado e inclusión en corte para el periodo y operador elegidos. Sin dispersión bancaria.','wallet','export-commissions','Exportar comisiones'],['Bitácora de actividad','Evidencia local de ventas, abonos, asignaciones, recepciones y cortes generados en esta demostración.','shield','export-audit','Exportar bitácora'],['Guion de presentación','Siete momentos para explicar el valor operativo: dirección, operadores, inventario, ventas, saldo, comisiones y evidencia.','play','guide','Iniciar recorrido']].map(([title,desc,glyph,action,label])=>`<section class="panel report-card"><span class="priority-icon">${icon(glyph)}</span><h2>${title}</h2><p>${desc}</p>${button(label,action,glyph,'soft')}</section>`).join('')}
    </div>`;
  }
  function auditView() {return `${notice('Esta bitácora registra acciones del escenario en este navegador. No es un registro productivo inmutable ni sustituye controles de autenticación o auditoría en servidor.',true)}<section class="panel section-gap">${tableToolbar('audit')}<div id="table-content">${tableContent('audit')}</div></section>`;}
  function settingsView() {return `<div class="settings-grid"><section class="panel panel-pad"><h2>El alcance, sin ambigüedades</h2><div class="scope-list">${[['Consola multioperador','Inventario, ventas, saldo, comisiones y red.','Demo funcional'],['Tres perfiles empresariales','Dirección, distribución y punto de venta.','Vistas simuladas'],['PWA empresarial','Instalación según navegador y dispositivo.','Disponible'],['APIs de operadores','No se envían solicitudes ni activaciones reales.','Sin conexión'],['Tienda pública y checkout','Fuera del alcance de esta plataforma interna.','No incluidos'],['WhatsApp Business y apps nativas','No forman parte de esta fase.','No incluidos']].map(([a,b,c])=>`<div class="scope-row"><div><strong>${a}</strong><p>${b}</p></div>${tag(c)}</div>`).join('')}</div></section><section class="panel panel-pad"><h2>Tu espacio de demostración</h2><div class="scope-list"><div class="scope-row"><div><strong>Apariencia</strong><p>Tema claro u oscuro, guardado en este dispositivo.</p></div>${button('Cambiar','theme','sun')}</div><div class="scope-row"><div><strong>Instalar aplicación</strong><p>No requiere App Store ni Google Play.</p></div>${button('Instalar','install','download')}</div><div class="scope-row"><div><strong>Persistencia local</strong><p>${(S.storageBytes()/1024/1024).toFixed(2)} MB de datos ficticios. No se sincronizan entre equipos.</p></div>${tag('Solo navegador','good')}</div><div class="scope-row"><div><strong>Restablecer escenario</strong><p>Elimina ventas, abonos y cambios de esta demo local.</p></div>${button('Restablecer','reset','refresh','danger')}</div></div><div class="section-gap">${notice('La selección de perfil ilustra responsabilidades; no autentica usuarios. Seguridad real, permisos en servidor, integraciones y pruebas de carga pertenecen a la implementación productiva.',true)}</div></section></div>`;}
  function timelineContent(history) { return history.map(h=>`<div class="timeline-item"><strong>${esc(h.title)}</strong><p>${esc(h.detail)}</p><small>${date(h.at)}</small></div>`).join(''); }
  const views={overview,operators:operatorsView,inventory:inventoryView,network:networkView,sales:salesView,wallet:walletView,commissions:commissionsView,approvals:approvalsView,reports:reportsView,audit:auditView,settings:settingsView};
  function render() {
    if(!permitted().includes(state.page))state.page='overview';
    const page=PAGES[state.page];$('#page-title').textContent=page[0];$('#breadcrumb').textContent=page[0];$('#eyebrow').textContent=page[2];$('#page-description').textContent=page[3];
    document.title=`${page[0]} · NEXUS ONE`;
    $('#scope-name').textContent=S.ROLES[state.role].name;$('.avatar').textContent=S.ROLES[state.role].avatar;
    let group='';$('#nav').innerHTML=permitted().map(p=>{const next=['overview','operators'].includes(p)?'PANORAMA':['inventory','network','sales'].includes(p)?'OPERACIÓN':['wallet','commissions','approvals'].includes(p)?'FINANZAS':'GOBIERNO';let title=group!==next?`<div class="nav-group">${next}</div>`:'';group=next;const count=p==='approvals'?S.requests(filter()).filter(r=>r.status==='Pendiente').length:0;return `${title}<button class="nav-item ${state.page===p?'active':''}" data-action="go" data-page="${p}" ${state.page===p?'aria-current="page"':''}>${icon(PAGES[p][1])}<span>${p==='overview'?'Centro de control':p==='operators'?'Operadores':p==='inventory'?'Inventario SIM / eSIM':p==='audit'?'Trazabilidad':p==='settings'?'Configuración':p==='approvals'?'Autorizaciones':PAGES[p][0]}</span>${count?`<b class="nav-count">${count}</b>`:''}</button>`;}).join('');
    $('#operator-tabs').innerHTML=[{id:'all',name:'Consolidado'},...S.allowedOperators(state.role)].map(o=>`<button class="operator-tab ${state.operator===o.id?'active':''}" data-action="operator" data-operator="${o.id}" aria-pressed="${state.operator===o.id}">${o.color?`<i class="operator-dot" style="--op:${o.color}"></i>`:''}${o.name}</button>`).join('');
    $('#period').value=String(state.period);
    $('#role-context').innerHTML=`<span><strong>${esc(S.ROLES[state.role].name)}</strong> <span>· ${esc(S.ROLES[state.role].description)}</span></span><button data-action="roles">Cambiar perfil</button>`;
    let actions=button('Informe ejecutivo','briefing','document');
    if(['overview','sales'].includes(state.page))actions+=button('Nueva venta','new-sale','plus','primary');
    if(state.page==='inventory'&&state.role==='director')actions+=button('Recibir lote','batch','plus','primary');
    if(state.page==='wallet')actions+=button('Solicitar abono','topup','plus','primary');
    if(state.page==='commissions'&&state.role==='director')actions+=button('Preparar corte','settle','check','primary');
    if(state.page==='reports')actions=button('Informe ejecutivo','briefing','document','primary');
    $('#heading-actions').innerHTML=actions;
    $('#view').innerHTML=views[state.page]();$('#view').className='fade-in';
    $('#mobile-nav').innerHTML=[['overview','Inicio'],['inventory','Inventario'],['sales','Ventas'],['wallet','Saldo'],['menu','Más']].map(([p,label])=>`<button data-action="${p==='menu'?'menu':'go'}" data-page="${p}" class="${state.page===p?'active':''}" ${state.page===p?'aria-current="page"':''}>${icon(p==='menu'?'menu':PAGES[p][1])}<span>${label}</span></button>`).join('');
    hydrate();renderTour();
    document.dispatchEvent(new CustomEvent("nexus:view"));
  }
  function showRoles() {
    modal('Tres perspectivas. Una operación.','Cambia el perfil para explorar responsabilidades y alcance.',
      Object.entries(S.ROLES).map(([id,r])=>`<button class="role-choice ${state.role===id?'selected':''}" data-action="set-role" data-role="${id}">${icon(id==='director'?'building':id==='distributor'?'network':'user')}<span><strong>${r.name}</strong><p>${r.description}</p></span>${tag(state.role===id?'Actual':'Explorar')}</button>`).join('')+notice('Estos perfiles son vistas de demostración. El cambio de perfil no es un inicio de sesión ni una validación de permisos en servidor.',true));
  }
  function newSale(owner=null,operator=null,productId='sim',assetId=null) {
    const points=S.rolePoints(state.role);
    const preferred=operator || (state.operator==='all'?S.ROLES[state.role].operators[0]:state.operator);
    const p=points.find(p=>p.id===owner)||points.find(p=>p.operators.includes(preferred))||points[0];
    const selected=p.operators.includes(preferred)?preferred:p.operators[0];
    draft={role:state.role,owner:p.id,operator:selected,product:productId,outcome:'confirm',assetId,nonce:crypto.randomUUID?crypto.randomUUID():`demo-${Date.now()}-${Math.random()}`};
    saleStep(1);
  }
  function stepper(step) {return `<div class="stepper">${['Configurar','Confirmar','Resultado'].map((v,i)=>`<span class="${i+1<=step?'active':''}"><b>${i+1}</b>${v}</span>`).join('')}</div>`;}
  function saleStep(step) {
    if(!draft)return;
    if(step===1){
      const p=S.point(draft.owner);const stock=S.assets({role:state.role,operator:draft.operator}).filter(a=>a.owner===p.id&&a.status==='Disponible');
      modal('Nueva venta de prueba','Recorre el flujo sin activar líneas ni enviar dinero.',`${stepper(1)}<form id="sale-form"><div class="form-grid"><label class="field"><span>Punto de venta</span><select name="owner" id="sale-point">${S.rolePoints(state.role).map(p=>`<option value="${p.id}" ${draft.owner===p.id?'selected':''}>${esc(p.name)} · ${p.id}</option>`).join('')}</select></label><label class="field"><span>Operador autorizado</span><select name="operator" id="sale-operator">${S.allowedOperators(state.role).filter(o=>p.operators.includes(o.id)).map(o=>`<option value="${o.id}" ${draft.operator===o.id?'selected':''}>${o.name}</option>`).join('')}</select></label></div><div class="field"><span>Producto de demostración</span></div><div class="product-options">${S.PRODUCTS.map(pr=>`<button type="button" class="product-option ${draft.product===pr.id?'selected':''}" data-action="select-product" data-product="${pr.id}" aria-pressed="${draft.product===pr.id}">${icon(pr.type==='SIM'?'sim':pr.type==='eSIM'?'signal':pr.id==='topup'?'wallet':'sale')}<strong>${pr.name}</strong><small>${money(pr.price)} · Precio ficticio</small></button>`).join('')}</div><label class="field"><span>Respuesta del simulador</span><select name="outcome" id="sale-outcome"><option value="confirm" ${draft.outcome==='confirm'?'selected':''}>Confirmar operación de prueba</option><option value="reject" ${draft.outcome==='reject'?'selected':''}>Simular rechazo · sin cargo</option></select></label>${notice(`${stock.filter(a=>a.type==='SIM').length} SIM y ${stock.filter(a=>a.type==='eSIM').length} eSIM disponibles en este punto. El inventario se consume únicamente al confirmar la venta.`,true)}<p class="form-error" id="form-error" role="alert"></p><div class="dialog-foot"><button type="button" class="btn" data-action="close">Cancelar</button><button class="btn primary" type="submit">Revisar operación ${icon('arrow')}</button></div></form>`);
    } else {
      const q=S.quote(draft);
      modal('Revisa antes de confirmar','Los importes siguientes pertenecen únicamente al escenario.',`${stepper(2)}<div class="receipt">${receiptRow('Punto de venta',esc(S.point(draft.owner).name))}${receiptRow('Operador',esc(S.op(draft.operator).name))}${receiptRow('Producto',esc(q.product.name))}${q.asset?receiptRow('Unidad demo',`<small>${q.asset}</small>`):''}${receiptRow('Comisión de la red',money(q.commission,2))}${receiptRow('Cargo al monedero',money(q.cost,2))}${receiptRow('Crédito a utilizar',money(Math.max(0,q.cost-q.wallet.balance),2))}<div class="receipt-row total"><span>Venta al público</span><strong>${money(q.amount,2)}</strong></div></div><div class="section-gap">${notice(draft.outcome==='reject'?'Se simulará un rechazo: no cambiarán saldo, inventario ni comisión.':'Al confirmar, la demo actualizará inventario, monedero, venta, comisión y bitácora. No hay solicitudes a un operador real.')}</div><p class="form-error" id="form-error" role="alert"></p><div class="dialog-foot">${button('Volver','sale-back','left')}${button(draft.outcome==='reject'?'Simular rechazo':'Confirmar venta de prueba','confirm-sale','check','primary')}</div>`);
    }
  }
  const receiptRow=(label,value)=>`<div class="receipt-row"><span>${label}</span><strong>${value}</strong></div>`;
  function showReceipt(t) {
    const success=t.status==='Confirmada';lastTransaction=t;
    modal(success?'Operación completada':'Rechazo simulado','Comprobante de demostración · no válido para cobro.',`${stepper(3)}<div class="receipt-title"><div class="success-mark ${success?'':'rejected'}">${icon(success?'check':'close')}</div><h2>${success?'Todo queda conectado.':'Sin cargo. Sin consumo de inventario.'}</h2><p>${esc(t.id)} · ${date(t.at)}</p></div><div class="receipt">${receiptRow('Punto de venta',esc(S.point(t.owner).name))}${receiptRow('Operador',esc(S.op(t.operator).name))}${receiptRow('Producto',esc(S.product(t.product).name))}${receiptRow('Importe de venta',money(t.amount,2))}${receiptRow('Cargo aplicado',money(t.cost,2))}${receiptRow('Comisión devengada',money(t.commission,2))}${receiptRow('Saldo restante',money(S.wallet(t.owner).balance,2))}${receiptRow('Resultado',tag(t.status))}</div>${success&&t.product==='esim'?`<div class="esim-preview">${icon('signal')}<strong>Entrega eSIM · simulación</strong><p><code>${esc(t.asset)}</code></p><p>Sin QR activable. El perfil real se obtiene del proveedor en producción.</p></div>`:''}<div class="dialog-foot">${button('Guardar comprobante','receipt-download','download')}${button('Ver bitácora','receipt-audit','shield','primary')}</div>`);
  }
  function showTransaction(id) {
    const t=S.transaction(id);if(!t||!S.canSeeOwner(t.owner,state.role)||!S.ROLES[state.role].operators.includes(t.operator))throw new Error('La operación no está disponible para este perfil.');
    lastTransaction=t;
    const history=S.logs(filter()).filter(l=>l.reference===id);
    modal('Detalle de operación',t.id,`<div class="receipt">${receiptRow('Estado',tag(t.status))}${receiptRow('Fecha del escenario',date(t.at))}${receiptRow('Punto de venta',esc(S.point(t.owner).name))}${receiptRow('Operador',esc(S.op(t.operator).name))}${receiptRow('Producto',esc(S.product(t.product).name))}${receiptRow('Importe',money(t.amount,2))}${receiptRow('Cargo',money(t.cost,2))}${receiptRow('Comisión',money(t.commission,2))}${t.asset?receiptRow('Unidad demo',`<small>${esc(t.asset)}</small>`):''}</div><div class="section-gap"><h3>Historia de esta operación</h3><div class="timeline">${history.length?history.map(l=>`<div class="timeline-item"><strong>${esc(l.action)}</strong><p>${esc(l.detail)}</p><small>${date(l.at)} · ${esc(l.actor)}</small></div>`).join(''):`<div class="timeline-item"><strong>Registro precargado del escenario</strong><p>Operación ficticia para explorar indicadores, filtros y reportes.</p><small>${date(t.at)}</small></div>`}</div></div>${notice('Este detalle no acredita una activación, pago o servicio real.',true)}<div class="dialog-foot">${button('Guardar comprobante','receipt-download','download')}</div>`,true);
  }
  function showAsset(id) {
    const a=S.asset(id);if(!a||!S.canSeeOwner(a.owner,state.role)||!S.ROLES[state.role].operators.includes(a.operator))throw new Error('Esta unidad no está disponible para el perfil.');
    modal(a.type==='eSIM'?'Perfil eSIM de demostración':'Trazabilidad de la SIM',a.id,`${a.type==='eSIM'?`<div class="esim-preview">${icon('signal')}<strong>Perfil digital · DEMO</strong><p><code>${a.id}</code></p><p>No contiene un QR ni un código LPA activable.</p></div>`:''}<div class="receipt">${receiptRow('Identificador',`<small>${a.id}</small>`)}${receiptRow('Operador',S.op(a.operator).name)}${receiptRow('Formato',tag(a.type))}${receiptRow('Responsable',a.owner?esc(S.point(a.owner).name):'Almacén matriz')}${receiptRow('Estado',tag(a.status))}</div><div class="section-gap"><h3>Historia de la unidad</h3><div class="timeline">${a.history.map(h=>`<div class="timeline-item"><strong>${esc(h.title)}</strong><p>${esc(h.detail)}</p><small>${date(h.at)}</small></div>`).join('')}</div></div><div class="dialog-foot">${a.status==='Disponible'&&state.role!=='pos'?button('Asignar unidad','transfer','network','',`data-id="${a.id}"`):''}${a.status==='En tránsito'?button('Confirmar recepción','receive-asset','check','primary',`data-id="${a.id}"`):''}${a.status==='Disponible'&&a.owner?button('Vender esta unidad','sell-asset','sale','primary',`data-id="${a.id}"`):''}</div>`,true);
  }
  function showTransfer(id) {
    const a=S.asset(id);if(!a||!S.canSeeOwner(a.owner,state.role)||state.role==='pos')throw new Error('No disponible para este perfil.');
    const points=S.rolePoints(state.role).filter(p=>p.operators.includes(a.operator)&&p.id!==a.owner);
    modal('Asignar inventario',a.id,points.length?`<form id="transfer-form"><input type="hidden" name="assetId" value="${a.id}"><label class="field"><span>Punto receptor autorizado</span><select name="owner">${points.map(p=>`<option value="${p.id}">${esc(p.name)} · ${p.id}</option>`).join('')}</select></label>${notice('La unidad pasará a En tránsito. Quedará disponible para venta después de confirmar su recepción.')}<p class="form-error" id="form-error" role="alert"></p><div class="dialog-foot"><button class="btn" type="button" data-action="close">Cancelar</button><button class="btn primary" type="submit">Asignar unidad ${icon('arrow')}</button></div></form>`:empty('Sin destinos disponibles','No hay otros puntos autorizados para este operador dentro del perfil.'));
  }
  function showBatch() {
    if(state.role!=='director')throw new Error('La recepción de lotes corresponde a matriz.');
    modal('Recibir lote en matriz','Se generan identificadores ficticios, nunca ICCID reales.',`<form id="batch-form"><div class="form-grid"><label class="field"><span>Operador</span><select name="operator">${S.OPERATORS.map(o=>`<option value="${o.id}" ${state.operator===o.id?'selected':''}>${o.name}</option>`).join('')}</select></label><label class="field"><span>Formato</span><select name="type"><option>SIM</option><option>eSIM</option></select></label><label class="field span2"><span>Cantidad de unidades</span><input name="count" type="number" min="1" max="50" step="1" value="10" required><small>De 1 a 50 unidades por lote de demostración.</small></label></div>${notice('El lote quedará disponible en Almacén matriz. Después puedes asignar unidades a un punto y confirmar su recepción.',true)}<p class="form-error" id="form-error" role="alert"></p><div class="dialog-foot"><button type="button" class="btn" data-action="close">Cancelar</button><button class="btn primary" type="submit">Recibir lote ${icon('check')}</button></div></form>`);
  }
  function showTopup(owner=null) {
    const points=S.rolePoints(state.role);const chosen=points.find(p=>p.id===owner)||points[0];
    modal('Solicitar abono de prueba','Sin depósitos reales. Utiliza solo referencias ficticias.',`<form id="topup-form"><label class="field"><span>Punto de venta</span><select name="owner">${points.map(p=>`<option value="${p.id}" ${p.id===chosen.id?'selected':''}>${esc(p.name)} · ${p.id}</option>`).join('')}</select></label><div class="form-grid"><label class="field"><span>Monto en MXN</span><input type="number" name="amount" min="50" max="50000" step="0.01" value="2500" required></label><label class="field"><span>Referencia ficticia</span><input name="reference" maxlength="40" value="DEMO-ABONO-${String(S.requests({role:'director'}).length+1).padStart(3,'0')}" pattern="[Dd][Ee][Mm][Oo]-[A-Za-z0-9-]{3,35}" required></label></div>${notice('El saldo no aumentará hasta que Dirección autorice la solicitud. Puedes cambiar de perfil para recorrer ambas responsabilidades.')}<p class="form-error" id="form-error" role="alert"></p><div class="dialog-foot"><button class="btn" type="button" data-action="close">Cancelar</button><button class="btn primary" type="submit">Enviar solicitud ${icon('arrow')}</button></div></form>`);
  }
  function reviewTopup(id,approve) {
    if(state.role!=='director')throw new Error('Solo Dirección autoriza solicitudes en este escenario.');
    const r=S.requests(filter()).find(x=>x.id===id&&x.status==='Pendiente');if(!r)throw new Error('Esta solicitud ya no está pendiente.');
    modal(approve?'Autorizar abono':'Rechazar solicitud',r.id,`<div class="receipt">${receiptRow('Punto de venta',esc(S.point(r.owner).name))}${receiptRow('Referencia',esc(r.reference))}${receiptRow('Monto',money(r.amount,2))}${receiptRow('Saldo actual',money(S.wallet(r.owner).balance,2))}${receiptRow('Saldo después de decidir',money(S.wallet(r.owner).balance+(approve?r.amount:0),2))}</div><div class="section-gap">${notice(approve?'Se acreditará este monto una sola vez en el monedero de demostración.':'La solicitud se marcará como rechazada. El saldo no cambiará.')}</div><p class="form-error" id="form-error" role="alert"></p><div class="dialog-foot">${button('Cancelar','close','close')}${button(approve?'Confirmar autorización':'Confirmar rechazo','resolve-topup','check','primary',`data-id="${r.id}" data-approve="${approve}"`)}</div>`);
  }
  function showPoint(id) {
    const p=S.point(id);if(!p||!S.canSeeOwner(id,state.role))throw new Error('Punto fuera del perfil seleccionado.');
    const w=S.wallet(id),sales=S.sales(filter()).filter(t=>t.owner===id&&t.status==='Confirmada'),assets=S.assets(filter()).filter(a=>a.owner===id);
    modal(p.name,p.id+' · '+p.distributor,`<div class="receipt">${receiptRow('Región',p.region)}${receiptRow('Operadores habilitados',p.operators.map(id=>S.op(id).name).join(' · '))}${receiptRow('Venta del periodo',money(sales.reduce((s,t)=>s+t.amount,0),2))}${receiptRow('Inventario disponible',num(assets.filter(a=>a.status==='Disponible').length))}${receiptRow('Saldo del monedero',money(w.balance,2))}${receiptRow('Crédito utilizado',money(w.creditUsed,2))}${receiptRow('Límite de crédito',money(w.creditLimit,2))}</div><div class="section-gap">${notice('Expediente ficticio. La información se limita a la red y al operador seleccionados; el monedero es único por punto.',true)}</div><div class="dialog-foot">${button('Solicitar abono','point-topup','wallet','',`data-id="${p.id}"`)}${button('Nueva venta','point-sale','sale','primary',`data-id="${p.id}"`)}</div>`,true);
  }
  function showSettle() {
    const m=S.metrics(filter());const pending=m.confirmed.filter(t=>!S.isSettled(t.id));
    if(state.role!=='director')throw new Error('La preparación del corte corresponde a matriz.');
    modal('Preparar corte de comisiones','La demo no realiza dispersión de dinero.',pending.length?`<div class="receipt">${receiptRow('Universo',state.operator==='all'?'Consolidado':S.op(state.operator).name)}${receiptRow('Periodo',state.period+' días')}${receiptRow('Operaciones pendientes',num(pending.length))}${receiptRow('Comisión incluida',money(m.outstanding,2))}</div><div class="section-gap">${notice('Las operaciones quedarán marcadas como incluidas en corte. No volverán a sumarse en un siguiente corte; el archivo se puede exportar desde Comisiones.')}</div><p class="form-error" id="form-error" role="alert"></p><div class="dialog-foot">${button('Cancelar','close','close')}${button('Confirmar corte de prueba','confirm-settle','check','primary')}</div>`:empty('No hay comisiones pendientes','Todas las operaciones elegibles de este filtro ya están incluidas en un corte.'));
  }
  function briefing() {
    const m=S.metrics(filter());const points=S.rolePoints(state.role);
    modal('Informe ejecutivo','NEXUS ONE · Escenario del 05 de septiembre de 2026',`<div class="eyebrow">${esc(S.ROLES[state.role].name)} / ${state.operator==='all'?'CONSOLIDADO':esc(S.op(state.operator).name)}</div><h2>Una operación visible. Decisiones con contexto.</h2><p class="panel-subtitle">Últimos ${state.period} días · MXN · Datos ficticios</p><div class="kpi-grid briefing-kpis section-gap">${kpi('Ventas',currencyValue(m.revenue),trend(m),'chart',true)}${kpi('Confirmaciones',num(m.count),`<span>${m.success.toFixed(1)}% de los intentos</span>`,'check')}</div><h3>Resultados por operador</h3><div class="section-gap">${table(['Operador','Venta','Operaciones','Comisión'],S.allowedOperators(state.role).filter(o=>state.operator==='all'||o.id===state.operator).map(o=>{const a=S.metrics({...filter(),operator:o.id});return [o.name,money(a.revenue),num(a.count),money(a.commission,2)];}))}</div><div class="section-gap"><h3>Lectura del escenario</h3><div class="scope-list"><div class="scope-row"><p>${num(m.activePoints)} de ${points.filter(p=>state.operator==='all'||p.operators.includes(state.operator)).length} puntos habilitados tienen ventas confirmadas durante el periodo.</p></div><div class="scope-row"><p>${num(m.rows.length-m.count)} operaciones rechazadas no generan cargo ni comisión.</p></div><div class="scope-row"><p>${num(m.stock)} unidades disponibles en el inventario visible. ${m.pending} solicitudes de monedero pendientes en la red del perfil.</p></div></div></div><div class="section-gap">${notice('Este informe presenta datos sintéticos. No acredita resultados de una empresa real, integraciones productivas, controles de seguridad ni acuerdos con operadores.',true)}</div><div class="dialog-foot">${button('Exportar detalle','export-sales','download')}${button('Imprimir / guardar PDF','print','document','primary')}</div>`);
  }
  function searchResults(value='') {
    const q=fold(value);let entries=permitted().filter(p=>!q||fold(PAGES[p].join(' ')).includes(q)).map(p=>`<button data-action="command-go" data-page="${p}">${icon(PAGES[p][1])}<span>${PAGES[p][0]}</span><small>Módulo ↗</small></button>`);
    if(q.length>=3){
      entries.push(...S.assets(filter()).filter(a=>fold(a.id).includes(q)).slice(0,4).map(a=>`<button data-action="asset" data-id="${a.id}">${icon('sim')}<span>${a.id}</span><small>${a.type}</small></button>`));
      entries.push(...S.sales(filter()).filter(t=>fold(t.id).includes(q)).slice(0,4).map(t=>`<button data-action="transaction" data-id="${t.id}">${icon('sale')}<span>${t.id}</span><small>${money(t.amount)}</small></button>`));
      entries.push(...S.rolePoints(state.role).filter(p=>(state.operator==='all'||p.operators.includes(state.operator))&&fold(p.name+' '+p.id).includes(q)).slice(0,4).map(p=>`<button data-action="point" data-id="${p.id}">${icon('building')}<span>${esc(p.name)}</span><small>${p.id}</small></button>`));
    }
    return entries.join('')||'<p class="panel-subtitle">No hay resultados dentro del perfil y universo seleccionados.</p>';
  }
  function searchDialog() {modal('Buscar en NEXUS','Módulos, operaciones, inventario y puntos dentro de tu vista.',`<label class="command-input">${icon('search')}<span class="sr-only">Término de búsqueda</span><input id="command-query" placeholder="Escribe un módulo, folio o identificador DEMO..." autofocus autocomplete="off"></label><div class="command-results" id="command-results">${searchResults()}</div>`);}
  function download(name,content,type='text/plain;charset=utf-8') {
    const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
  }
  function csvCell(value) {
    let s=String(value??'');if(typeof value==='string'&&/^[=+\-@\t\r]/.test(s))s="'"+s;
    return '"'+s.replace(/"/g,'""')+'"';
  }
  function exportData(kind) {
    let headers,rows;
    if(kind==='inventory') {headers=['Identificador DEMO','Operador','Formato','Ubicacion','Estado'];const source=state.page==='inventory'?filtered('inventory'):S.assets(filter());rows=source.map(a=>[a.id,S.op(a.operator).name,a.type,a.owner||'Almacen matriz',a.status]);}
    else if(kind==='audit'){headers=['Evento','Fecha','Actor demo','Accion','Referencia','Resultado','Detalle'];const source=state.page==='audit'?filtered('audit'):S.logs(filter());rows=source.map(l=>[l.id,l.at,l.actor,l.action,l.reference,l.result,l.detail]);}
    else {const commissions=kind==='commissions';headers=['Folio DEMO','Fecha','Operador','Punto','Producto','Venta MXN','Cargo MXN','Comision MXN','Estado','Corte'];const source=state.page===kind?filtered(kind):S.sales(filter()).filter(t=>!commissions||t.status==='Confirmada');rows=source.map(t=>[t.id,t.at,S.op(t.operator).name,t.owner,S.product(t.product).name,t.amount/100,t.cost/100,t.commission/100,t.status,S.isSettled(t.id)?'Incluida en corte':'No incluida']);}
    const csv='\uFEFF'+[headers,...rows].map(r=>r.map(csvCell).join(',')).join('\r\n');
    download(`nexus-${kind}-${state.role}-${state.operator}-2026-09-05.csv`,csv,'text/csv;charset=utf-8');notify(`${num(rows.length)} registros de demostración exportados.`);
  }
  function receiptDownload() {
    if(!lastTransaction)return;const t=lastTransaction;
    download(`${t.id}-DEMO.txt`,['NEXUS ONE / COMPROBANTE DE DEMOSTRACION','NO VALIDO PARA COBRO. NO ACREDITA SERVICIO NI ACTIVACION REAL.','',`Folio: ${t.id}`,`Fecha de escenario: ${date(t.at)}`,`Operador: ${S.op(t.operator).name}`,`Punto de venta: ${S.point(t.owner).name} (${t.owner})`,`Producto: ${S.product(t.product).name}`,`Venta: ${money(t.amount,2)}`,`Cargo: ${money(t.cost,2)}`,`Comision: ${money(t.commission,2)}`,`Estado: ${t.status}`,`Inventario DEMO: ${t.asset||'No aplica'}`,'','Datos ficticios procesados solo en este navegador.'].join('\r\n'));
  }
  function renderTour() {
    const el=$('#tour');el.hidden=state.guide<0;
    if(state.guide<0)return;
    const [,title,copy]=TOUR[state.guide];el.innerHTML=`<div class="tour-index"><strong>${String(state.guide+1).padStart(2,'0')}</strong><span>/ 07</span></div><div class="tour-copy"><strong>${title}</strong><p>${copy}</p></div><button data-action="tour-prev" ${state.guide===0?'disabled':''} aria-label="Paso anterior del recorrido">${icon('left')}</button><button data-action="tour-next">${state.guide===TOUR.length-1?'Finalizar':'Siguiente'} ${icon('right')}</button><button class="tour-close" data-action="tour-end" aria-label="Salir del modo presentación">${icon('close')}</button>`;
  }
  function startTour() {closeDialog();state.role='director';state.operator='all';state.guide=0;document.documentElement.classList.add('present');go(TOUR[0][0]);}
  function endTour() {state.guide=-1;document.documentElement.classList.remove('present');render();}
  function tourStep(direction) {
    if(state.guide+direction>=TOUR.length){endTour();return;}
    state.guide=Math.max(0,state.guide+direction);go(TOUR[state.guide][0]);
  }
  async function install() {
    if(window.matchMedia('(display-mode: standalone)').matches){notify('Ya estás usando la aplicación en modo instalado.');return;}
    if(installPrompt){await installPrompt.prompt();const choice=await installPrompt.userChoice;installPrompt=null;notify(choice.outcome==='accepted'?'Instalación solicitada al navegador.':'Instalación cancelada. La demo sigue disponible en el navegador.');return;}
    modal('Instalar NEXUS ONE','La disponibilidad depende del navegador y dispositivo.',`<div class="scope-list"><div class="scope-row"><div><strong>En computadora o Android</strong><p>Abre el menú del navegador y busca Instalar aplicación o Agregar a pantalla de inicio.</p></div></div><div class="scope-row"><div><strong>En iPhone o iPad</strong><p>En Safari, abre Compartir y selecciona Agregar a pantalla de inicio cuando esté disponible.</p></div></div><div class="scope-row"><div><strong>Solo el escenario local</strong><p>La instalación no añade autenticación ni conexión a operadores. Sin conexión, solo se utiliza la simulación.</p></div></div></div><div class="dialog-foot">${button('Entendido','close','check','primary')}</div>`);
  }
  function toggleTheme() {
    const next=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=next;
    try{localStorage.setItem('nexus-theme-v3',next);}catch(_){notify('El tema se aplicó, pero el navegador no permitió guardarlo.');}
  }
  const actions={
    go:b=>b.dataset.status?openFiltered(b.dataset.page,{status:b.dataset.status}):go(b.dataset.page),operator:b=>{if(b.dataset.operator!=='all'&&!S.ROLES[state.role].operators.includes(b.dataset.operator))return;state.operator=b.dataset.operator;state.pageIndex=1;render();},
    universe:b=>{state.operator=b.dataset.operator;go('overview');},roles:showRoles,'set-role':b=>changeRole(b.dataset.role),theme:toggleTheme,search:searchDialog,
    'command-go':b=>{closeDialog();go(b.dataset.page);},close:closeDialog,
    menu:()=>{const open=!$('#sidebar').classList.contains('open');$('#sidebar').classList.toggle('open',open);$('#scrim').classList.toggle('open',open);$('.menu-toggle').setAttribute('aria-expanded',String(open));if(open)$('#sidebar .nav-item.active')?.focus();},
    'new-sale':()=>newSale(),'select-product':b=>{draft.product=b.dataset.product;draft.assetId=null;saleStep(1);},'sale-back':()=>saleStep(1),
    'confirm-sale':b=>{b.disabled=true;try{const tx=S.sale(draft);render();showReceipt(tx);}catch(e){b.disabled=false;throw e;}},
    'receipt-download':receiptDownload,'receipt-audit':()=>{closeDialog();go('audit');},transaction:b=>showTransaction(b.dataset.id),asset:b=>showAsset(b.dataset.id),
    'sell-asset':b=>{const a=S.asset(b.dataset.id);newSale(a.owner,a.operator,a.type==='eSIM'?'esim':'sim',a.id);},transfer:b=>showTransfer(b.dataset.id),
    'receive-asset':b=>{const a=S.confirmReceipt(b.dataset.id,state.role);render();showAsset(a.id);notify('Recepción confirmada. La unidad está disponible.');},
    batch:showBatch,topup:()=>showTopup(),point:b=>showPoint(b.dataset.id),'point-topup':b=>showTopup(b.dataset.id),'point-sale':b=>newSale(b.dataset.id),
    'review-topup':b=>reviewTopup(b.dataset.id,b.dataset.approve==='true'),
    'resolve-topup':b=>{b.disabled=true;try{const row=S.resolveTopup(b.dataset.id,b.dataset.approve==='true',state.role);closeDialog();render();notify(row.status==='Aprobada'?'Abono autorizado. Monedero actualizado.':'Solicitud rechazada. Saldo sin cambios.');}catch(e){b.disabled=false;throw e;}},
    settle:showSettle,'confirm-settle':()=>{const rows=S.settle(filter());closeDialog();render();notify(`${rows.length} operaciones incluidas en el corte de demostración.`);},
    briefing,print:()=>window.print(),export:()=>exportData(['inventory','audit','commissions'].includes(state.page)?state.page:'sales'),
    'export-sales':()=>exportData('sales'),'export-inventory':()=>exportData('inventory'),'export-audit':()=>exportData('audit'),'export-commissions':()=>exportData('commissions'),
    paginate:b=>{state.pageIndex+=Number(b.dataset.direction);$('#table-content').innerHTML=tableContent(state.page);},
    guide:()=>window.NexusExperience ? window.NexusExperience.open() : startTour(),'tour-next':()=>tourStep(1),'tour-prev':()=>tourStep(-1),'tour-end':endTour,install,
    reset:()=>modal('Restablecer esta demo local','Esta acción no modifica GitHub ni otros dispositivos.',`${notice('Se borrarán las operaciones, solicitudes, asignaciones y cortes que hayas generado aquí. Se conservará el tema visual y se restaurarán los datos ficticios iniciales.')}<div class="dialog-foot">${button('Cancelar','close','close')}${button('Restablecer escenario','confirm-reset','refresh','primary')}</div>`),
    'confirm-reset':()=>{S.reset();document.dispatchEvent(new Event('nexus:reset'));state.role='director';state.operator='all';state.period=30;closeDialog();go('overview');notify('Escenario inicial restaurado en este navegador.');}
  };
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-action]');if(!b||b.disabled)return;
    const fn=actions[b.dataset.action];if(!fn)return;
    if(b.tagName==='BUTTON'&&b.closest('form')&&b.type==='submit')return;
    try{const result=fn(b);if(result?.catch)result.catch(fail);}catch(error){fail(error);}
  });
  document.addEventListener('submit',e=>{
    const form=e.target;const formId=form.getAttribute('id');if(!['sale-form','batch-form','transfer-form','topup-form'].includes(formId))return;e.preventDefault();
    const data=new FormData(form);const submit=form.querySelector('[type="submit"]');if(submit)submit.disabled=true;
    try{
      if(formId==='sale-form'){draft.owner=String(data.get('owner'));draft.operator=String(data.get('operator'));draft.outcome=String(data.get('outcome'));saleStep(2);}
      else if(formId==='batch-form'){const operator=String(data.get('operator'));const result=S.receiveBatch({role:state.role,operator,type:String(data.get('type')),count:Number(data.get('count'))});state.operator=operator;state.pageIndex=1;state.query='';closeDialog();go('inventory');notify(`${result.length} unidades recibidas en Almacén matriz.`);}
      else if(formId==='transfer-form'){const a=S.transfer(String(data.get('assetId')),String(data.get('owner')),state.role);render();showAsset(a.id);notify('Unidad asignada. La recepción está pendiente.');}
      else if(formId==='topup-form'){const r=S.requestTopup({role:state.role,owner:String(data.get('owner')),amount:Math.round(Number(data.get('amount'))*100),reference:String(data.get('reference'))});closeDialog();go('wallet');notify(`${r.id} enviada a autorización. El saldo aún no cambia.`);}
    }catch(error){if(submit)submit.disabled=false;fail(error);}
  });
  document.addEventListener('change',e=>{
    try{
      if(e.target.id==='period'){state.period=Number(e.target.value);state.pageIndex=1;render();}
      if(e.target.id==='status-filter'){state.status=e.target.value;state.pageIndex=1;$('#table-content').innerHTML=tableContent(state.page);}
      if(e.target.id==='type-filter'){state.type=e.target.value;state.pageIndex=1;$('#table-content').innerHTML=tableContent(state.page);}
      if(e.target.id==='sale-point'){draft.owner=e.target.value;draft.assetId=null;if(!S.point(draft.owner).operators.includes(draft.operator))draft.operator=S.point(draft.owner).operators[0];saleStep(1);}
      if(e.target.id==='sale-operator'){draft.operator=e.target.value;draft.assetId=null;saleStep(1);}
      if(e.target.id==='sale-outcome')draft.outcome=e.target.value;
    }catch(error){fail(error);}
  });
  document.addEventListener('input',e=>{
    if(e.target.id==='table-search'){state.query=e.target.value;state.pageIndex=1;$('#table-content').innerHTML=tableContent(state.page);}
    if(e.target.id==='command-query')$('#command-results').innerHTML=searchResults(e.target.value);
  });
  document.addEventListener('keydown',e=>{
    if(document.querySelector('#experience[open],#decision[open]'))return;
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();searchDialog();}
    if(e.key==='Escape'&&!$('#dialog').open){if(state.guide>=0)endTour();$('#sidebar').classList.remove('open');$('#scrim').classList.remove('open');$('.menu-toggle').setAttribute('aria-expanded','false');}
    if(state.guide>=0&&!$('#dialog').open&&!['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)){if(e.key==='ArrowRight'){e.preventDefault();tourStep(1);}if(e.key==='ArrowLeft'){e.preventDefault();tourStep(-1);}}
  });
  $('#dialog').addEventListener('click',e=>{if(e.target===$('#dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog();}});
  window.addEventListener('hashchange',()=>go(location.hash.slice(1)));
  window.addEventListener('nexus-storage-warning',()=>notify('No se pudo guardar el escenario. Los cambios actuales son temporales hasta cerrar esta página.'));
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;});
  const connection=()=>{$('#connection-status').textContent=navigator.onLine?'Escenario disponible':'Sin conexión · demo local';};
  window.addEventListener('online',connection);window.addEventListener('offline',connection);
  if('serviceWorker' in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>notify('El navegador no habilitó el modo sin conexión. La demo sigue disponible en línea.'));
  function openFiltered(page,options={}) {
    go(page);
    const allowed={sales:['all','Confirmada','Rechazada'],inventory:['all','Disponible','En tránsito','Vendida'],commissions:['all','Por liquidar','Incluida en corte'],audit:['all']};
    if(!allowed[state.page])return;
    state.status=allowed[state.page].includes(options.status)?options.status:'all';
    state.query=typeof options.query==='string'?options.query.slice(0,100):'';
    state.pageIndex=1;render();
  }
  // Explicit presentation bridge; the extension never reaches into private UI state.
  window.NexusApp = Object.freeze({context:()=>({...filter(),page:state.page}),navigate:go,
    render,openFiltered,present:startTour,showBriefing:briefing,setRole:changeRole});
  go(location.hash.slice(1)||'overview');connection();
})();
