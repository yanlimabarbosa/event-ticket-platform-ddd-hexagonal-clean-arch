---
name: Cross-context communication rules committed
description: Ordering must never import Event Management's entities or reach into its DB directly. Upstream contexts expose public query services; downstream contexts call those or consume events. Full rules in TECHNICAL.md "CROSS-CONTEXT COMMUNICATION" section.
type: project
---

Student and I agreed on and documented cross-context communication rules in `TECHNICAL.md` (new "CROSS-CONTEXT COMMUNICATION" section, added 2026-04-22).

**Decisions:**
- Each bounded context is a module with public + private surface. Public = query services (Open Host Service) + published domain events. Everything else (entities, repositories, mappers, controllers, command handlers) is module-private.
- Cross-context writes go through domain events.
- Cross-context reads choose between two patterns based on resilience need:
  - **Projection (default for hot paths)** — downstream maintains a local read model updated from upstream events. Reads never leave the context. Upstream can die; downstream keeps serving.
  - **Query service (exception)** — upstream exposes a public `*QueryService` class. Only acceptable for non-critical reads (admin panels, reports) where upstream downtime failing the flow is tolerable.
- Query services alone are NOT resilient — in a monolith, both contexts share a process; across services, the network adds failure modes. Only projections give runtime independence.
- Ordering owns `TicketTypePricing` port. Adapter reads Ordering's own `ticket_type_prices` projection table, populated asynchronously from Event Management's `TicketTypePriceChanged` events.
- Price-at-order-time (Ordering's `order_items.unit_price`) is intentionally duplicated from Event Management's catalog price — same number at creation, different meanings, different ownership.
- Evolution: monolith + projection → Kafka + projection → microservices + projection. Port never changes; only adapter internals evolve. Projections are in place from phase 4.4, not deferred to phase 6.

**Why this got written down:** Student caught me prescribing "Ordering reads `TicketTypeEntity` via MikroORM" as phase 4.4 pattern. That's the Shared Database anti-pattern — kills bounded context integrity. Student called it out explicitly: "that's cross boundaries, that shouldn't be allowed." Correct. Then student pushed further: "query service still couples runtime — if it's down, I'm down." Also correct. That reframed the default from "query service" to "local projection," with query service as an exception for non-critical reads. Rules in TECHNICAL.md were updated accordingly.

Student also raised microservices-first as an option for decoupling. Declined — decoupling is an architecture property, not a deployment property. Modular monolith + events + projections gives full decoupling without the distributed systems tax. Microservices extraction stays as phase 5.1, not earlier.

Session extended to cover distributed-systems trade-offs generically and specifically for ticketing. TECHNICAL.md now has a "DISTRIBUTED SYSTEMS TRADE-OFFS — APPLIED TO TICKETING" section that nails the per-read-and-per-action decisions:
- Price, event metadata, sales status → local projection (eventual consistency, correct behavior)
- Inventory / reservation → synchronous command on Event Management with DB lock (strong consistency — overselling is non-negotiable)
- Payment authorization → synchronous (cannot tell user "paid" without confirmation)
- Confirmation email, analytics, ticket issuance → outbox / events (eventual)
- Event payloads → event-carried state transfer (fat events), not thin notifications
- Reservation + 15-minute timeout is the compensating pattern that lets Ordering avoid a full saga
- 6 reliability primitives required before splitting contexts: outbox, idempotency keys, optimistic locking, projection, inbox, reconciliation job

External reference doc `~/Desktop/distributed-systems-tradeoffs.md` is cross-referenced from TECHNICAL.md. Not copied into repo unless student asks.

**How to apply:**
- When designing a new context, build its public query service first, alongside the domain model. Other contexts' adapters depend on it.
- When reviewing a cross-context import: if it points anywhere but `<context>/application/queries/<Public...>`, it's a violation.
- When planning phase 4.4 (Check-in + Event Management), create `TicketTypeQueryService` as the Ordering-facing interface. Ordering's `EventMgmtTicketTypePricing` adapter calls it.
- Consider adding `noRestrictedImports` lint rule when second context is introduced — enforces rules mechanically.
