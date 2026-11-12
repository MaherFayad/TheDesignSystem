// The text of AGENTS.md and DESIGN.md for one app. Pure: same input, same text.
import type { Detected } from './detect';

export interface TemplateContext extends Detected {
  /** The system name, from ds.config.json. */
  name: string;
  /** The CLI name, from ds.config.json. */
  bin: string;
  /** The package scope, from ds.config.json. */
  scope: string;
  /** Where llms.txt lives. */
  llms: string;
  /** Style ids that ship. */
  styles: string[];
}

const FRAMEWORK_NAME: Record<Detected['framework'], string> = {
  next: 'React with Next.js',
  vite: 'React with Vite',
  react: 'React',
  angular: 'Angular',
  expo: 'React Native with Expo',
};

const fence = (lang: string, body: string) => `\`\`\`${lang}\n${body.trim()}\n\`\`\``;

function setup(c: TemplateContext): string {
  const s = c.scope;
  if (c.framework === 'angular') {
    return [
      'In the global stylesheet (`styles.css`), the system first:',
      '',
      fence('css', `@import '${s}/tokens/css';\n@import '${s}/css';\n@import '${s}/styles';`),
      '',
      'Wrap the app once in the theme directive. Write the style as `dsTheme="<id>"`; a static `style="..."` is read as inline CSS.',
      '',
      fence('html', '<div dsTheme="studio" scheme="dark" lang="en">\n  <router-outlet />\n</div>'),
      '',
      `Components come from \`${s}/angular\`: standalone, attribute selectors on the host (\`button[dsButton]\`), inputs with the React prop names.`,
    ].join('\n');
  }
  if (c.framework === 'expo') {
    return [
      'Wrap the app once in the theme provider. React Native never imports the web CSS.',
      '',
      fence('tsx', `import { ThemeProvider } from '${s}/native';\n\nexport default function App() {\n  return (\n    <ThemeProvider style="studio" scheme="dark" lang="en">\n      {/* screens */}\n    </ThemeProvider>\n  );\n}`),
      '',
      'Right to left comes from `I18nManager`; a direction change needs an app restart.',
    ].join('\n');
  }
  if (c.source === 'registry') {
    const dir = (c.registryDir ?? 'src/components').replace(/^src\//, './');
    return [
      `The system files live in \`${c.registryDir}/ds/\`, added with \`${c.bin} add\` or \`shadcn add @ds/<name>\`. Import them by path, never from \`${s}/*\`.`,
      '',
      'Once, at the app root, before the app CSS:',
      '',
      fence('ts', `import '${dir}/ds/ds.css';\nimport '${dir}/ds/style-studio.css';`),
      '',
      fence('tsx', `import { Theme } from '${dir}/ds/react/theme';\n\n<Theme style="studio" scheme="dark" lang="en">{/* the app */}</Theme>`),
    ].join('\n');
  }
  const css = `import '${s}/tokens/css';\nimport '${s}/css';\nimport '${s}/styles';`;
  if (c.framework === 'next') {
    return [
      'In the root layout, the system CSS first, then the app CSS. Stamp the theme on `<html>` on the server so the first paint is themed:',
      '',
      fence('tsx', `${css}\nimport './app.css';\nimport { Theme, Toaster, themeAttributes } from '${s}/react';\n\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <html {...themeAttributes({ style: 'studio', scheme: 'dark', lang: 'en' })}>\n      <body>\n        <Theme style="studio" scheme="dark" lang="en">\n          <Toaster />\n          {children}\n        </Theme>\n      </body>\n    </html>\n  );\n}`),
      '',
      'The packages export TypeScript and CSS source, so list them in `transpilePackages` in `next.config.ts`:',
      '',
      fence('ts', `transpilePackages: ['${s}/react', '${s}/shared', '${s}/icons', '${s}/motion', '${s}/styles', '${s}/css', '${s}/tokens'],`),
    ].join('\n');
  }
  return [
    'In the entry file (`src/main.tsx`), the system CSS first, then the app CSS:',
    '',
    fence('ts', css),
    '',
    'Wrap the app once in `Theme`, and mount `Toaster` once inside it:',
    '',
    fence('tsx', `import { Theme, Toaster } from '${s}/react';\n\n<Theme style="studio" scheme="dark" lang="en">\n  <Toaster />\n  {/* the app */}\n</Theme>`),
  ].join('\n');
}

function componentRules(c: TemplateContext): string[] {
  if (c.framework === 'angular') {
    return [
      '- System components only. No bare `<button>`, `<input>`, `<select>` or `<dialog>` where a system component exists: use `button[dsButton]`, `[dsInput]` and the rest.',
      '- Never import `@angular/aria` or CDK overlays to rebuild a system component.',
    ];
  }
  if (c.framework === 'expo') {
    return [
      `- System components only, from \`${c.scope}/native\`. No raw \`Pressable\` or \`TextInput\` where a system component exists.`,
      '- No inline color or size literals in styles: read the theme object.',
      '- Touch targets: 44pt on iOS, 48dp on Android. Respect safe areas, font scale to 200% and reduce motion.',
    ];
  }
  return [
    '- System components only. No bare `<button>`, `<input>`, `<select>` or `<dialog>` where a system component exists.',
    '- Never import `radix-ui` or `react-aria-components` in app code. The system component wires the behavior, the anatomy and the tokens.',
  ];
}

export function agentsMd(c: TemplateContext): string {
  const run = `npx ${c.bin}`;
  return [
    `# Agent rules: ${c.name}`,
    '',
    `This app is ${FRAMEWORK_NAME[c.framework]} on ${c.name}. DESIGN.md holds the setup. The full reference for agents is \`${c.llms}\` on the docs site.`,
    '',
    '## Before you write UI',
    '',
    `1. Find the component: \`${run} search <what it is for>\`.`,
    `2. Read it: \`${run} docs <Name>\` (use when, avoid when, use instead, keys, mistakes).`,
    `3. Add it if the app does not have it: \`${run} add <Name> --framework ${c.framework === 'angular' ? 'angular' : c.framework === 'expo' ? 'native' : 'react'}\`.`,
    '',
    '## Rules',
    '',
    ...componentRules(c),
    '- Tokens only. Colors, spacing, radius, font sizes, shadows, durations and z-index come from `--ds-*` variables (or the native theme). No raw values.',
    '- Never declare a `--ds-*` variable in app CSS. Change a style through its pack, not by overriding tokens.',
    '- Logical properties only: `margin-inline-start`, `inset-inline-end`, `padding-block`. Never `left`, `right`, `margin-left` and the like.',
    '- Props for size, tone, emphasis and shape take only the values in the component manifest.',
    '- No native `title` attribute for hints. Use Tooltip.',
    '- Only `transform` and `opacity` animate. No animation library on the web.',
    '',
    '## Copy',
    '',
    '- English: sentence case. Buttons are a verb plus a noun: "Save draft", "Delete board". Never "OK", "Continue", "Confirm" or "Yes".',
    '- An empty state says what to do next. An error names what happened and how to fix it.',
    '- Never an em dash or an en dash. No exclamation marks.',
    '',
    '## Arabic',
    '',
    '- Pick one register for the product and keep it: Gulf modern standard Arabic or white Saudi dialect.',
    '- Noun form labels, no diacritics, Western digits, the Arabic comma in running text.',
    '- Set `lang="ar"` on the theme root; the direction follows. Latin runs inside Arabic text go through `Bidi`.',
    '- No uppercase or italics for emphasis, no letter spacing. Directional icons mirror; brand marks, clocks and media controls do not.',
    '',
    '## Accessibility (WCAG 2.2 AA)',
    '',
    '- Targets at least 24 by 24 px on the web, 44 px in touch layouts. Every drag has a button or key path.',
    '- Text at 4.5:1, control borders and focus rings at 3:1. Never remove the focus ring.',
    '- Toasts and status changes announce once. A dialog has a title.',
    '',
    '## Check your work',
    '',
    fence('sh', `${run} doctor${c.framework === 'angular' || c.framework === 'expo' ? '' : ' src'}\n${run} doctor --json   # { apiVersion, type: "doctor.report", data: { findings, summary } }`),
    '',
    'Exit code 0 is clean, 1 means an error finding: fix every error before you finish. Then run the app in English and in Arabic, dark and light.',
    '',
  ].join('\n');
}

export function designMd(c: TemplateContext): string {
  const run = `npx ${c.bin}`;
  return [
    `# Design: ${c.name}`,
    '',
    `Framework: ${FRAMEWORK_NAME[c.framework]}. System source: ${c.source === 'registry' ? `copied files in \`${c.registryDir}/ds/\`` : `the \`${c.scope}/*\` packages`}.`,
    '',
    '## Setup',
    '',
    setup(c),
    '',
    '## Theme axes',
    '',
    'Set them on the one root theme. Nested themes may change any axis for a part of the page.',
    '',
    '| Axis | Values |',
    '| --- | --- |',
    `| style | ${c.styles.map((s) => `\`${s}\``).join(', ')} (\`${run} style list\`) |`,
    '| scheme | `dark`, `light` |',
    '| density | `compact`, `default`, `comfortable` |',
    '| contrast | `default`, `more` |',
    '| platform | `web`, `ios`, `android` |',
    '| dir, lang | `ltr` or `rtl`, `en` or `ar` |',
    '',
    '## Where to look',
    '',
    `- \`${c.llms}\` on the docs site root: every component, for agents. \`/llms-full.txt\` has the full text.`,
    `- \`${run} docs <Name>\` and \`${run} manifest <Name>\`: one component, from its manifest.`,
    `- \`${run} doctor\`: checks this app against the rules in AGENTS.md.`,
    '',
  ].join('\n');
}
