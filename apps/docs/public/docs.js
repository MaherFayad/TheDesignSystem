// Docs site behavior: the preview axis selects and the code tabs. Plain
// script, no framework. Each part does nothing when its markup is absent.
(() => {
  const ready = (fn) => (document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn());

  function setupPreview(box) {
    const frame = box.querySelector('iframe');
    const form = box.querySelector('form');
    if (!frame || !form) return;
    const base = box.dataset.base;
    const scheme = form.querySelector('[data-axis="scheme"]');
    // Open the preview in the scheme the docs show.
    const docTheme = document.documentElement.dataset.theme;
    if (scheme && (docTheme === 'dark' || docTheme === 'light')) scheme.value = docTheme;
    const update = () => {
      const q = new URLSearchParams({ chrome: '0' });
      for (const select of form.querySelectorAll('select[data-axis]')) q.set(select.dataset.axis, select.value);
      const next = `${base}?${q.toString()}`;
      if (frame.getAttribute('src') !== next) frame.setAttribute('src', next);
    };
    form.addEventListener('change', update);
    update();
  }

  function setupTabs(root, index) {
    const panels = [...root.querySelectorAll(':scope > .ds-tab-panel')];
    if (panels.length === 0) return;
    const list = document.createElement('div');
    list.className = 'ds-tablist';
    list.setAttribute('role', 'tablist');
    const tabs = panels.map((panel, i) => {
      const id = `ds-tabs-${index}-${panel.dataset.tab || i}`;
      panel.id = `${id}-panel`;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', `${id}-tab`);
      panel.tabIndex = 0;
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'ds-tab';
      tab.id = `${id}-tab`;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', panel.id);
      tab.textContent = panel.dataset.label || panel.dataset.tab || String(i + 1);
      list.append(tab);
      return tab;
    });
    const select = (i, focus) => {
      tabs.forEach((tab, j) => {
        const on = i === j;
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
        panels[j].hidden = !on;
      });
      if (focus) tabs[i].focus();
    };
    list.addEventListener('click', (event) => {
      const i = tabs.indexOf(event.target.closest('[role="tab"]'));
      if (i >= 0) select(i, false);
    });
    list.addEventListener('keydown', (event) => {
      const i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      const rtl = getComputedStyle(list).direction === 'rtl';
      const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
      const back = rtl ? 'ArrowRight' : 'ArrowLeft';
      let next = -1;
      if (event.key === forward) next = (i + 1) % tabs.length;
      else if (event.key === back) next = (i - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      if (next < 0) return;
      event.preventDefault();
      select(next, true);
    });
    root.prepend(list);
    root.dataset.ready = '';
    select(0, false);
  }

  ready(() => {
    document.querySelectorAll('[data-ds-preview]').forEach(setupPreview);
    document.querySelectorAll('[data-ds-tabs]').forEach(setupTabs);
    // A table wider than the column scrolls in its own box (Starlight sets
    // overflow on tables). A scrolling region must take keyboard focus.
    const tables = [...document.querySelectorAll('.sl-markdown-content table')];
    const markScroll = () => {
      for (const table of tables) {
        if (table.scrollWidth > table.clientWidth + 1) table.tabIndex = 0;
        else table.removeAttribute('tabindex');
      }
    };
    markScroll();
    window.addEventListener('resize', markScroll);
    // A code block that scrolls must take keyboard focus (WCAG 2.1.1).
    document.querySelectorAll('.ds-code pre').forEach((pre) => {
      if (!pre.hasAttribute('tabindex')) pre.tabIndex = 0;
    });
  });
})();
