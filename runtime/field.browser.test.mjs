import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
test('FIELD aperture changes scene pixels through keyboard input, in both modes',async t=>{
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--enable-unsafe-swiftshader']});t.after(()=>browser.close());
  for(const [url,selector] of [[(process.env.V3_STATIC_URL||'http://127.0.0.1:8765')+'/examples/v3-flagship/','.instrument'],[(process.env.V3_URL||'http://127.0.0.1:8766')+'/v3-flagship','.optical-scene']]){
    const page=await browser.newPage({viewport:{width:1440,height:1000}});await page.goto(url);await page.waitForSelector(selector==='.instrument'?'.field-controls:not([hidden])':'canvas');
    const slider=page.getByRole('slider');await slider.focus();await slider.press('Home');await page.waitForTimeout(1300);
    const before=await page.locator(selector).screenshot();await slider.press('End');await page.waitForTimeout(300);
    assert.equal(await slider.inputValue(),'100');const after=await page.locator(selector).screenshot();assert.equal(before.equals(after),false,url+' changes the actual view');
    await page.getByRole('button',{name:'Pause motion'}).click();await page.waitForTimeout(150);
    assert.equal(await page.getByRole('button',{name:'Resume motion'}).getAttribute('aria-pressed'),'true');
    assert.equal(await page.locator('h1').isVisible(),true);
    await page.close();
  }
});
