# Environment Bootstrap & Credentials RCA

Date: 2026-09-17
Component: Environment / Authentication Bootstrap

## Incident

The local admin reset procedure could not be executed because the
`scripts/` directory did not exist.

The proposed reset script also assumed a fixed virtualenv location,
which did not match the active development environment reliably.

Staging was correctly migrated but contained zero staff records because
database migrations create schema, not application identities.

## Root Causes

### RCA-01 — Missing scripts directory
The repository did not yet contain the operational scripts directory.

### RCA-02 — Virtualenv path coupling
The reset script assumed `backend/.venv`, creating an unnecessary
dependency on one local Python environment layout.

### RCA-03 — No environment bootstrap contract
Migration, application configuration, identity provisioning, test data,
and staging bootstrap were not formally separated.

### RCA-04 — Staging identity strategy not yet implemented
Fresh staging databases have schema but no deterministic test/UAT
identity provisioning mechanism.

## Decisions

### Local
- Database: `hotel_ops`
- Username: `admin`
- Password: `admin`
- Role: `admin`
- Reset mechanism: `scripts/reset-local-admin.sh`
- Script must refuse staging and production databases.

### Test
- Database: `hotel_ops_test`
- Test identities/data are owned by automated test fixtures.
- No manual persistent admin dependency.

### Staging
- Database: `hotel_ops_staging`
- Credentials must be different from local defaults.
- Credentials must come from environment/secret configuration.
- Cypress must read credentials from environment variables.

### Production
- Database: `hotel_ops_prod`
- No default credentials.
- No local reset script.
- Identity provisioning must be controlled and auditable.

## Guardrails

- Migrations never create application passwords.
- Application startup never silently resets users.
- Local reset scripts may only target `hotel_ops`.
- Staging scripts may only target `hotel_ops_staging`.
- Production must reject development bootstrap operations.
- Secrets are never committed to Git.
- Automated tests must not depend on persistent manual database state.

## Acceptance Criteria

- [ ] Local reset works from a clean shell.
- [ ] Local reset cannot target staging.
- [ ] Local reset cannot target production.
- [ ] `admin/admin` always works in local UAT.
- [ ] Fresh test DB requires no manual identity setup.
- [ ] Staging bootstrap is explicit and secret-driven.
- [ ] Cypress credentials are environment-driven.
- [ ] Production has no default credential path.
- [ ] CI validates migration + environment bootstrap assumptions.

## Related Architecture

- Environment isolation
- Configuration management
- Authentication/RBAC
- Auditability
- Controlled deployment
