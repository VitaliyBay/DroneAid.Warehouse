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

- [ ] Create the Angular frontend workspace and ASP.NET Core API solution.
- [ ] Create the PostgreSQL schema and database migration strategy.
- [ ] Implement authentication, role-based authorization, and audit logging.
- [ ] Add Dockerfiles and a Docker Compose setup for web, API, and database.
- [ ] Configure environment-based secrets; do not commit credentials.
- [ ] Establish API error handling, validation, logging, and health checks.

## Quality and user experience

- [ ] Add automated unit, integration, and end-to-end tests.
- [ ] Set formatting, linting, static analysis, and test checks in CI.
- [ ] Verify all core workflows on phone, tablet, laptop, and desktop viewports.
- [ ] Review accessibility: keyboard operation, labels, focus, contrast, and
  readable error messages.
- [ ] Define privacy, retention, and deletion rules for donor, recipient, and
  shipment data.

## Deployment and operations

- [ ] Choose the host, deployment region, domain name, and production owner.
- [ ] Configure HTTPS, firewall rules, and least-privilege server access.
- [ ] Automate encrypted off-host PostgreSQL backups and test restoration.
- [ ] Set up monitoring, error reporting, and an incident-response contact.
- [ ] Create a staging environment and a documented deployment/rollback process.
