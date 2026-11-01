# Feature: Identification and Access

## Goal

Ensure that each action in DroneAid Warehouse is performed by an identifiable
person with an appropriate role. The feature protects sensitive donor,
recipient, and shipment information while allowing community volunteers to do
their assigned work.

## Users and access levels

| Role | Primary access |
| --- | --- |
| Administrator | Manage users, roles, and all records; resolve access issues. |
| Warehouse / logistics coordinator | Manage component allocation and shipment updates. |
| Builder | View assigned builds, components, and assembly guidance; record build progress. |
| Mentor / quality controller | View relevant builds; create and resolve assembly or quality findings. |
| Flight-test staff | View approved drones; submit and review flight-test results. |
| Donor | Deferred to the next version; no donor-facing access exists in the MVP. |

A person may hold more than one operational role. Permissions must be granted
by role, not by a user's job title alone. The application should deny access by
default when no permission has been assigned.

## Core workflow

1. An invited user opens the application and signs in using an approved
   identity method.
2. On first access, an administrator assigns one or more roles.
3. The application shows the user only the functions and records permitted by
   those roles.
4. A user can sign out at any time. Administrators can deactivate an account,
   immediately preventing new access while preserving the audit record.
5. Material actions—such as changing drone status, recording a defect, or
   confirming delivery—store the acting user's identity and time.

## Requirements

- Require authentication for all non-public pages and API endpoints.
- Use unique accounts; do not share community logins.
- Allow an administrator to invite, activate, deactivate, and assign roles to
  internal users.
- Do not provide donor-facing accounts or progress pages in the MVP. When the
  deferred donor role is introduced, it must not expose other donations, build
  notes, recipient contact details, or internal issue records.
- Protect personal and delivery data with least-privilege access.
- Record sign-in-related administration events and changes to roles or account
  status in an audit trail.
- Present clear messages for unauthorized access without exposing protected
  information.

## Initial local implementation

The API provides `POST /api/auth/login`, which validates the supplied username
and password against the PostgreSQL `users` table. On a new local database, it
creates the development-only administrator account `DAB_Test`; the requested
test password is stored only as a salted PBKDF2 hash. This seed account exists
solely to verify the initial end-to-end login flow and must be replaced or
removed before any public deployment.

The responsive Angular login page calls this endpoint through `/api`, allowing
the same-origin Docker deployment and the local development proxy to use the
same request. The first response identifies the authenticated user and role.
Persistent sessions, access tokens, password reset, and production
identity-provider integration remain to be implemented before this can protect
operational features.

## Decisions to make

Before implementation, decide the approved sign-in method (for example,
email/password, passwordless email link, or a community identity provider),
whether the deferred donor access uses accounts or secure progress links,
required multi-factor authentication for administrators, password-reset
ownership, and account-retention rules. These decisions should be documented
here once agreed.
