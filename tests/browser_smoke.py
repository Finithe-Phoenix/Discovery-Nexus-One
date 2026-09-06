"""Browser acceptance suite. Default: real HTTP, real storage and real service worker.
NEXUS_INLINE_TEST=1 is an explicit network-free rendering test double for restricted labs.
"""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
import json, os, re, sys, time, traceback
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(os.environ.get('NEXUS_EVIDENCE', str(ROOT / 'test-results')))
OUT.mkdir(parents=True, exist_ok=True)
INLINE = os.environ.get('NEXUS_INLINE_TEST') == '1'
CHECKS = []
SKIPPED = []
ERRORS = []

def check(name, condition=True):
    if not condition:
        raise AssertionError(name)
    CHECKS.append({'name': name, 'status': 'passed'})
    print('PASS', name, flush=True)

def load(page, url):
    if not INLINE:
        response = page.goto(url, wait_until='networkidle')
        assert response and response.ok, 'HTTP entry point failed'
    else:
        html = (ROOT / 'index.html').read_text()
        html = re.sub(r'<link rel="stylesheet"[^>]+>', lambda m: '<style>' + (ROOT / re.search(r'href="\./([^"?]+)', m.group()).group(1)).read_text() + '</style>', html)
        html = re.sub(r'<script src="[^>]+></script>', '', html)
        html = re.sub(r'<link rel="(?:manifest|icon)"[^>]+>', '', html)
        page.evaluate('''() => {const d = new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>d.get(k)??null,setItem:(k,v)=>d.set(k,String(v)),removeItem:k=>d.delete(k),clear:()=>d.clear()}})}''')
        page.set_content(html, wait_until='domcontentloaded')
        page.add_script_tag(content=(ROOT / 'demo-store.js').read_text())
        page.add_script_tag(content=(ROOT / 'enterprise.js').read_text())
        page.add_script_tag(content=(ROOT / 'experience.js').read_text())
        page.add_script_tag(content=(ROOT / 'decision-core.js').read_text())
        page.add_script_tag(content=(ROOT / 'decision.js').read_text())
    page.wait_for_selector('#view .kpi')
    page.wait_for_timeout(100)

def metric(page):
    return page.evaluate('NexusStore.metrics({role:"director",operator:"all",period:30})')

def goto(page, target):
    page.locator(f'#nav [data-page="{target}"]').click()

def role(page, target):
    page.locator('.top-actions [data-action="roles"]').click()
    page.locator(f'[data-action="set-role"][data-role="{target}"]').click()

def close(page):
    if page.locator('#dialog').evaluate('(d)=>d.open'):
        page.locator('#dialog [data-action="close"]').first.click()

