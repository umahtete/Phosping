/**
 * RSA key pair management for LTI 1.3 JWT signing and verification.
 * Keys are generated on first use and stored on the persistent /app/data volume.
 */

import { importPKCS8, importSPKI, exportPKCS8, exportSPKI, generateKeyPair } from 'jose';
import { promises as fs } from 'fs';
import path from 'path';

const KEYS_DIR = path.join(process.cwd(), 'data', 'lti-keys');
const PRIVATE_KEY_PATH = path.join(KEYS_DIR, 'private.pem');
const PUBLIC_KEY_PATH = path.join(KEYS_DIR, 'public.pem');

let cachedPrivateKey: CryptoKey | null = null;
let cachedPublicKey: CryptoKey | null = null;

async function ensureKeysDir() {
  await fs.mkdir(KEYS_DIR, { recursive: true });
}

async function generateAndSaveKeys() {
  await ensureKeysDir();

  const { publicKey, privateKey } = await generateKeyPair('RS256', {
    modulusLength: 2048,
    extractable: true,
  });

  const privatePem = await exportPKCS8(privateKey);
  const publicPem = await exportSPKI(publicKey);

  await fs.writeFile(PRIVATE_KEY_PATH, privatePem, 'utf-8');
  await fs.writeFile(PUBLIC_KEY_PATH, publicPem, 'utf-8');

  cachedPrivateKey = privateKey;
  cachedPublicKey = publicKey;

  return { privateKey, publicKey };
}

export async function getPrivateKey(): Promise<CryptoKey> {
  if (cachedPrivateKey) return cachedPrivateKey;

  try {
    const pem = await fs.readFile(PRIVATE_KEY_PATH, 'utf-8');
    cachedPrivateKey = await importPKCS8(pem, 'RS256', { extractable: true });
    return cachedPrivateKey!;
  } catch {
    const { privateKey } = await generateAndSaveKeys();
    return privateKey;
  }
}

export async function getPublicKey(): Promise<CryptoKey> {
  if (cachedPublicKey) return cachedPublicKey;

  try {
    const pem = await fs.readFile(PUBLIC_KEY_PATH, 'utf-8');
    cachedPublicKey = await importSPKI(pem, 'RS256', { extractable: true });
    return cachedPublicKey!;
  } catch {
    const { publicKey } = await generateAndSaveKeys();
    return publicKey;
  }
}

export async function getPublicJwk(): Promise<{ kty: string; kid: string; n: string; e: string; alg: string; use: string }> {
  const { exportJWK } = await import('jose');
  const publicKey = await getPublicKey();
  const jwk = await exportJWK(publicKey);

  return {
    kty: jwk.kty!,
    kid: 'luxup-tutor-key-1',
    n: jwk.n!,
    e: jwk.e!,
    alg: 'RS256',
    use: 'sig',
  };
}
