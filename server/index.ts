import { serve } from '@hono/node-server';
import { checkStoreWritable, cleanupExpiredFiles, createApp } from './app';

const PORT = Number(process.env.PORT ?? 3000);

const app = createApp();

// Fail loudly at startup instead of on the first save: if the store
// directory is not writable (typically a volume owned by root while the
// server runs as uid 1000), every upload would end in EACCES.
checkStoreWritable().then((writable) => {
    if (!writable) {
        const uid = process.getuid?.() ?? 'unknown';
        console.error(
            `[warn] The store directory is not writable by uid ${uid}; ` +
            'saving from the app will fail with "write failed".\n' +
            'Fix the mounted volume ownership, e.g.:\n' +
            '  docker run --rm -v hse-store:/store alpine chown -R 1000:1000 /store\n' +
            'or start the container without --user so docker-entrypoint.sh can repair it.',
        );
    }
});

// Periodic cleanup of stale store files (every 10 minutes, threshold of 2 hours)
cleanupExpiredFiles();
setInterval(() => {
    cleanupExpiredFiles();
}, 10 * 60 * 1000);

serve({
    fetch: app.fetch,
    port: PORT,
}, (info) => {
    console.log(`HTTP Shortcuts Editor backend listening on http://localhost:${info.port}`);
    console.log('Serving the editor at /editor/ (after "npm run build")');
});
