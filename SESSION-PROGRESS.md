# Session Progress

## Current Phase: 1.4 — Order Aggregate (not started)

Phases 0, 1.1, 1.2, and 1.3 are complete. Student has shared base classes, value objects, and domain errors built.

## Completed Phases

### Phase 0.1 — Domain Selection
- Chose **Event Ticketing Platform** (like a simpler Eventbrite)
- Single-platform (not multi-tenant) — anyone can organize events, anyone can buy tickets
- General admission only (quantity-based, no assigned seats)

### Phase 0.2 — Ubiquitous Language
- Built glossary in DOMAIN.md
- Key corrections made during learning:
  - "Venue" is not the main thing — "Event" is (venue is a property)
  - "Lock" is a technical term — business says "Reservation"
  - "User" is too generic — business says "Organizer" and "Attendee"
  - "Confirmation" is not the thing at the door — it's a "Ticket"

### Phase 0.3 — Bounded Contexts
- Identified 3 contexts: Event Management, Ordering, Check-in
- Chose **Ordering** as the core domain to build first (richest business rules)
- Key lesson: start with the most complex context, not the chronologically first one
- Cross-context communication: EventCancelled (Event Mgmt → Ordering), OrderPaid/OrderCancelled (Ordering → Check-in)

### Phase 0.4 — Aggregate Mapping
- Aggregate root: **Order**
- Child entity: **Order Item** (ticket type reference, quantity, unit price)
- 8 invariants defined (see DOMAIN.md)
- 5 domain events mapped with reactors (see DOMAIN.md)
- 2 refund policies: customer-initiated (time-limited) vs organizer-cancelled-event (always)
- Key lesson: Order Items ≠ Tickets. Order Items are the intent (exist from reservation), Tickets are the result (exist after payment)

### Phase 0.5 — Database Design
- 3 tables: orders, order_items, tickets
- Key lessons learned:
  - One-to-many: children get their own table with FK to parent
  - Denormalization: event_id on tickets avoids joins during door scanning
  - Never delete data for state changes — use status fields
  - DECIMAL for money, never FLOAT
  - Index frequently-queried FKs, not all FKs
  - Order Items stay forever as historical records (receipts)

### Phase 0.6 — API Design
- 5 endpoints defined with request/response shapes (see DOMAIN.md)
- Key lessons learned:
  - URLs are nouns, not verbs: `/orders/:id/pay` not `/orders-pay`
  - POST for business actions (pay, cancel), PATCH for field updates
  - 400 = structurally wrong request, 409 = business rule violation
  - 404 = not found (it IS an error), 200 + empty array = no results (NOT an error)
  - 204 = no response body allowed
  - APIs return data, frontends build messages
  - Request bodies contain minimum data — server knows prices, user ID (from token), timestamps

### Phase 0.7 — Project Setup
- Scaffolded NestJS with `npx @nestjs/cli new event-ticketing --package-manager pnpm --strict`
- Changed tsconfig to `"strict": true` (full strict, not partial — important for DDD to catch uninitialized fields)
- Installed MikroORM: `@mikro-orm/core`, `@mikro-orm/nestjs`, `@mikro-orm/postgresql`, `@mikro-orm/migrations`, `@mikro-orm/cli`
- Installed `@nestjs/config` for environment variable management
- PostgreSQL 16 via Docker Compose (container: `event_ticketing_db`, port 5432)
- `.env` with DATABASE_HOST, DATABASE_PORT, DATABASE_NAME, DATABASE_USER, DATABASE_PASSWORD
- `mikro-orm.config.ts` with `defineConfig` + `import 'dotenv/config'` (single config for both NestJS and CLI)
- `app.module.ts` wired with `ConfigModule.forRoot({ isGlobal: true })` and `MikroOrmModule.forRoot(mikroOrmConfig)`
- Folder structure created: only domain layer folders for now (ordering/domain/model, ports, events, errors + shared/domain). Application and infrastructure folders removed — will create when needed (no empty folders)
- `ordering.module.ts` created (empty, to be wired later)
- Key lessons learned:
  - Always use production tools (PostgreSQL + Docker, not SQLite)
  - Docker volumes: named volume on host mapped to container path, not copying — same folder accessed from two paths
  - `forRoot()` = global setup in AppModule, `forFeature()` = per-module entity registration
  - `defineConfig` config file serves both NestJS app and MikroORM CLI
  - NestJS folder convention is flexible — modules wire everything, folder structure is our choice

### Phase 1.1 — Shared Base Classes
- Created 4 base classes in `src/shared/domain/`:
  - `Entity.ts` — abstract, public readonly id, equals() by id
  - `ValueObject.ts` — abstract, abstract equals() (each subclass defines own equality)
  - `DomainEvent.ts` — abstract, readonly occurredOn set to new Date() in constructor
  - `AggregateRoot.ts` — extends Entity, private domainEvents array, protected addDomainEvent(), public pullDomainEvents() (returns events and clears array)
