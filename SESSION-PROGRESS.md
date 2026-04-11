# Session Progress

## Current Phase: 3.4 — External Service Adapters (next)

Phases 0, 1.1–1.6 complete. Phase 1.7 (tests) deferred until routes work. Domain layer fully built. Application layer complete (all 4 use cases). Infrastructure: entities, migrations, mapper, and repository done.

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

### Phase 1.4 — Order Aggregate
- Created **OrderItem** child entity in `src/ordering/domain/model/OrderItem.ts`:
  - Extends Entity, immutable after creation, receives value objects (Quantity, Money) directly
  - Getters for all fields, `getTotal()` returns Money (quantity × unitPrice)
- Created **Order** aggregate root in `src/ordering/domain/model/Order.ts`:
  - Extends AggregateRoot, 9 private fields, constructor receives ALL fields (for DB reconstruction)
  - `static create()` factory sets defaults (status=reserved, createdAt=now, expiresAt=now+15min)
  - Behavior methods: `pay()`, `expire()`, `cancel(reason)` — transition status via OrderStatus value object
  - `getTotal()` calculates from items using reduce
  - `getItems()` returns a copy (`[...this.items]`) to prevent external mutation
  - Invariant #1 enforced: throws EmptyOrderItem if items array is empty
  - All 4 methods record domain events via `this.addDomainEvent()`
- Created **EmptyOrderItem** domain error in `src/ordering/domain/errors/`
- Created **4 domain events** in `src/ordering/domain/events/`:
  - `OrderCreated` (orderId, expiresAt) — recorded in create()
  - `OrderPaid` (orderId, attendeeId, eventId, items as plain data) — recorded in pay()
  - `OrderExpired` (orderId, attendeeId) — recorded in expire()
  - `OrderCancelled` (orderId, attendeeId, reason) — recorded in cancel()
  - Events use `public readonly` fields (no getters needed — immutable data carriers)
  - Events carry self-contained data for future microservice compatibility
- Key lessons learned:
  - Constructor = dumb (receives everything, just assigns). Factory = smart (computes defaults)
  - Constructor is for DB mapper reconstruction, factory is for new creation
  - Value objects are received, not created inside entities (avoid double validation)
  - Arrays are passed by reference — return copies to protect aggregate internals
  - `readonly` only prevents reassignment — mutable fields (status, paidAt) can't be readonly
  - Domain events are recorded inside aggregate, published externally by use case (Phase 2)
  - Events carry plain data, not domain objects (map OrderItem[] to simple {ticketTypeId, quantity})
  - Anemic Domain Model (anti-pattern) = classes with only data, no behavior — recognized in Acutis project
  - DDD vs Good OOP: main difference is bounded contexts + domain events + ubiquitous language as law
  - Not every project needs DDD — simple CRUD is fine without it, DDD adds overhead
  - CQRS is separate from events — events decouple contexts, CQRS organizes reads/writes

### Phase 1.5 — Repository Interfaces (Ports)
- Created `OrderRepository` interface in `src/ordering/domain/ports/OrderRepository.ts`
  - 3 methods: `save(order)`, `findById(id)`, `findByAttendeeId(attendeeId)`
  - All async (Promise), findById returns `Order | null`
  - One repository per aggregate root — no OrderItemRepository
- Key lessons: ports define WHAT the domain needs, not HOW. Zero framework imports.

### Phase 1.6 — Domain Service Interfaces (Ports)
- Created `EventAvailabilityChecker` in `src/ordering/domain/ports/`
  - `isEventOpenForSales(eventId)` and `hasEnoughTickets(ticketTypeId, quantity)`
  - Enforces invariants #2 and #6 which need external data
- Created `PaymentGateway` in `src/ordering/domain/ports/`
  - `charge(orderId, amount, paymentToken)`
- Chose Option A (port in domain) over Option B (direct check in use case) for microservice-readiness
- Key lessons: domain defines what it needs to ask external services, infrastructure implements how

### Phase 2.1 — CreateOrderUseCase (Application Layer)
- Created `CreateOrderUseCase` in `src/ordering/application/CreateOrderUseCase.ts`
  - @Injectable, receives OrderRepository and EventAvailabilityChecker via DI
  - execute() receives raw data (eventId, attendeeId, items as plain objects)
  - Orchestrates: check availability → create domain objects → Order.create() → save → return
  - Converts raw input to value objects (Money, Quantity) and entities (OrderItem) — use case is the translator
- Created 2 new domain errors: `EventNotAvailable`, `InsufficientTickets`
- Key lessons learned:
  - Use case is THIN — orchestrates but doesn't contain business logic
  - Constructor = dependencies (services, repos via DI). execute() = per-request data
  - Domain objects (Order, Money) are created with `new`/`.create()`, not injected
  - Services (repos, gateways) are injected — they change between production/tests
  - Missing `await` on Promise is a dangerous silent bug — Biome `noFloatingPromises` catches it
  - Application layer CAN use NestJS decorators — only domain layer is pure TS
  - Use cases belong in application layer, not domain — they orchestrate but don't contain rules
  - Three layers of validation: DTO (input format) → Use case (external preconditions) → Domain (business rules)
  - "Open for sales" rule belongs to Event Management domain; Ordering just asks via port

