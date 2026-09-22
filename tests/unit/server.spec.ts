import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, stat, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
    checkStoreWritable,
    cleanupExpiredFiles,
    createApp,
    getStoreFilePath,
    parseBasicAuth,
    RETENTION_MS,
} from '../../server/app';

const AUTH = `Basic ${Buffer.from('device-1:secret').valueOf().toString('base64')}`;

describe('parseBasicAuth', () => {
    it('parses valid credentials', () => {
        expect(parseBasicAuth(AUTH)).toEqual(['device-1', 'secret']);
    });

    it('returns null for missing header', () => {
        expect(parseBasicAuth(undefined)).toBeNull();
    });

    it('returns null for non-basic auth', () => {
        expect(parseBasicAuth('Bearer token123')).toBeNull();
    });
});

describe('files API', () => {
    let storeDir: string;

    beforeEach(async () => {
        storeDir = await mkdtemp(path.join(tmpdir(), 'hse-store-'));
    });

    afterEach(async () => {
        await rm(storeDir, { recursive: true, force: true });
    });

    function makeApp() {
        return createApp({ storeDir, distDir: path.join(storeDir, 'dist') });
    }

    it('responds with 401 when no credentials are provided', async () => {
        const app = makeApp();
        const res = await app.request('/editor/api/files/');
        expect(res.status).toBe(401);
    });

    it('responds with 404 for unknown store files', async () => {
        const app = makeApp();
        const res = await app.request('/editor/api/files/', {
            headers: { Authorization: AUTH },
        });
        expect(res.status).toBe(404);
        expect(await res.json()).toEqual({ error: 'not found' });
    });

    it('stores posted data under md5(deviceId:password).json', async () => {
        const app = makeApp();
        const payload = JSON.stringify({ version: 43, categories: [], variables: [] });

        const postRes = await app.request('/editor/api/files/', {
            method: 'POST',
            headers: { Authorization: AUTH, 'Content-Type': 'application/json' },
            body: payload,
        });
        expect(postRes.status).toBe(200);
        expect(await postRes.json()).toEqual({ status: 'ok' });

        const filePath = getStoreFilePath(storeDir, 'device-1', 'secret');
        expect(path.basename(filePath))
            .toBe(`${createHash('md5').update('device-1:secret').digest('hex')}.json`);
        expect(await readFile(filePath, 'utf8')).toBe(payload);

        const getRes = await app.request('/editor/api/files/', {
            headers: { Authorization: AUTH },
        });
        expect(getRes.status).toBe(200);
        expect(await getRes.text()).toBe(payload);
    });

    it('rejects methods other than GET and POST with 405', async () => {
        const app = makeApp();
        const res = await app.request('/editor/api/files/', {
            method: 'DELETE',
            headers: { Authorization: AUTH },
        });
        expect(res.status).toBe(405);
        expect(await res.json()).toEqual({ error: 'method not allowed' });
    });

    it('responds with 500 {error: write failed} when the store is unwritable', async () => {
        // A plain file used as the store directory makes every write fail
        // (ENOTDIR/ENOENT), which is what EACCES on a read-only volume looks
        // like in the handler.
        const blockedDir = path.join(tmpdir(), `hse-blocked-${Date.now()}.json`);
        await writeFile(blockedDir, '');
        try {
            const app = createApp({
                storeDir: blockedDir,
                distDir: path.join(storeDir, 'dist'),
            });
            const res = await app.request('/editor/api/files/', {
                method: 'POST',
                headers: { Authorization: AUTH },
                body: '{"x":1}',
            });
            expect(res.status).toBe(500);
            expect(await res.json()).toEqual({ error: 'write failed' });
        } finally {
            await rm(blockedDir, { force: true });
        }
    });

    it('treats different credentials as different store files', async () => {
        const app = makeApp();
        await app.request('/editor/api/files/', {
            method: 'POST',
            headers: { Authorization: AUTH },
            body: '{"mine":true}',
        });

        const otherAuth = `Basic ${Buffer.from('device-1:wrong-password').toString('base64')}`;
        const res = await app.request('/editor/api/files/', {
            headers: { Authorization: otherAuth },
        });
        expect(res.status).toBe(404);
    });
});

describe('cleanupExpiredFiles', () => {
    let storeDir: string;

    beforeEach(async () => {
        storeDir = await mkdtemp(path.join(tmpdir(), 'hse-cleanup-'));
    });

    afterEach(async () => {
        await rm(storeDir, { recursive: true, force: true });
    });

    it('removes files older than the retention threshold', async () => {
        const stale = path.join(storeDir, 'stale.json');
        const fresh = path.join(storeDir, 'fresh.json');
        await writeFile(stale, '{}');
        await writeFile(fresh, '{}');

        const now = Date.now();
        const oldTime = (now - RETENTION_MS - 60_000) / 1000;
        await utimes(stale, oldTime, oldTime);

        await cleanupExpiredFiles(storeDir, now);

        await expect(stat(stale)).rejects.toThrow();
        await expect(stat(fresh)).resolves.toBeDefined();
    });
});

describe('checkStoreWritable', () => {
    it('returns true for a writable directory (creating it if needed)', async () => {
        const base = await mkdtemp(path.join(tmpdir(), 'hse-probe-'));
        try {
            const missing = path.join(base, 'store');
            await expect(checkStoreWritable(missing)).resolves.toBe(true);
            // The probe file must not be left behind.
            await expect(stat(path.join(missing, '.write-probe'))).rejects.toThrow();
        } finally {
            await rm(base, { recursive: true, force: true });
        }
    });

    it('returns false when the store path cannot be written', async () => {
        const base = await mkdtemp(path.join(tmpdir(), 'hse-probe-'));
        try {
            const blocked = path.join(base, 'not-a-dir.json');
            await writeFile(blocked, '');
            await expect(checkStoreWritable(blocked)).resolves.toBe(false);
        } finally {
            await rm(base, { recursive: true, force: true });
        }
    });
});
