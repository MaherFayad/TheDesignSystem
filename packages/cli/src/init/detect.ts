// Which framework an app uses, from its package.json, and how it gets the
// system: the packages, or the files `ds add` and `shadcn add` copy in.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CliError } from '../output';

export type AppFramework = 'next' | 'vite' | 'react' | 'angular' | 'expo';

export interface Detected {
  framework: AppFramework;
  /** `packages`: imports from @the-system/*. `registry`: copied files under <components>/ds. */
  source: 'packages' | 'registry';
  /** For registry apps: the folder that holds ds/, relative to the app. */
  registryDir: string | null;
  /** The package names that decided it, for the report. */
  evidence: string[];
}

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

/** First match wins: Expo apps also list react, Next apps also list react. */
const RULES: [AppFramework, string[]][] = [
  ['expo', ['expo']],
  ['angular', ['@angular/core']],
  ['next', ['next']],
  ['vite', ['vite']],
  ['react', ['react']],
];

export function detect(cwd: string): Detected {
  const file = join(cwd, 'package.json');
  if (!existsSync(file)) throw new CliError('DS_E_CONFIG', `No package.json in ${cwd}. Run ds init in the app folder.`);
  let json: PackageJson;
  try {
    json = JSON.parse(readFileSync(file, 'utf8')) as PackageJson;
  } catch (e) {
    throw new CliError('DS_E_CONFIG', `package.json is not readable JSON: ${(e as Error).message}`);
  }
  const deps = { ...json.devDependencies, ...json.dependencies };
  const rule = RULES.find(([, names]) => names.every((n) => n in deps));
  if (!rule) throw new CliError('DS_E_FRAMEWORK', 'Cannot tell the framework: package.json lists none of react, next, vite, @angular/core or expo.');
  const [framework, evidence] = rule;
  // A vite app is only a React app here when react is there too.
  if (framework === 'vite' && !('react' in deps)) throw new CliError('DS_E_FRAMEWORK', 'A Vite app without react. The system serves React, Angular and React Native.');

  const usesPackages = Object.keys(deps).some((d) => d.startsWith('@the-system/'));
  const registryDir = ['src/components', 'components'].find((d) => existsSync(join(cwd, d, 'ds', 'ds.css'))) ?? null;
  return {
    framework,
    source: !usesPackages && registryDir ? 'registry' : 'packages',
    registryDir: !usesPackages ? registryDir : null,
    evidence,
  };
}