### Phase 2.1 continued — PayOrderUseCase and CancelOrderUseCase
- Created `PayOrderUseCase` in `src/ordering/application/PayOrderUseCase.ts`
  - Uses PaymentGateway port to charge, then order.pay(), then save
  - Handles payment failure with PaymentFailed domain error
  - Created `PaymentMethod` type (`'credit_card' | 'pix' | 'boleto'`) in PaymentGateway port
- Created `CancelOrderUseCase` in `src/ordering/application/CancelOrderUseCase.ts`
  - Simplest use case: find → cancel(reason) → save
- Created `PaymentFailed` domain error
- Refactored all classes to use **parameter properties** (TS feature) — cut ~40 lines of boilerplate
  - Works on: Entity, Order, OrderItem, OrderStatus, all events, all use cases
  - Doesn't work on: Money, Quantity (validation runs before assignment)
- Fixed all remaining Biome errors (explicit return types on AggregateRoot, Entity, main.ts)

### Phase 2.1 continued — ExpireOrderUseCase
- Created `ExpireOrderUseCase` in `src/ordering/application/ExpireOrderUseCase.ts`
  - Simplest use case: find, guard not found, expire, save
  - Triggered by the system (scheduled job), not by a person
  - Student correctly identified that it's the system, not a human, that triggers expiration

### Phase 3.1 — MikroORM Entities (Persistence Model)
- Created `OrderEntity` in `src/ordering/infrastructure/OrderEntity.ts`
  - `@Entity({ tableName: 'orders' })` with all columns from DB schema
  - `@Enum(() => OrderStatusEnum)` for status field
  - `@Property({ type: 'decimal' })` for money (total)
  - Nullable fields with `{ nullable: true }` and `?` type
  - `@OneToMany(() => OrderItemEntity, item => item.order)` with `Collection<OrderItemEntity>`
  - Created `OrderStatusEnum` (reserved, paid, cancelled, expired) — separate from domain `OrderStatus` value object
- Created `OrderItemEntity` in `src/ordering/infrastructure/OrderItemEntity.ts`
  - `@ManyToOne(() => OrderEntity)` with `Ref<OrderEntity>` to resolve circular reference
  - `@Property({ type: 'decimal' })` for unit_price
  - `@Property({ type: 'integer' })` for quantity
- Key lessons learned:
  - Persistence entities are DUMB data holders — no behavior, no validation, all fields public
  - Separate from domain models — persistence optimized for storage, domain for business rules
  - MikroORM v7 moved decorators to `@mikro-orm/decorators/legacy` (NestJS requires legacy because of `experimentalDecorators: true`)
  - ES spec decorators (`/es`) exist but can't be used with NestJS yet
  - `@ManyToOne` = "many of THIS entity belong to one of THAT entity" — first word = current entity
  - `@OneToMany` = inverse side, needs `Collection<T>` type with `new Collection(this)` initialization
  - MikroORM auto-generates FK column names: field `order` → column `order_id`
  - Circular references between entities need `Ref<T>` type wrapper from `@mikro-orm/core`
  - MikroORM v7 without reflect-metadata needs explicit `type` in every decorator
  - `!` (definite assignment assertion) needed on ORM fields — TS strict mode doesn't know ORM fills them

### Phase 3.2 — Migrations
- Generated initial migration: `src/migrations/Migration20260411183609.ts`
  - `npx mikro-orm migration:create --initial` reads entities and generates SQL
  - `npx mikro-orm migration:up` executes the SQL against PostgreSQL
- Migration creates: `orders` table, `order_items` table, FK constraint, enum check constraint
- Key lessons learned:
  - `migration:create` = generate the SQL plan, `migration:up` = execute it
  - Migrations run exactly once — MikroORM tracks executed migrations in `mikro_orm_migrations` table
  - No `IF NOT EXISTS` needed — migrations are designed for one-time execution
  - Docker volume persists data across container restarts — tables survive restart
  - Required `@oxc-node/core` for MikroORM CLI to run TypeScript files
  - Required `mikro-orm` section in package.json with `configPaths` for CLI to find config

### Phase 3.3 — Repository Implementation (Mapper + Adapter)
- Created `OrderMapper` in `src/ordering/infrastructure/OrderMapper.ts`
  - `toDomain(entity)` — converts OrderEntity (raw DB values) to domain Order (value objects)
  - Maps `OrderStatusEnum` string → `OrderStatus` value object via statusMap
  - Maps `OrderItemEntity[]` → `OrderItem[]` wrapping quantity/price in value objects
  - No `toPersistence` — saving is handled by the repository directly using MikroORM's tracked entities
  - Used `biome-ignore` for static-only class (Mapper pattern convention)
