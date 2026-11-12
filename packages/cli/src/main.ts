// The `ds` command line. No CLI library: node:util parseArgs.
//
//   ds search <words> [--framework react|angular|native]
//   ds docs <name>
//   ds manifest <name>
//   ds add <name> --framework react|angular|native [--dir <dir>] [--registry <url>] [--overwrite] [--dry-run]
//   ds style list
//   ds style check <id>
//   ds doctor [path]
//   ds init [--force]
//
// Every command takes --json and then prints { apiVersion, type, data }.
// Exit codes: 0 done, 1 the answer is a failure (findings, a failing style,
// conflicts), 2 a usage or lookup error with a stable code (DS_E_*).
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { main as doctorMain } from '@the-system/lint/doctor';
import { add } from './commands/add';
import { docs, manifest, search } from './commands/catalog';
import { styleCheck, styleList } from './commands/style';
import { init } from './init/init';
import { FRAMEWORKS, loadConfig, type Framework } from './manifests';
import { API_VERSION, CliError, errorEnvelope, type Io, type Result } from './output';

const config = loadConfig();
const bin = config.cliName;

export const USAGE = `Usage: ${bin} <command> [options]

Commands:
  search <words>            Find components by what they are for
  docs <name>               When to use a component, its keys and its mistakes
  manifest <name>           The full manifest as JSON
  add <name> --framework <react|angular|native>
                            Add a component to this app
  style list                The style packs
  style check <id>          Contract, contrast, icon and font checks of a style
  doctor [path]             Check app code against the system rules
  init [--force]            Write AGENTS.md and DESIGN.md for this app

Options:
  --json                    Print { apiVersion, type, data }
  -h, --help                Show this help
  -v, --version             Show the version
`;

function framework(value: string | undefined, required: boolean): Framework | undefined {
  if (value === undefined) {
    if (required) throw new CliError('DS_E_FRAMEWORK', `Pass --framework ${FRAMEWORKS.join('|')}.`);
    return undefined;
  }
  if (!(FRAMEWORKS as readonly string[]).includes(value)) throw new CliError('DS_E_FRAMEWORK', `Unknown framework "${value}". Use ${FRAMEWORKS.join(', ')}.`);
  return value as Framework;
}

function one(positionals: string[], what: string, usage: string): string {
  if (positionals.length !== 1) throw new CliError('DS_E_USAGE', `Give one ${what}. Usage: ${bin} ${usage}`);
  return positionals[0]!;
}

async function dispatch(argv: string[], io: Io): Promise<Result> {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        json: { type: 'boolean' },
        help: { type: 'boolean', short: 'h' },
        version: { type: 'boolean', short: 'v' },
        framework: { type: 'string', short: 'f' },
        dir: { type: 'string' },
        registry: { type: 'string' },
        overwrite: { type: 'boolean' },
        'dry-run': { type: 'boolean' },
        force: { type: 'boolean' },
      },
    });
  } catch (e) {
    throw new CliError('DS_E_USAGE', `${(e as Error).message}. Run ${bin} --help.`);
  }
  const { values, positionals } = parsed;
  const [command, ...rest] = positionals;
  if (values.version) return { envelope: { apiVersion: API_VERSION, type: 'version', data: { name: config.name, version: config.version } }, text: `${config.version}\n`, exitCode: 0 };
  if (!command || values.help) return { envelope: { apiVersion: API_VERSION, type: 'help', data: { usage: USAGE } }, text: USAGE, exitCode: 0 };

  switch (command) {
    case 'search':
      return search(rest, framework(values.framework, false));
    case 'docs':
      return docs(one(rest, 'name', 'docs <name>'));
    case 'manifest':
      return manifest(one(rest, 'name', 'manifest <name>'));
    case 'add':
      return add({
        name: one(rest, 'name', 'add <name> --framework react|angular|native'),
        framework: framework(values.framework, true)!,
        cwd: io.cwd,
        dir: values.dir,
        registry: values.registry,
        overwrite: values.overwrite,
        dryRun: values['dry-run'],
      });
    case 'style': {
      const [sub, ...ids] = rest;
      if (sub === 'list' && ids.length === 0) return styleList();
      if (sub === 'check') return styleCheck(one(ids, 'style id', 'style check <id>'));
      throw new CliError('DS_E_USAGE', `Usage: ${bin} style list | ${bin} style check <id>`);
    }
    case 'init':
      if (rest.length) throw new CliError('DS_E_USAGE', `Usage: ${bin} init [--force]`);
      return init({ cwd: io.cwd, force: values.force });
    default:
      throw new CliError('DS_E_USAGE', `Unknown command "${command}". Run ${bin} --help.`);
  }
}

/** Runs one command line and returns the exit code. */
export async function run(argv: string[], io: Io): Promise<number> {
  const json = argv.includes('--json');
  if (argv.find((a) => !a.startsWith('-')) === 'doctor') {
    // The checker of order 1.12 owns its arguments, output and exit codes.
    const args = argv.filter((a) => a !== 'doctor');
    const flags = args.filter((a) => a.startsWith('-'));
    const paths = args.filter((a) => !a.startsWith('-')).map((a) => resolve(io.cwd, a));
    return doctorMain([...(paths.length ? paths : [io.cwd]), ...flags], io.out, io.err);
  }
  try {
    const result = await dispatch(argv, io);
    io.out(json ? `${JSON.stringify(result.envelope, null, 2)}\n` : result.text);
    return result.exitCode;
  } catch (e) {
    if (!(e instanceof CliError)) throw e;
    if (json) io.out(`${JSON.stringify(errorEnvelope(e), null, 2)}\n`);
    else io.err(`${e.code}: ${e.message}\n`);
    return 2;
  }
}
