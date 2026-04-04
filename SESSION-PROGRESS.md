# Session Progress

## Current Phase: 1.1 — Shared Base Classes (not started)

Phase 0 is complete. The student is ready to start writing domain code.

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

## What's Next: Phase 1 — Domain Model

Guide the student through building pure TypeScript domain code (no framework imports):

1. **Phase 1.1** — Shared base classes in `shared/domain/`: Entity, AggregateRoot, ValueObject, DomainEvent
2. **Phase 1.2** — Value Objects for the Ordering context
3. **Phase 1.3** — Domain Errors
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
