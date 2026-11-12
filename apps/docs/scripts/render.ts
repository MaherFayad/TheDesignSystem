// Renders one manifest as a docs page. Two outputs from one model:
// - "site": Markdown for Starlight, with the live preview and the code tabs
//   as small HTML blocks.
// - "twin": plain Markdown with no HTML, served next to the page as
//   <page>.md and joined into llms-full.txt.
// English and Arabic share the model. Manifest prose has no Arabic field yet,
// so on Arabic pages it stays English inside a left to right isolate.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { frameworkIds, repoRoot, sectionOf, slugOf, type FrameworkId, type Manifest, type Prop } from './manifests.ts';

export type Lang = 'en' | 'ar';
export type Mode = 'site' | 'twin';

/** The page chrome in both languages. Arabic: Gulf modern standard, noun forms, no diacritics. */
export const chrome = {
  en: {
    preview: 'Preview',
    previewNote: 'The preview is the React gallery page of this component. It needs the gallery running at',
    previewSettings: 'Preview settings',
    previewOf: (name: string) => `${name} preview`,
    useWhen: 'Use when',
    avoidWhen: 'Do not use when',
    insteadUse: 'Use instead',
    situation: 'Situation',
    use: 'Use',
    anatomy: 'Anatomy and variants',
    parts: 'Parts',
    partsLead: 'Each part is a data-part value on the rendered element. The first part is the root.',
    subComponents: 'Sub components',
    component: 'Component',
    part: 'Part',
    slots: 'Slots',
    slot: 'Slot',
    accepts: 'Accepts',
    count: 'Count',
    props: 'Props',
    prop: 'Prop',
    values: 'Values',
    default: 'Default',
    description: 'Description',
    required: 'required',
    states: 'States',
    contentRules: 'Content rules',
    contentEn: 'English',
    contentAr: 'Arabic',
    a11y: 'Accessibility',
    role: 'Role',
    focus: 'Focus',
    keys: 'Keyboard',
    key: 'Key',
    action: 'Action',
    announce: 'Announced',
    notes: 'Notes',
    mistakes: 'Common mistakes',
    wrong: 'Wrong',
    right: 'Right',
    styles: 'Styles',
    style: 'Style',
    note: 'Note',
    motion: 'Motion pattern',
    tokens: 'Tokens',
    tokensLead: (n: number) => `The component reads ${n} tokens.`,
    code: 'Code',
    codeLead: 'The demo file of each framework, with its status.',
    status: 'Status',
    behavior: 'Behavior',
    example: 'Example file',
    noExample: 'No example file is listed in the manifest.',
    planned: 'Planned. No code yet.',
    notApplicable: 'Not applicable to this framework.',
    statusWord: { ready: 'Ready', planned: 'Planned', 'not-applicable': 'Not applicable' },
    since: 'Since',
    family: 'Family',
    englishNote: '',
    twinOf: 'Markdown twin of',
    min: 'at least',
    max: 'at most',
    any: 'any',
    text: 'text',
    axes: {
      style: 'Style',
      scheme: 'Scheme',
      density: 'Density',
      dir: 'Direction',
      lang: 'Language',
    },
    axisValues: {
      dark: 'Dark',
      light: 'Light',
      compact: 'Compact',
      default: 'Default',
      comfortable: 'Comfortable',
      ltr: 'Left to right',
      rtl: 'Right to left',
      en: 'English',
      ar: 'Arabic',
    } as Record<string, string>,
    indexTitle: 'Components',
    indexLead: (n: number) => `${n} components. Each page is generated from the component manifest.`,
  },
  ar: {
    preview: 'المعاينة',
    previewNote: 'المعاينة هي صفحة المكون في معرض React، وتتطلب تشغيل المعرض على العنوان',
    previewSettings: 'إعدادات المعاينة',
    previewOf: (name: string) => `معاينة ${name}`,
    useWhen: 'حالات الاستخدام',
    avoidWhen: 'حالات عدم الاستخدام',
    insteadUse: 'البدائل',
    situation: 'الحالة',
    use: 'البديل',
    anatomy: 'البنية والخيارات',
    parts: 'الأجزاء',
    partsLead: 'كل جزء قيمة للسمة data-part على العنصر، وأول جزء هو الجذر.',
    subComponents: 'المكونات الفرعية',
    component: 'المكون',
    part: 'الجزء',
    slots: 'المنافذ',
    slot: 'المنفذ',
    accepts: 'المحتوى المقبول',
    count: 'العدد',
    props: 'الخصائص',
    prop: 'الخاصية',
    values: 'القيم',
    default: 'القيمة الافتراضية',
    description: 'الوصف',
    required: 'إلزامية',
    states: 'الحالات',
    contentRules: 'قواعد المحتوى',
    contentEn: 'الإنجليزية',
    contentAr: 'العربية',
    a11y: 'إمكانية الوصول',
    role: 'الدور',
    focus: 'التركيز',
    keys: 'لوحة المفاتيح',
    key: 'المفتاح',
    action: 'الإجراء',
    announce: 'إعلان قارئ الشاشة',
    notes: 'ملاحظات',
    mistakes: 'أخطاء شائعة',
    wrong: 'الخطأ',
    right: 'الصواب',
    styles: 'الأنماط',
    style: 'النمط',
    note: 'الملاحظة',
    motion: 'نمط الحركة',
    tokens: 'الرموز التصميمية',
    tokensLead: (n: number) => `عدد الرموز التصميمية التي يقرؤها المكون: ${n}.`,
    code: 'الشيفرة',
    codeLead: 'ملف العرض لكل إطار عمل مع حالته.',
    status: 'الحالة',
    behavior: 'السلوك',
    example: 'ملف المثال',
    noExample: 'لا يحدد ملف التعريف ملف مثال.',
    planned: 'ضمن الخطة، ولا توجد شيفرة بعد.',
    notApplicable: 'لا ينطبق على إطار العمل هذا.',
    statusWord: { ready: 'جاهز', planned: 'ضمن الخطة', 'not-applicable': 'لا ينطبق' },
    since: 'منذ الإصدار',
    family: 'الفئة',
    englishNote: 'يظهر وصف المكون بالإنجليزية إلى حين توفر ترجمته العربية.',
    twinOf: 'نسخة Markdown من',
    min: 'الحد الأدنى',
    max: 'الحد الأقصى',
    any: 'أي محتوى',
    text: 'نص',
    axes: {
      style: 'النمط',
      scheme: 'المظهر',
      density: 'الكثافة',
      dir: 'الاتجاه',
      lang: 'اللغة',
    },
    axisValues: {
      dark: 'داكن',
      light: 'فاتح',
      compact: 'مضغوط',
      default: 'افتراضي',
      comfortable: 'مريح',
      ltr: 'من اليسار إلى اليمين',
      rtl: 'من اليمين إلى اليسار',
      en: 'الإنجليزية',
      ar: 'العربية',
    } as Record<string, string>,
    indexTitle: 'المكونات',
    indexLead: (n: number) => `عدد المكونات: ${n}. تنشأ كل صفحة من ملف تعريف المكون.`,
  },
} as const;

