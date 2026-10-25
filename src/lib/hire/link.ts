import type { HireAnswers } from './types.ts';
import { validateAnswers, type Validation } from './validate.ts';

export const REPORT_BASE = 'https://kin.rag.wtf/hire/';
export const LONG_LINK = 2000;
const MAX_INFLATED = 64 * 1024;

function toB64Url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromB64Url(s: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]*$/.test(s)) throw new Error('not base64url');
  const b = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b + '='.repeat((4 - (b.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream, max = Infinity): Promise<Uint8Array> {
  const writer = stream.writable.getWriter();
  // Failures surface on the reader side; keep these promises from rejecting unhandled.
  writer.write(bytes as BufferSource).catch(() => {});
  writer.close().catch(() => {});
  const reader = stream.readable.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > max) { await reader.cancel().catch(() => {}); throw new Error('too large'); }
    chunks.push(value);
  }
  const out = new Uint8Array(size);
  let at = 0;
  for (const c of chunks) { out.set(c, at); at += c.length; }
  return out;
}

export async function encodeAnswers(a: HireAnswers): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(a));
  return toB64Url(await pipe(json, new CompressionStream('deflate-raw')));
}

export async function decodeAnswers(s: string): Promise<Validation> {
  try {
    const packed = fromB64Url(String(s));
    if (packed.length === 0) return { ok: false, issues: ['link: empty'] };
    const raw = await pipe(packed, new DecompressionStream('deflate-raw'), MAX_INFLATED);
    return validateAnswers(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(raw)));
  } catch {
    return { ok: false, issues: ["link: can't be read"] };
  }
}

export async function reportUrl(a: HireAnswers): Promise<string> {
  return `${REPORT_BASE}#a=${await encodeAnswers(a)}`;
}
