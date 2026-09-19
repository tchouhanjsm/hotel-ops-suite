# Hotel Ops Suite - Quality and Debugging

## Purpose

Prevent environment failures, test-order failures, authentication drift, runtime defects, and security defects from reaching staging or production.

## Diagnostic layers

Environment
    |
Database
    |
API
    |
Authentication
    |
pytest
    |
Cypress
    |
CodeQL
    |
Runtime debugger / observability

## Commands

### General diagnostics

    npm run diagnose

Checks:
- staging configuration
- staging database
- schema and migrations
- staging admin
- API health
- authentication
- authenticated staff access

### Start API against staging

    npm run api:staging

### Staging preflight

    npm run staging:preflight

### Staging UAT

    npm run uat:staging

## Rules

- Never use production for Cypress.
- Never use local credentials in staging or production.
- Never fall back to default passwords.
- Never print passwords, JWTs, password hashes, or secrets.
- Tests must create their own data or use controlled factories.
- Tests must not depend on database IDs.
- Tests must not depend on another test having run first.
- No arbitrary sleep or wait statements to hide race conditions.
- Every fixed production bug gets a regression test.
- Staging UAT starts only after preflight passes.
- CodeQL runs in CI.
- Backend runtime debugging uses debugpy.

## Failure classification

### Environment failure

Examples:
- wrong database
- missing secret
- wrong API endpoint
- missing environment variable

Fix the environment, not the test.

### Data failure

Examples:
- duplicate room number
- missing guest
- stale booking
- shared test record

Fix test factories, fixtures, uniqueness, or isolation.

### Application failure

Examples:
- wrong status transition
- incorrect business calculation
- authorization defect
- unexpected API response

Add a regression test and fix the application.

### UI failure

Examples:
- wrong selector
- loading-state race
- inaccessible control
- incorrect route or navigation

Fix the frontend or test contract.

## Debugging sequence

Reproduce
    |
Classify
    |
Run smallest failing test
    |
Run diagnostics
    |
Inspect API and database state
    |
Debug runtime with debugpy
    |
Fix
    |
Add regression test
    |
Run full quality gate
