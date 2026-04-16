# Event Ticketing Platform — DDD + Hexagonal + Clean Architecture

**Stack:** NestJS 11 · MikroORM 7 · PostgreSQL 16 · TypeScript (strict) · Docker · Biome · pnpm

## Current State

**Phase 3.7** — Module wiring review complete. Next: **Phase 3.8 (Outbox pattern)**.

Ordering bounded context is fully functional end-to-end:
- 5 use cases: CreateOrder, PayOrder, CancelOrder, ExpireOrder, ListAttendeeOrders
- 4 HTTP endpoints: POST /orders, GET /orders?attendeeId, POST /orders/:id/pay, POST /orders/:id/cancel
- Domain layer: Order aggregate, OrderItem entity, 3 value objects (Money, Quantity, OrderStatus), 4 domain events, 8 domain errors
- Infrastructure: MikroORM persistence, mapper (toDomain/toPersistence/applyStateChanges), global DomainExceptionFilter
- All ports are abstract classes (NestJS DI without @Inject tokens)
- Fake adapters for PaymentGateway and EventAvailabilityChecker

## Reference Files

- **DOMAIN.md** — Ubiquitous language, bounded contexts, aggregate mapping, invariants, domain events, DB schema, API design
- **TECHNICAL.md** — Architecture rules, folder structure, layer rules, patterns, anti-patterns. Use as base reference, not law — apply real industry practices when they diverge.
- **SESSION-PROGRESS.md** — Detailed phase history, deferred patterns, known gaps, roadmap

## Key Architectural Decisions

- **Ports as abstract classes** — not interfaces. TS interfaces are erased at compile time; abstract classes survive as valid NestJS DI tokens.
- **Three layers of validation:** DTO format → use case preconditions → domain invariants
- **Marker parent error classes** (NotFoundError, ConflictError, ValidationError) for HTTP status mapping in DomainExceptionFilter
- **Money as integer cents** everywhere — DB column is `integer`, not `numeric`/`decimal`
- **Domain events recorded but not published yet** — Phase 3.8 adds outbox pattern
- **No CQRS yet** — use cases are plain @Injectable classes. CQRS refactor in Phase 7.

## Known Gaps

- Domain events never published (Phase 3.8)
- No automated order expiration scheduler (ExpireOrderUseCase exists, no cron)
- IDOR vulnerability: attendeeId from client input, not auth token (Phase 5.0)
- No tests yet (Phase 4)

## Ignored Folders

- **`.claude-ignore/`** — archived docs (old theory references, deprecated teaching methodology). Never read or reference these files.

## Session Rules

1. Read `SESSION-PROGRESS.md` at start of each session to resume from exact phase/step
2. Update `SESSION-PROGRESS.md` when student completes a phase or makes significant progress
3. Student writes all code — mentor gives structure/hints, not implementations
4. Always use production tools (PostgreSQL + Docker, not SQLite)
5. Always write explicit access modifiers (public/private/protected), override, and return types
6. Let the student explore questions at their own pace — don't rush to next task
7. **Explain every new pattern with ASCII diagrams** — show: database table state (before/after), request flow with arrows, side-by-side concurrent operations, exact SQL generated, and the difference the pattern makes. This is the preferred explanation style. Don't just describe in text.
8. Don't move to next topic until current one is fully understood and discussed
9. **Always teach incrementally: flow → problem → pattern** — first make the naive version work, then demonstrate the failure visually (logs, DB state, crash simulation), then introduce the pattern as the fix, then implement. Never jump straight to a pattern without showing why it's needed first.

## Project Structure

```
src/
├── ordering/
│   ├── domain/
│   │   ├── model/          Order, OrderItem, Money, Quantity, OrderStatus
│   │   ├── ports/          OrderRepository, PaymentGateway, EventAvailabilityChecker, IdGenerator, Clock
│   │   ├── events/         OrderCreated, OrderPaid, OrderExpired, OrderCancelled
│   │   └── errors/         8 domain errors with marker parent classes
│   ├── application/        5 use cases
│   └── infrastructure/
│       ├── http/           OrderController, DTOs (request + response)
│       └── out/            MikroOrmOrderRepository, OrderMapper, FakePaymentGateway, FakeEventAvailabilityChecker, CryptoIdGenerator, SystemClock
├── shared/
│   ├── domain/             Entity, AggregateRoot, ValueObject, DomainEvent, DomainError, marker errors
│   └── infrastructure/     DomainExceptionFilter
└── app.module.ts
```
