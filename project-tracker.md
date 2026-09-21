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

### Batch 6.0C — Folio Tax + Balance Foundation

- Moved GST percentage to application configuration
- Added configurable `GST_PERCENT`
- Added folio paid amount tracking
- Added balance-due calculation
- Prevented negative paid balances
- Added folio balance regression tests
- Added PostgreSQL migration for `paid_amount`
- 53 backend tests passing
### Batch 6.0B — Folio Totals + Room Charges

- Added automatic room-charge generation when a folio is created
- Added folio subtotal calculation
- Added folio tax-total calculation
- Added folio grand-total calculation
- Added Decimal-safe financial arithmetic
- Added FolioSummary API response
- Added room-charge and totals regression tests
- 6 Folio tests passing
- 54 backend tests passing
- Ruff passing
- mypy passing
- Frontend production build passing

### Batch 6.1 — Payments Foundation

- Added Payment model and migration
- Added payment methods and statuses
- Added payment creation, listing, and void workflows
- Added payment audit fields
- Changed folio balance to derive from completed payments
- Removed mutable folio paid amount storage
- Added overpayment protection
- Added payment regression tests
- Added PostgreSQL payments table
- 59 backend tests passing
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

## Architecture Evolution

### Batch 6.1A: Platform Core v0.1

**Idea**

The project reached a point where repeated technical rules across domain modules would increase maintenance cost and create inconsistent behavior. A small domain-neutral Platform Core was introduced so reusable engineering rules are implemented once and shared across modules.

**How we are proceeding**

New work follows: Boundary → Reuse Check → Domain → API → UI → Tests → E2E → Audit/Security Review → Extract reusable pieces → Full project gate.

The Platform Core stays domain-neutral. Hotel-specific rules remain owned by their domain modules.

**Platform primitives introduced**

- identifiers: shared reference generation
- money: currency precision, rounding, tax, totals and balance helpers
- dates: date-range validation and night calculation
- pagination: reusable pagination contract
- errors: common domain-error hierarchy

**Modules migrated**

- Booking: shared identifier and date-range primitives
- Folio: shared identifier and money primitives
- Payment: shared identifier primitive
- Invoice: shared identifier and money primitives

**Reasoning**

The platform layer reduces duplicated technical logic while keeping business rules inside their owning domain modules. Migration is incremental so existing behavior remains protected by regression tests.

**Verification**

- Platform Core tests: 14 passing
- Booking + Core targeted tests: 19 passing
- Full backend suite: 80 passing
- mypy: passing
- Ruff: passing
- frontend production build: passing through the project check
- git diff --check: passing

**RCA / Lessons**

- Shared abstractions must remain generic and small.
- Compiler and lint feedback are part of the design loop.
- Large shell commands increase execution risk; future changes should use smaller atomic operations.
- Tests must validate the intended behavior and mathematical result, not an assumed result.

**Next Architecture Target**

Shared API Error Boundary: consolidate repeated domain-error-to-HTTP translation at the API boundary while preserving domain-specific business messages and HTTP semantics.

## Engineering Guardrails

### Batch 6.2A.1: Reusable Test Infrastructure

**Problem**

Repeated framework-specific test setup and large shell edits were creating avoidable syntax and typing failures.

**Change**

Introduced reusable HTTP request construction in the shared test configuration and standardized the change workflow around small atomic edits followed by formatting, linting, type checking, and tests.

**Why**

Test infrastructure is application infrastructure. Framework-specific plumbing should be centralized so individual tests focus on behavior rather than constructing low-level objects repeatedly.

**Verification**

- Domain error handler unit tests: 7 passing
- Ruff: passing
- mypy: passing
- FastAPI integration dispatch verified

**Next**

Migrate Booking from ValueError to typed DomainError classes and remove duplicated route-level exception translation.

### Batch 6.2A.7 — Domain Error Boundary

- Migrated business-service errors from generic `ValueError` to typed `DomainError` subclasses
- Removed route-level `ValueError` translation
- Removed duplicated route-level rollback handling
- Preserved schema-level `ValueError` validation
- Standardized global API error translation through `DomainError`
- 88 backend tests passing
- Ruff passing
- mypy passing
- Frontend production build passing

### Batch 6.2B.1 — Repository Boundary Refactor

- Moved SQLAlchemy persistence mechanics from services into repositories
- Added repository persistence boundaries where lifecycle workflows require flush visibility
- Added Booking row-lock repository operation
- Added Payment reference lookup repository operation
- Moved Folio payment and folio-number queries into repositories
- Moved Invoice source-data queries and booking locking into repositories
- Preserved route-owned transaction commits
- Preserved `get_db()` rollback boundary
- Fixed Booking check-in/check-out persistence synchronization
- 88 backend tests passing
- Ruff passing
- mypy passing
- Frontend production build passing

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

## Batch 7.1 - Hotel Ops Suite SaaS Design System

### Approved Visual Direction

- [x] Approved light, airy SaaS visual language
- [x] Approved soft pastel / glass-like surfaces
- [x] Approved deep navy / charcoal primary typography
- [x] Approved sandstone / gold brand accent
- [x] Approved restrained Jaisalmer heritage imagery
- [x] Approved soft semantic status colors
- [x] Approved consistent rounded controls, spacing and surfaces
- [x] Approved shared visual language across all portal pages

### Design System Foundation

- [ ] Establish global color tokens
- [ ] Establish typography scale
- [ ] Establish spacing scale
- [ ] Establish border-radius scale
- [ ] Establish shadow / elevation system
- [ ] Establish shared button variants
- [ ] Establish shared input / filter styles
- [ ] Establish shared card / surface styles
- [ ] Establish shared status badges
- [ ] Establish shared page-header pattern
- [ ] Establish shared application shell

### SaaS Consistency Rule

Every portal page must use the same:

- App shell
- Navigation
- Topbar
- Page-header structure
- Typography
- Spacing
- Surface treatment
- Button language
- Status language
- Responsive behavior

Pages should differ through their content and workflows, not through unrelated visual systems.

## Batch 7.2 - Booking -> Folio -> Payments Workflow

- [ ] Add Booking -> Folio navigation
- [ ] Resolve existing folio by booking
- [ ] Explicitly create folio when none exists
- [ ] Remove default/manual folio loading from normal workflow
- [ ] Pass folio context into Payments
- [ ] Remove default/manual payment loading from normal workflow
- [ ] Add end-to-end Booking -> Folio -> Payment UAT
- [ ] Protect workflow with CI

### Local Runtime Topology

- Canonical browser entrypoint: `https://hotel-ops.localhost`
- Caddy terminates local HTTPS and routes traffic.
- `/api/*` is proxied to FastAPI at `127.0.0.1:8000`.
- All other requests are proxied to Vite at `127.0.0.1:5173`.
- Direct Vite access is not the canonical application entrypoint for UAT.
- Frontend functional testing should use `https://hotel-ops.localhost`.
