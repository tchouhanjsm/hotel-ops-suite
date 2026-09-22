# Service Voucher Architecture Blueprint

## Batch
**Batch 7.4B - Service Voucher Foundation**

## Purpose
A Service Voucher records a guest-facing hotel service charge. It is a separate domain from Cash Voucher.

- Cash Voucher: hotel pays money out for an expense.
- Service Voucher: hotel records a charge for a service provided to a guest.
- Payment: records money received from the guest.
- Invoice: presents the folio's billable charges as an invoice.

A Service Voucher is therefore not a payment transaction.

## Domain Boundary
Service Voucher owns:
- voucher number and lifecycle
- service identity and description
- guest/folio context
- charge amount and tax snapshot
- staff/audit metadata
- linkage to the resulting folio charge

Folio owns the guest ledger and totals.
Payment owns money received.
Invoice owns the finalized billing document.
Cash Voucher remains completely independent.

## Proposed Lifecycle
draft -> issued -> cancelled

Draft: the service charge is being prepared and may be edited.
Issued: the charge has been posted to the guest's open folio and is available to Payments and Invoice.
Cancelled: the voucher is retained for audit history and is no longer an active service charge.
No physical deletion of an issued voucher.

## Core Financial Flow
Guest / Booking -> Folio -> Service Voucher -> Folio Item -> Payment -> Invoice

The Service Voucher creates exactly one corresponding FolioItem when it is issued.
The Service Voucher stores the folio_item_id so the relationship is explicit and never inferred from description, amount, or date.
Invoice generation continues to read the Folio as the billing source, so issued service charges naturally appear on the invoice.
Payment remains a separate transaction against the Folio.

## Proposed Data Model
### service_vouchers

| Field | Purpose |
| --- | --- |
| id | Primary key |
| voucher_number | Unique service voucher reference |
| voucher_date | Service/billing date |
| folio_id | Guest folio receiving the charge |
| folio_item_id | Exact folio charge created for this voucher |
| service_category | Tour, transfer, meal, laundry, etc. |
| service_name | Human-readable service name |
| description | Service details |
| quantity | Quantity of service |
| unit_price | Price before tax |
| tax_percent | Tax snapshot |
| amount | Pre-tax amount |
| tax_amount | Tax amount |
| total_amount | Final charge |
| currency | Currency snapshot |
| status | draft / issued / cancelled |
| notes | Optional operational notes |
| created_by | Staff who created the voucher |
| issued_by | Staff who issued the voucher |
| issued_at | Issue timestamp |
| cancelled_by | Staff who cancelled it |
| cancelled_at | Cancellation timestamp |
| created_at | Creation timestamp |
| updated_at | Last update timestamp |

### Folio integration
To preserve accounting history, issued service vouchers must never be implemented as a free-text folio charge with a hidden relationship.
The folio charge must be explicitly traceable to the Service Voucher.
Before cancellation of an issued service voucher, FolioItem needs a non-destructive lifecycle marker so the linked charge can be voided without deleting financial history.

## API Shape
- GET /service-vouchers
- POST /service-vouchers
- GET /service-vouchers/{voucher_id}
- PATCH /service-vouchers/{voucher_id}
- POST /service-vouchers/{voucher_id}/issue
- POST /service-vouchers/{voucher_id}/cancel

Reject issuance when the folio does not exist, the folio is not open, or the voucher is not a draft.
Reject edits after issuance.

## Permissions
- service_voucher:read
- service_voucher:create
- service_voucher:update
- service_voucher:issue
- service_voucher:void

Role assignments follow the existing RBAC model and should be reviewed against admin, manager and front_desk permissions.

## Audit Events
- SERVICE_VOUCHER_CREATED
- SERVICE_VOUCHER_UPDATED
- SERVICE_VOUCHER_ISSUED
- SERVICE_VOUCHER_CANCELLED

Audit records include the voucher reference and relevant financial context.

## UI Direction
Do not merge Service Voucher fields into the existing Cash Voucher form.
The Vouchers workspace should evolve into two distinct workflows:

Cash Vouchers: hotel expenses and cash paid out.
Service Vouchers: guest services and charges billed to a folio.

Service Voucher create flow requires folio context. The user should not manually type a guest name when the Folio already provides the booking/guest relationship.

Suggested flow:
1. Open a guest folio.
2. Create a service voucher as Draft.
3. Review service, quantity, price and tax.
4. Issue to folio.
5. Record guest payment separately.
6. Generate/use invoice from the folio.

## UAT Coverage
1. Create a draft service voucher against a folio.
2. Edit a draft service voucher.
3. Issue it to the open folio.
4. Verify exactly one linked FolioItem exists.
5. Verify folio totals include the service charge.
6. Record a payment against the folio.
7. Verify balance changes.
8. Verify the service charge appears in invoice source data.
9. Verify an issued voucher cannot be edited.
10. Verify cancellation preserves the voucher record and audit history once FolioItem non-destructive voiding is available.

## Implementation Order
1. Architecture + data model
2. Migration
3. Repository
4. Service domain rules
5. Folio linkage / FolioItem lifecycle support
6. API + RBAC + audit
7. Backend tests
8. React Service Voucher workspace
9. Cypress UAT
10. Full project gate
11. PR -> develop

## Explicit Non-Goals
- Do not turn Cash Voucher into a generic voucher type.
- Do not create a generic Voucher base table.
- Do not record guest payments inside Service Voucher.
- Do not generate invoices directly from Service Voucher.
- Do not bypass Folio for financial totals.
- Do not physically delete financial history.

## Reuse
Reuse shared identifier generation, money/tax calculation, domain errors, repository boundaries, audit service, RBAC patterns, shared UI primitives, API client and Cypress UAT patterns.
Do not copy Cash Voucher's domain model or make Service Voucher a type switch inside Cash Voucher.