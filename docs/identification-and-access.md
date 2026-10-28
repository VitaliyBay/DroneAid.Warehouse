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
| Warehouse / logistics coordinator | Manage component allocation, shipment, and receipt updates. |
| Builder | View assigned builds, components, and assembly guidance; record build progress. |
| Mentor / quality controller | View relevant builds; create and resolve assembly or quality findings. |
| Flight-test staff | View approved drones; submit and review flight-test results. |
| Donor | View only the progress and destination information explicitly linked to their donation. |

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
- Give donors a restricted view with no access to other donations, build notes,
  recipient contact details, or internal issue records.
- Protect personal and delivery data with least-privilege access.
- Record sign-in-related administration events and changes to roles or account
  status in an audit trail.
- Present clear messages for unauthorized access without exposing protected
  information.

## Decisions to make

Before implementation, decide the approved sign-in method (for example,
email/password, passwordless email link, or a community identity provider),
whether donor access uses accounts or secure progress links, required
multi-factor authentication for administrators, password-reset ownership, and
account-retention rules. These decisions should be documented here once agreed.
