import { mkdtemp, readFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { describe, it, expect } from 'vitest';
import {
  backupFile,
  listBackups,
  resolvePath,
  simpleDiff,
  tryReadFile,
  tryWriteFile,
} from '../fs';

describe('fs helpers', () => {
  it('resolves home-relative paths', () => {
    expect(resolvePath('~/example')).toContain('/example');
  });

  it('reads and writes files safely', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'linger-utils-fs-'));
    const file = join(dir, 'nested', 'file.txt');

    try {
      await expect(tryWriteFile(file, 'hello')).resolves.toBe(true);
      await expect(tryReadFile(file)).resolves.toBe('hello');
      await expect(readFile(file, 'utf-8')).resolves.toBe('hello');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('uses unique temp files for concurrent writes to the same path', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'linger-utils-fs-'));
    const file = join(dir, 'shared.txt');

    try {
      const results = await Promise.all([
        tryWriteFile(file, 'first'),
        tryWriteFile(file, 'second'),
      ]);

      expect(results).toEqual([true, true]);
      expect(['first', 'second']).toContain(await readFile(file, 'utf-8'));
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('creates and lists backups', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'linger-utils-fs-'));
    const file = join(dir, 'file.txt');

    try {
      await tryWriteFile(file, 'content');
      const backupPath = await backupFile(file);
      expect(backupPath).toContain('.backup');
      await expect(listBackups(file)).resolves.toHaveLength(1);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('returns simple line diffs', () => {
    expect(simpleDiff('a\nb', 'a\nc')).toEqual(['- b', '+ c']);
  });
});
