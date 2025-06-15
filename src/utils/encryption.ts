import jwt from '@tsndr/cloudflare-worker-jwt';
import ab2str from 'arraybuffer-to-string';
import str2ab from 'string-to-arraybuffer';

const algo = {
  name: 'AES-GCM',
  length: 256,
  iv: new Int8Array([5, 12, 14, 5, 12, 14, 14, 5, 12, 14, 10, 11]),
};

// Encrypt Function
export async function encrypt(text: string, secretKey?: string): Promise<string> {
  text = text.toString();
  const key = await genEncryptionKey(secretKey || globalThis.env.ENCRYPTION_SECRET_KEY);
  const encoded = new TextEncoder().encode(text);
  return ab2str(await crypto.subtle.encrypt(algo, key, encoded), 'base64');
}

// Decrypt Function
export async function decrypt(cipherText: string): Promise<string | null> {
  try {
    const cipher: ArrayBuffer | ArrayBufferView = str2ab(cipherText);
    const key = await genEncryptionKey(globalThis.env.ENCRYPTION_SECRET_KEY);
    const decrypted = await crypto.subtle.decrypt(algo, key, cipher);
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
}

// Generate encryption key from a password
async function genEncryptionKey(password: string): Promise<CryptoKey> {
  const keyAlgo = {
    name: 'PBKDF2',
    hash: 'SHA-256',
    salt: new TextEncoder().encode('a-unique-salt'),
    iterations: 1000,
  };
  const encoded = new TextEncoder().encode(password);
  const key = await crypto.subtle.importKey('raw', encoded, { name: 'PBKDF2' }, false, ['deriveKey']);
  return crypto.subtle.deriveKey(keyAlgo, key, { name: algo.name, length: algo.length }, false, [
    'encrypt',
    'decrypt',
  ]);
}

// Generate a signed JWT token
// In encryption.ts
export const generateToken = async (
  data: Record<string, unknown>,
  expiry = 432000 // Default expiry of 5 days in seconds
): Promise<string> => {
  // Use environment variable or fallback to a default for development
  const secretKey = globalThis.env?.ENCRYPTION_SECRET_KEY || 'dev-secret-key-for-testing-only';
  
  const exp = Math.floor(Date.now() / 1000) + expiry;
  return jwt.sign({ exp, ...data }, secretKey);
};

// Verify a JWT token
export const verifyToken = (token: string): Promise<boolean> => {
  return jwt.verify(token, globalThis.env.ENCRYPTION_SECRET_KEY);
};

// Decode a JWT token without verifying
export const decodeToken = (token: string): Record<string, unknown> => {
  const decoded = jwt.decode(token);
  return decoded.payload || {};
};


