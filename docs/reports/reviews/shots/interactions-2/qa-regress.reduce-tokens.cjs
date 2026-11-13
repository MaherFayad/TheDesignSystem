// ds-qa regression reviewer, order 1.22. Computed duration tokens under
// emulated prefers-reduced-motion, per style and scheme. Writes recheck.reduce-tokens.json.
const { chromium } = require('@playwright/test');
(async()=>{const b=await chromium.launch();const out={};
for (const style of ['studio','desk','neutral']) for (const scheme of ['light','dark']) {
const ctx=await b.newContext({reducedMotion:'reduce'});const p=await ctx.newPage();
await p.goto(`http://127.0.0.1:5190/c/checkbox?style=${style}&scheme=${scheme}&chrome=0`,{waitUntil:'networkidle'});await p.waitForSelector('[data-ds=checkbox]',{timeout:60000});
out[style+'-'+scheme]=await p.evaluate(()=>{const el=document.querySelector('[data-ds=checkbox]');const cs=getComputedStyle(el);const o={};for(const k of ['base','fast','spring-bouncy','spring-snappy','spring-soft','morph','celebrate'])o[k]=cs.getPropertyValue('--ds-duration-'+k).trim();o.stagger=cs.getPropertyValue('--ds-delay-stagger').trim();o.mq=matchMedia('(prefers-reduced-motion: reduce)').matches;return o});
await ctx.close();}
require('fs').writeFileSync(__dirname+'/recheck.reduce-tokens.json',JSON.stringify(out,null,1));console.log(JSON.stringify(out));await b.close();})();
