// ds style list, ds style check <id>: the style packs and their conformance.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { iconNames, iconSets } from '@the-system/icons';
import { CONTRAST_PAIRS, checkContract, contractEntries, checkContrast, contractModes, contrastModes, describeResult } from '@the-system/lint';
import { buildTokens } from '../../../tokens/build';
import { REPO } from '../manifests';
import { CliError, ok, type Result } from '../output';

interface StyleJson {
  id: string;
  name: string;
  status?: string;
  schemes: string[];
  proposedSchemes?: string[];
  defaultScheme: string;
  defaultDensity: string;
  iconSet: string;
  motionPreset: string;
  usesGlass?: boolean;
  fonts?: Record<string, string>;
}

export interface StyleSummary {
  id: string;
  name: string;
  status: string;
  schemes: string[];
  proposedSchemes: string[];
  defaultScheme: string;
  defaultDensity: string;
  iconSet: string;
  motionPreset: string;
}

const stylesDir = join(REPO, 'packages/styles');

export function styleIds(): string[] {
  return readdirSync(stylesDir)
    .filter((d) => existsSync(join(stylesDir, d, 'style.json')))
    .sort();
}

function readStyle(id: string): StyleJson {
  if (!styleIds().includes(id)) throw new CliError('DS_E_STYLE', `No style "${id}". Styles: ${styleIds().join(', ')}.`, { styles: styleIds() });
  return JSON.parse(readFileSync(join(stylesDir, id, 'style.json'), 'utf8')) as StyleJson;
}

export function styleList(): Result<{ styles: StyleSummary[] }> {
  const styles = styleIds().map((id) => {
    const s = readStyle(id);
    return {
      id: s.id,
      name: s.name,
      status: s.status ?? 'stable',
      schemes: s.schemes,
      proposedSchemes: s.proposedSchemes ?? [],
      defaultScheme: s.defaultScheme,
      defaultDensity: s.defaultDensity,
      iconSet: s.iconSet,
      motionPreset: s.motionPreset,
    };
  });
  const text = styles.map((s) => `${s.id.padEnd(10)} ${s.name.padEnd(10)} ${s.status.padEnd(9)} ${s.schemes.join(', ')}`).join('\n') + '\n';
  return ok('style.list', { styles }, text);
}

export interface StyleCheck {
  id: 'contract' | 'contrast' | 'icons' | 'fonts';
  ok: boolean;
  /** What was measured, for example the number of names or pairs. */
  checked: number;
  findings: string[];
  /** Failures the repo records with a reason (contrast only). They do not fail the check. */
  known: string[];
}

function checkIcons(id: string, style: StyleJson): StyleCheck {
  const findings: string[] = [];
  const set = (iconSets as Record<string, { icons: Record<string, unknown>; glyphs: Record<string, unknown> }>)[style.iconSet];
  if (!set) {
    findings.push(`style.json names icon set "${style.iconSet}", which does not exist (sets: ${Object.keys(iconSets).join(', ')})`);
    return { id: 'icons', ok: false, checked: 0, findings, known: [] };
  }
  for (const name of iconNames) if (!set.icons[name]) findings.push(`${name}: no glyph in the ${style.iconSet} set`);
  // The map in icons.ts may point a system name at another glyph of the same set.
  const iconsTs = join(stylesDir, id, 'icons.ts');
  if (!existsSync(iconsTs)) findings.push(`packages/styles/${id}/icons.ts is missing`);
  else {
    const source = readFileSync(iconsTs, 'utf8');
    const setInFile = /set:\s*'([^']+)'/.exec(source)?.[1];
    if (setInFile !== style.iconSet) findings.push(`icons.ts uses set "${setInFile}", style.json says "${style.iconSet}"`);
    const map = /map:\s*\{([\s\S]*?)\}/.exec(source)?.[1] ?? '';
    for (const m of map.matchAll(/'?([a-z0-9-]+)'?\s*:\s*'([^']+)'/g)) {
      if (!(iconNames as readonly string[]).includes(m[1]!)) findings.push(`icons.ts maps "${m[1]}", which is not a system icon name`);
      if (!set.glyphs[m[2]!] && !set.icons[m[2]!]) findings.push(`icons.ts maps ${m[1]} to "${m[2]}", which the ${style.iconSet} set does not ship`);
    }
  }
  return { id: 'icons', ok: findings.length === 0, checked: iconNames.length, findings, known: [] };
}

function checkFonts(id: string, style: StyleJson): StyleCheck {
  const findings: string[] = [];
  const fonts = style.fonts ?? {};
  for (const role of ['sans', 'arabic']) if (!fonts[role]) findings.push(`style.json declares no ${role} font`);
  const fontsCss = join(stylesDir, id, 'fonts.css');
  const index = join(stylesDir, id, 'index.css');
  if (!existsSync(fontsCss)) findings.push(`packages/styles/${id}/fonts.css is missing`);
  else {
    const css = readFileSync(fontsCss, 'utf8');
    if (!/@import\s+'[^']+'|@font-face/.test(css)) findings.push('fonts.css neither imports a font file nor declares @font-face');
    if (fonts.arabic && !/arabic/i.test(css)) findings.push(`fonts.css loads no Arabic font for "${fonts.arabic}"`);
  }
  if (existsSync(index) && !readFileSync(index, 'utf8').includes("'./fonts.css'")) findings.push('index.css does not import fonts.css');
  return { id: 'fonts', ok: findings.length === 0, checked: Object.keys(fonts).length, findings, known: [] };
}

export function styleCheck(id: string): Result<{ style: string; ok: boolean; checks: StyleCheck[] }> {
  const style = readStyle(id);
  const built = buildTokens();
  const inStyle = <T extends { id: string }>(modes: T[]) => modes.filter((m) => m.id.startsWith(`${id}.`));

  const cModes = inStyle(contractModes(built.modes));
  const contract = checkContract(cModes, built.contract);
  const xModes = inStyle(contrastModes(built.modes));
  const contrast = checkContrast(xModes, CONTRAST_PAIRS);

  const checks: StyleCheck[] = [
    {
      id: 'contract',
      ok: cModes.length > 0 && contract.length === 0,
      checked: cModes.length * contractEntries(built.contract).length,
      findings: cModes.length ? contract.map((f) => f.message) : [`no token modes for ${id}`],
      known: [],
    },
    {
      id: 'contrast',
      ok: contrast.findings.length === 0,
      checked: contrast.results.length,
      findings: contrast.findings.map((f) => f.message),
      known: contrast.known.map(({ result, entry }) => `${describeResult(result)} [${entry.reason}]`),
    },
    checkIcons(id, style),
    checkFonts(id, style),
  ];
  const passed = checks.every((c) => c.ok);
  const text =
    checks
      .map((c) => {
        const head = `${c.ok ? 'pass' : 'FAIL'}  ${c.id.padEnd(9)} ${c.checked} checked${c.known.length ? `, ${c.known.length} known` : ''}`;
        return [head, ...c.findings.map((f) => `      ${f}`)].join('\n');
      })
      .join('\n') + `\n${passed ? `${style.name} passes.` : `${style.name} fails.`}\n`;
  return ok('style.check', { style: id, ok: passed, checks }, text, passed ? 0 : 1);
}
