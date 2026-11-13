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
    remove(key) {
      try {
        localStorage.removeItem(key);
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
  // The site settings live on <html>: the head script applied the saved
  // style, scheme and platform before the first paint. The preview settings
  // of a component page may override the style and the scheme for the
  // previews of that page only; they are not saved.
  const site = {
    style: root.dataset.style || 'neutral',
    schemeChoice: root.dataset.schemeChoice || 'system',
    platform: root.dataset.platformChoice || 'web',
  };
  const preview = { style: null, scheme: null, density: 'default', dir: pageLang === 'ar' ? 'rtl' : 'ltr', lang: pageLang };
  const frames = [];
  const galleryBase = root.dataset.gallery || '';
  const systemDark = matchMedia('(prefers-color-scheme: dark)');

  const siteScheme = () => (site.schemeChoice === 'system' ? (systemDark.matches ? 'dark' : 'light') : site.schemeChoice);
  // What every preview frame and gallery link gets.
  const previewSettings = () => ({
    style: preview.style || site.style,
    scheme: preview.scheme || siteScheme(),
    platform: site.platform,
    density: preview.density,
    dir: preview.dir,
    lang: preview.lang,
  });

  function frameUrl(frame) {
    const base = frame.dataset.src;
    const q = new URLSearchParams({ chrome: '0' });
    if (frame.dataset.case) q.set('case', frame.dataset.case);
    for (const [k, v] of Object.entries(previewSettings())) q.set(k, v);
    if (frame.dataset.fixed) {
      try {
        for (const [k, v] of Object.entries(JSON.parse(frame.dataset.fixed))) q.set(k, v);
      } catch {}
    }
    return `${base}?${q.toString()}`;
  }

  const isGalleryLink = (a) => {
    if (a.hasAttribute('data-open-gallery')) return true;
    if (!galleryBase) return false;
    const raw = a.getAttribute('href') || '';
    return raw === galleryBase || raw.startsWith(`${galleryBase}/`) || raw.startsWith(`${galleryBase}?`);
  };

  // Mark the checked item of a menu and the value its button shows.
  function showValue(setting, value) {
    document.querySelectorAll(`[data-menu-root][data-setting="${setting}"]`).forEach((menu) => {
      menu.querySelectorAll('[role="menuitemradio"]').forEach((item) => item.setAttribute('aria-checked', String(item.dataset.value === value)));
      menu.querySelectorAll('.mv > [data-v]').forEach((v) => v.toggleAttribute('data-current', v.dataset.v === value));
    });
  }

  function applySettings() {
    root.dataset.style = site.style;
    root.dataset.scheme = siteScheme();
    root.dataset.schemeChoice = site.schemeChoice;
    root.dataset.platformChoice = site.platform;
    const p = previewSettings();
    for (const frame of frames) {
      const next = frameUrl(frame);
      if (frame.getAttribute('src') !== next) {
        frame.closest('[data-preview]')?.setAttribute('data-state', 'loading');
        frame.setAttribute('src', next);
      }
    }
    showValue('style', site.style);
    showValue('scheme', site.schemeChoice);
    showValue('lang', pageLang);
    for (const [k, v] of Object.entries(p)) showValue(`axis-${k}`, v);
    // Gallery links open the same view the previews show.
    document.querySelectorAll('a[href]').forEach((a) => {
      if (!isGalleryLink(a)) return;
      const url = new URL(a.href, location.href);
      const q = a.hasAttribute('data-open-gallery') ? new URLSearchParams() : url.searchParams;
      const keys = a.hasAttribute('data-open-gallery') ? Object.keys(p) : ['style', 'scheme', 'platform'];
      for (const k of keys) q.set(k, p[k]);
      url.search = q.toString();
      a.href = url.toString();
    });
  }

  function setSetting(setting, value) {
    if (setting === 'style') {
      site.style = value;
      preview.style = null;
      store.set('ds-docs-style', value);
    } else if (setting === 'scheme') {
      site.schemeChoice = value;
      preview.scheme = null;
      if (value === 'system') store.remove('ds-docs-scheme');
      else store.set('ds-docs-scheme', value);
    } else if (setting === 'axis-platform') {
      site.platform = value;
      store.set('ds-docs-platform', value);
    } else if (setting === 'axis-style') {
      preview.style = value === site.style ? null : value;
    } else if (setting === 'axis-scheme') {
      preview.scheme = value === siteScheme() ? null : value;
    } else if (setting.startsWith('axis-')) {
      preview[setting.slice(5)] = value;
    }
    applySettings();
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
    // Follow the system setting until the person picks a scheme.
    systemDark.addEventListener('change', () => {
      if (site.schemeChoice === 'system') applySettings();
    });
    // Another tab changed a setting: follow it.
    window.addEventListener('storage', (e) => {
      if (e.key === 'ds-docs-style' && e.newValue) site.style = e.newValue;
      else if (e.key === 'ds-docs-scheme') site.schemeChoice = e.newValue || 'system';
      else return;
      applySettings();
    });
  }

  // ------------------------------------------------------------ menus
  // A menu button and its menu (src/components/Menu.astro), as in the WAI
  // ARIA menu button pattern: Enter, Space or Down open on the checked item,
  // Up opens on the last; in the menu Up, Down, Home, End and type ahead
  // move, Enter and Space pick, Escape closes, Tab closes and moves on; a
  // click outside closes. Focus goes back to the button.
  let openMenu = null;
  function setupMenus() {
    document.querySelectorAll('[data-menu-root]').forEach((box) => {
      const btn = box.querySelector('[data-menu-button]');
      const menu = box.querySelector('[role="menu"]');
      if (!btn || !menu) return;
      const items = () => [...menu.querySelectorAll('[role^="menuitem"]')];
      let typed = '';
      let typedAt = 0;

      const focusItem = (item) => {
        if (!item) return;
        items().forEach((i) => {
          i.tabIndex = i === item ? 0 : -1;
          i.toggleAttribute('data-highlighted', i === item);
        });
        item.focus();
      };
      const close = (returnFocus) => {
        if (menu.hidden) return;
        menu.hidden = true;
        btn.setAttribute('aria-expanded', 'false');
        box.removeAttribute('data-open');
        items().forEach((i) => i.removeAttribute('data-highlighted'));
        if (openMenu === close) openMenu = null;
        if (returnFocus) btn.focus();
      };
      const open = (where) => {
        if (openMenu && openMenu !== close) openMenu(false);
        menu.hidden = false;
        btn.setAttribute('aria-expanded', 'true');
        box.setAttribute('data-open', '');
        openMenu = close;
        const list = items();
        const checked = list.find((i) => i.getAttribute('aria-checked') === 'true');
        focusItem(where === 'last' ? list[list.length - 1] : where === 'first' ? list[0] : checked || list[0]);
      };
      const pick = (item) => {
        if (item.tagName === 'A') {
          if (box.dataset.setting === 'lang') store.set('ds-docs-lang', item.dataset.value);
          close(false);
          location.href = item.href;
          return;
        }
        close(true);
        setSetting(box.dataset.setting, item.dataset.value);
        announce(`${menu.getAttribute('aria-label')}: ${item.querySelector('[data-part="text"]')?.textContent ?? ''}`);
      };

      btn.addEventListener('click', () => (menu.hidden ? open() : close(true)));
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          open(e.key === 'ArrowUp' ? 'last' : undefined);
        }
      });
      menu.addEventListener('keydown', (e) => {
        const list = items();
        const i = list.indexOf(document.activeElement);
        if (e.key === 'ArrowDown') focusItem(list[(i + 1) % list.length]);
        else if (e.key === 'ArrowUp') focusItem(list[(i - 1 + list.length) % list.length]);
        else if (e.key === 'Home' || e.key === 'PageUp') focusItem(list[0]);
        else if (e.key === 'End' || e.key === 'PageDown') focusItem(list[list.length - 1]);
        else if (e.key === 'Escape') close(true);
        else if (e.key === 'Enter' || e.key === ' ') {
          if (i >= 0) pick(list[i]);
        } else if (e.key === 'Tab') {
          close(true);
          return;
        } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const now = Date.now();
          typed = now - typedAt > 600 ? e.key.toLowerCase() : typed + e.key.toLowerCase();
          typedAt = now;
          const text = (item) => (item.querySelector('[data-part="text"]')?.textContent || '').trim().toLowerCase();
          const order = [...list.slice(i + (typed.length === 1 ? 1 : 0)), ...list.slice(0, i + (typed.length === 1 ? 1 : 0))];
          const hit = order.find((item) => text(item).startsWith(typed));
          if (hit) focusItem(hit);
        } else return;
        e.preventDefault();
      });
      menu.addEventListener('click', (e) => {
        const item = e.target.closest('[role^="menuitem"]');
        if (!item) return;
        e.preventDefault();
        pick(item);
      });
      menu.addEventListener('pointermove', (e) => {
        const item = e.target.closest('[role^="menuitem"]');
        if (item && item !== document.activeElement) focusItem(item);
      });
      box.addEventListener('focusout', (e) => {
        if (!menu.hidden && e.relatedTarget && !box.contains(e.relatedTarget)) close(false);
      });
    });
    document.addEventListener('pointerdown', (e) => {
      if (!openMenu) return;
      const box = e.target.closest?.('[data-menu-root][data-open]');
      if (!box) openMenu(false);
    });
  }

  // ------------------------------------------------------------ tabs
  function setupTabs(list) {
    const tabs = [...list.querySelectorAll('[role="tab"]')];
    const panelOf = (tab) => document.getElementById(tab.getAttribute('aria-controls'));
    const select = (i, focus) => {
      const indicator = list.querySelector('[data-part="indicator"]');
      tabs.forEach((tab, j) => {
        const on = i === j;
        tab.setAttribute('aria-selected', String(on));
        tab.dataset.state = on ? 'active' : 'inactive';
        if (on && indicator) tab.prepend(indicator);
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
    const span = btn.querySelector('[data-part="label"]');
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
      // A Button of the system, with the copy icon of every style (src/components/Layout.astro).
      const btn = document.getElementById('copy-button')?.content.firstElementChild?.cloneNode(true);
      if (!btn) return;
      btn.dataset.copy = '';
      btn.dataset.done = done;
      btn.querySelector('[data-part="label"]').textContent = label;
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
    // Remember the language of the page the person reads.
    store.set('ds-docs-lang', pageLang);
    setupScheme();
    setupFrames();
    setupMenus();
    applySettings();
    document.querySelectorAll('[data-tabs]').forEach(setupTabs);
    setupCopy();
    setupMenu();
    setupRail();
    setupSearch();
  });
})();
