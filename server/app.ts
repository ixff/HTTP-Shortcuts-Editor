import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Hono } from 'hono';

export const RETENTION_MS = 2 * 60 * 60 * 1000; // 2 hours, same as the original cleanup.php

const DEFAULT_STORE_DIR = path.join(process.cwd(), 'server', 'store');
const DEFAULT_DIST_DIR = path.join(process.cwd(), 'dist');

const MIME_TYPES: Record<string, string> = {
    '.html': 'text/html; charset=UTF-8',
    '.js': 'text/javascript; charset=UTF-8',
    '.css': 'text/css; charset=UTF-8',
    '.json': 'application/json; charset=UTF-8',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.png': 'image/png',
    '.map': 'application/json; charset=UTF-8',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
};

export interface AppConfig {
    storeDir?: string;
    distDir?: string;
}

/**
 * Decodes an HTTP Basic Auth header into [username, password],
 * or returns null if the header is missing or malformed.
 */
export function parseBasicAuth(header: string | undefined): [string, string] | null {
    if (!header || !header.startsWith('Basic ')) {
        return null;
    }
    let decoded: string;
    try {
        decoded = Buffer.from(header.slice('Basic '.length), 'base64').toString('utf8');
    } catch {
        return null;
    }
    const separatorIndex = decoded.indexOf(':');
    if (separatorIndex === -1) {
        return null;
    }
    return [decoded.slice(0, separatorIndex), decoded.slice(separatorIndex + 1)];
}

/**
 * Same naming scheme as the original PHP backend:
 * the store file is named after md5(deviceId:password).
 */
export function getStoreFilePath(storeDir: string, deviceId: string, password: string): string {
    const hash = createHash('md5').update(`${deviceId}:${password}`).digest('hex');
    return path.join(storeDir, `${hash}.json`);
}

/**
 * Deletes all store files that have not been modified for RETENTION_MS.
 * Equivalent of the original cleanup.php cron job.
 */
export async function cleanupExpiredFiles(
    storeDir: string = DEFAULT_STORE_DIR,
    now: number = Date.now(),
): Promise<void> {
    let entries: string[];
    try {
        entries = await readdir(storeDir);
    } catch {
        return;
    }
    for (const entry of entries) {
        if (!entry.endsWith('.json')) {
            continue;
        }
        const filePath = path.join(storeDir, entry);
        try {
            const info = await stat(filePath);
            if (now - info.mtimeMs >= RETENTION_MS) {
                await unlink(filePath);
            }
        } catch {
            // ignore files that disappeared in the meantime
        }
    }
}

export function createApp(config: AppConfig = {}): Hono {
    const storeDir = config.storeDir ?? DEFAULT_STORE_DIR;
    const distDir = config.distDir ?? DEFAULT_DIST_DIR;

    const app = new Hono();

    mkdir(storeDir, { recursive: true }).catch(() => {
        // will surface on first write
    });

    const filesHandler = async (c: any) => {
        const credentials = parseBasicAuth(c.req.header('authorization'));
        if (!credentials) {
            // The original PHP backend responds with a bare 401
            return c.body(null, 401);
        }
        const [deviceId, password] = credentials;
        const filePath = getStoreFilePath(storeDir, deviceId, password);

        const method = c.req.method;
        if (method === 'GET') {
            try {
                const content = await readFile(filePath);
                return c.body(content, 200, { 'Content-Type': 'application/json' });
            } catch {
                return c.json({ error: 'not found' }, 404);
            }
        }
        if (method === 'POST') {
            const body = Buffer.from(await c.req.arrayBuffer());
            await writeFile(filePath, body);
            return c.json({ status: 'ok' });
        }
        return c.json({ error: 'method not allowed' }, 405);
    };

    // Same endpoints as the original `/editor/api/files/index.php`
    app.all('/editor/api/files', filesHandler);
    app.all('/editor/api/files/', filesHandler);

    // Serve the built SPA under `/editor`, mirroring the old Apache setup
    app.get('/editor', (c) => c.redirect('/editor/'));
    app.get('/editor/', async (c) => {
        try {
            const content = await readFile(path.join(distDir, 'index.html'));
            return c.body(content, 200, { 'Content-Type': 'text/html; charset=UTF-8' });
        } catch {
            return c.text('Build not found. Run "npm run build" first.', 503);
        }
    });
    app.get('/editor/*', async (c, next) => {
        const relativePath = decodeURIComponent(c.req.path.replace(/^\/editor\/?/, ''));
        const filePath = path.join(distDir, relativePath);
        if (!filePath.startsWith(distDir) || !existsSync(filePath)) {
            return next();
        }
        const mimeType = MIME_TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';
        const content = await readFile(filePath);
        return c.body(content, 200, { 'Content-Type': mimeType });
    });

    return app;
}
