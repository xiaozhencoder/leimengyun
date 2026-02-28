# AGENTS.md

## Cursor Cloud specific instructions

This is a **pnpm monorepo** (pnpm v10, Node >= 20) for the 雷檬云 diabetes management platform.

### Workspace structure

| Package | Description |
|---|---|
| `apps/server` | NestJS backend (port 3000) |
| `apps/patient-h5` | Vue 3 + Vite + Vant 4 patient mobile web (port 5173) |
| `apps/doctor-h5` | Vue 3 + Vite + Vant 4 doctor mobile web (port 5174) |
| `packages/shared` | Shared types and utilities |

### Key commands

- **Install deps:** `pnpm install` (from repo root)
- **Dev all:** `pnpm dev` (starts all apps in parallel)
- **Dev patient-h5 only:** `pnpm dev:patient`
- **Dev doctor-h5 only:** `pnpm dev:doctor`
- **Dev server only:** `pnpm dev:server`
- **Lint:** `pnpm lint`
- **Build patient-h5:** `pnpm --filter @leimengyun/patient-h5 build`

### Caveats

- The ESLint config (`eslint.config.js`) does not configure `@typescript-eslint/parser` for `.vue` files' `<script>` blocks. This causes parsing errors on inline TypeScript annotations in Vue templates (e.g., `(a:any)=>`). This is a pre-existing issue across both `doctor-h5` and `patient-h5`.
- Vite dev server ports may auto-increment if the default port is in use (5173 -> 5174 -> 5175, etc.).
- The `patient-h5` and `doctor-h5` apps proxy `/api` requests to `http://localhost:3000` (the NestJS server). The frontend apps work standalone with mock data for UI development but need the server running for API calls.
