# Hotel-Ops-Suite Observability, Security and Data Architecture

## Observability

```text
Frontend ───────┐
API ────────────┤
Domain Services ┤
Workers ────────┤
Integrations ───┤
Database ────────┘
       │
       ▼
┌───────────────────────────────┐
│ Observability Platform       │
│ Logs | Metrics | Traces       │
│ Errors | Dashboards | Alerts  │
└───────────────────────────────┘
```

## Logging categories

- Application logs
- API/access logs
- Worker/job logs
- Integration logs
- Security logs
- Audit events

Application logs explain system behaviour. Audit events record important business/security actions.

## Correlation ID

```text
Request
  ↓
Frontend
  ↓
API  [correlation_id=abc123]
  ↓
Service
  ↓
Repository
  ↓
External adapter
```

The same correlation ID should be retained through relevant synchronous and asynchronous operations.

## Audit

Important actions should produce durable audit records.

Examples:

```text
BOOKING_CREATED
BOOKING_CANCELLED
CHECKIN_COMPLETED
CHECKOUT_COMPLETED
INVOICE_FINALIZED
PAYMENT_RECORDED
VOUCHER_CREATED
VOUCHER_CANCELLED
USER_ROLE_CHANGED
```

Avoid physically deleting financial history. Use reversal, cancellation, refund, or adjustment semantics where appropriate.

## Security

```text
Identity
   ↓
Authentication
   ↓
Authorization / RBAC
   ↓
Application Validation
   ↓
Domain Rules
   ↓
Data Access
```

Security controls:

- Authentication
- Role-based permissions
- Input validation
- HTTPS
- Secret management
- Least-privilege database access
- Security logging
- Dependency scanning
- Auditability

## Data ownership

| Module | Owns |
|---|---|
| Booking | Booking |
| Guest | Guest profile |
| Room | Room and room state |
| Billing | Invoice and invoice items |
| Payment | Payment transaction |
| Voucher | Voucher |
| Housekeeping | Operational housekeeping tasks |
| User/Access | Users, roles, permissions |

Other modules should use explicit interfaces rather than directly modifying another module's data.

## Transaction boundary example

```text
Checkout
  ↓
Validate booking
  ↓
Calculate final bill
  ↓
Record payment
  ↓
Finalize invoice
  ↓
Complete checkout
  ↓
Update room status
  ↓
Audit event
```

Critical state changes should use an appropriate transaction boundary.

## Reliability rules

- External failures should be isolated where possible.
- Async jobs should be retryable.
- Important operations should be idempotent.
- Database is the source of truth.
- Cache is an optimization, not the source of truth.
