# Hotel Ops Suite Project Tracker

## Project Status

- Repository: hotel-ops-suite
- Primary development branch: develop
- Workflow: feature branch → Pull Request → CI → approval → develop
- Direct pushes to develop: blocked by repository ruleset
- Local pre-PR gate: `npm run check`

## Architecture

- Backend: Python + FastAPI
- Database: PostgreSQL
- ORM: SQLAlchemy 2
- Migrations: Alembic
- Frontend: React + TypeScript + Vite
- UI foundation: Tailwind / Lucide
- Backend testing: pytest
- Backend linting: Ruff
- Backend type checking: mypy
- CI: GitHub Actions
- Architecture style: modular monolith
- Authentication: JWT
- Password hashing: pwdlib + Argon2
- Authorization: role-based permissions

## Completed

### Batch 5.5 — Test Infrastructure + Booking Hardening

- Centralized reusable booking test fixtures in `backend/tests/conftest.py`
- Added dedicated booking lifecycle regression tests
- Added PostgreSQL row locking for booking operations
- Added room operational-state validation for booking and check-in
- Hardened booking cancellation state transitions
- Improved booking transaction safety for concurrent booking attempts
- Removed manual test path manipulation in favor of project-level pytest configuration
- Added `pytest.ini` with backend Python path configuration

### Batch 6.0A — Folio / Billing Foundation

- Added Folio and FolioItem models
- Added Folio schemas
- Added Folio repository and service
- Added Folio API routes
- Added one-folio-per-booking enforcement
- Added folio item charge calculation
- Added tax calculation using Decimal arithmetic
- Added closed-folio protection
- Added cancelled-booking protection
- Added PostgreSQL migration for folio tables
- PostgreSQL migration verified
- 53 backend tests passing
- Ruff passing
- mypy passing
- Frontend production build passing
- **48 backend tests passing**
- Ruff passing
- mypy passing
- Frontend production build passing

### Foundation

- Project repository initialized
- Git/GitHub workflow established
- Backend FastAPI foundation
- Frontend React/Vite foundation
- PostgreSQL local development setup
- SQLAlchemy database session
- Environment configuration
- Alembic initialized and connected
- GitHub Actions CI
- PostgreSQL CI test service
- Local pre-PR quality gate

### Staff / Authentication / RBAC

- Staff SQLAlchemy model
- Staff database migration
- Staff schemas
- Password hashing and verification
- Staff repository
- Staff service
- Authentication service
- JWT token creation and decoding
- Login API
- Current authenticated staff dependency
- RBAC permission definitions
- Protected API routes
- Staff list API
- Staff creation API
- Staff detail API

## Automated Checks

`npm run check`

Runs:

1. Backend tests
2. Ruff
3. Mypy
4. Frontend production build

## Current Test Coverage

- 20 backend tests passing
- Ruff passing
- Mypy passing
- Frontend build passing

## Current Database Migrations

- `5f6d94f8ceb8` - create staff table

## Current Backend Structure

- `app/api`
- `app/core`
- `app/db`
- `app/models`
- `app/repositories`
- `app/schemas`
- `app/services`
- `alembic`

## Pending

- Production-grade secret management
- Authentication hardening
- Complete RBAC permission matrix
- Staff update/deactivation/delete workflows
- Rooms module
- Guests module
- Bookings module
- Folio module
- Payments module
- Vouchers module
- Invoices module
- Cash management
- Reports
- Dashboard data layer
- Frontend authentication
- Frontend RBAC
- Audit logging
- Error monitoring
- Deployment setup
- Production documentation
- Security review
- Growth/direct-booking capabilities

## Development Rules

- Work in small feature batches
- Update this tracker with each completed batch
- Run `npm run check` before every PR
- Never bypass failing tests, lint, type checks, or builds
- Commit related code and tracker changes together
- Merge feature branches into `develop` through PRs
- Keep modules isolated and maintainable

### Rooms

- Room model
- Room database migration
- Room schemas
- Room repository
- Room service
- Room CRUD API
- Room status / housekeeping states
- Room validation
- Room API tests
