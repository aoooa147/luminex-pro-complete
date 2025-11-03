import fs from 'node:fs';
import path from 'node:path';

// Check if we're in a serverless environment (Vercel, AWS Lambda, etc.)
const isServerless = () => {
  return !!(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.VERCEL_ENV ||
    process.env.NEXT_PUBLIC_VERCEL_ENV
  );
};

// In-memory storage for serverless environments
const memoryStore: Map<string, any> = new Map();

// File-based storage for local development
const root = process.cwd();
const dir = path.join(root, 'tmp_data');

function ensureDir() {
  if (isServerless()) return; // Skip in serverless
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (e: any) {
    // If we can't create directory (e.g., read-only filesystem), fallback to memory
    console.warn('[storage] Cannot create directory, using in-memory storage:', e?.message);
  }
}

export function readJSON<T>(name: string, fallback: T): T {
  // Use in-memory storage in serverless environments
  if (isServerless()) {
    const data = memoryStore.get(name);
    return data !== undefined ? data : fallback;
  }

  // Try file-based storage for local development
  try {
    ensureDir();
    const p = path.join(dir, name + '.json');
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf8');
      return JSON.parse(content);
    }
    return fallback;
  } catch (e: any) {
    // Fallback to in-memory if file operations fail
    console.warn(`[storage] File read failed for ${name}, using in-memory fallback:`, e?.message);
    const data = memoryStore.get(name);
    return data !== undefined ? data : fallback;
  }
}

export function writeJSON(name: string, data: any) {
  // Use in-memory storage in serverless environments
  if (isServerless()) {
    memoryStore.set(name, data);
    return;
  }

  // Try file-based storage for local development
  try {
    ensureDir();
    const p = path.join(dir, name + '.json');
    fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e: any) {
    // Fallback to in-memory if file operations fail (e.g., read-only filesystem)
    console.warn(`[storage] File write failed for ${name}, using in-memory fallback:`, e?.message);
    memoryStore.set(name, data);
  }
}
