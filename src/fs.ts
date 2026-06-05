/**
 * 绫儿标准工具库 — 文件系统
 *
 * 用法：
 *   import { tryReadFile, tryWriteFile, backupFile, simpleDiff } from '.../linger-utils/src/fs';
 */

import { promises as fs } from 'fs';
import { dirname, basename, join, resolve } from 'path';

/** 解析 ~ 为 HOME 目录 */
export function resolvePath(p: string): string {
  return resolve(p.replace(/^~/, process.env.HOME || ''));
}

/** 安全读文件 — 失败返回 null */
export async function tryReadFile(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(resolvePath(filePath), 'utf-8');
  } catch {
    return null;
  }
}

/** 安全写文件 — 自动创建目录 */
export async function tryWriteFile(filePath: string, content: string): Promise<boolean> {
  try {
    const resolved = resolvePath(filePath);
    await fs.mkdir(dirname(resolved), { recursive: true });
    // 原子写入：先写临时文件再 rename
    const tmp = resolved + '.tmp';
    await fs.writeFile(tmp, content, 'utf-8');
    await fs.rename(tmp, resolved);
    return true;
  } catch {
    return false;
  }
}

/** 备份文件到 .backup/ 目录，返回备份路径 */
export async function backupFile(filePath: string): Promise<string | null> {
  try {
    const resolved = resolvePath(filePath);
    const content = await fs.readFile(resolved, 'utf-8');
    const backupDir = join(dirname(resolved), '.backup');
    await fs.mkdir(backupDir, { recursive: true });
    const backupPath = join(backupDir, `${basename(filePath)}.${Date.now()}`);
    await fs.writeFile(backupPath, content, 'utf-8');
    return backupPath;
  } catch {
    return null;
  }
}

/** 简易文本差异 */
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

/** 列出 .backup/ 目录下的备份 */
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
