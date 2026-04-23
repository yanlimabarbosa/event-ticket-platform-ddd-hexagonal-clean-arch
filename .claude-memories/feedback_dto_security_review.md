---
name: DTO security review — reject client-owned money/identity/auth fields
description: When reviewing or creating HTTP request DTOs, flag any field representing money, identity, or authorization state as presumed-hostile. These must be derived server-side, never accepted from request body.
type: feedback
---

When reviewing or creating HTTP request DTOs (especially write endpoints like `CreateOrder*`, `Pay*`), flag any field representing:

- **Money** — prices, amounts, totals, fees, discounts
- **Identity** — userId, attendeeId, organizerId, tenantId
- **Authorization state** — role, permissions, status, verified

as presumed-hostile. These must be derived server-side (from DB lookup or auth token), never accepted from the request body.

**Why:** Student caught a critical bug in `CreateOrderRequestDto` — `unitPrice` was a client field, letting an attacker pay 1 cent for a VIP ticket. Naive `@IsInt @Min(0)` validation only guards format, not authority. Student reaction: "how the hell did u let that pass?" — DOMAIN.md explicitly omits `unitPrice` from the request shape, and the DTO diverged without anyone catching it.

**How to apply:**

1. When creating a new request DTO: for each field, ask "who owns this value — client or server?" If server, it doesn't belong in the DTO.
2. When reviewing existing DTOs: diff against the API design section in `DOMAIN.md`. Any divergence on money/identity/auth = bug to fix, not convenience to accept.
3. The project's "three layers of validation" rule (format → preconditions → invariants) covers correctness, NOT authorization. Authorization is a separate, earlier gate — apply it first.
4. Phase 5.0 already flags the IDOR bug on `attendeeId`. `unitPrice` is the same class of bug — don't wait until phase 5 to fix this category, flag proactively whenever a DTO is introduced.
5. Fix pattern: introduce a server-side port (e.g., `TicketTypePricingPort.getPrice(ticketTypeId)`), remove the field from the DTO, look it up in the use case before constructing the aggregate.
