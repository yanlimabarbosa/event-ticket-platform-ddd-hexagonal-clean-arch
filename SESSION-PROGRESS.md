# Session Progress

## Current Phase: 3.7 — Module wiring review (next, mostly done), then 3.8 Outbox

All 4 HTTP endpoints live (create / list by attendee / pay / cancel). Global `DomainExceptionFilter` maps domain errors → HTTP via marker parent classes (`NotFoundError`, `ConflictError`, `ValidationError`). Money columns migrated from `numeric(10,0)` → `integer` to fix DB round-trip type mismatch. REST Client `.http` file added with all 15 scenarios (happy path + unhappy paths + validation failures).

Phases 0, 1.1–1.6, 2.1, 3.1–3.6 complete. Phase 1.7 (tests) deferred until Phase 4. Domain + application + infrastructure fully built for Ordering context. All ports are abstract classes. All use cases wired with DI. HTTP layer fully functional.

## Deferred Patterns (considered, intentionally not adopted yet)

- **Typed ID value objects (`OrderId`, `OrderItemId`, etc.).** Prototyped end-to-end during this session then reverted. On the current codebase (single bounded context, 2 aggregate-level IDs, use cases still accepting strings at the public API) the ROI is marginal — the pattern catches maybe 1 bug class (`OrderId` ↔ `OrderItemId` mixing inside `CreateOrderUseCase`) at the cost of 3 new files, generic base classes (`Entity<TId>`, `AggregateRoot<TId>`), and VO↔string conversion at every boundary (mapper, repo, DTO, events). **Revisit when:** (a) Check-in adds a second aggregate with cross-ID references (`TicketId`, `OrderId`, `EventId`, `AttendeeId` all flowing through one method signature — this is where the pattern pays off), (b) an incident shows an ID-mix bug in production, or (c) we extend to Option B scope and add foreign-ID VOs. Reference implementation existed briefly; reverted by student as "too much ceremony for current return." Also acknowledged limitation: TS type tagging is lost the moment `.value` is extracted, so even with VOs `OrderId.from(attendeeIdString)` compiles fine — the pattern catches compile-time signature mixing, not runtime string roundtrips. Stripe-style prefixed IDs (`order_<uuid>`, `attendee_<uuid>`) are the runtime-safe alternative, deferred until it's warranted by real external API pressure.

- **Command/Query objects (`CreateOrderCommand`, `PayOrderCommand`, etc.).** Discussed and intentionally deferred. These are the building block of CQRS — a Command is a plain typed DTO representing an intent (e.g., `class CreateOrderCommand { constructor(eventId, attendeeId, items) {} }`), passed as a single parameter to the use case's `execute(cmd)`. Benefits: named verbs in the application layer, self-documenting signatures, 1:1 migration to `@CommandHandler` in Phase 7, matches Spring `@CommandHandler` idiom. Current signatures accept primitives (`execute(eventId, attendeeId, items)`) which is simpler and sufficient for 2-3 param use cases. **Revisit when:** Phase 7 (CQRS refactor) arrives — at that point Commands are mandatory, and retrofitting them before the bus exists adds ceremony with no bus-level payoff yet. Queries can stay as primitive params indefinitely unless they grow multi-filter signatures.

## Known Gaps (to revisit)

- **Domain events are recorded but never published.** Use cases call `order.pay()` etc. (which records events) and then call `save()`, but nobody calls `pullDomainEvents()`. **Decision for Phase 3.8: outbox pattern.** Events get inserted into an `outbox_events` table inside the same transaction as the aggregate write; a background worker polls the table and publishes to EventEmitter2 (later swappable for RabbitMQ/Kafka). Rejected alternatives: direct publish (can lose events on crash), transactional messaging (requires Kafka + complex setup).
- **Phase 3.8 scaffolding needed:** `outbox_events` migration, `OutboxEventEntity`, `DomainEventPublisher` port, `OutboxDomainEventPublisher` adapter, background worker (NestJS `@Cron` or interval) that polls and marks rows published.
- **IDOR vulnerabilities — identity fields come from client-controlled input.** Current API trusts `attendeeId` from request body (`POST /orders`) and query param (`GET /orders?attendeeId=X`). Any caller can create orders on someone else's behalf or list anyone's orders. **Resolved in Phase 5.0 (Auth).** When auth lands, refactor ALL affected surfaces:
  - Remove `attendeeId` from `CreateOrderRequestDto` — source it from `@CurrentAttendee()` decorator instead
  - Replace `GET /orders?attendeeId=X` with `GET /orders/me` — no tamperable query param
  - Audit every future endpoint/DTO for the same pattern (organizerId when Event Management lands, any `*Id` that refers to the authenticated user)
  - Add role-based guards where needed (e.g., only an Organizer can cancel their own event; only the owning Attendee can cancel their own order)
  - General rule: **identity fields must never be trusted from request payloads** — always from the verified token/session.

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

