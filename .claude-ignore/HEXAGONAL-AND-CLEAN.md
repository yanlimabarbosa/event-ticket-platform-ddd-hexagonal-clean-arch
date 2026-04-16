# Hexagonal Architecture and Clean Architecture — Core Principles

A reference guide to the principles behind the folder structure in this project, sourced directly from the people who invented these patterns.

This is a learning document, not a how-to. Read it to understand WHY the folders look the way they do.

---

## Part 1 — Hexagonal Architecture (Alistair Cockburn, 2005)

### The original idea

Alistair Cockburn coined "Hexagonal Architecture" in 2005. He drew the application as a hexagon with two sides:

```
      DRIVING SIDE (primary)            DRIVEN SIDE (secondary)
      actors who USE the app            actors the app USES

         ┌────────┐                      ┌────────┐
User ──► │ inbound│ ──► ┌───────────┐ ──►│outbound│ ──► Database
HTTP ──► │ port   │     │  Domain + │    │ port   │ ──► Payment API
CLI  ──► │        │     │Application│    │        │ ──► Email service
         └────────┘     └───────────┘    └────────┘
         "primary" ports                 "secondary" ports
         "driving" adapters              "driven" adapters
```

### The key distinctions

| Term | Meaning |
|---|---|
| **Primary / driving actor** | Anything that STARTS a flow by calling the application (HTTP request, CLI command, scheduled cron, message consumer). |
| **Secondary / driven actor** | Anything the application CALLS to get work done (database, payment API, SMTP server, clock). |
| **Inbound port** | A contract (interface) the application EXPOSES to primary actors. The method signature a controller calls. |
| **Outbound port** | A contract the application DEPENDS ON for secondary actors. The repository interface, payment gateway interface, etc. |
| **Inbound adapter** | The implementation that wraps a primary actor (HTTP controller, CLI parser, Kafka consumer). |
| **Outbound adapter** | The implementation that wraps a secondary actor (MikroORM repository, Stripe client, SMTP sender). |

### **Critical rule: the IN / OUT distinction lives at the PORT level, not just at the adapter level.**

This is the single most important point Cockburn's paper makes, and it's widely misunderstood.

- Inbound ports live in the **application layer** — they are interfaces the application exposes.
- Outbound ports live in the **application layer** — they are interfaces the application requires.
- Adapters (both inbound and outbound) live in the **infrastructure layer**.

The application layer declares BOTH kinds of ports; the infrastructure layer implements them.

### Why domain has no in/out

The domain layer (entities, value objects, domain events) is the INNERMOST concern. It has no boundary with the outside world — everything it does is pure business logic. Therefore there are **no ports in the domain layer.** Ports are boundary contracts; the domain has no boundaries.

Any rule like "a Repository is a port the domain declares" is a simplification that blurs this boundary. Strict hexagonal puts the Repository interface in the application layer because the application is what needs persistence — the domain doesn't "know" it's being persisted.

### Reference

- Cockburn's original paper: https://alistair.cockburn.us/hexagonal-architecture/

---

## Part 2 — Clean Architecture (Robert C. "Uncle Bob" Martin, 2012 / book 2017)

### The Dependency Rule

> **Source code dependencies can only point inward.**
> Nothing in an inner circle can know anything at all about something in an outer circle.

Uncle Bob's diagram:

```
       ┌───────────────────────────────────────────┐
       │ Frameworks & Drivers (Web, DB, UI)        │   ← outermost
       │   ┌───────────────────────────────────┐   │
       │   │ Interface Adapters                │   │
       │   │   ┌───────────────────────────┐   │   │
       │   │   │ Use Cases                 │   │   │
       │   │   │   ┌─────────────────────┐ │   │   │
       │   │   │   │ Entities            │ │   │   │
       │   │   │   └─────────────────────┘ │   │   │
       │   │   └───────────────────────────┘   │   │
       │   └───────────────────────────────────┘   │
       └───────────────────────────────────────────┘
```

### Mapping to DDD/Hexagonal terminology

