import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {JSDOM} from 'jsdom';
import test from 'node:test';
import assert from 'node:assert/strict';
import MessageBody from '../src/MessageBody';

test('Markdown preserves rich structure and safe code references',()=>{
 const html=renderToStaticMarkup(<MessageBody onReference={()=>{}} content={'# Overview\n\n## Details\n\n**Strong** and *emphasis* with `src/auth.ts:12`.\n\n> A useful note\n\n1. First\n   - Nested\n2. Second\n\n- [x] Verified\n- [ ] Pending\n\n| Option | Result |\n| --- | --- |\n| Sessions | Works |\n\n[Docs](https://example.com)\n\n```ts\nconst token = "ready";\n```'}/>);
 const document=new JSDOM(html).window.document;
 assert.equal(document.querySelector('h1')?.textContent,'Overview');
 assert.equal(document.querySelector('h2')?.textContent,'Details');
 assert.equal(document.querySelector('strong')?.textContent,'Strong');
 assert.equal(document.querySelector('em')?.textContent,'emphasis');
 assert.equal(document.querySelector('blockquote')?.textContent?.trim(),'A useful note');
 assert.ok(document.querySelector('ol li ul li'));
 assert.equal(document.querySelectorAll('input[type=checkbox]').length,2);
 assert.equal(document.querySelector('tbody td')?.textContent,'Sessions');
 assert.equal(document.querySelector('a')?.getAttribute('rel'),'noopener noreferrer');
 assert.equal(document.querySelector('button[title="Open src/auth.ts:12"]')?.textContent,'src/auth.ts:12');
 assert.equal(document.querySelector('pre code')?.textContent,'const token = "ready";');
});
test('Markdown does not execute HTML or unsafe links',()=>{
 const html=renderToStaticMarkup(<MessageBody content={'<script>alert(1)</script>\n\n[bad](javascript:alert%281%29)\n\n![tracking](https://example.com/pixel.png)'}/>);
 const document=new JSDOM(html).window.document;
 assert.equal(document.querySelector('script'),null);
 assert.equal(document.querySelector('a[href^="javascript:"]'),null);
 assert.equal(document.querySelector('img'),null);
});
