# Repository To-Do

This is the living checklist for work needed to turn the documented plan into a
safe, usable DroneAid Warehouse application. Check off an item only when the
work is completed and validated; add newly discovered work in the relevant
section.

## MVP: drone registry

Spec: `features/drone-registry-mvp.md`.

- [ ] Confirm MVP statuses (Available, In testing, Needs repair, Unavailable)
  and whether the drone code is editable after creation.
- [x] Add drone, component, issue, and flight-video data model and API
  (create, list with search/filter, detail, edit), with tests.
- [x] Seed default component lists for Analog and Digital types (reused from
  the existing build configurations).
- [x] Build the responsive list, filters, create form, and detail/edit pages.
- [x] Reduce the signed-in workspace to the registry; inventory/request screens
  are removed from the UI (their API remains for post-MVP).
- [x] Define the app style (`architecture/design-system.md`) and add global
  tokens and shared classes in `src/styles/`.
- [x] Apply the design system to the login and registry screens.
- [ ] Add Angular unit tests and browser end-to-end tests for the registry.
- [ ] Verify the registry on tablet, laptop, and desktop viewports (phone and
  one tablet-width pass done manually). Original item: verify the registry on phone, tablet, laptop, and desktop viewports.

- [x] Add Ukrainian, Spanish, and Catalan support (`features/localization.md`).
- [ ] Have native speakers review the Ukrainian, Spanish, and Catalan texts.
- [ ] Add automated checks for translations (key parity is compile-time
  checked; add unit tests for plural and date formatting).

## Product and feature decisions

These items belong to the post-MVP roadmap.

- [ ] Confirm the detailed part and model choices for the initial Digital and
  Analog drone configurations.
- [ ] Decide the authentication method, donor-access model, and administrator
  multi-factor authentication requirements.
- [ ] Finalize roles, permissions, and what information donors may see.
- [ ] Agree the drone-status workflow, approver rules, and handling of failed,
  cancelled, retired, or reworked drones.
- [ ] Define initial component categories, serial/batch tracking, and stocktake
  process.
- [ ] Define assembly-guide format, issue severities, and evidence needed to
  resolve an issue.

## Feature documentation to create

- [x] Quality control inspection and approval (documented in
  `features/quality-flight-and-delivery.md`).
- [x] Flight-test records and failure handling (documented in
  `features/quality-flight-and-delivery.md`).
- [x] Shipment, recipient confirmation, and delivery tracking (documented in
  `features/quality-flight-and-delivery.md`).
- [ ] Donations and donor-facing progress updates.
- [ ] Notifications and reminders.
- [ ] Reporting and operational dashboards.

## Application foundation

- [x] Add repository-local Claude Code skills and an optional pre-commit validation
  hook.
- [x] Create the Angular frontend workspace and ASP.NET Core API solution.
- [x] Create the initial PostgreSQL user schema for local development.
- [ ] Replace development database initialization with versioned EF Core
  migrations before production.
- [ ] Implement authentication, role-based authorization, and audit logging.
- [x] Add Dockerfiles and a Docker Compose setup for web, API, and database.
- [x] Configure local environment-based database credentials without committing
  the `.env` file.
- [x] Implement the first component-inventory slice: predefined Digital and
  Analog configurations, drone-request workflow, build-capacity calculation,
  audited component receipts and adjustments, and responsive workspace view.
- [x] Accept readable enum values, such as request priority `Normal`, in MVC
  API request payloads.
- [ ] Establish API error handling, validation, logging, and health checks.
- [ ] Add drone-specific component reservations, releases, and installation
  records after build configurations and drone records are available.

## Quality and user experience

- [x] Add initial automated unit tests for password hashing and login behavior.
- [ ] Add database-backed integration tests and browser end-to-end tests.
- [ ] Set formatting, linting, static analysis, and test checks in CI.
- [ ] Verify all core workflows on phone, tablet, laptop, and desktop viewports.
- [ ] Review accessibility: keyboard operation, labels, focus, contrast, and
  readable error messages.
- [ ] Define privacy, retention, and deletion rules for donor, recipient, and
  shipment data.
- [ ] Choose an organization-owned evidence-link provider, define access and
  retention rules, and verify backup/recovery for linked flight videos and
  attachments.

## Deployment and operations

- [ ] Verify the Docker Compose stack end-to-end with Docker Desktop running:
  sign in through the browser and confirm PostgreSQL contains the seeded user.
- [ ] Choose the host, deployment region, domain name, and production owner.
- [ ] Configure HTTPS, firewall rules, and least-privilege server access.
- [ ] Automate encrypted off-host PostgreSQL backups and test restoration.
- [ ] Set up monitoring, error reporting, and an incident-response contact.
- [ ] Create a staging environment and a documented deployment/rollback process.
