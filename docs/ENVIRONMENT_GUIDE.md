# Environment Guide

## Local Development
Database: `hotel_ops`
Purpose: local development and manual UAT

## Automated Test
Database: `hotel_ops_test`
Purpose: pytest/integration tests

## Staging
Database: `hotel_ops_staging`
Purpose: Cypress, release validation, manual UAT

## Production
Database: `hotel_ops_prod`
Purpose: live hotel operations

## Rules

- Never run Cypress against production.
- Never use production data for automated tests.
- Every environment has its own database and secrets.
- Migrations run independently against each environment.
- Application credentials are never changed by migrations.
- Local UAT admin credentials are deterministic:
  - username: `admin`
  - password: `admin`
  - role: `admin`
- Staging and production credentials must never use local defaults.

## Bootstrap Ownership

| Environment | Identity/Data Bootstrap |
|---|---|
| Local | `scripts/reset-local-admin.sh` |
| Test | pytest fixtures/factories |
| Staging | explicit staging bootstrap script + secret |
| Production | controlled operator provisioning |

## Critical Rule

Migrations create and evolve schema only.

Migrations must never:
- create application passwords
- reset application passwords
- change application roles
- create production identities
