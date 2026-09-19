# Hotel-Ops-Suite Abstraction and Technology Blueprint

## Why abstraction exists

The core business should not depend directly on a database vendor, payment provider, notification provider, queue implementation, or web framework.

```text
DOMAIN
  ↓
PORT / INTERFACE
  ↓
ADAPTER / IMPLEMENTATION
  ↓
TECHNOLOGY
```

## Example

```text
                    Billing / Payment Domain
                              │
                              ▼
                     PaymentGateway
                       <<interface>>
                              │
                 ┌────────────┼────────────┐
                 ▼            ▼            ▼
          ProviderAdapter  MockAdapter  FutureAdapter
                 │
                 ▼
           External Provider
```

## Abstraction catalogue

| Port / Abstraction | Responsibility | Possible implementation |
|---|---|---|
| BookingRepository | Booking persistence | PostgreSQL adapter |
| GuestRepository | Guest persistence | PostgreSQL adapter |
| RoomRepository | Room persistence | PostgreSQL adapter |
| InvoiceRepository | Invoice persistence | PostgreSQL adapter |
| PaymentGateway | Payment operations | Provider adapter |
| NotificationProvider | Guest/staff notifications | Email/WhatsApp adapter |
| DocumentStorage | File storage | Object-storage adapter |
| MessagePublisher | Async jobs/events | Queue adapter |
| IdentityProvider | Authentication identity | OIDC provider |
| AuditSink | Durable audit events | DB/log platform |
| Clock | Time-dependent business rules | System clock / test clock |
| ConfigurationProvider | Environment configuration | Environment/secrets system |

## Architecture vs implementation

| Layer | Example | Rule |
|---|---|---|
| Architecture | Billing Service | Stable responsibility |
| Abstraction | PaymentGateway | Stable contract |
| Implementation | PaymentProviderAdapter | Replaceable |
| Framework | FastAPI / Express / Django | Implementation detail |
| Infrastructure | Container / VM / PaaS | Deployment detail |

## Technology decision matrix

Do not mark a technology as selected until it is reviewed.

| Area | Candidates | Decision | Status |
|---|---|---|---|
| Frontend | React / Vue / Angular / other | TBD | Decision required |
| Frontend framework | Next.js / Vite / other | TBD | Decision required |
| Backend | FastAPI / Django / Node | TBD | Decision required |
| Database | PostgreSQL / MySQL | TBD | Decision required |
| ORM | SQLAlchemy / Prisma / Django ORM | TBD | Decision required |
| Cache | Redis / none | TBD | Only if justified |
| Queue | RabbitMQ / cloud queue / none | TBD | Only if justified |
| Auth | OIDC / managed identity / other | TBD | Security review |
| Logging | OpenTelemetry + log backend / native | TBD | Decision required |
| Tracing | OpenTelemetry / other | TBD | Scale-dependent |
| Storage | Object storage / managed drive | TBD | Decision required |
| CI/CD | GitHub Actions / other | TBD | Repository-dependent |
| Runtime | Containers / PaaS / VM | TBD | DevOps review |

## Rule

The project can change frameworks without redesigning the business domain.
