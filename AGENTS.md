# AGENTS.md

## Cursor Cloud specific instructions

### Project Overview

雷檬云 (LeiMengYun) is a diabetes health management platform with three services:

| Service | Port | Directory | Command |
|---|---|---|---|
| Backend API | 3000 | `apps/server` | `pnpm dev:server` |
| Patient H5 | 5173 | `apps/patient-h5` | `pnpm dev:patient` |
| Doctor H5 | 5174 | `apps/doctor-h5` | `pnpm --filter @leimengyun/doctor-h5 dev` |

### Infrastructure

- **Database**: PostgreSQL 16 via Docker Compose (`docker compose up -d`)
- **Cache**: Redis 7 via Docker Compose
- **Connection**: `postgresql://leimengyun:leimengyun123@localhost:5432/leimengyun`

### Key Development Notes

- **Docker must be running** before starting the backend. Use `sudo dockerd &` if the daemon isn't started, then `docker compose up -d`. In Cloud Agent VMs you may need `sudo chmod 666 /var/run/docker.sock` to fix permission errors.
- **Prisma migrations**: Run `cd apps/server && npx prisma migrate dev` after schema changes.
- **Prisma client**: Run `cd apps/server && npx prisma generate` after pulling schema changes.
- **Backend TypeScript**: The server `tsconfig.json` has `incremental: false` due to a stale-cache issue with NestJS watch mode. Do not re-enable it.
- **Swagger docs** are available at `http://localhost:3000/api/docs` when the backend is running.
- **Auth for dev**: The login API accepts any 6-digit code (e.g. `123456`) and auto-creates users.
- **Admin account**: To create an admin, set a user's role to `ADMIN` in the database, e.g. `UPDATE users SET role = 'ADMIN' WHERE phone = '13800138000';` — then log in with that phone in the doctor H5 app to access 「审核医生」.
- **All services** can be started simultaneously with `pnpm dev` from the workspace root.
- **Frontend proxy**: Both Vue3 apps proxy `/api` requests to `localhost:3000` via Vite config.
- **Server .env file**: Must exist at `apps/server/.env` (copy from `.env.example` at the repo root if missing). The update script handles this automatically.
- **Docker in Cloud Agent VMs**: Requires `fuse-overlayfs` storage driver and `iptables-legacy`. See the Docker setup steps in the update script / VM snapshot for details.
- **Enum values for patient profile**: `diabetesType` must be one of `TYPE_1`, `TYPE_2`, `GESTATIONAL`, `OTHER`; `treatmentPlan` must be one of `CSII`, `MDI`, `ORAL`, `LIFESTYLE` (defined in `apps/server/prisma/schema.prisma`).
