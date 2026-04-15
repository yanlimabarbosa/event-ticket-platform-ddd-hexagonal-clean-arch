# Ordering Context

The attendee's buying journey — reservations, payment, cancellations, refunds.

This is the **core domain** of the Event Ticketing platform. Richest business rules, most active aggregate, most state transitions. Built first.

---

## Aggregate

**Order** (aggregate root) — owns its **OrderItem** children.

```
Order (id, eventId, attendeeId, status, total, timestamps)
 └── OrderItem[] (id, ticketTypeId, quantity, unitPrice)
```

An Order starts `reserved` when created, transitions to `paid`, `expired`, or `cancelled`. Terminal states (`expired`, `cancelled`) cannot transition further. An Order with zero items cannot exist.

## Invariants (enforced in the domain)

1. An Order must have at least one OrderItem — enforced in `Order.create` (throws `EmptyOrderItem`).
2. Quantity requested cannot exceed available tickets — enforced in `CreateOrderUseCase` via `EventAvailabilityChecker` port.
3. State transitions are one-directional. Terminal states reject all further transitions — enforced in `OrderStatus.toPaid/toExpired/toCancelled`.
4. Order total equals `sum(quantity × unitPrice)` for all items — computed in `Order.getTotal()`, never stored directly.
5. A reservation expires after 15 minutes — `Order.RESERVATION_WINDOW_MS`, `expires_at` computed at creation.
6. An Order can only be created for an event that is open for sales — checked via `EventAvailabilityChecker.isEventOpenForSales`.
7. Customer refunds are only allowed before the event date — **not yet enforced** (see Known Gaps).
8. If the organizer cancels the event, all orders are refunded regardless of time — **not yet implemented** (Event Management context).

## Domain Events

| Event | When | Consumers |
|---|---|---|
| `OrderCreated` | reservation starts | internal (15-min timer — future outbox) |
| `OrderPaid` | payment charged successfully | Check-in (creates Ticket), Notifications (email) |
| `OrderExpired` | 15-min timeout without payment | Event Management (releases inventory), Notifications |
| `OrderCancelled` | user cancels | Check-in (invalidates Ticket), Notifications (refund email) |

**Events are currently recorded but NOT published** — see Known Gaps.

---

## Key Flows

### Create order (reserve tickets) — `POST /orders`
1. Check event is open for sales (`EventAvailabilityChecker`)
2. Check each ticket type has enough inventory
3. Generate `OrderItem[]` with fresh IDs
4. `Order.create(...)` — sets status `reserved`, emits `OrderCreated`
5. Save via `OrderRepository`
6. Return `OrderResponseDto`

### Pay order — `POST /orders/:id/pay`
1. Load order via repo
2. `paymentGateway.charge(...)` — throws `PaymentFailed` on failure
3. `order.pay(now)` — transitions status, emits `OrderPaid`
4. Save

### Cancel order — `POST /orders/:id/cancel`
1. Load order
2. `order.cancel(reason, now)` — allowed from `reserved` or `paid`, emits `OrderCancelled`
3. Save

### List attendee's orders — `GET /orders?attendeeId=X`
1. Query repo by `attendee_id`
2. Map to response DTOs

### Expire order — scheduled (not yet wired)
Triggered by a cron job (future). Finds orders past `expires_at` still in `reserved` state, transitions them to `expired`.

---

## API Surface

See [`requests.http`](../../requests.http) for runnable scenarios (15 total — happy paths + domain errors + validation failures).

| Method | Path | Use case |
|---|---|---|
| POST | `/orders` | `CreateOrderUseCase` |
| GET | `/orders?attendeeId=X` | `ListAttendeeOrdersUseCase` |
| POST | `/orders/:id/pay` | `PayOrderUseCase` |
| POST | `/orders/:id/cancel` | `CancelOrderUseCase` |

All domain errors map through `DomainExceptionFilter` to HTTP status codes (404 / 409 / 400).

---

## Folder Structure

Follows the hexagonal in/out split + type-based grouping applied across `domain/` and `infrastructure/`.

```
ordering/
├── domain/                    # pure TypeScript, zero framework imports
│   ├── entities/              # Order, OrderItem
│   ├── value-objects/         # Money, Quantity, OrderStatus
│   ├── events/                # 4 domain events
│   └── errors/                # 8 domain errors
├── application/
│   ├── ports/
│   │   └── out/               # outbound ports (Clock, Repo, PaymentGateway, ...)
│   └── use-cases/             # 5 use cases (Create, Pay, Cancel, Expire, List)
├── infrastructure/
│   ├── in/                    # driving adapters (inbound)
│   │   └── http/
│   │       └── orders/        # OrdersController + its DTOs + mapper
│   └── out/                   # driven adapters (outbound)
│       ├── persistence/       # MikroORM entities, mappers, repository
│       └── services/          # Clock, IdGenerator, fakes
└── ordering.module.ts         # DI composition root
```

---

## Known Gaps (to revisit)

- **Domain events never published.** Events are recorded via `addDomainEvent` but `pullDomainEvents` is never called. Closes in **Phase 3.8** (outbox pattern).
- **IDOR vulnerability.** `attendeeId` comes from client input (body + query). In production, must come from auth token. Closes in **Phase 5.0**.
- **No customer refund time-limit enforcement** (invariant #7). Needs `event_date` context from Event Management; design pending.
- **No automatic expiration.** `ExpireOrderUseCase` exists but no scheduler calls it. Add `@Cron` worker in Phase 3.8 or 6.x.

## Deferred Patterns

See [`../../SESSION-PROGRESS.md`](../../SESSION-PROGRESS.md) — typed ID value objects and Command/Query objects were considered and deferred intentionally. Revisit when Check-in context arrives (cross-aggregate IDs) or at Phase 7 (CQRS).

---

## External Dependencies (outbound ports)

| Port | Current adapter | Production adapter |
|---|---|---|
| `OrderRepository` | `MikroOrmOrderRepository` (Postgres) | same |
| `PaymentGateway` | `FakePaymentGateway` (deterministic `fail-` prefix) | `StripePaymentGateway` — Phase 5.2 |
| `EventAvailabilityChecker` | `FakeEventAvailabilityChecker` (in-memory Map) | HTTP/gRPC to Event Management — when that context exists |
| `Clock` | `SystemClock` | same |
| `IdGenerator` | `CryptoIdGenerator` (node:crypto UUID v4) | same |
