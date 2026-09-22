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

### Docker

The multi-stage [Dockerfile](Dockerfile) builds the web app and packages it together with the Node.js API server into a single image:

```sh
docker build -t http-shortcuts-editor .
docker run --name http-shortcuts-editor -p 3000:3000 -v hse-store:/app/server/store http-shortcuts-editor
```

The editor is then available at `http://localhost:3000/editor/`. The volume at `/app/server/store` persists the temporary JSON files that the app pushes to the editor (omit the `-v` flag if you don't need persistence). Use `-e PORT=...` to change the listening port.

The image starts its entrypoint as root, repairs the ownership of a mounted
`/app/server/store` (this fixes `EACCES` on volumes that were created by an
earlier root-owned run), then drops to the unprivileged `node` user
(uid/gid 1000) before launching the server. So named volumes and bind mounts
work out of the box. Options:

- `-e HSE_KEEP_ROOT=1` – stay root (handy when the host deployment itself runs as root)
- `--user 1000:1000` – skip the ownership repair entirely (the directory must already be writable)
- `-e PORT=...` – change the listening port

If the store directory is still not writable, the server logs a warning at
startup and answers saves with `500 {"error":"write failed"}` instead of
crashing. You can repair a named volume manually with:

```sh
docker run --rm -v hse-store:/store alpine chown -R 1000:1000 /store
```

### API Server

The API server accepts incoming `GET` and `POST` requests at `/editor/api/files`.
It uses HTTP Basic Auth where the username is the device ID (as shown inside the HTTP Shortcuts app).
Uploaded data is stored as temporary JSON files named after `md5(deviceId:password)` under `server/store/` and is automatically deleted after 2 hours of inactivity, mirroring the behavior of the original PHP backend.

## Acknowledgements

This project uses
- [Vue.Draggable](https://github.com/SortableJS/Vue.Draggable) (MIT License)
- [CodeMirror](https://codemirror.net/) (MIT License)
- [Hono](https://honojs.dev/) (MIT License)
