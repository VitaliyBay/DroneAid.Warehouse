# DroneAid.Warehouse

DroneAid Barcelona is a responsive Angular and ASP.NET Core application for
tracking community drone builds from components through delivery.

## Run locally with Docker

Prerequisites: Docker Desktop with Docker Compose.

1. Create a local-only environment file and choose a database password:

   ```powershell
   Copy-Item .env.example .env
   ```

2. Replace the placeholder password in `.env`, then start the stack:

   ```powershell
   docker compose up --build
   ```

3. Open http://localhost:4200 and sign in with `DAB_Test` and `qwerty123`.

The browser talks to the API through Caddy at `/api`; the API connects to
PostgreSQL on Docker's internal network. The database is stored in the
`postgres-data` Docker volume. Stop the stack with `docker compose down`;
the volume and its data remain available for the next start.

The seeded account is for local verification only. Replace or remove it before
deploying any public environment.
