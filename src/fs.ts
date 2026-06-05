/**
 * File-system helpers with safe fallbacks.
 *
 * Example:
 *   import { tryReadFile, tryWriteFile, backupFile, simpleDiff } from './src/fs';
 */

import { promises as fs } from 'fs';
import { dirname, basename, join, resolve } from 'path';
import { isoTimestamp, shortId } from './id.js';

/** Resolves a leading ~ to the current HOME directory. */
export function resolvePath(p: string): string {
  return resolve(p.replace(/^~/, process.env.HOME || ''));
}

/** Reads a UTF-8 file and returns null on failure. */
export async function tryReadFile(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(resolvePath(filePath), 'utf-8');
  } catch {
    return null;
  }
}

/** Writes a UTF-8 file atomically and creates parent directories as needed. */
export async function tryWriteFile(filePath: string, content: string): Promise<boolean> {
  try {
    const resolved = resolvePath(filePath);
    await fs.mkdir(dirname(resolved), { recursive: true });
    const tmp = `${resolved}.${process.pid}.${shortId()}.tmp`;
    await fs.writeFile(tmp, content, 'utf-8');
    await fs.rename(tmp, resolved);
    return true;
  } catch {
    return false;
  }
}

/** Copies a file into a sibling .backup directory and returns the backup path. */
export async function backupFile(filePath: string): Promise<string | null> {
  try {
    const resolved = resolvePath(filePath);
    const content = await fs.readFile(resolved, 'utf-8');
    const backupDir = join(dirname(resolved), '.backup');
    await fs.mkdir(backupDir, { recursive: true });
    const stamp = isoTimestamp().replace(/[:.]/g, '-');
    const backupPath = join(backupDir, `${basename(filePath)}.${stamp}`);
    await fs.writeFile(backupPath, content, 'utf-8');
    return backupPath;
  } catch {
    return null;
  }
}

/** Returns simple line-oriented differences between two strings. */
export function simpleDiff(oldText: string, newText: string): string[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const changes: string[] = [];

  for (let i = 0; i < Math.max(oldLines.length, newLines.length); i++) {
    if (oldLines[i] !== newLines[i]) {
      if (oldLines[i] !== undefined) changes.push(`- ${oldLines[i]}`);
      if (newLines[i] !== undefined) changes.push(`+ ${newLines[i]}`);
    }
  }
  return changes;
}

/** Lists backups in the sibling .backup directory. */
export async function listBackups(filePath: string): Promise<string[]> {
  try {
    const resolved = resolvePath(filePath);
    const backupDir = join(dirname(resolved), '.backup');
    const files = await fs.readdir(backupDir);
    const name = basename(filePath);
    return files.filter(f => f.startsWith(name)).sort().reverse();
  } catch {
    return [];
  }
}
