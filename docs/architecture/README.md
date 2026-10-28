# Architecture

## Purpose and scope

DroneAid Warehouse will be a public-facing web application: anyone can reach
the site, but non-public functions and data require authenticated access. The
first architecture favors a small, understandable deployment that can grow
without redesigning the application.

## Proposed application architecture

```text
Browser
  │ HTTPS
  ▼
Reverse proxy / web server
  ├── Angular single-page application
  └── ASP.NET Core Web API
            │ private network only
            ▼
       PostgreSQL database
```

- **Frontend:** Angular, compiled to static files. It provides the browser UI
  and calls the API over HTTPS.
- **Backend:** ASP.NET Core Web API. It implements authentication,
  authorization, workflow rules, validation, auditing, and data access. It is
  the only component allowed to connect to the database.
- **Database:** PostgreSQL. It stores operational data such as users, roles,
  drones, components, issues, test results, and shipment milestones.
- **Reverse proxy:** Caddy is the preferred initial choice because it serves
  the Angular files, routes `/api` to the backend, and manages HTTPS
  certificates automatically. Nginx is an acceptable alternative.

The API and database must never be exposed directly to the public internet.
Only ports 80 and 443 are public. Database credentials, token-signing keys,
and connection strings belong in deployment secrets or a server-side `.env`
file, never in Git or the Angular bundle.

## Responsive user experience

The application must be usable on smartphones, tablets, laptops, and desktop
computers. Angular views should use responsive layouts that reflow content for
small screens rather than relying on a desktop-sized interface or horizontal
page scrolling. Every core workflow—sign-in, build progress, issue reporting,
quality control, flight tests, and shipment updates—must remain complete and
practical on a phone as well as on a larger screen.

Design for touch and keyboard interaction, readable text, accessible labels,
and clear feedback at all supported viewport sizes. Dense information such as
tables may adapt into cards or provide a deliberate, usable horizontal scroll;
critical actions and status must not be hidden. Verify user-facing changes at
phone, tablet, laptop, and wide-desktop viewport widths before release.

## Docker deployment

Use Docker Compose for local development and the first deployment. The planned
services are `web` (Angular/Caddy), `api` (ASP.NET Core), and `db`
(PostgreSQL). PostgreSQL uses a named persistent volume. The compose file must
define health checks, restart policies, environment-based configuration, and
an internal network for the API and database.

Back up the PostgreSQL database off the server on a regular schedule and test
restoration before relying on the application. A server backup alone is not a
sufficient database recovery plan.

## Hosting recommendation

For a proof of concept or small community launch, use one Oracle Cloud
Always Free Ampere A1 Linux VM in the account's home region, running the Docker
Compose stack. Oracle currently includes up to 2 Arm OCPUs, 12 GB memory, and
200 GB block storage under its Always Free allowance. Container images must
support `linux/arm64`. This is the lowest-cost approach, but capacity may be
unavailable and Oracle may reclaim an idle Always Free instance; it is not the
best choice for a service that must be continuously dependable.

For a dependable launch, migrate the same Compose deployment to a small paid
EU VPS with a static public IP and daily off-host backups. This keeps the
architecture portable and avoids coupling to a platform. Obtain the current
price from the provider at purchase time; provider pricing and free-tier terms
change frequently.

Do not use a temporary free backend/database tier for operational records.
For example, Render's free web services spin down after inactivity and its free
PostgreSQL databases expire after 30 days, making them suitable only for demos.

## Future evolution

Keep the frontend and API deployable separately. If demand grows, move
PostgreSQL to a managed service, store photos and documents in object storage,
and add automated deployments, monitoring, error reporting, and a separate
staging environment. These changes should preserve the HTTPS API contract and
not change feature behavior.

## Decisions to make

Confirm the hosting region, domain registrar, backup destination and retention,
expected number of active users, photo/document storage needs, and who owns
production access and incident response. Select the identity provider before
implementing authentication.
