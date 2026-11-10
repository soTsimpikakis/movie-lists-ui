# Frontend cheatsheet

Run from `C:\Personal\movie-lists\frontend`. The backend has its own
[CHEATSHEET.md](https://github.com/soTsimpikakis/movie-lists-api/blob/main/CHEATSHEET.md)
(accounts, migrations, server).

| What | Command |
|---|---|
| Run everything (DB, API, UI) | `..\dev.ps1` |
| UI only (needs the API on :8000) | `npm run dev`, then open http://localhost:5173 |
| Install packages | `npm install` |
| Unit tests (once / watch) | `npm run test:unit -- --run` / `npm run test:unit` |
| Lint (fixes what it can) | `npm run lint` |
| Format | `npx prettier --write src` |
| Type check | `npm run type-check` |
| Production build (type check + build to `dist/`) | `npm run build` |
| Preview the production build | `npm run preview` |
| Dependency audit | `npm audit --omit=dev` |

On the server the UI is built inside the `web` container, so there's nothing to run here for
a deploy: pull, then `docker compose up -d --build web` from `backend/deploy`.

Where things live: screens in `src/views/`, pieces in `src/components/`, API types in
`src/api/types.ts`, colours, fonts and buttons in `src/assets/main.css`.