export const frameworkNames: Record<FrameworkId, string> = { react: 'React', angular: 'Angular', native: 'React Native' };

/** Style ids offered in the preview: every packages/styles/<id>/style.json, so a new style needs no change here. */
export function styleIdsOnDisk(): string[] {
  const dir = join(repoRoot, 'packages', 'styles');
  const ids = existsSync(dir) ? readdirSync(dir).filter((id) => existsSync(join(dir, id, 'style.json'))) : [];
  // Neutral first: the gallery and the docs open on it.
  return ids.sort((a, b) => (a === 'neutral' ? -1 : b === 'neutral' ? 1 : a.localeCompare(b, 'en')));
}

// ---------------------------------------------------------------- escaping

const HTML_ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };

export function html(text: string): string {
  return text.replace(/[&<>"]/g, (c) => HTML_ESC[c] ?? c);
}

/** One line of manifest prose as inline Markdown. Backtick spans stay code; everything else is escaped. */
export function inline(text: string): string {
  const flat = text.replace(/\s*\n\s*/g, ' ');
  const parts = flat.split(/(`[^`]+`)/g);
  return parts
    .map((part) => {
      if (/^`[^`]+`$/.test(part)) return part;
      return part
        .replace(/\\/g, '\\\\')
        .replace(/[*_[\]|#`]/g, (c) => `\\${c}`)
        .replace(/[&<>]/g, (c) => HTML_ESC[c] ?? c);
    })
    .join('')
    .replace(/^(\d+)([.)])(\s)/, '$1\\$2$3')
    .replace(/^([-+])(\s)/, '\\$1$2');
}

function code(text: string): string {
  const clean = text.replace(/\s*\n\s*/g, ' ');
  if (!clean.includes('`')) return `\`${clean}\``;
  return `\`\` ${clean} \`\``;
}

function cell(text: string): string {
  return inline(text);
}

// ---------------------------------------------------------------- builders

interface Ctx {
  lang: Lang;
  mode: Mode;
  t: (typeof chrome)[Lang];
}

/** English manifest prose. On Arabic site pages it sits in a left to right block, a bidi isolate. */
function enBlock(ctx: Ctx, body: string): string {
  if (ctx.lang === 'ar' && ctx.mode === 'site') return `<div dir="ltr" lang="en" class="ds-en">\n\n${body}\n\n</div>`;
  return body;
}

/** English text inside an Arabic table cell, as an inline isolate. */
function enCell(ctx: Ctx, text: string): string {
  const md = cell(text);
  if (ctx.lang === 'ar' && ctx.mode === 'site') return `<span dir="ltr" lang="en">${md}</span>`;
  return md;
}

function list(items: string[]): string {
  return items.map((i) => `- ${inline(i)}`).join('\n');
}

function table(head: string[], rows: string[][]): string {
  const out = [`| ${head.join(' | ')} |`, `| ${head.map(() => '---').join(' | ')} |`];
  for (const r of rows) out.push(`| ${r.join(' | ')} |`);
  return out.join('\n');
}

function valuesOf(p: Prop): string {
  if (Array.isArray(p.type)) return p.type.map((v) => code(v)).join(', ');
  if (typeof p.type === 'string') return code(p.type);
  return '';
}

function defaultOf(p: Prop): string {
  if (p.default === undefined) return '';
  const v = typeof p.default === 'string' ? p.default : JSON.stringify(p.default);
  return code(v);
}

function acceptsOf(ctx: Ctx, accepts: string | string[] | undefined): string {
  if (accepts === undefined) return '';
  if (Array.isArray(accepts)) return accepts.map((a) => code(a)).join(', ');
  if (accepts === 'any') return ctx.t.any;
  if (accepts === 'text') return ctx.t.text;
  return code(accepts);
}

function countOf(ctx: Ctx, s: { min?: number; max?: number }): string {
  const bits: string[] = [];
  if (s.min !== undefined) bits.push(`${ctx.t.min} ${s.min}`);
  if (s.max !== undefined) bits.push(`${ctx.t.max} ${s.max}`);
  return bits.join(ctx.lang === 'ar' ? '، ' : ', ');
}

/** Where a framework keeps its component folders, in search order. */
function exampleCandidates(fw: FrameworkId, m: Manifest, file: string): string[] {
  const slug = slugOf(m.name);
  const pkgs: Record<FrameworkId, string[]> = {
    react: ['react', 'charts-react', 'ai-react'],
    angular: ['angular', 'charts-angular', 'ai-angular'],
    native: ['native', 'charts-native', 'ai-native'],
  };
  const folder = fw === 'angular' ? slug : m.name;
  return pkgs[fw].map((p) => join(repoRoot, 'packages', p, 'src', 'components', folder, file));
}

export function exampleSource(fw: FrameworkId, m: Manifest): { file: string; source: string } | undefined {
  const f = m.frameworks[fw];
  if (!f || f.status !== 'ready') return undefined;
  const fallback = fw === 'angular' ? `${slugOf(m.name)}.demo.ts` : `${m.name}.demo.tsx`;
  for (const file of [f.example, fallback]) {
    if (!file) continue;
    for (const path of exampleCandidates(fw, m, file)) {
      if (existsSync(path)) return { file, source: readFileSync(path, 'utf8') };
    }
  }
  return undefined;
}

function fence(source: string, lang: string, title: string): string {
  let ticks = '```';
  while (source.includes(ticks)) ticks += '`';
  return `${ticks}${lang} title="${title.replace(/"/g, '')}"\n${source.replace(/\s+$/, '')}\n${ticks}`;
}

export interface PreviewConfig {
  galleryUrl: string;
  styles: string[];
  /** Every manifest name to its page path without a language prefix, for example Button to components/button. */
  pages: Map<string, string>;
}

/** A use instead value that is exactly a manifest name becomes a link to that page. */
function insteadCell(ctx: Ctx, value: string, p: PreviewConfig): string {
  const path = p.pages.get(value.trim());
  if (!path) return enCell(ctx, value);
  const prefix = ctx.lang === 'ar' ? '/ar' : '';
  const href = ctx.mode === 'site' ? `${prefix}/${path}/` : `${prefix}/${path}.md`;
  const link = `[${value.trim()}](${href})`;
  return ctx.lang === 'ar' && ctx.mode === 'site' ? `<span dir="ltr" lang="en">${link}</span>` : link;
}

function previewBlock(ctx: Ctx, m: Manifest, p: PreviewConfig): string {
  const slug = slugOf(m.name);
  const base = `${p.galleryUrl.replace(/\/+$/, '')}/c/${slug}`;
  const dir = ctx.lang === 'ar' ? 'rtl' : 'ltr';
  const axes: { key: keyof typeof ctx.t.axes; values: string[]; value: string }[] = [
    { key: 'style', values: p.styles, value: p.styles.includes('neutral') ? 'neutral' : (p.styles[0] ?? 'neutral') },
    { key: 'scheme', values: ['dark', 'light'], value: 'dark' },
    { key: 'density', values: ['compact', 'default', 'comfortable'], value: 'default' },
    { key: 'dir', values: ['ltr', 'rtl'], value: dir },
    { key: 'lang', values: ['en', 'ar'], value: ctx.lang },
  ];
  if (ctx.mode === 'twin') {
    const q = new URLSearchParams({ chrome: '0', ...Object.fromEntries(axes.map((a) => [a.key, a.value])) });
    return `${ctx.t.preview}: <${base}?${q.toString()}>`;
  }
  const id = `ds-preview-${slug}`;
  const selects = axes
    .map((a) => {
      const options = a.values
        .map((v) => `<option value="${html(v)}"${v === a.value ? ' selected' : ''}>${html(ctx.t.axisValues[v] ?? v)}</option>`)
        .join('');
      return `<label class="ds-axis"><span>${html(ctx.t.axes[a.key])}</span><select name="${a.key}" data-axis="${a.key}">${options}</select></label>`;
    })
    .join('');
  const q = new URLSearchParams({ chrome: '0', ...Object.fromEntries(axes.map((a) => [a.key, a.value])) });
  return [
    `<div class="ds-preview not-content" data-ds-preview data-base="${html(base)}">`,
    `<form class="ds-axes" aria-label="${html(ctx.t.previewSettings)}" aria-controls="${id}">${selects}</form>`,
    `<iframe id="${id}" class="ds-frame" src="${html(`${base}?${q.toString()}`)}" aria-label="${html(ctx.t.previewOf(m.name))}" loading="lazy"></iframe>`,
    `<p class="ds-preview-note">${html(ctx.t.previewNote)} <span dir="ltr">${html(p.galleryUrl)}</span>.</p>`,
    `</div>`,
  ].join('\n');
}

function codeSection(ctx: Ctx, m: Manifest): string {
  const out: string[] = [];
  const tabbed = ctx.mode === 'site';
  if (tabbed) out.push(`<div class="ds-tabs" data-ds-tabs>`);
  for (const fw of frameworkIds) {
    const f = m.frameworks[fw];
    if (!f) continue;
    const name = frameworkNames[fw];
    const panel: string[] = [];
    panel.push(`### ${name}`);
    const meta: string[] = [`- ${ctx.t.status}: ${ctx.t.statusWord[f.status]}`];
    if (f.behavior) meta.push(`- ${ctx.t.behavior}: ${enCell(ctx, f.behavior)}`);
    if (f.example && f.status === 'ready') meta.push(`- ${ctx.t.example}: ${code(f.example)}`);
    panel.push(meta.join('\n'));
    if (f.note) panel.push(enBlock(ctx, inline(f.note)));
    if (f.status === 'planned') panel.push(ctx.t.planned);
    else if (f.status === 'not-applicable') panel.push(ctx.t.notApplicable);
    else {
      const ex = exampleSource(fw, m);
      if (ex) {
        const lang = ex.file.endsWith('.tsx') ? 'tsx' : 'ts';
        // Code is always left to right, Arabic pages included.
        const block = fence(ex.source, lang, ex.file);
        panel.push(tabbed ? `<div dir="ltr" class="ds-code">\n\n${block}\n\n</div>` : block);
      } else panel.push(ctx.t.noExample);
    }
    if (tabbed) out.push(`<section class="ds-tab-panel" data-tab="${fw}" data-label="${html(name)}">\n\n${panel.join('\n\n')}\n\n</section>`);
    else out.push(panel.join('\n\n'));
  }
  if (tabbed) out.push(`</div>`);
  return out.join('\n\n');
}

function frontmatter(fields: Record<string, unknown>): string {
  const lines = ['---'];
  for (const [k, v] of Object.entries(fields)) {
    lines.push(`${k}: ${typeof v === 'string' ? JSON.stringify(v) : JSON.stringify(v)}`);
  }
  lines.push('---');
  return lines.join('\n');
}

/** One page for one manifest. */
export function renderManifest(m: Manifest, lang: Lang, mode: Mode, preview: PreviewConfig): string {
  const ctx: Ctx = { lang, mode, t: chrome[lang] };
  const t = ctx.t;
  const s: string[] = [];

  if (mode === 'site') {
    s.push(
      frontmatter({
        title: m.name,
        description: m.summary.replace(/\s+/g, ' '),
        tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 2 },
      }),
    );
  } else {
    s.push(`# ${m.name}`);
  }

  if (lang === 'ar') s.push(`> ${t.englishNote}`);
  s.push(enBlock(ctx, inline(m.summary)));

  // The gallery has a route only for a React component folder with a demo.
  if (exampleSource('react', m)?.file.endsWith('.demo.tsx')) {
    s.push(`## ${t.preview}`);
    s.push(previewBlock(ctx, m, preview));
  }

  s.push(`## ${t.useWhen}`);
  s.push(enBlock(ctx, list(m.useWhen)));

  s.push(`## ${t.avoidWhen}`);
  s.push(enBlock(ctx, list(m.avoidWhen)));

  s.push(`## ${t.insteadUse}`);
  s.push(
    table(
      [t.situation, t.use],
      Object.entries(m.insteadUse).map(([k, v]) => [enCell(ctx, k), insteadCell(ctx, v, preview)]),
    ),
  );

  s.push(`## ${t.anatomy}`);
  if (m.anatomy && m.anatomy.length > 0) {
    s.push(`### ${t.parts}`);
    s.push(t.partsLead);
    s.push(m.anatomy.map((p) => code(p)).join(', '));
  }
  if (m.parts && Object.keys(m.parts).length > 0) {
    s.push(`### ${t.subComponents}`);
    s.push(table([t.component, t.part], Object.entries(m.parts).map(([k, v]) => [code(k), code(v)])));
  }
  if (m.slots && Object.keys(m.slots).length > 0) {
    s.push(`### ${t.slots}`);
    s.push(
      table(
        [t.slot, t.accepts, t.count],
        Object.entries(m.slots).map(([k, v]) => [code(k), acceptsOf(ctx, v.accepts), countOf(ctx, v)]),
      ),
    );
  }
  if (m.props && Object.keys(m.props).length > 0) {
    s.push(`### ${t.props}`);
    s.push(
      table(
        [t.prop, t.values, t.default, t.description],
        Object.entries(m.props).map(([k, raw]) => {
          const p: Prop = typeof raw === 'string' ? { description: raw } : raw;
          const name = p.required ? `${code(k)} (${t.required})` : code(k);
          return [name, valuesOf(p), defaultOf(p), p.description ? enCell(ctx, p.description) : ''];
        }),
      ),
    );
  }
  if (m.states && m.states.length > 0) {
    s.push(`### ${t.states}`);
    s.push(m.states.map((x) => code(x)).join(', '));
  }

  if (m.content && Object.keys(m.content).length > 0) {
    s.push(`## ${t.contentRules}`);
    for (const [l, rules] of Object.entries(m.content)) {
      const label = l === 'en' ? t.contentEn : l === 'ar' ? t.contentAr : code(l);
      s.push(`### ${label}`);
      s.push(enBlock(ctx, Object.entries(rules).map(([k, v]) => `- ${code(k)}: ${inline(v)}`).join('\n')));
    }
  }

  if (m.a11y) {
    s.push(`## ${t.a11y}`);
    const a = m.a11y;
    const facts: string[] = [];
    if (a.role) facts.push(`- ${t.role}: ${enCell(ctx, a.role)}`);
    if (a.focus) facts.push(`- ${t.focus}: ${enCell(ctx, a.focus)}`);
    if (a.announce) facts.push(`- ${t.announce}: ${enCell(ctx, a.announce)}`);
    if (facts.length > 0) s.push(facts.join('\n'));
    if (a.keys && Object.keys(a.keys).length > 0) {
      s.push(`### ${t.keys}`);
      s.push(table([t.key, t.action], Object.entries(a.keys).map(([k, v]) => [code(k), enCell(ctx, v)])));
    }
    if (a.notes && a.notes.length > 0) {
      s.push(`### ${t.notes}`);
      s.push(enBlock(ctx, list(a.notes)));
    }
  }

  if (m.mistakes && m.mistakes.length > 0) {
    s.push(`## ${t.mistakes}`);
    s.push(table([t.wrong, t.right], m.mistakes.map((x) => [enCell(ctx, x.wrong), enCell(ctx, x.right)])));
  }

  const hasStyles = m.styles && Object.keys(m.styles).length > 0;
  if (hasStyles || m.motion || (m.tokens && m.tokens.length > 0)) {
    s.push(`## ${t.styles}`);
    if (hasStyles) {
      s.push(table([t.style, t.note], Object.entries(m.styles ?? {}).map(([k, v]) => [code(k), enCell(ctx, v)])));
    }
    if (m.motion) s.push(`${t.motion}: ${code(m.motion)}`);
    if (m.tokens && m.tokens.length > 0) {
      s.push(`### ${t.tokens}`);
      s.push(t.tokensLead(m.tokens.length));
      s.push(m.tokens.map((x) => code(x)).join(', '));
    }
  }

  s.push(`## ${t.code}`);
  s.push(t.codeLead);
  s.push(codeSection(ctx, m));

  s.push(`${t.family}: ${code(m.family)}. ${t.since}: ${code(m.since)}.`);

  return `${s.join('\n\n')}\n`;
}

/** The index page of one kind: every manifest of it with its summary. */
export function renderIndex(kind: string, list: Manifest[], lang: Lang, mode: Mode): string {
  const ctx: Ctx = { lang, mode, t: chrome[lang] };
  const t = ctx.t;
  const prefix = lang === 'ar' ? '/ar' : '';
  const s: string[] = [];
  const title = kind === 'component' ? t.indexTitle : `${kind}s`;
  if (mode === 'site') s.push(frontmatter({ title, description: t.indexLead(list.length), sidebar: { order: 0 } }));
  else s.push(`# ${title}`);
  s.push(t.indexLead(list.length));
  if (lang === 'ar') s.push(`> ${t.englishNote}`);
  const section = sectionOf(kind);
  s.push(
    table(
      [t.component, t.description],
      list.map((m) => {
        const href = mode === 'site' ? `${prefix}/${section}/${slugOf(m.name)}/` : `${prefix}/${section}/${slugOf(m.name)}.md`;
        return [`[${m.name}](${href})`, enCell(ctx, m.summary)];
      }),
    ),
  );
  return `${s.join('\n\n')}\n`;
}