| Uncle Bob | Hexagonal / DDD | This project |
|---|---|---|
| **Entities** | Domain model (aggregates, VOs, domain events) | `domain/` |
| **Use Cases** | Application services / use cases | `application/use-cases/` |
| **Interface Adapters** | Inbound + outbound adapters | `infrastructure/in/`, `infrastructure/out/` |
| **Frameworks & Drivers** | NestJS, MikroORM, PostgreSQL, etc. | dependencies used by infrastructure |

### Input ports and Output ports (Uncle Bob's terms)

In *Clean Architecture*, Uncle Bob explicitly names both sides of the port:

- **Input port** — interface exposed by a use case. The controller depends on this interface, not the concrete use case. (In practice, many projects skip this — the controller just depends on the concrete use case class.)
- **Output port** — interface the use case depends on for persistence, external services, etc. The concrete adapter in the outer ring implements this interface.

Both ports live in the **Use Cases layer** (the application layer).

### The Dependency Inversion Principle applied

The use case layer defines the output port. The infrastructure layer depends on the application layer (not the other way around) by implementing that interface. This is **DIP** — source code dependencies point inward, but **runtime dependencies point outward**. The compiler sees infrastructure importing application; the runtime sees the use case calling into the adapter.

### Reference

- *Clean Architecture* by Robert C. Martin (2017), Chapter 22
- Blog: https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html

---

## Part 3 — The practical layout (Hombergs buckpal, Spring Boot DDD)

Tom Hombergs's *Get Your Hands Dirty on Clean Architecture* translates Cockburn + Uncle Bob into a concrete Spring Boot layout. It's the most widely cited reference for hexagonal done right:

```
com/example/account/
├── domain/                         # pure business concepts
│   └── Account.java
├── application/
│   ├── port/
│   │   ├── in/                     # INBOUND PORTS = use case interfaces
│   │   │   ├── SendMoneyUseCase.java
│   │   │   └── GetAccountBalanceQuery.java
│   │   └── out/                    # OUTBOUND PORTS = infrastructure interfaces
│   │       ├── LoadAccountPort.java
│   │       ├── UpdateAccountStatePort.java
│   │       └── AccountLock.java
│   └── service/                    # USE CASE IMPLEMENTATIONS
│       └── SendMoneyService.java
└── adapter/
    ├── in/                         # INBOUND ADAPTERS
    │   └── web/
    │       └── SendMoneyController.java
    └── out/                        # OUTBOUND ADAPTERS
        └── persistence/
            └── AccountPersistenceAdapter.java
```

### Key observations from Hombergs

1. **in/out split appears TWICE**: once at ports (application layer), once at adapters (infrastructure layer). Both are needed for full hexagonal symmetry.
2. **Domain has no in/out**. Pure concepts only.
3. **Use case interfaces ARE inbound ports**. Controllers depend on `SendMoneyUseCase` interface, not `SendMoneyService` concrete class.
4. **Outbound ports are named for the capability**, not the implementation: `LoadAccountPort`, not `AccountRepositoryPort`. This is a subtle but important naming convention.

### Reference

- Book: *Get Your Hands Dirty on Clean Architecture* (Hombergs, 2019, 2nd ed. 2023)
- Code: https://github.com/thombergs/buckpal

---

## Part 4 — How this applies to the Event Ticketing project

### Current layout (this project)

```
ordering/
├── domain/                          # ENTITIES (Uncle Bob) / pure domain (Cockburn)
│   ├── entities/
│   ├── value-objects/
│   ├── events/
│   └── errors/
├── application/                     # USE CASES (Uncle Bob) / hexagon interior (Cockburn)
│   ├── ports/
│   │   └── out/                     # OUTBOUND PORTS — what the app NEEDS
│   │       ├── Clock.ts
│   │       ├── EventAvailabilityChecker.ts
│   │       ├── IdGenerator.ts
│   │       ├── OrderRepository.ts
│   │       └── PaymentGateway.ts
│   └── use-cases/                   # USE CASE IMPLEMENTATIONS
│       ├── CreateOrderUseCase.ts
│       └── ...
└── infrastructure/                  # INTERFACE ADAPTERS + FRAMEWORKS/DRIVERS
    ├── in/                          # INBOUND ADAPTERS (primary/driving)
    │   └── http/
    │       └── orders/
    │           ├── OrdersController.ts
    │           └── ...
    └── out/                         # OUTBOUND ADAPTERS (secondary/driven)
        ├── persistence/
        └── services/
```