- Set up Biome for formatting/linting (replaced ESLint + Prettier)
  - biome.json at workspace root (study/) with paths pointing to event-ticketing/src/**
  - VS Code format on save configured
  - Semicolons disabled (asNeeded)
- Key lessons learned:
  - `abstract` = blueprint class, can't instantiate directly
  - `public readonly` for id — visible but immutable
  - `private` vs `protected` vs `public` access modifiers
  - Classes can be used as types in TypeScript (not just as constructors)
  - `pullDomainEvents()` must clear the array after returning to prevent duplicate publishing
  - Domain layer imports NOTHING from frameworks — pure TypeScript

### Phase 1.2 — Value Objects
- Created 3 value objects in `src/ordering/domain/model/`:
  - `Money.ts` — stores amount in cents (integer), non-negative, private constructor + static create()
  - `Quantity.ts` — positive integer, same pattern as Money
  - `OrderStatus.ts` — state machine value object with transition methods (toPaid, toExpired, toCancelled), static factories per state (reserved, paid, expired, cancelled), guards invalid transitions
- Updated `ValueObject.ts` base class — removed generic approach, kept simple `abstract equals(other: unknown)` with instanceof check in subclasses
- Key lessons learned:
  - Value objects are immutable — transitions return NEW objects, never mutate
  - Private constructor + static factory = one controlled entry point
  - Money stored as integer cents avoids floating-point issues (industry standard: Stripe, PayPal)
  - `Number.isInteger()` to enforce no decimals
  - `super()` must be called in child constructors (TS and Java both enforce this)
  - Self-referential generics (`ValueObject<T extends ValueObject<T>>`) are a Java/C# pattern — in TS the simpler `equals(other: unknown)` with instanceof is more common
  - Static methods can't access instance fields (`this.value` doesn't exist on the class)
  - `instanceof` narrows types in TS — after the check, TS knows the type
  - OrderStatus static factories needed for: initial creation (reserved), DB reconstruction (any state), testing
  - Terminal states = no transitions allowed (expired, cancelled)
  - Always add explicit access modifiers (public/private/protected) for readability

### Phase 1.3 — Domain Errors
- Created `DomainError` base class in `src/shared/domain/DomainError.ts` — extends Error, auto-sets `this.name` to class name via `this.constructor.name`
- Created 3 domain errors in `src/ordering/domain/errors/`:
  - `InvalidMoney.ts` — takes invalid value, produces descriptive message
  - `InvalidQuantity.ts` — same pattern as InvalidMoney
  - `InvalidOrderTransition.ts` — takes current and attempted status, type-safe with exported `OrderStatusType`
- Updated value objects (Money, Quantity, OrderStatus) to throw domain errors instead of generic `Error`
- Exported `OrderStatusType` from OrderStatus.ts for type safety in error class
- Key lessons learned:
  - Custom domain errors are catchable by type (`instanceof`) — generic `Error` is not
  - `DomainError` base class lets infrastructure catch ALL business errors with one `instanceof DomainError` check
  - One error class per business situation, not per validation line (InvalidMoney covers both "not integer" and "negative")
  - `throw` needs `new` — without it you throw the class itself, not an instance
  - `this.constructor.name` returns the class name as a string — built-in JS feature
  - Error `.name` and `.message` are different: name = error type, message = what went wrong

## What's Next: Phase 1.4 — Order Aggregate
4. **Phase 1.4** — Order aggregate root with Order Items
5. **Phase 1.5** — Repository interfaces (ports)
6. **Phase 1.6** — Domain service interfaces (ports)
7. **Phase 1.7** — Domain unit tests

## Student Profile

- Learning DDD, Hexagonal, and Clean Architecture for the first time
- Not deeply familiar with database concepts (indexes, FK relationships, Docker volumes were new)
- Needs visual examples (table diagrams, ASCII art) to understand data relationships
- Asks good clarifying questions — prefers to understand WHY before proceeding
- Sometimes needs multiple hints before attempting challenges
- Gets confused between similar concepts (Order Items vs Tickets, Event vs Venue)
- Responds well to direct corrections with consequences explained
- Wants production-grade tools always — no toy setups (SQLite → PostgreSQL, etc.)
- Pushes back when something feels wrong — good instinct, respect it
- Curious about how things work under the hood (Docker volumes, token context, config loading)

## Project Files

- `CLAUDE.md` — Project guide with references to all docs
- `TECHNICAL.md` — Architecture rules (pre-existing, not modified)
- `TEACH-ME.md` — Teaching methodology (pre-existing, not modified)
- `DOMAIN.md` — All project-specific decisions (glossary, contexts, aggregates, DB schema, API design)
- `how-to-map-requirements/` — 5 reusable thinking guides (01 through 05)
- `event-ticketing/` — NestJS project with MikroORM, PostgreSQL via Docker
- `.claude-memories/` — Persistent memories that travel with the repo (learning profile, feedback)