- Created `MikroOrmOrderRepository` in `src/ordering/infrastructure/MikroOrmOrderRepository.ts`
  - Implements `OrderRepository` domain port with MikroORM `EntityManager`
  - `findById`: loads entity with `populate: ['items']` (joins both tables), maps to domain
  - `findByAttendeeId`: loads array, maps each to domain. Returns `[]` not `null` for no results
  - `save`: checks if entity exists → update tracked fields or `em.create()` with items → `em.flush()`
  - `em.flush()` = Unit of Work pattern — all changes persisted in one transaction
  - `domainToEnum` map for domain status string → `OrderStatusEnum` (avoids `as` casting)
- Fixed `OrderEntity` nullable fields: changed `?` (undefined) to `| null` to match domain model
- Key lessons learned:
  - Mapper only needs `toDomain` — ORM tracks entities for updates, `em.create` handles inserts
  - `em.findOne` returns entity tracked by identity map — updating its fields and flushing persists changes
  - `em.create` registers new entity in identity map without needing to store the return value
  - `em.flush` writes all tracked changes in one transaction (Unit of Work pattern)
  - Repository returns `null` for single not-found, empty array `[]` for list queries — never throws
  - Use case decides what to do with null (throw NotFoundException, etc.)
  - `populate: ['items']` tells MikroORM to join child table automatically
  - `?` in TS means `T | undefined`, `| null` means `T | null` — DB nulls should use `| null`
  - Student wants to write code himself — mentor should give structure/hints, not full implementations

### Tooling updates
- Added Biome nursery rules: `noFloatingPromises` (error), `useExplicitType` (error)
- Fixed VS Code import sorting on save: added `source.fixAll.biome` to codeActionsOnSave
- Moved `biome.json` into `event-ticketing/` for proper VS Code extension detection
- Added `.vscode/settings.json` in both root and `event-ticketing/` with `biome.lspBin` path
- Removed deprecated `baseUrl` from tsconfig, replaced with `paths`
- Installed `dotenv` for MikroORM CLI env loading
- Installed `@mikro-orm/decorators` for v7 decorator imports
- Installed `@oxc-node/core` for TS file support in MikroORM CLI
- Updated all MikroORM packages from 7.0.8 to 7.0.10

## What's Next
4. ~~Phase 1.4~~ ✅
5. ~~Phase 1.5~~ ✅
6. ~~Phase 1.6~~ ✅
7. **Phase 1.7** — Domain unit tests (deferred — will write after routes are working)
8. ~~Phase 2.1~~ ✅ — All 4 use cases complete
9. ~~Phase 3.1~~ ✅ — MikroORM entities
10. ~~Phase 3.2~~ ✅ — Migrations
11. ~~Phase 3.3~~ ✅ — Repository implementation (mapper + MikroORM adapter)
12. **Phase 3.4** — External service adapters (fake payment gateway, event availability)
13. **Phase 3.5** — HTTP controllers
14. **Phase 3.6** — Error handling (exception filters)
15. **Phase 3.7** — NestJS module wiring

## Architectural Decisions

### Events + CQRS
- Build Phase 2 **without CQRS** — simple use case services + EventEmitter2 for domain events
- After Phase 4, optionally refactor to CQRS (`@nestjs/cqrs` with CommandBus/QueryBus/EventBus) so the student learns both approaches
- Domain events are independent of CQRS — they work with or without it
- In-memory EventBus is production-grade for a monolith — message brokers (Kafka, RabbitMQ) are only needed for microservices
- If bounded contexts are later split into microservices, only the infrastructure adapter changes (EventBus → Kafka), domain code stays the same

### Future exploration (after Phase 4)
- Explore **message queues** (RabbitMQ or Kafka) — swap in-memory EventBus for a real broker to learn infrastructure-level event transport

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
- Connects learning to real job projects (compared Acutis and Avenir to patterns being learned) — let these tangents happen, they deepen understanding
- Wants to learn common/foundational patterns before advanced ones (prefers use case services before CQRS)
- Don't push to next step — let the student explore questions at their own pace
- Had "aha moment" about OOP — understood why anemic models make OOP feel pointless, and why rich models justify classes
- Prefers to see the full flow working before writing tests (practical learner)
- Common mistakes: missing `await`, typos in method names, forgetting to assign return values of immutable operations
- Frustrated by TS/JS tooling friction — recognizes Java/C# are better fits for DDD/OOP patterns
- Interested in migrating to Java/Spring Boot after finishing this project — wants good job opportunities in Brazil and abroad
- Wants to do things himself — got frustrated when mentor did too much infrastructure setup without explaining

## Project Files

- `CLAUDE.md` — Project guide with references to all docs
- `TECHNICAL.md` — Architecture rules (pre-existing, not modified)
- `TEACH-ME.md` — Teaching methodology (pre-existing, not modified)
- `DOMAIN.md` — All project-specific decisions (glossary, contexts, aggregates, DB schema, API design)
- `how-to-map-requirements/` — 5 reusable thinking guides (01 through 05)
- `event-ticketing/` — NestJS project with MikroORM, PostgreSQL via Docker
- `.claude-memories/` — Persistent memories that travel with the repo (learning profile, feedback)
