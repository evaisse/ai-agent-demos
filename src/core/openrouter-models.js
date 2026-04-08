import fs from 'fs/promises';
import path from 'path';

export async function loadAvailableModels(rootDir) {
  const cachePath = path.join(rootDir, 'openrouter-models.json');
  try {
    const raw = JSON.parse(await fs.readFile(cachePath, 'utf-8'));
    const models = Array.isArray(raw.models) ? raw.models : raw.data;
    return Array.isArray(models) ? models : [];
  } catch {
    return [];
  }
}
