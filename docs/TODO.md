# Repository To-Do

This is the living checklist for work needed to turn the documented plan into a
safe, usable DroneAid Warehouse application. Check off an item only when the
work is completed and validated; add newly discovered work in the relevant
section.

## Product and feature decisions

- [ ] Confirm supported drone models and their build configurations.
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

- [ ] Quality control inspection and approval.
- [ ] Flight-test records and failure handling.
- [ ] Shipment, recipient confirmation, and delivery tracking.
- [ ] Donations and donor-facing progress updates.
- [ ] Notifications and reminders.
- [ ] Reporting and operational dashboards.

## Application foundation

- [x] Create the Angular frontend workspace and ASP.NET Core API solution.
- [x] Create the initial PostgreSQL user schema for local development.
- [ ] Replace development database initialization with versioned EF Core
  migrations before production.
- [ ] Implement authentication, role-based authorization, and audit logging.
- [x] Add Dockerfiles and a Docker Compose setup for web, API, and database.
- [x] Configure local environment-based database credentials without committing
  the `.env` file.
- [ ] Establish API error handling, validation, logging, and health checks.

## Quality and user experience

- [x] Add initial automated unit tests for password hashing and login behavior.
- [ ] Add database-backed integration tests and browser end-to-end tests.
- [ ] Set formatting, linting, static analysis, and test checks in CI.
- [ ] Verify all core workflows on phone, tablet, laptop, and desktop viewports.
- [ ] Review accessibility: keyboard operation, labels, focus, contrast, and
  readable error messages.
- [ ] Define privacy, retention, and deletion rules for donor, recipient, and
  shipment data.

## Deployment and operations

- [ ] Verify the Docker Compose stack end-to-end with Docker Desktop running:
  sign in through the browser and confirm PostgreSQL contains the seeded user.
- [ ] Choose the host, deployment region, domain name, and production owner.
- [ ] Configure HTTPS, firewall rules, and least-privilege server access.
- [ ] Automate encrypted off-host PostgreSQL backups and test restoration.
- [ ] Set up monitoring, error reporting, and an incident-response contact.
- [ ] Create a staging environment and a documented deployment/rollback process.
