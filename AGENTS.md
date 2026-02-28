# AGENTS.md

## Cursor Cloud specific instructions

This is a pnpm monorepo (pnpm v10.30.3, Node >=20) for the 雷檬云 (LeiMengYun) diabetes management platform.

### Services

| App | Path | Dev command | Port |
|-----|------|-------------|------|
| patient-h5 | `apps/patient-h5` | `pnpm dev:patient` | 5173 |
| doctor-h5 | `apps/doctor-h5` | `pnpm dev:doctor` | 5174 |
| server (NestJS) | `apps/server` | `pnpm dev:server` | 3000 |
| shared lib | `packages/shared` | N/A (consumed as workspace dep) | N/A |

### Key commands (run from repo root)

- **Install deps:** `pnpm install`
- **Lint:** `pnpm lint`
- **Dev (all):** `pnpm dev`
- **Dev (single app):** `pnpm dev:doctor`, `pnpm dev:patient`, `pnpm dev:server`
- **Build:** `pnpm build`

### Caveats

- The H5 frontends (patient-h5, doctor-h5) proxy `/api` to `http://localhost:3000` via Vite config; the NestJS server must be running for API calls to work.
- The `@leimengyun/shared` package is referenced as `workspace:*`; pnpm resolves it automatically.
- `pnpm.onlyBuiltDependencies` is configured in the root `package.json` for Prisma and NestJS packages to avoid interactive build prompts.
