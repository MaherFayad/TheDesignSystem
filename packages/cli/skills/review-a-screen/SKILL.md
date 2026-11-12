---
name: review-a-screen
description: Review one screen of an app on The system against its rules. Runs ds doctor and axe in English and Arabic, dark and light, and reports findings with file and line. Use when asked to review, audit or check a screen, a page or a pull request that changes UI.
---

# Review a screen

Read `AGENTS.md` in the app first: it holds the rules this review checks.
Report findings; do not fix them unless asked.

## 1. Static check: ds doctor

```sh
npx ds doctor <path of the screen or src> --json
```

The answer is `{ apiVersion: 1, type: "doctor.report", data: { findings, summary } }`.
Each finding has `ruleId`, `severity`, `file`, `line`, `column`, `message` and
sometimes `fix`. Exit code 1 means at least one error. List every error; group
warnings by rule.

## 2. Accessibility: axe in four themes

Start the app (`npm run dev`), then run axe on the screen URL with Playwright
and `@axe-core/playwright` (dev dependencies). Check English and Arabic, dark
and light, because contrast and direction change with the theme:

```js
// review-axe.mjs: node review-axe.mjs http://localhost:5173/<screen>
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';

const url = process.argv[2];
const browser = await chromium.launch();
let failed = 0;
for (const lang of ['en', 'ar']) {
  for (const scheme of ['dark', 'light']) {
    const page = await browser.newPage();
    await page.goto(url);
    // Set the axes the way the app does; this sets them on <html> and the root theme.
    await page.evaluate(([lang, scheme]) => {
      for (const el of document.querySelectorAll('html, [data-style]')) {
        el.setAttribute('lang', lang);
        el.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
        el.setAttribute('data-scheme', scheme);
      }
    }, [lang, scheme]);
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    for (const v of violations) {
      failed++;
      console.log(`${lang} ${scheme} ${v.id} (${v.impact}): ${v.help}`);
      for (const n of v.nodes) console.log(`  ${n.target.join(' ')}`);
    }
    await page.close();
  }
}
await browser.close();
process.exit(failed ? 1 : 0);
```

If the app has its own switch for language and scheme (a URL parameter, a
cookie), use that instead of setting attributes.

## 3. Read the screen

Check by eye and by keyboard what tools cannot:

- every state is handled: empty, loading, error, long text, long Arabic text;
- Tab reaches every control in reading order, in LTR and RTL; Escape closes
  overlays; the focus ring shows;
- targets are at least 24 by 24 px (44 px in touch layouts);
- copy: sentence case, buttons a verb plus a noun, no "OK", "Continue",
  "Confirm" or "Yes", no em or en dash; Arabic in one register, no diacritics;
- a component used where `npx ds docs <Name>` says "do not use when".

## 4. Report

One list, most severe first. Each finding: file and line (or the axe target),
the rule (`ds/<rule>`, the axe id, or the WCAG 2.2 criterion), what is wrong,
and the fix. End with the counts: doctor errors, doctor warnings, axe
violations per theme.