### Phase 3.3 follow-up — Mapper refactor (toPersistence + applyStateChanges)
- Problem identified by student: `OrderMapper` only had `toDomain()`. Domain→entity mapping was inlined in `MikroOrmOrderRepository.save()` (30 lines, `domainToEnum` map duplicated between repo and mapper).
- Refactor: added `OrderMapper.toPersistence(order): RequiredEntityData<OrderEntity>` for inserts, and `OrderMapper.applyStateChanges(entity, order): void` for updates.
- Repository `save()` shrunk from ~30 lines to 8 lines. Both status conversion maps (`enumToDomain`, `domainToEnum`) now live together in the mapper.
- Used `import type { OrderEntity }` split from `import { OrderStatusEnum }` — enum is a runtime value, entity is a type-only import.
- Key lessons learned:
  - "Unit of Work handles persistence" means MikroORM handles the SQL, NOT the domain→ORM translation. That translation always has to happen somewhere.
  - `applyStateChanges` only touches mutable fields (status, total, paid_at, cancelled_at, cancel_reason). Immutable fields never change after creation — mirrors the domain.
  - `RequiredEntityData<OrderEntity>` is MikroORM's type for "the plain data shape needed by `em.create`" — handles `Collection<T>` → array conversion automatically.
  - Half-finished refactors (port created, old code still called) are the most common kind in the wild. Always grep for the old call after introducing a replacement.

### Phase 3.3 follow-up — IdGenerator port + adapter
- Problem: `CreateOrderUseCase` called `crypto.randomUUID()` inline — non-deterministic, hard to test.
- Created `IdGenerator` port in `domain/ports/` with single `generate(): string` method.
- Created `CryptoIdGenerator` adapter in `infrastructure/` using `node:crypto` `randomUUID()`. `@Injectable()`, extends (not implements) the abstract port.
- Wired into `CreateOrderUseCase` constructor — both `Order` and `OrderItem` IDs now come from `this.idGenerator.generate()`.
- Key lessons learned:
  - Non-deterministic calls (`crypto.randomUUID`, `new Date()`) are infrastructure by definition — they produce side effects. Keep them behind ports.
  - One shared `IdGenerator` port is fine for all aggregates/entities — don't split into `OrderIdGenerator` + `OrderItemIdGenerator`. They want the same string.
  - Common mistake: `new randomUUID()` — `randomUUID` is a function, not a class. `new` only applies to constructors. TS strict mode catches this.
  - `new Date()` inside `Order.create()` is a second hidden dependency — a `Clock` port would let tests freeze time. Deferred for now.

### Phase 3.3 follow-up — Abstract classes for all ports (major architectural refactor)
- Problem: TypeScript interfaces are erased at compile time. NestJS DI has no runtime type to resolve against, forcing `@Inject('string-token')` — ugly, stringly-typed, easy to typo silently.
- Refactor: converted all 4 Ordering ports from `interface` to `abstract class`:
  - `IdGenerator`, `OrderRepository`, `PaymentGateway`, `EventAvailabilityChecker`
- Adapters switched from `implements` to `extends` (with `super()` in constructors where applicable) and use `public override` on every method.
- Use cases now inject ports by type alone — **no `@Inject()` decorators needed** because abstract classes survive compilation as real JS classes (valid runtime DI tokens).
- Module wiring (future Phase 3.7) uses the class itself as the token: `{ provide: OrderRepository, useClass: MikroOrmOrderRepository }`.
- Changed port imports in use cases from `import type {...}` to `import {...}` — abstract classes are runtime values, not just types.
- Key lessons learned:
  - **NestJS DI is a `Map<token, implementation>`.** Tokens are runtime values. Interfaces can't be tokens because they vanish at compile time. Classes survive, so they CAN be tokens. Abstract classes are still classes.
  - Decision rule: concrete class → NestJS resolves by type automatically. Abstract class → NestJS resolves by class-as-token (type-only injection works). Interface → must use `@Inject('string')` and is stringly-typed.
  - `public override` (explicit modifiers rule) gives you TS safety: if the parent method is renamed, children break at compile time. `implements` gives weaker guarantees — a renamed interface method silently becomes a NEW method on the implementer.
  - The `super()` call in constructors that extend abstract classes is required — Java enforces the same rule.
  - This is the **NestJS-idiomatic** pattern for ports — the framework docs themselves recommend abstract classes for this reason.

