# Hotel-Ops-Suite Architecture Review Checklist

Use this checklist before approving a significant architectural change.

## Domain

- [ ] Business capability is clearly identified.
- [ ] Module ownership is explicit.
- [ ] Business rules have one authoritative location.
- [ ] Entity ownership is clear.
- [ ] State transitions are documented.

## Abstraction

- [ ] Core logic does not depend directly on infrastructure.
- [ ] External providers are behind adapters.
- [ ] Repository access is abstracted where useful.
- [ ] Time/configuration dependencies are testable.
- [ ] Interfaces are small and responsibility-focused.

## Technology

- [ ] Framework choice is documented separately from architecture.
- [ ] Technology choice has a stated reason.
- [ ] Operational cost is understood.
- [ ] Vendor lock-in has been considered.
- [ ] Technology can be replaced without rewriting the domain unnecessarily.

## API

- [ ] Authentication is enforced.
- [ ] Authorization is enforced.
- [ ] Input validation exists.
- [ ] Error responses are consistent.
- [ ] Idempotency is considered for retryable operations.
- [ ] API versioning strategy is understood.

## Data

- [ ] Source of truth is identified.
- [ ] Transactions are defined.
- [ ] Constraints and indexes are considered.
- [ ] Migration strategy exists.
- [ ] Backup strategy exists.
- [ ] Restore has been tested.

## DevOps

- [ ] CI runs automatically.
- [ ] Tests run before deployment.
- [ ] Security checks exist.
- [ ] Build artifacts are identifiable.
- [ ] Environments are isolated.
- [ ] Production deployment is controlled.
- [ ] Rollback procedure exists.

## Observability

- [ ] Structured logs exist.
- [ ] Correlation IDs exist.
- [ ] Critical actions create audit events.
- [ ] Errors are observable.
- [ ] Important metrics exist.
- [ ] Health/readiness checks exist.
- [ ] Alerts have clear ownership.

## Reliability

- [ ] External dependency failure is considered.
- [ ] Background jobs can retry.
- [ ] Jobs are idempotent where necessary.
- [ ] Timeouts are defined.
- [ ] Failure boundaries are documented.

## Architecture governance

- [ ] Significant decisions have an ADR.
- [ ] Current / Planned / Future status is clear.
- [ ] Lucidchart reflects the current approved blueprint.
- [ ] Documentation is updated with the implementation.
- [ ] No unnecessary infrastructure has been introduced.

## Final approval questions

1. What problem are we solving?
2. What boundary changes?
3. What abstraction is required?
4. Which technology implements it?
5. What happens when the dependency fails?
6. How will we observe it?
7. How will we test it?
8. How will we deploy it?
9. How will we roll it back?
10. What decision needs to be recorded in an ADR?
