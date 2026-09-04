(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const isMobile=()=>matchMedia('(max-width:780px)').matches;
  document.body.classList.add('v2-ready');

  function addMobileExecutiveStrip(){
    if(!isMobile()||$('#mobile-exec-strip')) return;
    const head=$('#dashboard .head'); if(!head) return;
    const strip=document.createElement('section');
    strip.id='mobile-exec-strip'; strip.className='mobile-exec-strip';
    strip.innerHTML=`<article><span>Venta consolidada</span><strong>$1.84M</strong><small>+12.8% vs. periodo</small></article><article><span>Activaciones</span><strong>2,842</strong><small>SIM + eSIM confirmadas</small></article><article><span>Red activa</span><strong>1,247</strong><small>89% de puntos registrados</small></article>`;
    head.after(strip);
  }

  function addOperatorRail(){
    if(!isMobile()||$('#mobile-operator-rail')) return;
    const strip=$('#mobile-exec-strip'); if(!strip) return;
    const rail=document.createElement('section');
    rail.id='mobile-operator-rail'; rail.className='mobile-operator-rail';
    rail.innerHTML=`<header><div><span>Universos independientes</span><strong>Explorar por telefonía</strong></div><small>Sin mezclar inventarios</small></header><div class="mobile-operator-buttons"><button data-operator="all" class="active">Consolidado</button><button data-operator="movistar">Movistar</button><button data-operator="att">AT&amp;T</button><button data-operator="bait">Bait</button><button data-operator="other">Otros</button></div>`;
    strip.after(rail);
  }

  function syncOperatorRail(){
    const select=$('#operatorSelect'); if(!select) return;
    const current=select.value;
    $$('.mobile-operator-buttons button').forEach(b=>b.classList.toggle('active',b.dataset.operator===current));
  }

  function observeReveals(){
    if(!('IntersectionObserver'in window)) return;
    const items=$$('.card,.metric,.pulse,.mobile-exec-strip,.mobile-operator-rail').filter(x=>!x.dataset.v2Observed);
    const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.animate([{opacity:.35,transform:'translateY(10px)'},{opacity:1,transform:'none'}],{duration:420,easing:'cubic-bezier(.2,.8,.2,1)',fill:'both'});io.unobserve(e.target)}}),{threshold:.08});
    items.forEach(el=>{el.dataset.v2Observed='1';io.observe(el)});
  }

  function enhance(){ addMobileExecutiveStrip(); addOperatorRail(); syncOperatorRail(); observeReveals(); }
  enhance(); setTimeout(enhance,250); setTimeout(enhance,900);

  document.addEventListener('click',e=>{
    const op=e.target.closest('.mobile-operator-buttons [data-operator]');
    if(op){ setTimeout(syncOperatorRail,20); if(navigator.vibrate) navigator.vibrate(8); }
    if(e.target.closest('button')&&navigator.vibrate&&isMobile()) navigator.vibrate(5);
    setTimeout(()=>{enhance();syncOperatorRail()},80);
  },true);
  $('#operatorSelect')?.addEventListener('change',()=>setTimeout(syncOperatorRail,30));
  window.addEventListener('resize',enhance);

  if(!document.querySelector('link[rel="manifest"]')){
    const link=document.createElement('link');link.rel='manifest';link.href='./manifest.webmanifest';document.head.append(link);
  }
})();
