// `ds doctor`: checks a consumer's React, React Native and Angular code
// against the system's rules. The CLI (order 1.14) wires this entry to
// `ds doctor`; until then:
//
//   npx tsx packages/lint/src/doctor.ts <path> [--json]
//
// Exit codes: 0 clean (warnings allowed), 1 an error finding, 2 a tool error
// (stable codes: DS_E_USAGE, DS_E_NOT_FOUND, DS_E_CONFIG, DS_E_MANIFEST).
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { DoctorError, errorReport, exitCode, formatText, runDoctor } from './doctor/run';

export { DOCTOR_RULES, checkFile, classify, markupFindings } from './doctor/checks';
export type { DoctorContext, DoctorFile, DoctorFinding, DoctorRuleId, Severity } from './doctor/checks';
export { API_VERSION, DEFAULT_EXCLUDED, DoctorError, discover, errorReport, exitCode, formatText, loadConfig, runDoctor, validateConfig } from './doctor/run';
export type { DoctorConfig, DoctorErrorCode, DoctorErrorReport, DoctorOptions, DoctorReport, DoctorSummary } from './doctor/run';

const USAGE = 'Usage: ds doctor [path] [--json]';

/** Runs the command line and returns the exit code. Output goes to the given writers. */
export async function main(argv: string[], out: (s: string) => void = (s) => process.stdout.write(s), err: (s: string) => void = (s) => process.stderr.write(s)): Promise<number> {
  let json = false;
  try {
    let parsed;
    try {
      parsed = parseArgs({ args: argv, allowPositionals: true, options: { json: { type: 'boolean' }, help: { type: 'boolean', short: 'h' } } });
    } catch (e) {
      throw new DoctorError('DS_E_USAGE', `${(e as Error).message}. ${USAGE}`);
    }
    json = parsed.values.json ?? false;
    if (parsed.values.help) {
      out(`${USAGE}\n`);
      return 0;
    }
    if (parsed.positionals.length > 1) throw new DoctorError('DS_E_USAGE', `One path at most. ${USAGE}`);
    const report = await runDoctor({ path: parsed.positionals[0] ?? '.' });
    out(json ? `${JSON.stringify(report, null, 2)}\n` : formatText(report));
    return exitCode(report);
  } catch (e) {
    if (!(e instanceof DoctorError)) throw e;
    if (json) out(`${JSON.stringify(errorReport(e), null, 2)}\n`);
    else err(`${e.code}: ${e.message}\n`);
    return 2;
  }
}

const self = fileURLToPath(import.meta.url);
if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(self)) {
  main(process.argv.slice(2)).then((code) => process.exit(code));
}