### Cross-cutting learning — TypeScript vs Java for DDD/OOP (conclusion reached this session)
- Student hit the wall with TS's type erasure during DI wiring and explicitly concluded: **will migrate to Java/Spring Boot after this project**.
- Why Java is genuinely better for DDD/OOP:
  - **Reflection & reified types.** Java interfaces survive as runtime `Class<?>` objects. Spring can do `applicationContext.getBean(OrderRepository.class)` — no token dance, no abstract-class workaround. The "interface is the idiomatic port shape" in Java and 90% of Spring codebases use interfaces for ports.
  - **Real access modifiers.** `private` is a JVM guarantee. In TS it's a lint rule — `(order as any).status = 'paid'` bypasses it and ruins aggregate invariants. For DDD where invariants matter, this is significant.
  - **Nominal typing.** Java types match by name. TS structural typing means `{ id: string }` accidentally satisfies your `Entity` type. Nominal typing is safer for DDD.
  - **Real enums.** Java enums are classes with methods. TS enums are a mess and most teams avoid them.
  - **Stable decorator spec.** `@Injectable` `@Entity` sit on years-long "stage 2/3" proposals in JS.
- Java/Kotlin job-market take:
  - **Java dominates.** ~10x more jobs than Kotlin backend — Brazil and abroad. Banks, insurance, e-commerce, enterprise.
  - **Kotlin is not mobile-only.** General-purpose JVM, used for backend at Netflix/Uber/Pinterest/Square. Nordic fintech likes it. But still a much smaller job pool.
  - **Strategy:** learn Java + Spring Boot first (hireable skill), add Kotlin later as a differentiator. Most "Kotlin jobs" accept Java devs; few "Java jobs" require Kotlin.
  - **Export package for Brazilian devs abroad:** English + Java + Spring + DDD + cloud (AWS/GCP) + Kubernetes.
- Architectural patterns learned in TS transfer 1:1 to Java — the hard part is domain modeling, not the language. Nothing wasted.

### Phase 3.3 follow-up — OrderNotFound domain error
- Problem: `PayOrderUseCase`, `ExpireOrderUseCase`, `CancelOrderUseCase` were throwing NestJS `NotFoundException` from the application layer — HTTP infrastructure leaking into the use-case layer (hexagonal violation).
- Created `OrderNotFound` domain error in `src/ordering/domain/errors/OrderNotFound.ts` extending `DomainError`, takes order id in constructor.
- Replaced all 3 `throw new NotFoundException()` calls with `throw new OrderNotFound(orderId)`.
- Removed `NotFoundException` imports from use cases.
- Future Phase 3.6 exception filter will map `OrderNotFound` → HTTP 404.
- Key lessons learned:
  - Application layer should throw domain errors only — HTTP exceptions belong in controllers/filters.
  - One domain error class per business situation. `OrderNotFound(id)` is more expressive than `Error('not found')`.
  - The `DomainError` base class lets a single exception filter catch all business errors with one `instanceof DomainError` check.