def run():
    server = None
    url = os.environ.get('NEXUS_BASE_URL')
    if not INLINE and not url:
        server = ThreadingHTTPServer(('127.0.0.1', 0), partial(SimpleHTTPRequestHandler, directory=str(ROOT)))
        Thread(target=server.serve_forever, daemon=True).start()
        url = f'http://127.0.0.1:{server.server_port}/'
    with sync_playwright() as p:
        launch = {'headless': True}
        if os.environ.get('CHROMIUM_PATH'):
            launch['executable_path'] = os.environ['CHROMIUM_PATH']
        browser = p.chromium.launch(**launch)
        context = browser.new_context(viewport={'width':1440,'height':1000}, accept_downloads=True)
        page = context.new_page()
        page.set_default_timeout(10000)
        page.on('pageerror', lambda e: ERRORS.append(str(e)))
        try:
            load(page, url)
            baseline = metric(page)
            check('dashboard renders deterministic ledger totals', baseline['count'] > 3000)
            page.screenshot(path=str(OUT / 'desktop-overview.png'), full_page=True)
            page.screenshot(path=str(OUT / 'desktop-viewport.png'))
            for target in ['operators','inventory','network','sales','wallet','commissions','approvals','reports','audit','settings','overview']:
                goto(page, target)
                check('module renders: '+target, page.locator('#view').inner_text().strip() != '' and not ERRORS)
                check('no horizontal page overflow: '+target, page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'))
            original = page.locator('.kpi-value .wide-value').first.inner_text()
            page.locator('[data-action="operator"][data-operator="movistar"]').click()
            check('operator selection changes visible sales', page.locator('.kpi-value .wide-value').first.inner_text() != original)
            page.locator('#period').select_option('7')
            check('period selection recalculates visible sales', '7 días' in page.locator('#view').inner_text())
            page.locator('#period').select_option('30')
            page.locator('[data-action="operator"][data-operator="all"]').click()
            role(page, 'pos')
            check('point-of-sale navigation hides matrix-only modules', page.locator('#nav [data-page="approvals"]').count()==0 and page.locator('#nav [data-page="network"]').count()==0)
            check('point-of-sale operator tabs are scoped', page.locator('#operator-tabs button').count()==3)
            wallet_before = page.evaluate('NexusStore.wallet("PDV-001").balance')
            before = metric(page)
            page.locator('#heading-actions [data-action="new-sale"]').click()
            check('sale starts with scoped point and operator', page.locator('#sale-point option').count()==1 and page.locator('#sale-operator option').count()==2)
            page.locator('#sale-form button[type="submit"]').click()
            page.locator('[data-action="confirm-sale"]').click()
            check('sale confirmation shows completed receipt', page.locator('#dialog-title').inner_text()=='Operación completada')
            after = metric(page)
            check('sale updates dashboard revenue and commission', after['revenue']==before['revenue']+19900 and after['commission']==before['commission']+1393)
            check('sale debits correct cost', page.evaluate('NexusStore.wallet("PDV-001").balance')==wallet_before-18507)
            page.screenshot(path=str(OUT / 'sale-receipt.png'))
            close(page)
            page.locator('#heading-actions [data-action="new-sale"]').click()
            page.locator('[data-action="select-product"][data-product="topup"]').click()
            page.locator('#sale-outcome').select_option('reject')
            unchanged = page.evaluate('NexusStore.wallet("PDV-001").balance')
            page.locator('#sale-form button[type="submit"]').click()
            page.locator('[data-action="confirm-sale"]').click()
            check('rejected sale has no wallet impact', page.locator('#dialog-title').inner_text()=='Rechazo simulado' and page.evaluate('NexusStore.wallet("PDV-001").balance')==unchanged)
            close(page)
            role(page,'director')
            goto(page,'inventory')
            inv_before = page.evaluate('NexusStore.assets({role:"director",operator:"all"}).length')
            page.locator('#heading-actions [data-action="batch"]').click()
            page.locator('#batch-form [name="operator"]').select_option('movistar')
            page.locator('#batch-form [name="type"]').select_option('eSIM')
            page.locator('#batch-form [name="count"]').fill('3')
            page.locator('#batch-form [type="submit"]').click()
            check('batch receipt adds exactly three stock units', page.evaluate('NexusStore.assets({role:"director",operator:"all"}).length')==inv_before+3)
            asset = page.evaluate('NexusStore.assets({role:"director",operator:"movistar"})[0].id')
            page.locator(f'#table-content [data-action="asset"][data-id="{asset}"]').first.click()
            page.locator('[data-action="transfer"]').click()
            page.locator('#transfer-form [name="owner"]').select_option('PDV-001')
            page.locator('#transfer-form [type="submit"]').click()
            check('assignment moves the specific unit into transit', page.evaluate('(id)=>NexusStore.asset(id).status',asset)=='En tránsito')
            page.locator('[data-action="receive-asset"]').click()
            check('receipt makes the assigned unit available', page.evaluate('(id)=>NexusStore.asset(id).status',asset)=='Disponible')
            page.locator('[data-action="sell-asset"]').click()
            page.locator('#sale-form [type="submit"]').click()
            page.locator('[data-action="confirm-sale"]').click()
            check('eSIM sale consumes the selected profile only', page.evaluate('(id)=>NexusStore.asset(id).status',asset)=='Vendida' and page.locator('.esim-preview').count()==1)
            page.screenshot(path=str(OUT / 'esim-receipt.png'))
            close(page)
            goto(page,'wallet')
            old_balance=page.evaluate('NexusStore.wallet("PDV-001").balance')
            page.locator('#heading-actions [data-action="topup"]').click()
            page.locator('#topup-form [name="amount"]').fill('2500')
            page.locator('#topup-form [name="reference"]').fill('DEMO-BROWSER-TEST-001')
            page.locator('#topup-form [type="submit"]').click()
            check('request alone does not credit wallet', page.evaluate('NexusStore.wallet("PDV-001").balance')==old_balance)
            req=page.evaluate('NexusStore.requests({role:"director"}).find(r=>r.reference==="DEMO-BROWSER-TEST-001").id')
            goto(page,'approvals')
            page.locator(f'[data-action="review-topup"][data-id="{req}"][data-approve="true"]').click()
            page.locator('[data-action="resolve-topup"]').click()
            check('matrix approval credits wallet once', page.evaluate('NexusStore.wallet("PDV-001").balance')==old_balance+250000)
            goto(page,'commissions')
            page.locator('#heading-actions [data-action="settle"]').click()
            page.locator('[data-action="confirm-settle"]').click()
            check('commission closing removes settled items from outstanding amount', page.evaluate('NexusStore.metrics({role:"director",operator:"movistar",period:30}).outstanding')==0)
            if INLINE:
                page.evaluate('''() => {const old=URL.createObjectURL;URL.createObjectURL=(blob)=>{window.__csv=blob;return old(blob)}}''')
                page.locator('[data-action="export"]').click()
                text=page.evaluate('window.__csv.text()')
                check('CSV export serializes selected operator ledger', 'Folio DEMO' in text and 'Movistar' in text and 'AT&T' not in text)
            else:
                with page.expect_download() as info:
                    page.locator('[data-action="export"]').click()
                file=OUT / 'commissions-export.csv';info.value.save_as(file)
                text=file.read_text(encoding='utf-8-sig')
                check('CSV download contains selected operator ledger', 'Folio DEMO' in text and 'Movistar' in text and 'AT&T' not in text)
            page.keyboard.press('Control+k')
            page.locator('#command-query').fill('Configuración')
            check('command palette finds modules', page.locator('#command-results [data-page="settings"]').count()==1)
            page.locator('#command-results [data-page="settings"]').click()
            page.locator('[data-action="reset"]').click()
            page.locator('[data-action="confirm-reset"]').click()
            check('reset restores initial sales ledger', metric(page)['revenue']==baseline['revenue'])
            page.locator('.top-actions [data-action="theme"]').click()
            check('dark theme switches and saves user preference', page.evaluate('document.documentElement.dataset.theme')=='dark' and page.evaluate('localStorage.getItem("nexus-theme-v3")')=='dark')
            check('transient notifications never exceed two', page.locator('#toasts .toast').count() <= 2)
            page.wait_for_function("document.querySelectorAll('#toasts .toast').length === 0")
            page.screenshot(path=str(OUT / 'dark-viewport.png'))
            page.locator('.top-actions [data-action="theme"]').click()
            page.set_viewport_size({'width':1920,'height':1080})
            page.locator('.presentation-launch').click()
            page.locator('[data-exp=\"free\"]').click()
            check('presentation mode hides sidebar', not page.locator('#sidebar').is_visible())
            page.screenshot(path=str(OUT / 'presentation-viewport.png'))
            for target in ['operators','inventory','sales','wallet','commissions','audit']:
                page.locator('[data-action="tour-next"]').click()
                check('guided step: '+target, page.url.endswith('#'+target))
            page.locator('[data-action="tour-next"]').click()
            check('presentation mode can exit normally', not page.evaluate('document.documentElement.classList.contains("present")'))
            goto(page,'overview')
            for width,height in [(320,740),(360,800),(390,844),(430,932),(768,1024),(1024,768),(1440,900),(1920,1080)]:
                page.set_viewport_size({'width':width,'height':height})
                page.wait_for_timeout(80)
                check(f'overview responsive at {width}px',page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'))
                if width==390:
                    page.screenshot(path=str(OUT/'mobile-viewport.png'))
                    page.screenshot(path=str(OUT/'mobile-overview.png'),full_page=True)
                    page.locator('#mobile-nav [data-page="inventory"]').click()
                    check('mobile navigation opens inventory',page.locator('#page-title').inner_text()=='Inventario SIM & eSIM')
                    page.locator('#type-filter').select_option('eSIM')
                    check('mobile inventory filter shows only eSIM', all(x.strip()=='eSIM' for x in page.locator('#table-content td[data-label="Formato"]').all_text_contents()))
                    check('mobile inventory has no horizontal page overflow',page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'))
                    page.screenshot(path=str(OUT/'mobile-inventory.png'))
                    page.locator('#mobile-nav [data-page="overview"]').click()
            page.set_viewport_size({'width':1440,'height':1000})
            page.locator('#heading-actions [data-action="briefing"]').click()
            check('executive report opens with scope and synthetic-data warning','datos sintéticos' in page.locator('#dialog').inner_text())
            page.keyboard.press('Tab')
            check('keyboard focus remains within open dialog',page.evaluate('document.querySelector("#dialog").contains(document.activeElement)'))
            page.keyboard.press('Escape')
            check('Escape closes dialog',not page.locator('#dialog').evaluate('(d)=>d.open'))
            if not INLINE:
                page.evaluate('NexusStore.sale({role:"pos",owner:"PDV-001",operator:"movistar",product:"topup",nonce:"persistence-check"})')
                revenue=metric(page)['revenue'];balance=page.evaluate('NexusStore.wallet("PDV-001").balance')
                page.reload(wait_until='networkidle')
                check('real browser reload preserves transaction and wallet',metric(page)['revenue']==revenue and page.evaluate('NexusStore.wallet("PDV-001").balance')==balance)
                page.evaluate('navigator.serviceWorker.ready')
                page.wait_for_function('navigator.serviceWorker.controller !== null')
                check('service worker controls application',page.evaluate('!!navigator.serviceWorker.controller'))
                context.set_offline(True)
                page.reload(wait_until='networkidle')
                check('PWA shell reloads offline with local demo data',page.locator('#page-title').inner_text()=='Centro de control' and metric(page)['revenue']==revenue)
                context.set_offline(False)
                check('manifest contains installable icon sizes',page.evaluate('''async()=>{const m=await(await fetch('./manifest.webmanifest')).json();return m.display==='standalone'&&m.icons.some(i=>i.sizes==='192x192')&&m.icons.some(i=>i.sizes==='512x512')}'''))
            else:
                SKIPPED.extend(['real HTTP persistence','service worker registration and offline reload','manifest HTTP response'])
            check('no uncaught JavaScript exceptions',not ERRORS)
        except Exception:
            page.screenshot(path=str(OUT/'failure.png'),full_page=True)
            traceback.print_exc()
            raise
        finally:
            report={'mode':'inline rendering with storage double' if INLINE else 'HTTP browser with real storage and service worker','passed':len(CHECKS),'checks':CHECKS,'skipped':SKIPPED,'page_errors':ERRORS}
            (OUT/'browser-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
            browser.close()
            if server: server.shutdown()
    print(json.dumps({'passed':len(CHECKS),'skipped':SKIPPED,'errors':ERRORS}),flush=True)

if __name__=='__main__':
    run()
