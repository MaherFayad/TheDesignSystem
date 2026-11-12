// The shape every command returns with --json, and the stable error codes.

export const API_VERSION = 1;

export type ErrorCode =
  | 'DS_E_USAGE'
  | 'DS_E_NOT_FOUND'
  | 'DS_E_FRAMEWORK'
  | 'DS_E_NOT_READY'
  | 'DS_E_STYLE'
  | 'DS_E_CONFLICT'
  | 'DS_E_REGISTRY'
  | 'DS_E_CONFIG';

/** A user facing error. Exit code 2. */
export class CliError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export interface Envelope<T = unknown> {
  apiVersion: typeof API_VERSION;
  type: string;
  data: T;
}

/** What a command hands back: the JSON envelope, its text form and the exit code. */
export interface Result<T = unknown> {
  envelope: Envelope<T>;
  text: string;
  exitCode: number;
}

export function ok<T>(type: string, data: T, text: string, exitCode = 0): Result<T> {
  return { envelope: { apiVersion: API_VERSION, type, data }, text, exitCode };
}

export function errorEnvelope(e: CliError): Envelope<{ code: ErrorCode; message: string } & Record<string, unknown>> {
  return { apiVersion: API_VERSION, type: 'error', data: { code: e.code, message: e.message, ...e.details } };
}

/** Input and output of one run, so tests can capture both. */
export interface Io {
  cwd: string;
  out: (s: string) => void;
  err: (s: string) => void;
}