### Phase 3.3 follow-up — Clock port and SystemClock adapter
- Problem: `Order.create()`, `Order.pay()`, `Order.cancel()` all called `new Date()` directly. Non-deterministic, hard to test (can't freeze time without globally mocking Date).
- Created `Clock` abstract class port in `domain/ports/Clock.ts` with `now(): Date`.
- Created `SystemClock` adapter in `infrastructure/SystemClock.ts` using `new Date()`. `@Injectable`, `extends Clock`, `public override now()`.
- Refactored `Order`:
  - Extracted `RESERVATION_WINDOW_MS = 15 * 60 * 1000` as private static readonly constant (no more magic number).
  - `Order.create(id, eventId, attendeeId, items, now: Date)` — takes `now`, computes `expiresAt = now + RESERVATION_WINDOW_MS` internally (the "+15 min" rule stays in the domain).
  - `Order.pay(now: Date)` — takes `now` for `paidAt`.
  - `Order.cancel(reason, now: Date)` — takes `now` for `cancelledAt`.
  - `Order.expire()` unchanged (no timestamp recorded).
- Use cases (`CreateOrderUseCase`, `PayOrderUseCase`, `CancelOrderUseCase`) now inject `Clock` and pass `this.clock.now()` to aggregate methods.
- Key lessons learned:
  - **Functional core, imperative shell** — aggregates take pure values (Date), not service interfaces (Clock). Use case orchestrates the Clock.
  - Alternative was inject-Clock into the aggregate constructor — rejected because it pollutes the mapper (would need Clock to reconstruct from DB) and every test (custom FakeClock helper).
  - Aggregates should be reconstructable from pure data — the row in the DB has all the dates already; rebuilding shouldn't require a service.
  - Inject-Clock has one strong case: batch consistency (1000 aggregates sharing same `now`). Solve in pass-Date by capturing `const now = this.clock.now()` once at top of use case and reusing.
  - Magic numbers (`15 * 60 * 1000`) should become named constants — this one is a real domain rule (reservation window length).

### Phase 3.3 follow-up — Biome config consolidation
- Problem: two `biome.json` files (workspace root + `event-ticketing/`) were drifting. VS Code LSP picked up the workspace root config, CLI from event-ticketing folder picked up the inner one. Edits in one were ignored by the other.
- Inner `event-ticketing/biome.json` deleted. Workspace root `biome.json` is now the single source of truth.
- Workspace root config updated:
  - Disabled `style.useImportType` rule — was auto-converting NestJS DI imports to `import type`, breaking runtime DI (abstract classes are erased when imported as types).
  - Added `!event-ticketing/src/migrations/**` to file excludes — MikroORM auto-generates a snapshot JSON file that fails Biome's formatter rules (multi-line vs single-line arrays).
- Reformatted `OrderEntity.ts` to match Biome's preferences.
- Key lessons learned:
  - Biome's config discovery walks up from each file's location and stops at the first `biome.json` it finds. Two configs = two sources of truth = drift.
  - Biome `useImportType` is a trap for NestJS projects: it converts class imports used only in type annotations to `import type`, but `emitDecoratorMetadata` needs them as runtime values for DI to work.
  - LSP configuration is cached in memory — after editing `biome.json`/`tsconfig.json`/`eslint.config.js`, restart the LSP or reload the editor window.

### Phase 3.4 — External Service Adapters
- Created `FakePaymentGateway` in `src/ordering/infrastructure/FakePaymentGateway.ts`. Extends `PaymentGateway`, `@Injectable`, deterministic failure trigger: if `paymentToken` starts with `fail-`, returns `false`. Otherwise succeeds. Logs each charge.
- Created `FakeEventAvailabilityChecker` in `src/ordering/infrastructure/FakeEventAvailabilityChecker.ts`. Extends `EventAvailabilityChecker`, `@Injectable`, in-memory seed data in constructor: events (`evt-rock-festival` open, `evt-closed-concert` closed) and tickets (`ticket-vip` 10, `ticket-general` 100, `ticket-sold-out` 0). Unknown keys return safe defaults (`false`, `0`).
- Key lessons learned:
  - **Fakes vs mocks:** fakes are real production adapters with hardcoded behavior. Mocks are per-test test doubles. Fakes run during normal app execution; mocks are injected by test setup.
  - Deterministic failure triggers (`fail-` prefix) beat random failures for reproducible QA via curl.
  - `Map<K, V>` over plain objects when keys are dynamic/user-provided: no prototype pollution, cleaner `.get()/.size` semantics, closer in shape to the eventual real adapter (which will query a repo).
  - `?? 0` and `?? false` matter vs `||` — `||` treats `0` as falsy, would use default when the real value IS 0.
  - Common JS bug: `console.log\`text ${var}\`` is a **tagged template literal**, not a function call. Needs parens: `console.log(\`text ${var}\`)`. Looks like a function call but isn't.

### Phase 3.5.1 — ValidationPipe setup
- Installed `class-validator` + `class-transformer` via pnpm.
- Enabled global `ValidationPipe` in `src/main.ts` with 4 options:
  - `whitelist: true` — strips properties not in DTOs.
  - `forbidNonWhitelisted: true` — 400 on unknown properties instead of stripping.
  - `transform: true` — instantiates DTO classes from plain JSON (required for `@Type()` nested DTOs).
  - `transformOptions.enableImplicitConversion: true` — coerces query string types (`?page=1` → `page: number`).
- Key lessons: `whitelist + forbidNonWhitelisted` is the security-conscious default against mass-assignment bugs. `transform + enableImplicitConversion` is critical for GET endpoints with query params.

### Phase 3.5.2 — CreateOrderRequestDto
- Created `src/ordering/infrastructure/http/dtos/CreateOrderRequestDto.ts` with two classes:
  - `CreateOrderItemDto` — `ticketTypeId: string`, `quantity: number` (integer, min 1), `unitPrice: number` (integer, min 0)
  - `CreateOrderRequestDto` — `eventId: string`, `attendeeId: string`, `items: CreateOrderItemDto[]` (non-empty array)
- Decorators: `@IsString`, `@IsNotEmpty`, `@IsInt`, `@Min`, `@IsArray`, `@ArrayMinSize`, `@ValidateNested({ each: true })`, `@Type(() => CreateOrderItemDto)`.
- Key lessons learned:
  - **Decorators don't work on interfaces.** Must be `class` — interfaces are erased at compile time, decorators need runtime targets. Same root cause as the abstract-class ports workaround.
  - Request DTOs = **classes** (need runtime decorators for validation). Response DTOs = **interfaces** (zero runtime behavior, shape contract only).
  - `@Type(() => CreateOrderItemDto)` + `@ValidateNested({ each: true })` BOTH required for nested validation. Missing `@Type` is the #1 "my nested validation doesn't work" NestJS bug.
  - Use `!` (definite assignment assertion) on DTO fields in TS strict mode — NestJS assigns them via `plainToClass`, TS can't see it.
  - `@Min(1)` on quantity vs `@Min(0)` on unitPrice reflects domain invariants at the boundary (free tickets OK, zero-quantity items not).

### Phase 3.5.3 — OrderResponseDto + mapper function
- Created `src/ordering/infrastructure/http/dtos/OrderResponseDto.ts` with:
  - `OrderItemResponseDto` interface (flat primitives)
  - `OrderResponseDto` interface (id, eventId, attendeeId, status, total, items, createdAt, expiresAt, paidAt, cancelledAt, cancelReason)
  - `toOrderResponseDto(order: Order): OrderResponseDto` free function that maps domain to response DTO
- Design choices:
  - Response DTOs as **interfaces** (zero runtime behavior needed) — contrast with request DTOs as classes.
  - JSON-friendly primitives only: Date → ISO string via `.toISOString()`, Money → integer cents via `.getValue()`, OrderStatus → string via `.getValue()`.
  - Mapper is a **free function**, not a class. Stateless transformation doesn't need DI or instance methods.
  - `paidAt: order.getPaidAt()?.toISOString() ?? null` — optional chain AND explicit null fallback. Without `?? null`, optional chain returns `undefined` which gets stripped by `JSON.stringify`.
- Key lessons: never return domain objects from controllers; DTOs decouple API contract from internal domain structure. Renaming a domain field is safe because the DTO buffers the change.

### Phase 3.5.4 — OrderController with POST /orders
- Created `src/ordering/infrastructure/http/OrderController.ts` with:
  - `@Controller('orders')` — route prefix
  - Constructor injects `CreateOrderUseCase` by type (no `@Inject`)
  - `@Post() @HttpCode(HttpStatus.CREATED) create(@Body() body: CreateOrderRequestDto)` — delegates to use case, maps result to response DTO
- Key lessons learned:
  - Controllers are thin — no business logic, no try/catch. Domain errors propagate to the (future) exception filter.
  - `@Body() body: CreateOrderRequestDto` triggers the global `ValidationPipe` automatically: parses JSON, instantiates DTO, runs validators, 400 on failure.
  - Biome rejects parameter decorators by default (Stage-3 spec). Fixed in `biome.json` with `javascript.parser.unsafeParameterDecoratorsEnabled: true`. The `unsafe` label is about future-compatibility, not security.

### Phase 3.5.6 — Remaining HTTP endpoints (create, list, pay, cancel complete)
- Added `PayOrderRequestDto` — `paymentToken: string`, `paymentMethod: PaymentMethod` with `@IsIn(PAYMENT_METHODS)`. Array of valid methods typed as `PaymentMethod[]` so adding a new method forces a compile error here.
- Added `CancelOrderRequestDto` — `reason?: string` with `@IsOptional` + `@MaxLength(500)`.
- Added `ListAttendeeOrdersUseCase` — thin query use case wrapping `orderRepository.findByAttendeeId`. Kept as its own file even though it's 3 lines today: future home for pagination/filter/caching.
- Refactored `PayOrderUseCase.execute` and `CancelOrderUseCase.execute` from `Promise<void>` → `Promise<Order>` — controllers now return the updated order DTO.
- `OrderController` expanded with 3 new endpoints: `GET /orders?attendeeId=X` (`findByAttendeeId`), `POST /orders/:id/pay` (`pay`), `POST /orders/:id/cancel` (`cancel`). Registered new use cases in `ordering.module.ts`.
- Added `requests.http` (REST Client format) with 15 scenarios covering happy path, domain errors, DTO validation, and boundary coercion (null reason).
- Key lessons learned:
  - **Never trust identity fields from request payloads — IDOR vulnerability.** Current `POST /orders` accepts `attendeeId` in the body; `GET /orders?attendeeId=X` accepts it as query param. In production, identity must come from the auth token via `@CurrentAttendee()` decorator. Flagged in Known Gaps; scheduled as Phase 5.0.
  - **Types-at-the-boundary must match across the chain.** `CancelOrderRequestDto.reason` was `?` (undefined), but `CancelOrderUseCase.execute(cancelReason)` required `string` — TS strict would reject the controller call. Fixed by propagating `string | null` all the way through and using `body.reason ?? null` at the controller boundary. Rule: DB nullable column → domain `string | null` → use case `string | null` → controller coerces `undefined → null` with `??` (never `||`, which would also swallow empty strings).
  - **Method naming: describe what the method guarantees, not what it might one day do.** `findByAttendeeId` is honest when `attendeeId` is a required query param; `list()` implies optional filters. Match the method name to the constraint the signature enforces. Also mirrors `OrderRepository.findByAttendeeId` across layers — reading the stack is one consistent verb.
  - **Route params require `:id` in the path.** `@Post(':id/pay')` not `@Post('pay')`. `@Param('id')` silently returns `undefined` without the placeholder — a bug TS can't catch. Caught only at runtime by "order not found" errors. This is exactly what Phase 4.2 integration tests will catch.
  - **Explicit-over-implicit is codebase-wide, not just TS syntax.** `@HttpCode(HttpStatus.OK)` on GET endpoints is noise to some, clarity to this codebase — framework defaults should never be load-bearing knowledge. Same rule extends to `@HttpCode(HttpStatus.CREATED)` on POST, `transform: true` on ValidationPipe, etc.
  - **Thin query use cases are still worth their own file.** `ListAttendeeOrdersUseCase` is 3 lines. Keeping it as a use case (not calling repo directly from controller) means Phase 6.1 caching, Phase 6.2 pagination, and Phase 7 read-model projections all change in ONE place. Symmetry across layers > saving 5 lines today.

### Phase 3.5.5 — OrderingModule wiring + first successful curl
- Created `src/ordering/ordering.module.ts`:
  - `imports: MikroOrmModule.forFeature([OrderEntity, OrderItemEntity])` — registers entities in this module's scope
  - `controllers: [OrderController]`
  - `providers`: all 4 use cases (shorthand), all 5 port → adapter bindings using `{ provide: Port, useClass: Adapter }`
- Imported `OrderingModule` into `AppModule`.
- Fixed two runtime DI failures caused by `import type`:
  - `MikroOrmOrderRepository` imported `EntityManager` as type → NestJS couldn't resolve it → `UnknownDependenciesException` at boot. Changed to value import.
  - `AppController` imported `AppService` as type → same error. Changed to value import.
- Ran pending migration (`npx mikro-orm migration:up`) against restarted DB container.
- First successful `curl`:
  ```
  curl -X POST http://localhost:3000/orders -d '{"eventId":"evt-rock-festival","attendeeId":"att-1","items":[{"ticketTypeId":"ticket-vip","quantity":2,"unitPrice":5000}]}'
  ```
  Response: full `OrderResponseDto` with generated UUID, `status: "reserved"`, `total: 10000`, `expiresAt` exactly 15 minutes after `createdAt`, row confirmed in Postgres `orders` table.
- Key lessons learned:
  - **NEVER `import type` a class that enters NestJS DI.** Applies to EntityManager, repository classes, services, anything in a constructor parameter. Type-only imports are erased; DI needs the runtime value.
  - Composition root pattern: `ordering.module.ts` is allowed to import all concrete adapters — that's its job. Domain and application layers stay pure.
  - `forFeature` per module vs `forRoot` in app module: `forRoot` establishes the DB connection once; `forFeature` registers entities per-module scope. Different levels of setup.
  - Provider forms in NestJS:
    - Shorthand `CreateOrderUseCase` = `{ provide: CreateOrderUseCase, useClass: CreateOrderUseCase }` — no abstraction swap needed.
    - Long form `{ provide: Port, useClass: Adapter }` — when token differs from implementation (hexagonal port/adapter).
  - Spring Boot equivalent: `@Service` / `@Repository` on adapter classes + component scanning replaces the entire providers array in the common case. `@Configuration` + `@Bean` is the equivalent when explicit wiring is needed (conditional / third-party / multi-impl cases).

### Phase 3.5.7 — Money column type fix (numeric → integer)
- Bug surfaced when `GET /orders?attendeeId=X` was first tested: `InvalidMoney: Invalid money amount: 5000. Must be a non-negative integer (cents)`. `POST /orders` never triggered it because the create flow never loads from DB — first DB→domain round-trip was via `findByAttendeeId`.
- Root cause: `@Property({ type: 'decimal' })` on `unit_price` and `total` produced SQL column `numeric(10,0)`. The `pg` driver returns ALL `numeric`-family values as **JS strings** (to preserve precision), not numbers. `Number.isInteger("5000")` returns `false` because the type is string, not number. `Money.create` rejected it.
- `numeric(10,0)` is a trap — looks integer-like (0 decimal places), but it's still in the NUMERIC family. pg's string-return rule is per family, not per precision.
- Fix: changed `@Property({ type: 'decimal' })` → `@Property({ type: 'integer' })` on both `OrderEntity.total` and `OrderItemEntity.unit_price`. Generated migration `Migration20260414222827.ts` which runs `ALTER COLUMN ... TYPE integer USING <col>::integer`. Existing rows cast cleanly since values were all integer-valued.
- Key lessons learned:
  - **Column type must match domain invariant.** Domain says "Money is integer cents" → column must be `integer`, not `numeric`. The TS field type was already `number` — the mismatch was between the TS lie and runtime reality (string from pg).
  - **Stripe / industry pattern: money stored as integer cents everywhere.** Frontend sends cents, backend works in cents, DB stores cents. Formatting ("$59.50") happens at display time only. No `Number` float math anywhere — integer arithmetic is exact.
  - **Dormant bugs surface on new code paths.** Create worked because it builds Order in-memory and returns it without a DB read. First DB read (findByAttendeeId) triggered the bug. Integration tests against a real DB (Phase 4.2) will catch this category of bug in the future.
  - **DECIMAL/NUMERIC is for actual decimal values** (crypto precision, tax rates, FX). Cents are integer by definition — DECIMAL is the wrong type.

### Phase 3.6 — Global Exception Filter with Marker Error Categories
- Created `DomainExceptionFilter` in `src/shared/infrastructure/http/`. `@Catch(DomainError)` catches any subclass. Maps domain error → HTTP status using `instanceof` ladder on marker parent classes. Response body matches `DOMAIN.md` spec: `{ statusCode, error: class name, message }`.
- Registered globally in `src/main.ts` with `app.useGlobalFilters(new DomainExceptionFilter())`.
- Created 3 marker parent classes in `src/shared/domain/`:
  - `NotFoundError` → 404
  - `ConflictError` → 409
  - `ValidationError` → 400
- Repointed all 8 concrete domain errors to extend the correct marker:
  - `OrderNotFound` → `NotFoundError`
  - `InvalidOrderTransition`, `EventNotAvailable`, `InsufficientTickets`, `PaymentFailed` → `ConflictError`
  - `EmptyOrderItem`, `InvalidMoney`, `InvalidQuantity` → `ValidationError`
- Design iteration: considered 4 approaches (central map in filter, abstract `httpStatus` property, marker parent classes, discriminated-union kind enum). Settled on marker parent classes after researching 2024-2026 senior NestJS-DDD practice.
- Key lessons learned:
  - **Marker parent classes are the mainstream DDD-pure pattern in NestJS and Spring Boot.** Domain stays HTTP-agnostic — zero imports of `@nestjs/common` anywhere in `domain/`. HTTP mapping lives entirely in the filter (infrastructure).
  - **Type hierarchy encodes meaning.** `OrderNotFound extends NotFoundError` is self-documenting — "this is a not-found kind of error" is a type fact. Can `catch (e instanceof NotFoundError)` meaningfully across any not-found error in the system.
  - **Adding a new error = 1 line (`extends ConflictError`).** Filter is never edited again. New category (rare, ~5 total HTTP categories ever) = 1 marker class + 1 branch in filter. Filter edits should be rare events.
  - **Collapsed `PaymentError` into `ConflictError`.** Original design had a dedicated `PaymentError` marker for `PaymentFailed` (→ 402). One-member categories are over-engineering — a category earns its existence at 2+ concrete subclasses. 402 is an obscure HTTP status anyway; 409 is the right semantic for "payment couldn't advance the order state."
  - **Transfers 1:1 to Spring Boot.** `@ControllerAdvice` + `@ExceptionHandler(NotFoundException.class)` is the Java equivalent of the `instanceof` ladder. The marker-parent pattern is portable across frameworks and even transports (gRPC, CLI) — the filter is the adapter, domain doesn't know.
  - **Never `throw new NotFoundException()` (or any `HttpException`) from use cases.** That imports `@nestjs/common` into the application layer, couples business logic to HTTP, and breaks non-HTTP adapters (cron jobs, gRPC, CLI). Rule: if you can still throw it from a CLI script, it's a `DomainError`. Otherwise it's framework and belongs in infra only.
  - **Response shape differences matter for API consumers.** Nest default: `{ statusCode, message, error: "Not Found" }`. Our filter: `{ statusCode, error: "OrderNotFound", message }`. Mixing patterns creates inconsistent API. Commit to one — ours is richer (specific class name as the error field).
  - **Researched 2024-2026 practice:** marker parents + `@Catch(DomainError)` is mainstream. Gaps seniors add: catch-all `@Catch()` filter with correlation IDs, Pino logging, Sentry, MikroORM constraint error translation, RFC 9457 Problem Details response format. All belong to Phase 5.3 (Observability). `neverthrow` / Result types are niche and don't transfer to Java — skipped.

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

## What's Next — Expanded Architect-Level Roadmap

Goal: student becomes capable of designing and building distributed, event-driven systems at the architect level. One project, progressively harder layers.

### Phase 3 — Finish the monolith (in progress)
- ~~3.1~~ ✅ MikroORM entities
- ~~3.2~~ ✅ Migrations
- ~~3.3~~ ✅ Repository implementation + follow-ups (bidirectional mapper, abstract-class ports, IdGenerator, Clock, OrderNotFound, biome consolidation)
- ~~3.4~~ ✅ Fake adapters (FakePaymentGateway, FakeEventAvailabilityChecker)
- ~~3.5~~ ✅ HTTP controllers — all 4 endpoints live (create / list / pay / cancel) + DTOs + REST Client `.http` scenarios
- ~~3.5.7~~ ✅ Money column fix (numeric → integer) — DB type now matches domain invariant
- ~~3.6~~ ✅ Global `DomainExceptionFilter` + marker error categories (`NotFoundError` / `ConflictError` / `ValidationError`)
- **3.7 NEXT** — Final NestJS module wiring review (mostly done, quick sanity check)
- **3.8** — Outbox pattern: `outbox_events` table, `DomainEventPublisher` port, `OutboxDomainEventPublisher` adapter, background worker polling & publishing via EventEmitter2. Closes audit item #1 (domain events never published).

### Phase 4 — Testing + second bounded context (events hands-on)
- **4.1** Domain unit tests (aggregates, value objects, business rules)
- **4.2** Integration tests hitting real PostgreSQL (testcontainers or in-memory SQLite)
- **4.3** **Check-in bounded context** — NEW NestJS module: `Ticket` aggregate, listens to `OrderPaid` events from Ordering, creates tickets. First time you see events flow BETWEEN contexts with your own eyes.
- **4.4** **Swap EventEmitter2 for RabbitMQ** — real message broker via Docker. Add management UI (port 15672) so you can SEE messages flow. First hands-on broker experience.
- **4.5** **Inbox pattern in Check-in** — consumer-side dedup table. At-least-once delivery + inbox = exactly-once processing. Only makes sense once you have a real broker.

### Phase 5 — Auth + microservices split + production concerns
- **5.0** **Auth + IDOR refactor.** JWT auth with NestJS `@nestjs/passport` + `passport-jwt`. Custom `@CurrentAttendee()` / `@CurrentOrganizer()` param decorators that extract identity claims from the verified token. Global `AuthGuard`. **Refactor every controller/DTO that currently trusts a client-supplied identity field** — remove `attendeeId` from `CreateOrderRequestDto`, replace `GET /orders?attendeeId=X` with `GET /orders/me`, audit future endpoints as they're added. Add role-based guards for cross-role operations (Organizer cancels event, Attendee cancels own order). This closes the IDOR gap called out in Known Gaps.
- **5.1** Split Check-in into its own NestJS app with its own DB. `docker-compose.yml` with 4 containers: postgres-ordering, postgres-checkin, rabbitmq, ordering-app, checkin-app. First real microservices deployment. Auth strategy across services: shared JWT secret or a small auth service — decide when we get there.
- **5.2** Real `StripePaymentGateway` adapter — swap the fake, Stripe test mode with webhooks. Portfolio-grade integration.
- **5.3** Observability — structured JSON logging via Pino, correlation IDs propagated through HTTP headers and event metadata, basic Prometheus metrics.
- **5.4** Resilience patterns — retry with exponential backoff on PaymentGateway, circuit breaker on EventAvailabilityChecker, timeouts on all external calls.

### Phase 6 — Scale-out reads + architect-tier patterns
- **6.1** Redis cache for `GET /orders/:id` with TTL + invalidation on domain events.
- **6.2** Pagination, filtering, sorting on list endpoints.
- **6.3** Event sourcing for the Order aggregate — events ARE the source of truth; state is projected from events. Compare trade-offs vs state-based approach.
- **6.4** Saga pattern — distributed transaction across Ordering + Check-in when an order is created and tickets must be pre-reserved atomically.

### Phase 7 — CQRS refactor (LAST step)
- **7.1** Refactor existing use cases to CQRS using `@nestjs/cqrs`: separate CommandBus, QueryBus, EventBus. Commands mutate, queries read.
- **7.2** Dedicated read models for list endpoints — optimized projections built from events.
- **7.3** Write a teardown doc: what the student learned, trade-offs, when to use each pattern in the wild. CQRS chosen last because it's a refactor of working code, not a new capability.

### Time estimate (honest)
- Phase 3.5–3.8: ~1 week
- Phase 4: ~3 weeks
- Phase 5: ~3 weeks
- Phase 6: ~2 weeks
- Phase 7: ~2 weeks
- **Total: ~10–12 weeks of focused work to architect-level**

### Why this roadmap takes you to architect-level
Diagrams and articles teach vocabulary; hands-on experience teaches judgment. By Phase 5 the student will have:
- Built a full monolith with DDD + Hexagonal + Clean Architecture ✅
- Seen events flow between bounded contexts in-process and via a real broker ✅
- Split a monolith into microservices with a real message bus ✅
- Implemented outbox + inbox for crash-safe exactly-once messaging ✅
- Integrated a real external API (Stripe) with webhooks ✅
- Shipped observability and resilience patterns used in real production systems ✅

This is roughly the skill set expected of a mid-to-senior backend engineer in Brazil. Phases 6–7 push toward senior/architect.

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
