// ds-qa regression reviewer, order 1.22. B6 in the Angular gallery: the
// Arabic form row, a bad email and an empty name, submit; the field errors
// and the summary must be the Arabic copy, never the browser's message.
// Same on React for comparison. Writes recheck.b6.json and a screenshot.
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const out = {};
  for (const [fw, base] of [['angular', 'http://127.0.0.1:4290'], ['react', 'http://127.0.0.1:5190']]) {
    const p = await b.newPage({ viewport: { width: 1024, height: 900 }, locale: 'en-US' });
    await p.goto(`${base}/c/form?style=neutral&scheme=light&chrome=0&case=variants`, { waitUntil: 'networkidle', timeout: 120000 });
    await p.waitForTimeout(800);
    const form = p.locator('[lang="ar"] form').first();
    await form.scrollIntoViewIfNeeded();
    const email = form.locator('input[type="email"]').first();
    await email.fill('abc');
    await form.locator('button[type="submit"], [data-ds="button"]').last().click();
    await p.waitForTimeout(1200);
    out[fw] = await form.evaluate((f) => ({
      errors: [...f.querySelectorAll('[data-part="error"], [data-ds="field-error"]')].map((e) => e.textContent.trim()).filter(Boolean),
      summary: (f.querySelector('[data-part="summary"], [role="alert"]') || {}).textContent?.trim().slice(0, 300) || null,
      browserMsg: [...f.querySelectorAll('input')].map((i) => i.validationMessage).filter(Boolean),
    }));
    await form.screenshot({ path: path.join(__dirname, `recheck.b6.${fw}.arabic-submit.png`) });
    await p.close();
  }
  console.log(JSON.stringify(out, null, 1));
  fs.writeFileSync(path.join(__dirname, 'recheck.b6.json'), JSON.stringify(out, null, 1));
  await b.close();
})();
