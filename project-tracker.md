# Hotel Ops Suite — Project Tracker

## 1. Project Overview
- Project: Hotel Ops Suite
- Repository: `https://github.com/tchouhanjsm/hotel-ops-suite.git`
- Primary development branch: `develop`
- Architecture: Modular monolith
- Backend: Python + FastAPI
- Frontend: React + TypeScript + Vite
- Database: PostgreSQL
- ORM: SQLAlchemy 2
- Migrations: Alembic
- Source of truth: GitHub

## 2. Architecture
```text
React + TypeScript + Vite
          ↓
       FastAPI
          ↓
     Service Layer
          ↓
  Repository / Data Layer
          ↓
     PostgreSQL
```

Planned backend modules:
- Auth / Staff / RBAC
- Rooms
- Guests
- Bookings
- Folio
- Payments
- Vouchers
- Invoices
- Cash
- Reports
- Assistant
- Audit
- Settings

Frontend principle:
- Independent routes/pages
- Route-level error isolation
- Shared layout/components

## 3. Repository Structure
```text
hotel-ops-suite/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   └── __init__.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── __init__.py
│   │   ├── db/
│   │   │   ├── base.py
│   │   │   ├── session.py
│   │   │   └── __init__.py
│   │   ├── models/
│   │   │   ├── staff.py
│   │   │   └── __init__.py
│   │   ├── repositories/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── main.py
│   │   └── __init__.py
│   ├── alembic/
│   │   └── versions/
│   ├── alembic.ini
│   └── tests/
├── frontend/
├── docs/
├── tests/
├── .github/
│   └── workflows/
│       └── ci.yml
├── .gitignore
├── docker-compose.yml
├── package.json
└── project-tracker.md
```

## 4. Development History

### Foundation
- [x] Git repository initialized
- [x] `develop` branch created
- [x] GitHub remote configured
- [x] Root `.gitignore` added
- [x] Root package check scripts added
- [x] Python virtual environment created
- [x] FastAPI health endpoint created
- [x] React + TypeScript + Vite frontend created
- [x] React Router added
- [x] Tailwind packages added
- [x] Lucide icons added
- [x] Frontend route structure created
- [x] Frontend ErrorBoundary created

### Database
- [x] PostgreSQL installed locally on Windows
- [x] PostgreSQL service running
- [x] `hotel_ops` database created
- [x] `hotel_admin` database user created
- [x] SQLAlchemy installed
- [x] Psycopg installed
- [x] Pydantic Settings installed
- [x] `.env` configuration added
- [x] SQLAlchemy engine/session created
- [x] Database connection test added
- [x] SQLAlchemy declarative `Base` created
- [x] Staff model created
- [x] Alembic initialized
- [x] Alembic connected to application database configuration
- [ ] First Staff migration generated
- [ ] First migration applied

### Quality Gates
- [x] pytest
- [x] pytest-cov installed
- [x] Ruff
- [x] Mypy
- [x] Frontend production build check
- [x] GitHub Actions CI
- [x] PostgreSQL CI service
- [x] PR-only workflow enforced on `develop`
- [x] Required CI checks enforced
- [x] Solo-development ruleset adjusted

## 5. Current Checks

Local root command:
```powershell
npm run check
```

Checks included:
- Backend tests
- Backend Ruff
- Backend Mypy
- Frontend build

GitHub Actions:
- Backend Checks
- Frontend Build
- PostgreSQL service for backend integration tests

## 6. Current Git / PR Workflow
```text
feature branch
      ↓
commit
      ↓
push
      ↓
Pull Request → develop
      ↓
CI checks
      ↓
Approval / ruleset requirements
      ↓
Merge
```

Direct pushes to `develop` are restricted by the repository ruleset.

## 7. Completed Components
- FastAPI application foundation
- Health endpoint
- PostgreSQL connection
- SQLAlchemy foundation
- Application configuration
- Alembic foundation
- Initial Staff model
- React application shell
- Route structure
- Basic UI layout foundation
- CI quality gate

## 8. In Progress
- Staff / Authentication / RBAC
- Database migration foundation

## 9. Pending Major Work
- First Staff migration
- Authentication
- Password hashing
- Session/token strategy
- RBAC and permission model
- Protected backend routes
- Frontend login
- Route-level authorization
- Rooms module
- Guests module
- Bookings module
- Folio module
- Payments module
- Vouchers module
- Invoices module
- Cash module
- Reports
- Audit logging
- Settings
- Assistant
- Production deployment
- Backup / recovery strategy
- Security hardening
- Direct booking / growth integrations

## 10. Legacy / Reference
- Previous Google Apps Script hotel operations prototype is retained as reference only.
- It is not the production architecture for the new system.

## 11. Handover Notes
- Keep GitHub as the source of truth.
- Develop feature-by-feature using feature branches and pull requests.
- Keep modules independently testable.
- Keep authentication, authorization, validation, transactions, and auditability as first-class concerns.
- Avoid coupling unrelated hotel workflows.
- Update this tracker whenever a major file, module, architecture decision, check, or milestone changes.
