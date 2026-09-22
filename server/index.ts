import { serve } from '@hono/node-server';
import { cleanupExpiredFiles, createApp } from './app';

const PORT = Number(process.env.PORT ?? 3000);

const app = createApp();

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