### What's missing vs the canonical layout

- **`application/ports/in/`** — inbound ports (use case interfaces). Currently absent because we chose not to extract interfaces from use case classes yet (controllers depend on concrete `CreateOrderUseCase`, `PayOrderUseCase`, etc., not on an interface).
  - This is a conscious simplification documented in `SESSION-PROGRESS.md` under Deferred Patterns.
  - Add when: you want polymorphic use cases, or Phase 7 CQRS arrives with `CommandHandler<T>` interfaces.

### What we got right

- **in/out split at infrastructure adapters** — full symmetry per Cockburn.
- **`out/` at ports level** — outbound port contracts live in application, not domain. Per Uncle Bob's DIP: application defines the contract, infrastructure implements it.
- **Domain layer has NO ports folder** — pure concepts only. Per Cockburn's innermost-hexagon rule and Uncle Bob's entities layer.
- **Use cases grouped in their own folder** — Uncle Bob's "Use Cases" layer made explicit.

### Why we chose `out/` over Hombergs's `port/out/`

Hombergs writes `port/` (singular); we use `ports/` (plural). Pure style; TypeScript/NestJS convention favors plural for folders holding multiple files. The architectural meaning is identical.

### If you see these in Java/Spring

The migration to Java/Spring Boot later will encounter this exact layout. The mapping is 1:1:

| This project | Java/Spring equivalent |
|---|---|
| `domain/` | `com.company.context.domain` |
| `application/ports/out/` | `com.company.context.application.port.out` |
| `application/ports/in/` (when added) | `com.company.context.application.port.in` |
| `application/use-cases/` | `com.company.context.application.service` |
| `infrastructure/in/` | `com.company.context.adapter.in` |
| `infrastructure/out/` | `com.company.context.adapter.out` |

---

## Part 5 — The rules, restated as a checklist

Use these when deciding where a new file goes:

### 1. Is it a pure business concept?
- Yes → `domain/` (specifically `entities/`, `value-objects/`, `events/`, or `errors/`)
- The test: could a domain expert with no code knowledge recognize it?

### 2. Is it an interface/abstraction the application needs from the outside?
- Yes → `application/ports/out/` (outbound port — database, external service, clock, id generator)
- Or `application/ports/in/` (inbound port — use case interface)
- The test: does this declare a CONTRACT, without an implementation?

### 3. Is it an orchestration of the domain for a specific user intent?
- Yes → `application/use-cases/`
- The test: does it say "do this, then this, then save"?

### 4. Does it receive external input and call a use case?
- Yes → `infrastructure/in/` (inbound adapter — controller, consumer, CLI)

### 5. Does it implement an outbound port?
- Yes → `infrastructure/out/` (outbound adapter — database repo, Stripe client, email sender)

### 6. Is it framework/library integration?
- Lives wherever the framework demands (typically `infrastructure/`)

### The one rule that binds them

**Dependencies point inward.** Domain imports nothing from application or infrastructure. Application imports only from domain. Infrastructure imports from both but is imported by neither.

If you ever write `import { OrdersController } from '../infrastructure/...'` inside domain or application code, you broke the rule.

---

## Recommended reading

In order of accessibility:

1. **Khalil Stemmler's blog** — https://khalilstemmler.com/articles/ — NestJS-flavored DDD + Clean Architecture tutorials.
2. **Tom Hombergs, *Get Your Hands Dirty on Clean Architecture*** — most practical book. Spring Boot but concepts transfer.
3. **Robert C. Martin, *Clean Architecture*** — the foundational book. Chapters 19-22 cover the boundary rules.
4. **Alistair Cockburn, *Hexagonal Architecture* (2005 paper)** — original, short, dense.
5. **Vaughn Vernon, *Implementing Domain-Driven Design*** — DDD bible; Chapter 4 covers architecture styles.
6. **Eric Evans, *Domain-Driven Design*** — the original DDD book. Less about architecture, more about modeling.
