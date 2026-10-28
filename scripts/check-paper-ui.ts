import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {paperWorkspace} from '../tests/fixtures/paper-workspace';

const directory=process.env.JOVE_SCREENSHOTS||'/tmp/jove-paper-ui';
await fs.mkdir(directory,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined});
try{
 const page=await browser.newPage({viewport:{width:1536,height:1024},deviceScaleFactor:1});
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/api/**',route=>route.fulfill({json:route.request().url().includes('/api/state')?paperWorkspace:{}}));
 await page.goto(process.env.JOVE_UI_URL||'http://127.0.0.1:5197');
 await page.getByRole('tab',{name:'General',exact:true}).waitFor();
 assert.deepEqual(await page.getByRole('navigation',{name:'Change views'}).getByRole('button').allTextContents(),['Diff','History','Terminal']);
 assert.equal(await page.getByRole('button',{name:'Local account'}).count(),0);
 assert.equal(await page.locator('.window-controls').count(),0);
 await page.getByRole('tab',{name:'Security',exact:true}).click();
 await page.getByLabel('Conversation capabilities').waitFor();
 await page.getByRole('textbox',{name:'Message Security'}).click();
 await page.screenshot({path:`${directory}/empty-chat.png`});
 const layout=await page.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:innerWidth,app:document.querySelector('.app')!.getBoundingClientRect().x}));
 assert.ok(layout.width<=layout.viewport);assert.equal(layout.app,0);assert.deepEqual(errors,[]);
}finally{await browser.close()}
