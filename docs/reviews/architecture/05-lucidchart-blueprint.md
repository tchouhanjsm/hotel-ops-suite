# Hotel-Ops-Suite Lucidchart Blueprint

This document is the drawing specification for the architecture diagrams.

## Main architecture diagram

Use large containers for architectural boundaries and smaller boxes for components.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ USERS                                                                        │
│                                                                              │
│ Admin | Manager | Reception | Accountant | Operations                        │
└────────────────────────────────────┬─────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ PRESENTATION CONTAINER                                                       │
│                                                                              │
│ Web / PWA                                                                    │
│ UI | State | Forms | API Client                                              │
│                                                                              │
│ Framework: TBD                                                              │
└────────────────────────────────────┬─────────────────────────────────────────┘
                                     │ HTTPS
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ API / APPLICATION CONTAINER                                                  │
│                                                                              │
│ Router | Authentication | Authorization | Validation | Controllers           │
│                                                                              │
│ Framework: TBD                                                              │
└────────────────────────────────────┬─────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ DOMAIN CONTAINER                                                             │
│                                                                              │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                            │
│ │ Booking │ │ Guest   │ │ Rooms   │ │ Billing │                            │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘                            │
│                                                                              │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────────┐                       │
│ │ Payment │ │ Voucher │ │ Front   │ │ Housekeeping │                       │
│ │         │ │         │ │ Desk    │ │              │                       │
│ └─────────┘ └─────────┘ └─────────┘ └──────────────┘                       │
└────────────────────────────────────┬─────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ ABSTRACTION / PORTS CONTAINER                                                 │
│                                                                              │
│ Repository Ports | PaymentGateway | NotificationProvider                    │
│ Storage | MessagePublisher | IdentityProvider | AuditSink                   │
└────────────────────────────────────┬─────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ INFRASTRUCTURE / ADAPTERS                                                    │
│                                                                              │
│ Database Adapter | Queue Adapter | Cache Adapter | Storage Adapter            │
│ Payment Adapter | Email Adapter | WhatsApp Adapter | Identity Adapter       │
└───────────────┬─────────────────────┬─────────────────────┬──────────────────┘
                │                     │                     │
                ▼                     ▼                     ▼
          ┌───────────┐         ┌───────────┐        ┌──────────────┐
          │ Database  │         │ Storage   │        │ External     │
          │           │         │           │        │ Services     │
          └───────────┘         └───────────┘        └──────────────┘


┌──────────────────────────────────────────────────────────────────────────────┐
│ CROSS-CUTTING                                                                │
│ Security | Logging | Audit | Metrics | Tracing | Errors | Health | Config    │
└──────────────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────────┐
│ DEVOPS                                                                       │
│ Git → PR → CI → Test → Security → Build → Artifact → Deploy                 │
│                                      ↓                                       │
│                           DEV → STAGING → PRODUCTION                         │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Arrow rules

| Arrow | Meaning |
|---|---|
| Solid arrow | Synchronous runtime interaction |
| Dashed arrow | Async event/job |
| Dotted telemetry arrow | Logs/metrics/traces |
| Dependency arrow | Compile/runtime dependency |

## Lucidchart containers

Create these major containers:

1. Users
2. Presentation
3. API/Application
4. Domain
5. Abstraction/Ports
6. Infrastructure/Adapters
7. Data/Storage
8. External Systems
9. Cross-Cutting Concerns
10. DevOps Pipeline

## Visual rule

Keep the main diagram architectural. Do not place every class, table, endpoint, library, or configuration variable on it.

Technology names belong in a technology matrix or as small labels inside implementation containers.

## Recommended additional diagrams

### 1. System Context
Hotel staff + Hotel-Ops-Suite + external systems.

### 2. Container Architecture
Frontend → API → Domain → Abstractions → Infrastructure → Data.

### 3. Domain Architecture
Booking, Guest, Room, Billing, Payment, Voucher, Front Desk, Housekeeping.

### 4. Deployment Architecture
Runtime containers, database, storage, workers, network boundaries.

### 5. CI/CD
Developer → Git → PR → CI → artifact → staging → production.

### 6. Observability
Application components → telemetry → dashboards/alerts.

### 7. Critical workflows
Reservation, check-in, checkout, invoice, payment, voucher cancellation.

## Do not create a spaghetti diagram

If an arrow crosses half the page, the diagram probably needs another level of decomposition.

Use multiple focused diagrams instead of one enormous drawing.
