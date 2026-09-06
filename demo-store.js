/* NEXUS ONE v3. Deterministic demonstration model. NOT authentication or a backend. */
(() => {
  'use strict';
  const KEY = 'nexus-enterprise-demo-v3';
  const DAY = 86400000;
  const ANCHOR = Date.parse('2026-09-05T23:59:59-06:00');
  const OPERATORS = [
    { id: 'movistar', name: 'Movistar', short: 'M', color: '#28866b', rate: 700 },
    { id: 'att', name: 'AT&T', short: 'A', color: '#388dbb', rate: 600 },
    { id: 'bait', name: 'Bait', short: 'B', color: '#c5a243', rate: 900 },
    { id: 'other', name: 'Otros', short: '+', color: '#8379b5', rate: 650 }
  ];
  const PRODUCTS = [
    { id: 'sim', name: 'SIM + paquete inicial', type: 'SIM', price: 19900, description: 'SIM física · oferta de ejemplo' },
    { id: 'esim', name: 'eSIM digital', type: 'eSIM', price: 34900, description: 'Perfil digital · no activable' },
    { id: 'topup', name: 'Recarga de saldo', type: 'Recarga', price: 10000, description: 'Saldo de prueba · sin envío real' },
    { id: 'package', name: 'Paquete de datos', type: 'Paquete', price: 49900, description: 'Paquete de ejemplo · sin servicio real' }
  ];
  const REGIONS = ['Centro', 'Valle', 'Occidente', 'Bajío', 'Norte', 'Sureste'];
  const NAMES = ['Conecta Alameda', 'Plaza Central', 'Punto Universidad', 'Terminal Norte', 'Conecta Las Torres', 'Plaza del Valle', 'Punto Reforma', 'Terminal Poniente', 'Conecta Jardines', 'Plaza del Sol', 'Punto Chapultepec', 'Terminal Oriente', 'Conecta Campestre', 'Plaza Mayor', 'Punto Tecnológico', 'Terminal Bajío', 'Conecta Cumbres', 'Plaza del Norte', 'Punto Industrial', 'Terminal Metropolitana', 'Conecta Ceiba', 'Plaza del Sur', 'Punto Riviera', 'Terminal Sureste'];
  const POINTS = NAMES.map((name, i) => ({
    id: 'PDV-' + String(i + 1).padStart(3, '0'), name, region: REGIONS[Math.floor(i / 4)],
    distributor: 'DIST-' + String(Math.floor(i / 4) + 1).padStart(2, '0'),
    operators: i === 0 ? ['movistar', 'att'] : i < 4 ? ['movistar', 'att', 'bait'] : i % 3 === 0 ? ['att', 'bait', 'other'] : ['movistar', 'att', 'bait', 'other']
  }));
  const ROLES = {
    director: { name: 'Dirección y matriz', short: 'Dirección', avatar: 'DM', description: 'Vista nacional · toda la red · cuatro universos', operators: OPERATORS.map(o => o.id) },
    distributor: { name: 'Distribuidor Centro', short: 'Distribuidor', avatar: 'DC', description: 'DIST-01 · cuatro puntos de venta de la región Centro', operators: ['movistar', 'att', 'bait'] },
    pos: { name: 'Conecta Alameda', short: 'Punto de venta', avatar: 'PV', description: 'PDV-001 · inventario, saldo y operaciones propias', operators: ['movistar', 'att'] }
  };
  const pad = (v, n = 4) => String(v).padStart(n, '0');
  const op = id => OPERATORS.find(x => x.id === id);
  const point = id => POINTS.find(x => x.id === id);
  const product = id => PRODUCTS.find(x => x.id === id);
  const amount = rows => rows.reduce((s, x) => s + x.amount, 0);
  const demoTime = n => new Date(Date.parse('2026-09-05T18:00:00-06:00') + n * 1000).toISOString();
  function seed() {
    let serial = 0;
    const inventory = [];
    const addAsset = (operator, type, owner, status = 'Disponible') => {
      const id = `DEMO-${operator.toUpperCase().slice(0,3)}-${type === 'SIM' ? 'S' : 'E'}-${pad(++serial, 5)}`;
      inventory.push({ id, operator, type, owner, status, history: [{ title: 'Carga inicial de demostración', detail: owner || 'Almacén matriz', at: '2026-09-01T15:00:00.000Z' }] });
    };
    OPERATORS.forEach(o => { for (let i = 0; i < 24; i++) addAsset(o.id, i % 2 ? 'SIM' : 'eSIM', null); });
    POINTS.forEach(p => p.operators.forEach(o => { for (let i = 0; i < 8; i++) addAsset(o, i % 2 ? 'SIM' : 'eSIM', p.id, i === 7 ? 'En tránsito' : 'Disponible'); }));
    const transactions = [];
    let seq = 0;
    for (let d = 0; d < 60; d++) {
      const count = 80 + (d * 7 % 27) + (d >= 30 ? 24 : 0);
      for (let i = 0; i < count; i++) {
        const p = POINTS[(i * 5 + d) % POINTS.length];
        const operator = p.operators[(i + d) % p.operators.length];
        const pr = PRODUCTS[(i + d * 3) % PRODUCTS.length];
        const confirmed = (i + d * 3) % 37 !== 0;
        const at = new Date(ANCHOR - (59 - d) * DAY - (16 * 60 - (i % 75) * 6) * 60000).toISOString();
        const commission = confirmed ? Math.round(pr.price * op(operator).rate / 10000) : 0;
        transactions.push({ id: `NX-26-${pad(++seq, 6)}`, at, owner: p.id, operator, product: pr.id, amount: pr.price, commission,
          cost: confirmed ? pr.price - commission : 0, status: confirmed ? 'Confirmada' : 'Rechazada', asset: null, nonce: null });
      }
    }
    const wallets = Object.fromEntries(POINTS.map((p, i) => [p.id, { balance: 1850000 + i * 73000, creditLimit: 1000000 + i * 20000, creditUsed: i % 4 === 0 ? 175000 : 0 }]));
    const requests = [
      { id: 'AB-0001', owner: 'PDV-001', amount: 1250000, reference: 'DEMO-DEP-2401', status: 'Pendiente', at: '2026-09-05T15:15:00.000Z' },
      { id: 'AB-0002', owner: 'PDV-009', amount: 850000, reference: 'DEMO-DEP-2402', status: 'Pendiente', at: '2026-09-05T15:30:00.000Z' },
      { id: 'AB-0003', owner: 'PDV-019', amount: 2100000, reference: 'DEMO-DEP-2403', status: 'Pendiente', at: '2026-09-05T16:10:00.000Z' }
    ];
    const logs = requests.map((r,i) => ({ id: `EV-${pad(i+1, 6)}`, at: r.at, owner: r.owner, operator: 'all', actor: 'Punto de venta · demo', action: 'Solicitud de abono', detail: r.reference, reference: r.id, result: 'Pendiente' }));
    return { version: 3, inventory, transactions, wallets, requests, logs, settled: [], nextAsset: serial + 1, nextTx: seq + 1, nextEvent: 4 };
  }
  let db;
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || 'null');
    db = stored && stored.version === 3 && Array.isArray(stored.transactions) && Array.isArray(stored.inventory) && stored.wallets && Array.isArray(stored.logs) && Array.isArray(stored.requests) && Array.isArray(stored.settled) ? stored : seed();
  } catch (_) { db = seed(); }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); return true; }
    catch (_) { window.dispatchEvent(new Event('nexus-storage-warning')); return false; }
  }
  function rolePoints(role = 'director') {
    if (!ROLES[role]) throw new Error('Perfil no válido.');
    return POINTS.filter(p => role === 'director' || role === 'distributor' && p.distributor === 'DIST-01' || role === 'pos' && p.id === 'PDV-001');
  }
  function canSeeOwner(owner, role) { return owner === null ? role === 'director' : rolePoints(role).some(p => p.id === owner); }
  function allowedOperators(role) { return OPERATORS.filter(o => ROLES[role].operators.includes(o.id)); }
  function matches(row, filter, useOperator = true) {
    return canSeeOwner(row.owner, filter.role) && (!useOperator || (row.operator === 'all' || ROLES[filter.role].operators.includes(row.operator)) && (filter.operator === 'all' || row.operator === 'all' || row.operator === filter.operator));
  }
  function inPeriod(tx, period = 30, previous = false) {
    const end = ANCHOR - (previous ? period * DAY : 0);
    const t = Date.parse(tx.at);
    return t <= end && t > end - period * DAY;
  }
  function sales(filter, previous = false) {
    return db.transactions.filter(t => matches(t, filter) && inPeriod(t, Number(filter.period), previous)).sort((a,b) => b.at.localeCompare(a.at));
  }
  function assets(filter) { return db.inventory.filter(a => matches(a, filter)).slice().reverse(); }
  function requests(filter) { return db.requests.filter(r => matches(r, filter, false)).sort((a,b) => b.at.localeCompare(a.at)); }
  function logs(filter) { return db.logs.filter(r => matches(r, filter)).sort((a,b) => b.at.localeCompare(a.at)); }
  function finance(role) {
    return rolePoints(role).reduce((s,p) => {
      const w = db.wallets[p.id];
      return { balance: s.balance + w.balance, creditLimit: s.creditLimit + w.creditLimit, creditUsed: s.creditUsed + w.creditUsed };
    }, { balance: 0, creditLimit: 0, creditUsed: 0 });
  }
  function metrics(filter) {
    const rows = sales(filter); const confirmed = rows.filter(t => t.status === 'Confirmada');
    const prior = sales(filter, true).filter(t => t.status === 'Confirmada');
    const revenue = amount(confirmed), previousRevenue = amount(prior);
    return { rows, confirmed, revenue, previousRevenue, growth: previousRevenue ? (revenue / previousRevenue - 1) * 100 : null,
      count: confirmed.length, success: rows.length ? confirmed.length / rows.length * 100 : 0,
      commission: confirmed.reduce((s,t) => s + t.commission, 0),
      activePoints: new Set(confirmed.map(t => t.owner)).size,
      stock: assets(filter).filter(a => a.status === 'Disponible').length,
      pending: requests(filter).filter(r => r.status === 'Pendiente').length,
      outstanding: confirmed.filter(t => !db.settled.includes(t.id)).reduce((s,t) => s + t.commission, 0) };
  }
  function log(role, action, detail, owner, operator = 'all', reference = '', result = 'Confirmada') {
    const entry = { id: `EV-${pad(db.nextEvent++, 6)}`, at: demoTime(db.nextEvent), owner, operator, actor: ROLES[role].name + ' · demo', action, detail, reference, result };
    db.logs.push(entry);
    return entry;
  }
  function authorizeOwner(owner, role) {
    if (!point(owner) || !canSeeOwner(owner, role)) throw new Error('El punto de venta no pertenece a este perfil.');
  }
  function quote({ role, owner, operator, product: productId, assetId = null }) {
    authorizeOwner(owner, role);
    if (!point(owner).operators.includes(operator) || !ROLES[role].operators.includes(operator)) throw new Error('Este operador no está habilitado para el punto de venta.');
    const pr = product(productId); if (!pr) throw new Error('Selecciona un producto válido.');
    const commission = Math.round(pr.price * op(operator).rate / 10000);
    const cost = pr.price - commission;
    const w = db.wallets[owner];
    if (w.balance + w.creditLimit - w.creditUsed < cost) throw new Error('Saldo y crédito disponibles insuficientes. Solicita un abono antes de continuar.');
    let asset = null;
    if (['SIM', 'eSIM'].includes(pr.type)) {
      asset = db.inventory.find(a => (!assetId || a.id === assetId) && a.owner === owner && a.operator === operator && a.type === pr.type && a.status === 'Disponible');
      if (!asset) throw new Error(`No hay inventario ${pr.type} disponible en este punto para ${op(operator).name}.`);
    }
    return { amount: pr.price, commission, cost, asset: asset?.id || null, wallet: { ...w }, product: pr };
  }
  function sale(input) {
    if (!input.nonce || typeof input.nonce !== 'string') throw new Error('Falta la referencia de la operación.');
    const existing = db.transactions.find(t => t.nonce === input.nonce);
    if (existing) {
      authorizeOwner(existing.owner, input.role);
      if (existing.owner !== input.owner || existing.operator !== input.operator || existing.product !== input.product) throw new Error('Esta referencia ya pertenece a otra operación.');
      return { ...existing };
    }
    const q = quote(input);
    const confirmed = input.outcome !== 'reject';
    const tx = { id: `NX-26-${pad(db.nextTx++, 6)}`, at: demoTime(db.nextEvent), owner: input.owner, operator: input.operator,
      product: input.product, amount: q.amount, commission: confirmed ? q.commission : 0, cost: confirmed ? q.cost : 0,
      status: confirmed ? 'Confirmada' : 'Rechazada', asset: confirmed ? q.asset : null, nonce: input.nonce };
    if (confirmed) {
      const wallet = db.wallets[input.owner];
      const cash = Math.min(wallet.balance, q.cost);
      wallet.balance -= cash;
      wallet.creditUsed += q.cost - cash;
      if (q.asset) {
        const asset = db.inventory.find(a => a.id === q.asset);
        asset.status = 'Vendida';
        asset.history.push({ title: 'Venta simulada confirmada', detail: tx.id, at: tx.at });
      }
    }
    db.transactions.push(tx);
    log(input.role, confirmed ? 'Venta confirmada' : 'Venta rechazada', confirmed ? 'Inventario, saldo y comisión actualizados en el escenario.' : 'Rechazo simulado. Sin cargo, comisión ni consumo de inventario.', input.owner, input.operator, tx.id, tx.status);
    save(); return { ...tx };
  }
  function requestTopup({ role, owner, amount: value, reference }) {
    authorizeOwner(owner, role);
    if (!Number.isInteger(value) || value < 5000 || value > 5000000) throw new Error('El monto debe estar entre $50 y $50,000 MXN.');
    const ref = String(reference || '').trim();
    if (!/^DEMO-[A-Z0-9-]{3,35}$/i.test(ref)) throw new Error('Usa una referencia ficticia como DEMO-ABONO-001.');
    if (db.requests.some(r => r.reference.toUpperCase() === ref.toUpperCase())) throw new Error('Ya existe una solicitud con esa referencia.');
    const row = { id: 'AB-' + pad(db.requests.length + 1), owner, amount: value, reference: ref, status: 'Pendiente', at: demoTime(db.nextEvent) };
    db.requests.push(row); log(role, 'Solicitud de abono', ref, owner, 'all', row.id, 'Pendiente'); save(); return row;
  }
  function resolveTopup(id, approve, role) {
    if (role !== 'director') throw new Error('La autorización corresponde a Dirección y matriz.');
    const r = db.requests.find(x => x.id === id);
    if (!r || r.status !== 'Pendiente') throw new Error('La solicitud ya fue procesada o no está disponible.');
    r.status = approve ? 'Aprobada' : 'Rechazada';
    if (approve) db.wallets[r.owner].balance += r.amount;
    log(role, approve ? 'Abono autorizado' : 'Abono rechazado', r.reference, r.owner, 'all', r.id, r.status); save(); return r;
  }
  function receiveBatch({ role, operator, type, count }) {
    if (role !== 'director') throw new Error('La carga de lotes corresponde a matriz.');
    if (!op(operator) || !['SIM','eSIM'].includes(type) || !Number.isInteger(count) || count < 1 || count > 50) throw new Error('Revisa operador, formato y cantidad (1 a 50).');
    const result = [];
    for (let i=0;i<count;i++) {
      const id = `DEMO-${operator.toUpperCase().slice(0,3)}-${type === 'SIM' ? 'S' : 'E'}-${pad(db.nextAsset++,5)}`;
      const a = { id, operator, type, owner: null, status: 'Disponible', history: [{ title: 'Lote recibido en matriz', detail: 'Carga de demostración validada', at: demoTime(db.nextEvent) }] };
      db.inventory.push(a); result.push(a);
    }
    log(role, 'Recepción de lote', `${count} unidades ${type} ingresadas a almacén matriz.`, null, operator, result[0].id); save(); return result;
  }
  function transfer(id, owner, role) {
    const a = db.inventory.find(x => x.id === id);
    if (!a || role === 'pos' || !canSeeOwner(a.owner, role) || a.status !== 'Disponible') throw new Error('Este inventario no puede asignarse desde el perfil actual.');
    authorizeOwner(owner, role);
    if (!point(owner).operators.includes(a.operator) || owner === a.owner) throw new Error('Selecciona otro punto autorizado para este operador.');
    a.owner = owner; a.status = 'En tránsito';
    a.history.push({ title: 'Asignación en tránsito', detail: owner, at: demoTime(db.nextEvent) });
    log(role, 'Inventario asignado', owner + ' · recepción pendiente.', owner, a.operator, id, 'En tránsito'); save(); return a;
  }
  function confirmReceipt(id, role) {
    const a = db.inventory.find(x => x.id === id);
    if (!a || !canSeeOwner(a.owner, role) || a.status !== 'En tránsito') throw new Error('El inventario no está pendiente de recepción en tu red.');
    a.status = 'Disponible'; a.history.push({ title: 'Recepción confirmada', detail: ROLES[role].name, at: demoTime(db.nextEvent) });
    log(role, 'Inventario recibido', 'Unidad disponible para venta simulada.', a.owner, a.operator, id); save(); return a;
  }
  function settle(filter) {
    if (filter.role !== 'director') throw new Error('El corte corresponde a matriz.');
    const pending = sales(filter).filter(t => t.status === 'Confirmada' && !db.settled.includes(t.id));
    if (!pending.length) throw new Error('No hay comisiones pendientes en este filtro.');
    db.settled = [...new Set([...db.settled, ...pending.map(t=>t.id)])];
    log(filter.role, 'Corte de comisiones', `${pending.length} operaciones incluidas. Sin dispersión bancaria real.`, null, filter.operator, 'CORTE-DEMO-' + db.nextEvent);
    save(); return pending;
  }
  window.NexusStore = Object.freeze({ KEY, ANCHOR, DAY, OPERATORS, PRODUCTS, POINTS, REGIONS, ROLES, op, point, product, rolePoints, allowedOperators, canSeeOwner,
    sales, assets, requests, logs, finance, metrics, quote, sale, requestTopup, resolveTopup, receiveBatch, transfer, confirmReceipt, settle,
    wallet: id => ({ ...db.wallets[id] }), asset: id => db.inventory.find(a=>a.id===id), transaction: id => db.transactions.find(t=>t.id===id),
    isSettled: id => db.settled.includes(id), reset: () => { db = seed(); save(); },
    storageBytes: () => new Blob([JSON.stringify(db)]).size, save });
})();
