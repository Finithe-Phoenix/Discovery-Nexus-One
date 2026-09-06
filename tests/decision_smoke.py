"""Decision room: provenance, arithmetic, privacy, keyboard, layouts and offline.
Actual HTTP is the default; the explicit inline mode is a render-only fallback.
"""
import os,json,traceback
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from playwright.sync_api import sync_playwright
from browser_smoke import ROOT,OUT,INLINE,load as base_load

def load(page,url):
    base_load(page,url)
    if INLINE:
        page.add_script_tag(content=(ROOT / "decision-model.js").read_text())
        page.add_script_tag(content=(ROOT / "decision.js").read_text())

RESULTS=[]
ERRORS=[]
def check(name,ok=True):
    if not ok:raise AssertionError(name)
    RESULTS.append(name);print('PASS',name,flush=True)
def run():
    server=None;url=os.environ.get('NEXUS_BASE_URL')
    if not INLINE and not url:
        server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
        Thread(target=server.serve_forever,daemon=True).start();url=f'http://127.0.0.1:{server.server_port}/'
    with sync_playwright() as p:
        opts={'headless':True}
        if os.environ.get('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
        browser=p.chromium.launch(**opts);ctx=browser.new_context(viewport={'width':1440,'height':1100},accept_downloads=True)
        page=ctx.new_page();page.set_default_timeout(12000);page.on('pageerror',lambda e:ERRORS.append(str(e)))
        tab=lambda name:page.locator(f'[data-dr="tab"][data-tab="{name}"]').click()
        snap=lambda:page.evaluate('JSON.stringify({metrics:NexusStore.metrics({role:"director",operator:"all",period:30}),wallet:NexusStore.wallet("PDV-001"),logs:NexusStore.logs({role:"director",operator:"all"})})')
        try:
            load(page,url);baseline=snap();page.locator('#decision-launch').click()
            check('evaluation opens as a native modal',page.locator('#decision-room').evaluate('(d)=>d.matches(":modal")'))
            check('opening evaluates without writing business records',snap()==baseline)
            check('proof instructions describe the actual business step',page.locator('.dr-proof-panel>h2').inner_text()=='Operación conectada' and 'Confirmar una venta' in page.locator('.dr-expected p').inner_text())
            check('no fabricated session evidence on entry','Todavía sin eventos' in page.locator('.dr-evidence').inner_text())
            page.screenshot(path=str(OUT/'v6-decision-desktop.png'),animations='disabled')
            page.keyboard.press('Control+k');check('command palette cannot open behind the modal',not page.locator('#dialog').evaluate('(d)=>d.open'))
            for _ in range(24):page.keyboard.press('Tab');assert page.evaluate('document.querySelector("#decision-room").contains(document.activeElement)')
            check('keyboard focus stays inside evaluation')
            for theme in ['light','dark']:
                page.evaluate('(t)=>document.documentElement.dataset.theme=t',theme)
                for width,height in [(320,740),(390,844),(768,1024),(1024,768),(1440,1000),(1920,1080)]:
                    page.set_viewport_size({'width':width,'height':height})
                    for name in ['proof','value','plan']:
                        tab(name)
                        check(f'{name} fits {width}px in {theme}',page.evaluate('''()=>{const d=document.querySelector('#decision-room'),s=d.querySelector('.dr-scroll');return d.scrollWidth<=d.clientWidth+1&&s.scrollWidth<=s.clientWidth+1}'''))
            page.evaluate('document.documentElement.dataset.theme="light"');page.set_viewport_size({'width':1440,'height':1100});tab('value')
            check('calculator begins with no financial assumptions',page.locator('.dr-result-empty').count()==1 and all(v=='' for v in page.locator('#dr-value-form input').evaluate_all('(xs)=>xs.map(x=>x.value)')))
            page.locator('[data-dr="example"]').click()
            check('example is explicit and starts with no conversion to cash',page.locator('#dr-realization').input_value()=='0' and '-$5,000' in page.locator('.dr-result-hero').inner_text())
            page.locator('#dr-realization').fill('100')
            check('positive scenario reconciles to arithmetic','$25,000' in page.locator('.dr-result-hero').inner_text() and '4 meses' in page.locator('.dr-result-metrics').inner_text())
            page.locator('.dr-value-heading').scroll_into_view_if_needed();page.screenshot(path=str(OUT/'v6-value-desktop.png'),animations='disabled')
            page.locator('#dr-realization').fill('0')
            check('cash is not conflated with capacity','200 h/mes' in page.locator('.dr-result-metrics').inner_text() and 'Sin recuperación' in page.locator('.dr-result-metrics').inner_text())
            page.locator('#dr-after').fill('10')
            check('worse time is displayed as time additional','Tiempo adicional' in page.locator('.dr-result-metrics').inner_text())
            page.locator('#dr-realization').fill('101')
            check('invalid percentage removes calculated returns',page.locator('.dr-result-empty').count()==1 and 'fuera de rango' in page.locator('#dr-input-error').inner_text())
            page.locator('#dr-realization').fill('100');page.locator('#dr-after').fill('4');page.locator('#dr-investment').fill('0')
            check('zero investment does not show fake recovery','inversión inicial cero' in page.locator('.dr-result-metrics').inner_text())
            page.locator('#dr-investment').fill('123456')
            check('private entered value is not persisted in localStorage',page.evaluate('!JSON.stringify(localStorage).includes("123456")'))
            check('scenario calculations do not mutate demo records',snap()==baseline)
            tab('plan');page.locator('[name="meeting-0"]').check();page.locator('#dr-notes').fill('Revisar <script>window.pwned=true</script> y definir alcance.')
            page.locator('.dr-plan-intro').scroll_into_view_if_needed();page.screenshot(path=str(OUT/'v6-plan-desktop.png'),animations='disabled')
            if INLINE:
                page.evaluate('''()=>{const create=URL.createObjectURL;URL.createObjectURL=b=>{window.__brief=b;return create(b)}}''')
                page.locator('.dr-header [data-dr="export"]').click();text=page.evaluate('window.__brief.text()')
            else:
                with page.expect_download() as d:page.locator('.dr-header [data-dr="export"]').click()
                target=OUT/'NEXUS_ONE_Resumen_de_evaluacion.html';d.value.save_as(target);text=target.read_text()
            check('explicit export includes private worksheet only on request','123456' in text and 'No es una cotización' in text)
            check('export escapes notes and has no injected script','<script>window.pwned=true</script>' not in text and '&lt;script&gt;' in text)
            check('meeting marks are discussion, not contractual acceptance','Conversado — Responsable' in text and 'No es una cotización, contrato, aceptación' in text)
            page.keyboard.press('Escape');check('Escape restores launch focus',page.evaluate('document.activeElement.id')=='decision-launch')
            page.locator('#decision-launch').click();tab('proof');page.locator('[data-dr="priority"][data-id="sale"]').click();page.locator('[data-dr="story"]').click()
            check('proof route opens exact story chapter',page.locator('.exp-main').get_attribute('data-chapter')=='3')
            page.locator('[data-exp="confirm"]').click();page.keyboard.press('Escape');page.locator('#decision-launch').click()
            check('completed sale creates traceable new evidence',page.locator('.dr-evidence [data-dr="event"]').count()==1)
            ref=page.locator('.dr-evidence [data-dr="event"]').get_attribute('data-ref');page.locator('.dr-evidence [data-dr="event"]').click()
            check('evidence link drills into exact audit reference',page.locator('#table-search').input_value()==ref and page.locator('#page-title').inner_text()=='Bitácora de operaciones')
            page.locator('#decision-launch').click();page.locator('[data-dr="priority"][data-id="reject"]').click();check('confirmed sale is not misclassified as rejection',page.locator('.dr-evidence [data-dr="event"]').count()==0)
            page.locator('[data-dr="story"]').click();page.locator('[data-exp="again"]').click();page.locator('[data-exp="reject"]').click();page.keyboard.press('Escape');page.locator('#decision-launch').click()
            check('new rejection is linked to zero-cost transaction',page.locator('.dr-evidence [data-dr="event"]').count()==1)
            page.locator('[data-dr="priority"][data-id="funds"]').click();page.locator('[data-dr="story"]').click();page.locator('[data-exp="request"]').click();page.keyboard.press('Escape');page.locator('#decision-launch').click()
            check('request without approval is not reported as authorized',page.locator('.dr-evidence [data-dr="event"]').count()==0)
            page.locator('[data-dr="story"]').click();page.locator('[data-exp="approve"]').click();page.keyboard.press('Escape');page.locator('#decision-launch').click()
            check('request and authorization produce matching reference',page.locator('.dr-evidence [data-dr="event"]').count()==1)
            page.set_viewport_size({'width':390,'height':844});page.locator('.dr-scroll').evaluate('(x)=>x.scrollTop=0');page.screenshot(path=str(OUT/'v6-decision-mobile.png'),animations='disabled')
            page.locator('.dr-proof-panel').scroll_into_view_if_needed();page.screenshot(path=str(OUT/'v6-proof-mobile.png'),animations='disabled')
            page.keyboard.press('Escape');page.set_viewport_size({'width':1440,'height':1000})
            page.locator('.top-actions [data-action="roles"]').click();page.locator('[data-role="pos"]').click()
            check('matrix evaluation entry is absent for point-of-sale view',not page.locator('#decision-launch').is_visible() and page.locator('#decision-nav').count()==0)
            page.evaluate('NexusDecisionRoom.open()');check('explicit open respects current presentation role',not page.locator('#decision-room').evaluate('(d)=>d.open'))
            page.locator('.top-actions [data-action="roles"]').click();page.locator('[data-role="director"]').click()
            if not INLINE:
                page.evaluate('navigator.serviceWorker.ready');page.wait_for_function('navigator.serviceWorker.controller!==null');ctx.set_offline(True);page.reload(wait_until='networkidle');page.locator('#decision-launch').click();tab('value')
                check('evaluation and calculator are available offline after initial load',page.locator('.dr-result-empty').count()==1)
                check('reload clears private worksheet instead of persisting it',all(v=='' for v in page.locator('#dr-value-form input').evaluate_all('(xs)=>xs.map(x=>x.value)')))
                ctx.set_offline(False)
            check('no uncaught JavaScript errors',not ERRORS)
        except Exception:
            page.screenshot(path=str(OUT/'v6-failure.png'),animations='disabled');traceback.print_exc();raise
        finally:
            (OUT/'decision-report.json').write_text(json.dumps({'mode':'inline / offline skipped' if INLINE else 'HTTP / real browser storage and service worker','passed':len(RESULTS),'checks':RESULTS,'skipped':['offline reload and real download'] if INLINE else [],'page_errors':ERRORS},ensure_ascii=False,indent=2));browser.close()
            if server:server.shutdown()
    print(json.dumps({'passed':len(RESULTS),'errors':ERRORS}),flush=True)
if __name__=='__main__':run()
