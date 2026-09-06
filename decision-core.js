/* Buyer evaluation primitives. Pure calculations; no telemetry or sales writes. */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NexusDecisionCore = api;
})(typeof window === 'undefined' ? globalThis : window, () => {
  'use strict';
  const PRIORITIES = Object.freeze({
    inventory: {name:'Saber dónde está cada SIM', outcome:'Responsable, estado e historia por unidad.', question:'¿Podemos seguir una unidad desde matriz hasta su venta?', module:'inventory'},
    balance: {name:'Controlar saldo y autorizaciones', outcome:'Separar la solicitud de la decisión y del movimiento.', question:'¿Un abono cambia el saldo solo cuando matriz lo autoriza?', module:'wallet'},
    network: {name:'Crecer sin perder visibilidad', outcome:'Operadores separados, indicadores consolidados y comisiones trazables.', question:'¿Podemos pasar del resultado al detalle que lo explica?', module:'operators'}
  });
  const CRITERIA = Object.freeze([
    {id:'inventory',name:'Unidad trazable',module:'inventory', action:'Recibir lote',
      description:'Recibir una unidad en matriz, asignarla y confirmar su recepción en el mismo recorrido.'},
    {id:'sale',name:'Venta conectada',module:'sales',action:'Nueva venta',
      description:'Confirmar una venta de SIM/eSIM que enlace unidad, cargo, comisión y evento.'},
    {id:'reject',name:'Rechazo sin cargo',module:'sales',action:'Simular rechazo',
      description:'Registrar un intento rechazado con cargo y comisión en cero.'},
    {id:'topup',name:'Abono autorizado',module:'wallet',action:'Solicitar abono',
      description:'Crear una solicitud nueva y autorizarla desde matriz.'},
    {id:'cut',name:'Comisión en corte',module:'commissions',action:'Preparar corte',
      description:'Incluir la comisión de una venta de esta evaluación en un corte posterior.'}
  ]);
  const NEXT = Object.freeze({pending:'Por acordar',workshop:'Proponer taller de reglas de negocio',technical:'Solicitar revisión técnica del conector',scope:'Revisar alcance y propuesta comercial'});
  const VERDICTS = Object.freeze({pending:'Sin revisar',fits:'Encaja con el proceso esperado',gap:'Requiere adecuaciones'});
  const key = log => [log.id,log.at,log.action,log.reference,log.result].join('|');
  const blank = () => ({version:1,priority:'inventory',started:null,baseline:[],verdict:'pending',next:'pending',inputs:{volume:'',days:'',before:'',after:'',adoption:''}, estimate:null});
  function restore(data) {
    if(!data || data.version!==1)return blank();
    const fresh=blank();
    fresh.priority=Object.hasOwn(PRIORITIES,data.priority)?data.priority:'inventory';
    fresh.next=Object.hasOwn(NEXT,data.next)?data.next:'pending';
    fresh.verdict=Object.hasOwn(VERDICTS,data.verdict)?data.verdict:'pending';
    if(typeof data.started==='string' && Number.isFinite(Date.parse(data.started)) && Array.isArray(data.baseline) && data.baseline.every(s=>typeof s==='string') && data.baseline.length<100000){fresh.started=data.started;fresh.baseline=data.baseline.slice();}
    for(const field of Object.keys(fresh.inputs))if(typeof data.inputs?.[field]==='string'&&data.inputs[field].length<30)fresh.inputs[field]=data.inputs[field];
    // An estimate is always derived again, never trusted as a saved result.
    if(data.estimate){try{fresh.estimate=capacity(fresh.inputs);}catch(_){}}
    return fresh;
  }
  function start(review,logs,now=new Date().toISOString()) {
    return {...review,started:now,baseline:logs.map(key),verdict:'pending'};
  }
  function evidence(review,store) {
    const all=store.logs({role:'director',operator:'all'}), baseline=new Set(review.baseline);
    const current=new Set(all.map(key));
    const stale=!!review.started&&review.baseline.some(k=>!current.has(k));
    const events=review.started&&!stale?all.filter(l=>!baseline.has(key(l))):[];
    const byAction=action=>events.filter(l=>l.action===action);
    const earliest=rows=>rows.slice().sort((a,b)=>a.at.localeCompare(b.at)||a.id.localeCompare(b.id))[0];
    let sale=earliest(byAction('Venta confirmada').filter(l=>{
      const t=store.transaction(l.reference),a=t?.asset&&store.asset(t.asset);
      return t?.status==='Confirmada'&&a?.status==='Vendida'&&a.owner===t.owner&&a.operator===t.operator&&t.cost+t.commission===t.amount;
    }));
    const inventory=earliest(byAction('Inventario recibido').filter(l=>{
      const unit=store.asset(l.reference);if(!unit)return false;
      const loaded=unit.history.find(h=>h.title==='Lote recibido en matriz');
      return !!loaded && byAction('Recepción de lote').some(e=>Date.parse(e.at)-Date.parse(loaded.at)===1000&&e.operator===unit.operator) && byAction('Inventario asignado').some(e=>e.reference===unit.id&&e.id<l.id);
    }));
    const rejected=earliest(byAction('Venta rechazada').filter(l=>{const t=store.transaction(l.reference);return t?.status==='Rechazada'&&t.cost===0&&t.commission===0&&t.asset===null;}));
    const topup=earliest(byAction('Abono autorizado').filter(l=>store.requests({role:'director'}).some(r=>r.id===l.reference&&r.status==='Aprobada')&&byAction('Solicitud de abono').some(e=>e.reference===l.reference&&e.id<l.id)));
    const cut=earliest(byAction('Corte de comisiones').filter(l=>byAction('Venta confirmada').some(e=>{const t=store.transaction(e.reference);return t?.status==='Confirmada'&&store.isSettled(t.id)&&e.id<l.id&&(l.operator==='all'||l.operator===t.operator);})));
    const matches={inventory,sale,reject:rejected,topup,cut};
    return {stale,events,checks:CRITERIA.map(c=>({...c,observed:!!matches[c.id],event:matches[c.id]||null}))};
  }
  function capacity(input) {
    const limits={volume:[1,1000000],days:[1,31],before:[.1,480],after:[.1,480],adoption:[0,100]};
    const n={};
    for(const field of Object.keys(limits)){
      const value=input[field];
      if(value===''||value===null||value===undefined||typeof value==='boolean'||!Number.isFinite(Number(value)))throw new Error('Completa los cinco supuestos con números válidos.');
      n[field]=Number(value);const [min,max]=limits[field];
      if(n[field]<min||n[field]>max)throw new Error('Revisa los límites indicados en los campos.');
    }
    if(!Number.isInteger(n.volume)||!Number.isInteger(n.days))throw new Error('Operaciones y días deben ser números enteros.');
    if(n.after>n.before)throw new Error('El tiempo objetivo no puede superar el tiempo actual en esta estimación de capacidad.');
    const monthly=n.volume*n.days, current=monthly*n.before/60;
    const potential=monthly*(n.before-n.after)/60, recoverable=potential*n.adoption/100;
    return {inputs:n,monthly,current,remaining:current-recoverable,recoverable,potential};
  }
  return Object.freeze({PRIORITIES,CRITERIA,NEXT,VERDICTS,blank,restore,start,evidence,capacity,key});
});
