"""Executive story acceptance. HTTP by default; INLINE explicitly omits PWA checks."""
import json, os, traceback
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
from playwright.sync_api import sync_playwright
from browser_smoke import ROOT, OUT, INLINE, load

RESULTS=[]
ERRORS=[]
def check(name, condition=True):
    if not condition: raise AssertionError(name)
    RESULTS.append(name);print('PASS',name,flush=True)

def main():
    url=os.environ.get('NEXUS_BASE_URL');server=None
    if not INLINE and not url:
        server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
        Thread(target=server.serve_forever,daemon=True).start();url=f'http://127.0.0.1:{server.server_port}/'
    with sync_playwright() as p:
        kwargs={'headless':True}
        if os.environ.get('CHROMIUM_PATH'):kwargs['executable_path']=os.environ['CHROMIUM_PATH']
        browser=p.chromium.launch(**kwargs)
        ctx=browser.new_context(viewport={'width':1440,'height':960})
        page=ctx.new_page();page.set_default_timeout(10000)
        page.on('pageerror',lambda e:ERRORS.append(str(e)))
        snap=lambda:page.evaluate('''() => {const s=NexusStore,f={role:'director',operator:'all',period:30};return {revenue:s.metrics(f).revenue,commission:s.metrics(f).commission,count:s.sales(f).length,stock:s.metrics(f).stock,wallet:s.wallet('PDV-001').balance,requests:s.requests(f).length,logs:s.logs(f).length}}''')
        chapter=lambda n:page.locator(f'.exp-chapters [data-index="{n}"]').click()
        try:
            load(page,url)
            check('comparison chart includes previous period',page.locator('.ep-prior-line').count()==1)
            out=page.locator('#ep-chart-value').inner_text();page.locator('#ep-chart-day').focus();page.keyboard.press('Home')
            check('chart can be read using keyboard',page.locator('#ep-chart-value').inner_text()!=out)
            page.locator('#period').select_option('7')
            check('comparison table follows seven-day period',page.locator('.chart-access tbody tr').count()==7)
            page.locator('#period').select_option('1')
            check('single day has finite chart and disabled range',page.locator('#ep-chart-day').is_disabled() and 'NaN' not in page.locator('.sales-chart').inner_html())
            page.locator('#period').select_option('30')
            page.wait_for_timeout(300);page.screenshot(animations='disabled',timeout=8000,path=str(OUT/'v5-console-desktop.png'))
            before=snap();page.locator('.presentation-launch').click()
            check('story opens as native modal dialog',page.locator('#experience').evaluate('(d)=>d.open&&d.matches(":modal")'))
            check('opening never resets or mutates scenario',snap()==before)
            check('initial focus announces title',page.evaluate('document.activeElement.id')=='exp-title')
            page.keyboard.press('Control+k')
            check('global command palette does not open behind story',not page.locator('#dialog').evaluate('(d)=>d.open'))
            for _ in range(22):
                page.keyboard.press('Tab')
                assert page.evaluate('document.querySelector("#experience").contains(document.activeElement)')
            check('keyboard focus stays within story')
            for theme in ['light','dark']:
                page.evaluate('(theme)=>document.documentElement.dataset.theme=theme',theme)
                for width,height in [(320,740),(390,844),(430,932),(768,1024),(1024,768),(1280,720),(1440,960),(1920,1080)]:
                    page.set_viewport_size({'width':width,'height':height})
                    for n in range(6):
                        chapter(n)
                        ok=page.evaluate('''() => {const d=document.querySelector('#experience'),m=d.querySelector('.exp-main');const r=d.getBoundingClientRect();return d.scrollWidth<=d.clientWidth+1&&m.scrollWidth<=m.clientWidth+1&&r.left>=-1&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1}''')
                        check(f'story {n+1} fits {width}px / {theme}',ok)
            check('all chapter navigation is read-only',snap()==before)
            page.set_viewport_size({'width':1440,'height':960});page.evaluate('document.documentElement.dataset.theme="light"')
            chapter(0);page.wait_for_timeout(400);page.screenshot(animations='disabled',timeout=8000,path=str(OUT/'v5-keynote-desktop.png'))
            chapter(1);full=page.locator('.exp-universe-total strong').inner_text()
            page.locator('[data-exp="operator"][data-id="att"]').click()
            check('story operator switch recalculates revenue',page.locator('.exp-universe-total strong').inner_text()!=full)
            check('operator selection keeps keyboard focus',page.evaluate('document.activeElement.dataset.id')=='att')
            page.screenshot(animations='disabled',timeout=8000,path=str(OUT/'v5-universes-desktop.png'))
            chapter(2);asset=page.locator('.exp-asset-card>code').inner_text()
            check('story inventory references existing demo asset',page.evaluate('(id)=>!!NexusStore.asset(id)',asset))
            chapter(3);page.wait_for_timeout(400);page.screenshot(animations='disabled',timeout=8000,path=str(OUT/'v5-sale-before.png'))
            sale_before=snap();page.locator('[data-exp="confirm"]').click()
            sale_after=snap()
            check('story sale debits cost and creates commission',sale_after['wallet']==sale_before['wallet']-18507 and sale_after['commission']==sale_before['commission']+1393)
            check('story sale changes revenue and specific asset',sale_after['revenue']==sale_before['revenue']+19900 and page.evaluate('(id)=>NexusStore.asset(id).status',asset)=='Vendida')
            check('five effects reference committed operation',page.locator('.exp-effect').count()==5 and sale_after['logs']==sale_before['logs']+1)
            page.wait_for_timeout(600);page.screenshot(animations='disabled',timeout=8000,path=str(OUT/'v5-sale-effects.png'))
            chapter(2);chapter(3)
            check('revisiting sale does not replay a transaction',snap()==sale_after and page.locator('[data-exp="confirm"]').count()==0)
            page.locator('[data-exp="again"]').click();reject_before=snap();page.locator('[data-exp="reject"]').click();reject_after=snap()
            check('story rejection changes no money or stock',all(reject_before[k]==reject_after[k] for k in ['wallet','revenue','commission','stock']))
            check('rejected attempt is recorded',reject_after['count']==reject_before['count']+1 and reject_after['logs']==reject_before['logs']+1)
            chapter(4);check('cannot authorize before requesting',page.locator('[data-exp="approve"]').is_disabled())
            pre=snap();page.locator('[data-exp="request"]').click()
            check('story request does not credit balance',snap()['wallet']==pre['wallet'] and snap()['requests']==pre['requests']+1)
            page.locator('[data-exp="approve"]').click();post=snap()
            check('story approval credits exactly 2500 MXN',post['wallet']==pre['wallet']+250000)
            chapter(3);chapter(4)
            check('approved request cannot be credited twice',snap()==post and page.locator('[data-exp="approve"]').count()==0)
            page.wait_for_timeout(400);page.screenshot(animations='disabled',timeout=8000,path=str(OUT/'v5-control.png'))
            chapter(5);check('closing evidence is drawn from local events',page.locator('.exp-proof-list>div').count()>=3)
            page.wait_for_timeout(400);page.screenshot(animations='disabled',timeout=8000,path=str(OUT/'v5-evidence.png'))
            page.locator('[data-exp="report"]').click()
            check('story opens existing scoped report',not page.locator('#experience').evaluate('(d)=>d.open') and page.locator('#dialog-title').inner_text()=='Informe ejecutivo')
            page.keyboard.press('Escape');page.locator('.presentation-launch').click()
            check('story resumes the last chapter',page.locator('.exp-main').get_attribute('data-chapter')=='5')
            page.keyboard.press('Escape');page.wait_for_timeout(100)
            check('Escape closes and restores focus',not page.locator('#experience').evaluate('(d)=>d.open') and page.evaluate('document.activeElement.classList.contains("presentation-launch")'))
            page.locator('.presentation-launch').click();chapter(2);page.locator('[data-exp="module"]').click()
            check('story deep-link reaches inventory console',page.locator('#page-title').inner_text()=='Inventario SIM & eSIM')
            page.locator('.presentation-launch').click();chapter(0)
            page.emulate_media(reduced_motion='reduce');chapter(3)
            check('reduced-motion stops story animations',page.locator('#experience').evaluate('(el)=>el.getAnimations({subtree:true}).length===0'))
            page.emulate_media(reduced_motion='no-preference')
            chapter(0);page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(400)
            page.screenshot(animations='disabled',timeout=8000,path=str(OUT/'v5-keynote-mobile.png'))
            chapter(3);page.locator('.exp-visual').scroll_into_view_if_needed();page.wait_for_timeout(400)
            page.screenshot(animations='disabled',timeout=8000,path=str(OUT/'v5-effects-mobile.png'))
            page.keyboard.press('Escape');page.set_viewport_size({'width':1440,'height':960})
            if not INLINE:
                page.evaluate('navigator.serviceWorker.ready')
                page.wait_for_function('navigator.serviceWorker.controller !== null')
                ctx.set_offline(True);page.reload(wait_until='networkidle');page.locator('.presentation-launch').click()
                check('story resources and comparison work offline',page.locator('.exp-orbit').count()==1 and page.locator('#page-title').inner_text()=='Inventario SIM & eSIM') # inventory console remains behind
                chapter(3);check('offline story can quote existing local data',page.locator('.exp-ledger').count()==1)
                ctx.set_offline(False)
            check('no uncaught JavaScript errors',not ERRORS)
        except Exception:
            page.screenshot(animations='disabled',timeout=8000,path=str(OUT/'v5-failure.png'));traceback.print_exc();raise
        finally:
            (OUT/'experience-report.json').write_text(json.dumps({'passed':len(RESULTS),'checks':RESULTS,'mode':'inline / PWA omitted' if INLINE else 'HTTP / real browser storage and service worker','skipped':['offline reload'] if INLINE else [],'page_errors':ERRORS},ensure_ascii=False,indent=2))
            browser.close()
            if server:server.shutdown()
    print(json.dumps({'passed':len(RESULTS),'errors':ERRORS}),flush=True)

if __name__=='__main__':main()
