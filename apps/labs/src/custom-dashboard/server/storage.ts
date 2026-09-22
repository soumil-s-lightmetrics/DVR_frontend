/**
 * JSON document store. Port of backend/store.py.
 *
 * Each document is one file, data/<name>.json, in exactly the format the Flask
 * backend wrote, so the two are interchangeable. Writes go to a temp file and
 * are renamed into place, so a crash mid-write never leaves a half-written
 * document behind.
 *
 * Mutations are serialised per document with an in-process promise chain,
 * which is only sound while the app runs as ONE Node process (`next dev` /
 * `next start`). A serverless deploy needs a different backend here — S3 with
 * If-Match conditional writes is the planned one; everything else in
 * src/server talks to this module only through read/mutate/getBlob/putBlob.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { settings } from "./config";
import { clone, hex } from "./util";

// Runtime data, not source: keep the bundler from tracing the whole project.
const root = () => path.resolve(/*turbopackIgnore: true*/ process.cwd(), settings.dataDir);

// On globalThis so that route bundles that each import this module in dev
// still share one lock per document.
const g = globalThis as unknown as { __cdLocks?: Map<string, Promise<unknown>> };
const locks = (g.__cdLocks ??= new Map());

function withLock<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(name) ?? Promise.resolve();
  const next = prev.then(fn, fn);
  locks.set(
    name,
    next.catch(() => undefined),
  );
  return next;
}

function fileFor(key: string): string {
  // Keys are fixed document names or server-generated ids; refuse anything
  // that could step outside the data directory.
  if (!/^[a-z0-9_]+(\/[a-z0-9_]+)*$/i.test(key)) {
    throw new Error(`invalid storage key: ${key}`);
  }
  return path.join(root(), `${key}.json`);
}

async function readFile<T>(key: string): Promise<T | undefined> {
  try {
    return JSON.parse(await fs.readFile(fileFor(key), "utf8")) as T;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    console.error(`[storage] could not read ${key} (${(err as Error).message}) — using default`);
    return undefined;
  }
}

async function writeFile(key: string, payload: unknown): Promise<void> {
  const target = fileFor(key);
  const dir = path.dirname(target);
  await fs.mkdir(dir, { recursive: true });
  const tmp = path.join(dir, `.${path.basename(key)}.${hex(8)}.tmp`);
  try {
    await fs.writeFile(tmp, JSON.stringify(payload, null, 2), "utf8");
    await fs.rename(tmp, target);
  } catch (err) {
    await fs.unlink(tmp).catch(() => undefined);
    throw err;
  }
}

/** The document, or a copy of `fallback` if it does not exist yet. */
export async function read<T>(name: string, fallback: T): Promise<T> {
  return (await readFile<T>(name)) ?? clone(fallback);
}

/**
 * Read, apply fn, write back — holding the document's lock throughout.
 * fn may mutate the document in place and/or return a replacement.
 */
export function mutate<T>(name: string, fallback: T, fn: (doc: T) => T | void): Promise<T> {
  return withLock(name, async () => {
    let doc = (await readFile<T>(name)) ?? clone(fallback);
    const result = fn(doc);
    if (result !== undefined) doc = result;
    await writeFile(name, doc);
    return doc;
  });
}

/** Single-object blobs (e.g. the query-result cache) under a key prefix. */
export async function getBlob<T>(key: string): Promise<T | null> {
  return (await readFile<T>(key)) ?? null;
}

export async function putBlob(key: string, value: unknown): Promise<void> {
  await writeFile(key, value);
}

export async function deleteBlob(key: string): Promise<void> {
  await fs.unlink(fileFor(key)).catch(() => undefined);
}

export function describe() {
  return { backend: "local", location: root() };
}
