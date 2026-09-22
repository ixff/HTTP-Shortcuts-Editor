/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    // Served under the `/editor` sub-path, same as the original `publicPath`
    base: '/editor/',
    plugins: [vue()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    server: {
        proxy: {
            // In dev, forward the API calls to the Node backend
            '/editor/api/files': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            },
        },
    },
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/unit/**/*.spec.ts'],
    },
});
