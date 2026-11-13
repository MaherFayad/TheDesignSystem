// Docs site behavior. Plain script, no framework. Each part does nothing when
// its markup is absent.
//
// - Scheme switch (light and dark), saved in localStorage.
// - Preview settings: the style in the top bar and the switches above the
//   hero preview drive every gallery iframe on the page.
// - Preview frames: lazy, sized to their content when the gallery is served
//   by the same origin (the site build bundles it under /gallery/).
// - Code tabs, copy controls, the mobile menu, the "on this page" rail.
// - Search: a dialog over an index built at build time (/search/<lang>.json).
(() => {
  const root = document.documentElement;
  const store = {
    get(key) {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, value);
      } catch {}
    },
  };
  const ready = (fn) => (document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn());
  const pageLang = root.lang === 'ar' ? 'ar' : 'en';

  // One polite live region for short confirmations such as "Copied".
  let live;
  const announce = (text) => {
    if (!live) {
      live = document.createElement('p');
      live.className = 'visually-hidden';
      live.setAttribute('role', 'status');
      document.body.append(live);
    }
    live.textContent = '';
    requestAnimationFrame(() => (live.textContent = text));
  };

  // ------------------------------------------------------------ settings
  const settings = {
    style: store.get('ds-docs-style') || 'neutral',
    scheme: root.dataset.scheme === 'dark' ? 'dark' : 'light',
    platform: 'web',
    density: 'default',
    dir: pageLang === 'ar' ? 'rtl' : 'ltr',
    lang: pageLang,
  };
  const frames = [];

  function frameUrl(frame) {
    const base = frame.dataset.src;
    const q = new URLSearchParams({ chrome: '0' });
    if (frame.dataset.case) q.set('case', frame.dataset.case);
    for (const [k, v] of Object.entries(settings)) q.set(k, v);
    if (frame.dataset.fixed) {
      try {
        for (const [k, v] of Object.entries(JSON.parse(frame.dataset.fixed))) q.set(k, v);
      } catch {}
    }
    return `${base}?${q.toString()}`;
  }

  function applySettings() {
    for (const frame of frames) {
      const next = frameUrl(frame);
      if (frame.getAttribute('src') !== next) {
        frame.closest('[data-preview]')?.setAttribute('data-state', 'loading');
        frame.setAttribute('src', next);
      }
    }
    // Keep every control showing the current value.
    document.querySelectorAll('[data-style-select]').forEach((s) => (s.value = settings.style));
    document.querySelectorAll('[data-axis]').forEach((s) => {
      const v = settings[s.dataset.axis];
      if (v !== undefined) s.value = v;
    });
    document.querySelectorAll('[data-open-gallery]').forEach((a) => {
      const url = new URL(a.href, location.href);
      const q = new URLSearchParams();
      for (const [k, v] of Object.entries(settings)) q.set(k, v);
      url.search = q.toString();
      a.href = url.toString();
    });
  }

  // ------------------------------------------------------------ frames
  const HIDE = `[data-gallery='demo-title'],[data-demo='case']>[data-demo='title']{display:none}
html,body,#root,[data-gallery='root']{min-block-size:0;block-size:auto}
[data-gallery='stage']{padding:clamp(16px,3vw,28px)}`;

  function sizeFrame(frame) {
    const box = frame.closest('[data-preview]');
    let doc;
    try {
      doc = frame.contentDocument;
    } catch {
      doc = null;
    }
    if (!doc || !doc.body) {
      box?.setAttribute('data-state', 'ready');
      return;
    }
    if (!doc.getElementById('docs-embed')) {
      const style = doc.createElement('style');
      style.id = 'docs-embed';
      style.textContent = HIDE;
      doc.head.append(style);
    }
    const measure = () => {
      const stage = doc.querySelector("[data-gallery='stage']") || doc.body;
      const h = Math.ceil(stage.getBoundingClientRect().height);
      if (h > 40) frame.style.setProperty('--h', `${Math.min(h, 2400)}px`);
    };
    measure();
    if (!frame._observer && 'ResizeObserver' in window) {
      frame._observer = new ResizeObserver(measure);
    }
    if (frame._observer) {
      frame._observer.disconnect();
      const stage = doc.querySelector("[data-gallery='stage']") || doc.body;
      frame._observer.observe(stage);
    }
    // The demo renders after its lazy chunk loads: measure again shortly.
    setTimeout(measure, 300);
    setTimeout(() => {
      measure();
      box?.setAttribute('data-state', 'ready');
    }, 120);
  }

  function setupFrames() {
    document.querySelectorAll('iframe[data-src]').forEach((frame) => {
      frames.push(frame);
      frame.addEventListener('load', () => sizeFrame(frame));
    });
  }

  // ------------------------------------------------------------ scheme
  function setupScheme() {
    const btn = document.querySelector('[data-scheme-toggle]');
    const label = () => {
      if (!btn) return;
      btn.setAttribute('aria-label', root.dataset.scheme === 'dark' ? btn.dataset.labelLight : btn.dataset.labelDark);
    };
    label();
    btn?.addEventListener('click', () => {
      const next = root.dataset.scheme === 'dark' ? 'light' : 'dark';
      root.dataset.scheme = next;
      store.set('ds-docs-scheme', next);
      settings.scheme = next;
      label();
      applySettings();
    });
  }

  function setupControls() {
    document.querySelectorAll('[data-style-select]').forEach((select) =>
      select.addEventListener('change', () => {
        settings.style = select.value;
        store.set('ds-docs-style', select.value);
        applySettings();
      }),
    );
    document.querySelectorAll('select[data-axis]').forEach((select) =>
      select.addEventListener('change', () => {
        settings[select.dataset.axis] = select.value;
        if (select.dataset.axis === 'style') store.set('ds-docs-style', select.value);
        applySettings();
      }),
    );
  }

  // ------------------------------------------------------------ tabs
  function setupTabs(list) {
    const tabs = [...list.querySelectorAll('[role="tab"]')];
    const panelOf = (tab) => document.getElementById(tab.getAttribute('aria-controls'));
    const select = (i, focus) => {
      tabs.forEach((tab, j) => {
        const on = i === j;
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
        const panel = panelOf(tab);
        if (panel) panel.hidden = !on;
      });
      if (focus) tabs[i].focus();
    };
    list.addEventListener('click', (e) => {
      const i = tabs.indexOf(e.target.closest('[role="tab"]'));
      if (i >= 0) select(i, false);
    });
    list.addEventListener('keydown', (e) => {
      const i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      const rtl = getComputedStyle(list).direction === 'rtl';
      const fwd = rtl ? 'ArrowLeft' : 'ArrowRight';
      const back = rtl ? 'ArrowRight' : 'ArrowLeft';
      let next = -1;
      if (e.key === fwd) next = (i + 1) % tabs.length;
      else if (e.key === back) next = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabs.length - 1;
      if (next < 0) return;
      e.preventDefault();
      select(next, true);
    });
  }

  // ------------------------------------------------------------ copy
  async function copyText(text, btn) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      document.body.append(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
    const span = btn.querySelector('span');
    const done = btn.dataset.done || 'Copied';
    announce(done);
    if (span) {
      const before = span.textContent;
      span.textContent = done;
      setTimeout(() => (span.textContent = before), 1600);
    }
  }

  function setupCopy() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-copy], [data-copy-panel]');
      if (!btn) return;
      let pre;
      if (btn.hasAttribute('data-copy-panel')) {
        const box = btn.closest('[data-preview]');
        pre = box && [...box.querySelectorAll('[role="tabpanel"]')].find((p) => !p.hidden)?.querySelector('pre');
      } else pre = btn.closest('.code-block')?.querySelector('pre');
      if (pre) copyText(pre.innerText.replace(/\n$/, ''), btn);
    });
    // A copy control on every code block of the hand written pages.
    const label = pageLang === 'ar' ? 'نسخ الشيفرة' : 'Copy code';
    const done = pageLang === 'ar' ? 'تم النسخ' : 'Copied';
    document.querySelectorAll('.prose pre.astro-code').forEach((pre) => {
      if (pre.parentElement?.classList.contains('code-block')) return;
      const wrap = document.createElement('div');
      wrap.className = 'code-block';
      pre.replaceWith(wrap);
      wrap.append(pre);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'copy-btn';
      btn.dataset.copy = '';
      btn.dataset.done = done;
      btn.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg><span></span>';
      btn.querySelector('span').textContent = label;
      wrap.append(btn);
    });
    // Tables of the hand written pages scroll in their own focusable box.
    document.querySelectorAll('.prose table').forEach((table, i) => {
      if (table.parentElement?.classList.contains('table-wrap')) return;
      const wrap = document.createElement('div');
      wrap.className = 'table-wrap';
      wrap.tabIndex = 0;
      wrap.setAttribute('role', 'region');
      const heading = table.previousElementSibling?.closest('h2, h3') || [...document.querySelectorAll('.prose h2, .prose h3')].filter((h) => h.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING).pop();
      wrap.setAttribute('aria-label', heading?.textContent?.trim() || `Table ${i + 1}`);
      table.replaceWith(wrap);
      wrap.append(table);
    });
  }

  // ------------------------------------------------------------ menu
  function setupMenu() {
    const btn = document.querySelector('[data-menu]');
    const nav = document.getElementById('sidebar');
    if (!btn || !nav) return;
    const set = (open) => {
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? btn.dataset.labelClose : btn.dataset.labelOpen);
      if (open) nav.setAttribute('data-open', '');
      else nav.removeAttribute('data-open');
    };
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      set(open);
      if (open) (nav.querySelector('[aria-current="page"]') || nav.querySelector('a'))?.focus();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.hasAttribute('data-open')) {
        set(false);
        btn.focus();
      }
    });
    document.addEventListener('click', (e) => {
      if (nav.hasAttribute('data-open') && !nav.contains(e.target) && !btn.contains(e.target)) set(false);
    });
    // Bring the current page into view in the sidebar.
    const current = nav.querySelector('[aria-current="page"]');
    if (current) nav.scrollTop = Math.max(0, current.offsetTop - nav.clientHeight / 2);
  }

  // ------------------------------------------------------------ rail
  function setupRail() {
    const links = [...document.querySelectorAll('[data-rail-link]')];
    if (links.length === 0 || !('IntersectionObserver' in window)) return;
    const byId = new Map(links.map((a) => [decodeURIComponent(a.hash.slice(1)), a]));
    const targets = [...byId.keys()].map((id) => document.getElementById(id)).filter(Boolean);
    const visible = new Set();
    const pick = () => {
      const first = targets.find((t) => visible.has(t));
      if (!first) return;
      links.forEach((a) => a.removeAttribute('aria-current'));
      byId.get(first.id)?.setAttribute('aria-current', 'true');
    };
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target);
          else visible.delete(e.target);
        }
        pick();
      },
      { rootMargin: '-64px 0px -60% 0px' },
    );
    targets.forEach((t) => io.observe(t));
  }

  // ------------------------------------------------------------ search
  const normalize = (s) =>
    s
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[ً-ٰٟـ]/g, '')
      .replace(/[آأإ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/[̀-ͯ]/g, '');

  function setupSearch() {
    const dialog = document.querySelector('[data-search]');
    if (!dialog) return;
    const input = dialog.querySelector('[data-search-input]');
    const list = dialog.querySelector('#search-list');
    const status = dialog.querySelector('[data-search-status]');
    let index = null;
    let results = [];
    let active = -1;
    let opener = null;

    const load = async () => {
      if (index) return index;
      const res = await fetch(dialog.dataset.index);
      const raw = await res.json();
      index = raw.map((e) => ({ ...e, nt: normalize(e.t), ns: normalize(e.s), nk: normalize(`${e.g} ${e.k}`) }));
      return index;
    };

    const score = (e, words) => {
      let total = 0;
      for (const w of words) {
        let s = 0;
        if (e.nt === w) s = 100;
        else if (e.nt.startsWith(w)) s = 60;
        else if (e.nt.includes(w)) s = 40;
        else if (e.ns.includes(w)) s = 12;
        else if (e.nk.includes(w)) s = 6;
        if (s === 0) return 0;
        total += s;
      }
      return total;
    };

    const setActive = (i) => {
      const items = [...list.children];
      items.forEach((li, j) => li.setAttribute('aria-selected', String(i === j)));
      active = i;
      if (i >= 0 && items[i]) {
        input.setAttribute('aria-activedescendant', items[i].id);
        items[i].scrollIntoView({ block: 'nearest' });
      } else input.removeAttribute('aria-activedescendant');
    };

    const render = () => {
      const q = normalize(input.value.trim());
      list.textContent = '';
      if (!q || !index) {
        results = [];
        status.textContent = '';
        input.setAttribute('aria-expanded', 'false');
        setActive(-1);
        return;
      }
      const words = q.split(/\s+/).filter(Boolean);
      results = index
        .map((e) => ({ e, s: score(e, words) }))
        .filter((r) => r.s > 0)
        .sort((a, b) => b.s - a.s || a.e.t.localeCompare(b.e.t))
        .slice(0, 20)
        .map((r) => r.e);
      results.forEach((e, i) => {
        const li = document.createElement('li');
        li.id = `search-opt-${i}`;
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', 'false');
        li.dataset.href = e.u;
        const title = document.createElement('span');
        title.className = 'r-title';
        title.textContent = e.t;
        if (/^[\x00-\x7F]+$/.test(e.t) && pageLang === 'ar') title.lang = 'en';
        const group = document.createElement('span');
        group.className = 'r-group';
        group.textContent = e.g;
        const text = document.createElement('span');
        text.className = 'r-text';
        text.textContent = e.s;
        if (/^[\x00-\x7F]+$/.test(e.s) && pageLang === 'ar') {
          text.lang = 'en';
          text.dir = 'ltr';
        }
        li.append(title, group, text);
        list.append(li);
      });
      input.setAttribute('aria-expanded', String(results.length > 0));
      status.textContent = results.length > 0 ? dialog.dataset.countLabel.replace(/0/, String(results.length)) : dialog.dataset.empty;
      setActive(results.length > 0 ? 0 : -1);
    };

    const go = (i) => {
      const li = list.children[i];
      if (li?.dataset.href) location.href = li.dataset.href;
    };

    const open = async () => {
      if (dialog.open) return;
      opener = document.activeElement;
      dialog.showModal();
      input.focus();
      try {
        await load();
        render();
      } catch {
        status.textContent = dialog.dataset.empty;
      }
    };
    const close = () => {
      dialog.close();
    };
    dialog.addEventListener('close', () => opener?.focus?.());

    document.querySelectorAll('[data-search-open]').forEach((b) => b.addEventListener('click', open));
    dialog.querySelector('[data-search-close]')?.addEventListener('click', close);
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) close();
    });
    input.addEventListener('input', render);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (results.length) setActive((active + 1) % results.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (results.length) setActive((active - 1 + results.length) % results.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (active >= 0) go(active);
      }
    });
    list.addEventListener('click', (e) => {
      const li = e.target.closest('[role="option"]');
      if (li) go([...list.children].indexOf(li));
    });
    document.addEventListener('keydown', (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '') || document.activeElement?.isContentEditable;
      if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        open();
      } else if (e.key === '/' && !typing && !dialog.open) {
        e.preventDefault();
        open();
      }
    });
  }

  ready(() => {
    setupScheme();
    setupFrames();
    setupControls();
    applySettings();
    document.querySelectorAll('[data-tabs]').forEach(setupTabs);
    setupCopy();
    setupMenu();
    setupRail();
    setupSearch();
  });
})();
