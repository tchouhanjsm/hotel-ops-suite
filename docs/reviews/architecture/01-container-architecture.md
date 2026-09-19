# Hotel-Ops-Suite Container Architecture

## Lucidchart-ready container sketch

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ USERS                                                                    │
│ Admin | Manager | Reception | Accountant | Operations                    │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 │ HTTPS
                                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ PRESENTATION CONTAINER                                                   │
│ Web App / PWA                                                            │
│ UI | State | Forms | API Client | Client Validation                      │
│ Framework: TBD                                                           │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 │ HTTPS / JSON
                                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ API / APPLICATION CONTAINER                                              │
│ Router | Auth | Authorization | Validation | Controllers                 │
│ Framework: TBD                                                           │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ DOMAIN / APPLICATION CONTAINER                                           │
│                                                                          │
│ Booking | Guest | Room | Front Desk | Billing | Payment | Voucher        │
│ Housekeeping | Inventory | Reports | Notification | Document             │
│                                                                          │
│ Business rules live here.                                                │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ ABSTRACTION CONTAINER                                                    │
│                                                                          │
│ Repository Ports | Payment Port | Notification Port | Storage Port       │
│ Queue Port | Identity Port | Audit Port | Clock / Configuration Port     │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ INFRASTRUCTURE / ADAPTERS                                                │
│                                                                          │
│ DB Adapter | Cache Adapter | Queue Adapter | Storage Adapter             │
│ Payment Adapter | Email/WhatsApp Adapter | Identity Adapter              │
└───────────────┬──────────────────────┬──────────────────────┬─────────────┘
                │                      │                      │
                ▼                      ▼                      ▼
          ┌───────────┐          ┌───────────┐        ┌──────────────┐
          │ Database  │          │ Storage   │        │ External APIs│
          └───────────┘          └───────────┘        └──────────────┘

──────────────────────── CROSS-CUTTING ─────────────────────────────────────
Security | Logging | Audit | Metrics | Tracing | Error Handling | Health
Configuration | Feature Flags | Backup / Recovery
────────────────────────────────────────────────────────────────────────────
