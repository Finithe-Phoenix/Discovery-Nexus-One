'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '..', 'demo-store.js'), 'utf8');
const filter = { role: 'director', operator: 'all', period: 30 };
function fixture(initial) {
  const data = initial || new Map();
  const context = { window: { dispatchEvent() {} }, localStorage: {
    getItem: k => data.get(k) ?? null, setItem: (k,v) => data.set(k,String(v))
  }, Blob, Event, Date, console };
  vm.runInNewContext(source, context);
  return { s: context.window.NexusStore, data };
}
const input = extra => ({ role: 'pos', owner: 'PDV-001', operator: 'movistar', product: 'sim', outcome: 'confirm', nonce: 'test-unique', ...extra });
function modifiedWallet(balance, creditLimit=0, creditUsed=0) {
  const {s,data}=fixture();s.save();const saved=JSON.parse(data.get(s.KEY));
  saved.wallets['PDV-001']={balance,creditLimit,creditUsed};data.set(s.KEY,JSON.stringify(saved));
  return fixture(data).s;
}
test('seed is deterministic; operator totals reconcile to the consolidated ledger',()=>{
  const {s}=fixture(),m=s.metrics(filter);const sum=s.OPERATORS.reduce((a,o)=>a+s.metrics({...filter,operator:o.id}).revenue,0);
  assert.equal(m.revenue,sum);assert.equal(m.revenue,fixture().s.metrics(filter).revenue);assert.equal(s.POINTS.length,24);
  assert.ok(m.rows.length>3000);assert.ok(s.storageBytes()<4*1024*1024);
});
test('point-of-sale view is restricted to its stock, operators and transactions',()=>{
  const {s}=fixture(),f={...filter,role:'pos'};
  assert.ok(s.sales(f).every(t=>t.owner==='PDV-001'&&['movistar','att'].includes(t.operator)));
  assert.ok(s.assets(f).every(a=>a.owner==='PDV-001'));assert.equal(s.rolePoints('pos').length,1);
});
test('distributor is limited to its own four points and allowed operators',()=>{
  const {s}=fixture(),f={...filter,role:'distributor'};
  assert.equal(s.rolePoints('distributor').length,4);
  assert.ok(s.sales(f).every(t=>s.point(t.owner).distributor==='DIST-01'&&t.operator!=='other'));
  assert.equal(s.assets({...f,operator:'other'}).length,0);
});
test('confirmed SIM sale atomically updates wallet, inventory, commission and audit',()=>{
  const {s}=fixture(),before=s.metrics(filter),wallet=s.wallet('PDV-001'),q=s.quote(input()),tx=s.sale(input());
  assert.equal(tx.amount,19900);assert.equal(tx.commission,1393);assert.equal(tx.cost,18507);
  assert.equal(s.wallet('PDV-001').balance,wallet.balance-tx.cost);assert.equal(s.asset(q.asset).status,'Vendida');
  assert.equal(s.metrics(filter).revenue,before.revenue+19900);assert.equal(s.metrics(filter).commission,before.commission+1393);
  assert.ok(s.logs(filter).some(l=>l.reference===tx.id&&l.action==='Venta confirmada'));
});
test('rejected operation does not consume balance, credit, stock or commission',()=>{
  const {s}=fixture(),before=s.metrics(filter),wallet=s.wallet('PDV-001'),q=s.quote(input()),tx=s.sale(input({outcome:'reject'}));
  assert.equal(tx.status,'Rechazada');assert.equal(tx.cost,0);assert.equal(tx.commission,0);
  assert.deepEqual(s.wallet('PDV-001'),wallet);assert.equal(s.asset(q.asset).status,'Disponible');assert.equal(s.metrics(filter).revenue,before.revenue);
});
test('duplicate confirmation nonce cannot debit the wallet twice',()=>{
  const {s}=fixture(),tx=s.sale(input()),balance=s.wallet('PDV-001').balance,count=s.sales(filter).length;
  assert.equal(s.sale(input()).id,tx.id);assert.equal(s.wallet('PDV-001').balance,balance);assert.equal(s.sales(filter).length,count);
});
test('reusing an idempotency key for another operation is rejected',()=>{
  const {s}=fixture();s.sale(input());assert.throws(()=>s.sale(input({product:'topup'})),/otra operación/);
});
test('insufficient wallet and credit is rejected before any transaction is written',()=>{
  const s=modifiedWallet(0),count=s.sales(filter).length;
  assert.throws(()=>s.sale(input()),/insuficientes/);assert.equal(s.sales(filter).length,count);
});
test('credit is consumed only for the part not covered by wallet balance',()=>{
  const s=modifiedWallet(1000,100000);const tx=s.sale(input({product:'topup'}));
  assert.equal(tx.cost,9300);assert.equal(s.wallet('PDV-001').balance,0);assert.equal(s.wallet('PDV-001').creditUsed,8300);
});
test('unauthorized point and operator combinations are rejected',()=>{
  const {s}=fixture();assert.throws(()=>s.sale(input({owner:'PDV-009'})),/no pertenece/);
  assert.throws(()=>s.sale(input({operator:'bait'})),/no está habilitado/);
});
test('a top-up request does not credit the wallet until director approval',()=>{
  const {s}=fixture(),before=s.wallet('PDV-001').balance;
  const r=s.requestTopup({role:'pos',owner:'PDV-001',amount:250000,reference:'DEMO-TEST-001'});
  assert.equal(s.wallet('PDV-001').balance,before);assert.equal(r.status,'Pendiente');
  assert.throws(()=>s.resolveTopup(r.id,true,'pos'),/Dirección/);
  s.resolveTopup(r.id,true,'director');assert.equal(s.wallet('PDV-001').balance,before+250000);
  assert.throws(()=>s.resolveTopup(r.id,true,'director'),/ya fue procesada/);assert.equal(s.wallet('PDV-001').balance,before+250000);
});
test('rejecting a top-up preserves balance',()=>{
  const {s}=fixture(),before=s.wallet('PDV-001').balance;s.resolveTopup('AB-0001',false,'director');
  assert.equal(s.wallet('PDV-001').balance,before);assert.equal(s.requests(filter).find(r=>r.id==='AB-0001').status,'Rechazada');
});
test('top-up references must be synthetic, unique and within monetary limits',()=>{
  const {s}=fixture(),r={role:'pos',owner:'PDV-001',amount:10000,reference:'DEMO-UNIQUE-001'};
  assert.throws(()=>s.requestTopup({...r,reference:'real account data'}),/ficticia/);
  assert.throws(()=>s.requestTopup({...r,amount:1}),/monto/);
  s.requestTopup(r);assert.throws(()=>s.requestTopup({...r,reference:'demo-unique-001'}),/Ya existe/);
});
test('only matrix can receive a batch; IDs are unique and explicitly fictitious',()=>{
  const {s}=fixture(),before=s.assets(filter).length;
  assert.throws(()=>s.receiveBatch({role:'pos',operator:'movistar',type:'SIM',count:10}),/matriz/);
  const items=s.receiveBatch({role:'director',operator:'movistar',type:'SIM',count:10});
  assert.equal(s.assets(filter).length,before+10);assert.ok(items.every(a=>a.id.startsWith('DEMO-')&&a.owner===null));
  assert.equal(new Set(s.assets(filter).map(a=>a.id)).size,s.assets(filter).length);
});
test('batch size and format constraints are enforced',()=>{
  const {s}=fixture();for(const count of [0,51,1.5])assert.throws(()=>s.receiveBatch({role:'director',operator:'att',type:'SIM',count}),/cantidad/);
});
test('inventory transfer requires acknowledgment before the unit can be sold',()=>{
  const {s}=fixture(),a=s.receiveBatch({role:'director',operator:'movistar',type:'SIM',count:1})[0];
  s.transfer(a.id,'PDV-001','director');assert.equal(s.asset(a.id).status,'En tránsito');
  assert.throws(()=>s.sale(input({assetId:a.id})),/inventario/);
  s.confirmReceipt(a.id,'pos');assert.equal(s.asset(a.id).status,'Disponible');
  const tx=s.sale(input({assetId:a.id}));assert.equal(tx.asset,a.id);assert.equal(s.asset(a.id).status,'Vendida');
});
test('a specific sold asset cannot be sold a second time',()=>{
  const {s}=fixture(),tx=s.sale(input());assert.throws(()=>s.sale(input({nonce:'second',assetId:tx.asset})),/inventario/);
});
test('an eSIM sale consumes the right profile and does not generate an activation code',()=>{
  const {s}=fixture(),tx=s.sale(input({product:'esim'}));assert.equal(s.asset(tx.asset).type,'eSIM');
  assert.ok(tx.asset.startsWith('DEMO-'));assert.ok(!JSON.stringify(tx).includes('LPA:'));
});
test('commissions can be settled once and only by matrix',()=>{
  const {s}=fixture(),f={...filter,operator:'movistar'};const expected=s.metrics(f).outstanding;
  assert.throws(()=>s.settle({...f,role:'pos'}),/matriz/);
  const rows=s.settle(f);assert.equal(rows.reduce((n,t)=>n+t.commission,0),expected);assert.equal(s.metrics(f).outstanding,0);
  assert.throws(()=>s.settle(f),/No hay/);assert.ok(s.metrics({...filter,operator:'att'}).outstanding>0);
});
test('period filters and prior-period comparisons are real ledger aggregations',()=>{
  const {s}=fixture();const day=s.metrics({...filter,period:1}),week=s.metrics({...filter,period:7}),month=s.metrics(filter);
  assert.ok(day.count<week.count&&week.count<month.count);assert.ok(month.previousRevenue>0);
  assert.ok(day.rows.every(t=>Date.parse(t.at)>s.ANCHOR-s.DAY));
});
test('serialized state restores a transaction without duplicating it',()=>{
  const {s,data}=fixture(),tx=s.sale(input()),balance=s.wallet('PDV-001').balance;const restored=fixture(data).s;
  assert.equal(restored.transaction(tx.id).id,tx.id);assert.equal(restored.wallet('PDV-001').balance,balance);
  assert.equal(restored.sale(input()).id,tx.id);assert.equal(restored.wallet('PDV-001').balance,balance);
});
test('reset restores seed without changing theme or unrelated application keys',()=>{
  const {s,data}=fixture();data.set('unrelated','keep');data.set('nexus-theme-v3','dark');
  const revenue=s.metrics(filter).revenue;s.sale(input());s.reset();assert.equal(s.metrics(filter).revenue,revenue);
  assert.equal(data.get('unrelated'),'keep');assert.equal(data.get('nexus-theme-v3'),'dark');
});
test('invalid saved JSON and old schema fall back to the demo seed',()=>{
  const data=new Map([['nexus-enterprise-demo-v3','not-json']]);assert.equal(fixture(data).s.POINTS.length,24);
  data.set('nexus-enterprise-demo-v3',JSON.stringify({version:2}));assert.ok(fixture(data).s.metrics(filter).count>0);
});
