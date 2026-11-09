---
name: verify-local-stack
description: "Start and verify the local Angular, ASP.NET Core, and PostgreSQL Docker stack without destroying retained development data."
---

# Verify Local Stack

Use this skill to validate the locally runnable application after integration,
Docker, or authentication changes. It does not deploy to a public host.

Read `README.md`, `compose.yaml`, and the relevant feature documentation.
Confirm that Docker Desktop is running and that a local `.env` exists with a
non-placeholder `POSTGRES_PASSWORD`; never add `.env` to Git. Start with
`docker compose up --build --detach`, then inspect `docker compose ps` and
service logs if a container is unhealthy.

Verify the browser-facing route at `http://localhost:4200`, the API health
endpoint through the web proxy, and the documented local login account. Check
both valid and invalid login outcomes without printing the database password.
Do not run `docker compose down -v`, delete volumes, reset the database, or
change production configuration unless the user explicitly requests it.

Record the verification result in the current task and update `docs/TODO.md`
when an outstanding local-stack verification item is completed or a new problem
is discovered.
