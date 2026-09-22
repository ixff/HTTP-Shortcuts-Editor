# HTTP Shortcuts Editor

This editor allows editing shortcuts from the [HTTP Shortcuts](https://github.com/Waboodoo/HTTP-Shortcuts) app remotely, from the comfort of a desktop browser.

It is deployed here: [http-shortcuts.rmy.ch/editor](https://http-shortcuts.rmy.ch/editor)

## Tech Stack

- **Frontend**: Vue 3 (Composition API) + TypeScript + Vite + Pinia + vue-router (hash mode) + CodeMirror 6 + vue-i18n
- **Backend**: Node.js + TypeScript ([Hono](https://honojs.dev/)), replacing the previous single-file PHP backend
- **Tests**: Vitest

## Project Setup

```sh
npm install
npm run build     # build the web app into dist/
npm run test:unit # run the unit tests
```

For local development, run the backend and the Vite dev server in two terminals:

```sh
npm run dev:server  # API + static hosting on http://localhost:3000
npm run dev         # Vite dev server, proxies /editor/api/files to the backend
```

For production, a single process serves both the built web app and the API:

```sh
npm run build
npm start           # serves /editor/ and /editor/api/files on port 3000 (override with PORT)
```

You might want to remove the `history: createWebHashHistory('/editor')` base from [the router config](src/router/index.ts) and the `base: '/editor/'` option from [the Vite config](vite.config.ts) if you want to host the web app at the domain root instead of the `/editor` subpath.

### API Server

The API server accepts incoming `GET` and `POST` requests at `/editor/api/files`.
It uses HTTP Basic Auth where the username is the device ID (as shown inside the HTTP Shortcuts app).
Uploaded data is stored as temporary JSON files named after `md5(deviceId:password)` under `server/store/` and is automatically deleted after 2 hours of inactivity, mirroring the behavior of the original PHP backend.

## Acknowledgements

This project uses
- [Vue.Draggable](https://github.com/SortableJS/Vue.Draggable) (MIT License)
- [CodeMirror](https://codemirror.net/) (MIT License)
- [Hono](https://honojs.dev/) (MIT License)
