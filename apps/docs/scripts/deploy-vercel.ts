// Deploys apps/docs/dist (the output of `npm run build:site`) to Vercel as a
// static deployment: no build runs on Vercel. It uploads every file by its
// SHA1 (only the ones Vercel does not have yet), adds apps/docs/vercel.json
// at the root for the rewrites and headers, creates the deployment through
// the REST API, then waits until it is ready and prints its URL.
//
// Run: npm run deploy:site -w @the-system/docs              (a preview)
//      npm run deploy:site -w @the-system/docs -- --prod    (production)
//
// Auth: VERCEL_TOKEN when set, sent as a bearer token. In a session behind
// the agent proxy the proxy adds the credential, so no token is needed.
// Scope: VERCEL_TEAM_ID when set, else the account's default team.
// The project is `the-system-docs` (VERCEL_PROJECT changes it). No git
// repository is connected and no domain is added.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { vercelJsonPath } from './static-host.ts';

const API = 'https://api.vercel.com';
const dist = join(import.meta.dirname, '..', 'dist');
const project = process.env.VERCEL_PROJECT ?? 'the-system-docs';
const production = process.argv.includes('--prod');
const token = process.env.VERCEL_TOKEN;

interface DeployFile {
  file: string;
  sha: string;
  size: number;
  data: Buffer;
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(path));
    else out.push(path);
  }
  return out;
}

function fileOf(name: string, data: Buffer): DeployFile {
  return { file: name, sha: createHash('sha1').update(data).digest('hex'), size: data.length, data };
}

function headers(extra: Record<string, string> = {}): Record<string, string> {
  return { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra };
}

async function api<T>(path: string, init: RequestInit = {}): Promise<{ status: number; body: T }> {
  const res = await fetch(`${API}${path}`, init);
  const text = await res.text();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }
  return { status: res.status, body: body as T };
}

async function teamId(): Promise<string | undefined> {
  if (process.env.VERCEL_TEAM_ID) return process.env.VERCEL_TEAM_ID;
  const { status, body } = await api<{ user?: { defaultTeamId?: string | null } }>('/v2/user', { headers: headers() });
  if (status !== 200) throw new Error(`Vercel did not accept the credential (HTTP ${status}). Set VERCEL_TOKEN.`);
  return body.user?.defaultTeamId ?? undefined;
}

async function upload(files: DeployFile[], scope: string): Promise<void> {
  let next = 0;
  let done = 0;
  const worker = async () => {
    while (next < files.length) {
      const f = files[next++];
      if (!f) return;
      for (let attempt = 1; ; attempt++) {
        const res = await fetch(`${API}/v2/files${scope}`, {
          method: 'POST',
          headers: headers({ 'Content-Type': 'application/octet-stream', 'x-vercel-digest': f.sha, 'Content-Length': String(f.size) }),
          body: f.data,
        });
        await res.arrayBuffer();
        if (res.ok) break;
        if (attempt >= 3) throw new Error(`Upload of ${f.file} failed (HTTP ${res.status}).`);
      }
      done++;
      if (done % 100 === 0 || done === files.length) console.log(`deploy: uploaded ${done} of ${files.length}`);
    }
  };
  await Promise.all(Array.from({ length: 8 }, worker));
}

interface Deployment {
  id: string;
  url: string;
  readyState?: string;
  inspectorUrl?: string;
  error?: { code?: string; message?: string; missing?: string[] };
}

async function main(): Promise<void> {
  if (!existsSync(join(dist, 'gallery', 'index.html'))) {
    throw new Error('No site build in apps/docs/dist. Run npm run build:site -w @the-system/docs first.');
  }
  const files = walk(dist).map((path) => fileOf(relative(dist, path).split('\\').join('/'), readFileSync(path)));
  files.push(fileOf('vercel.json', readFileSync(vercelJsonPath)));
  const bySha = new Map(files.map((f) => [f.sha, f]));
  const total = files.reduce((n, f) => n + f.size, 0);
  console.log(`deploy: ${files.length} files, ${(total / 1024 / 1024).toFixed(1)} MB, project ${project}, ${production ? 'production' : 'preview'}`);

  const team = await teamId();
  const scope = team ? `?teamId=${encodeURIComponent(team)}` : '';
  const payload = JSON.stringify({
    name: project,
    project,
    files: files.map((f) => ({ file: f.file, sha: f.sha, size: f.size })),
    projectSettings: { framework: null, buildCommand: null, installCommand: null, devCommand: null, outputDirectory: null },
    // No target means a preview. Note: Vercel sends a new project's first deployment to production.
    ...(production ? { target: 'production' } : {}),
  });
  const create = () =>
    api<Deployment>(`/v13/deployments${scope}${scope ? '&' : '?'}skipAutoDetectionConfirmation=1`, {
      method: 'POST',
      headers: headers({ 'Content-Type': 'application/json' }),
      body: payload,
    });

  // Vercel answers missing_files with the SHAs it does not have yet: upload
  // those and ask again. A redeploy uploads only what changed.
  let res = await create();
  if (res.body.error?.code === 'missing_files') {
    const missing = (res.body.error.missing ?? []).map((sha) => bySha.get(sha)).filter((f): f is DeployFile => f !== undefined);
    console.log(`deploy: ${missing.length} new or changed files to upload`);
    await upload(missing, scope);
    res = await create();
  }
  if (res.status >= 300 || !res.body.id) {
    throw new Error(`Vercel refused the deployment (HTTP ${res.status}): ${JSON.stringify(res.body.error ?? res.body)}`);
  }

  const id = res.body.id;
  console.log(`deploy: created ${id}, waiting until it is ready`);
  for (let i = 0; i < 120; i++) {
    const { body } = await api<Deployment>(`/v13/deployments/${id}${scope}`, { headers: headers() });
    if (body.readyState === 'READY') {
      console.log(`deploy: ready at https://${body.url}`);
      if (body.inspectorUrl) console.log(`deploy: inspect at ${body.inspectorUrl}`);
      return;
    }
    if (body.readyState === 'ERROR' || body.readyState === 'CANCELED') {
      throw new Error(`The deployment ended as ${body.readyState}. Inspect it at ${body.inspectorUrl ?? id}.`);
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error(`The deployment ${id} was not ready after 10 minutes.`);
}

main().catch((error: unknown) => {
  console.error(`deploy: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
