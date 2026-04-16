# Session Progress

## Current Phase: 3.8 — Outbox Pattern (next)

Phase 3.7 (module wiring review) complete. All 5 use cases wired, 4 HTTP endpoints live, global exception filter active.

## Deferred Patterns

- **Typed ID value objects** (OrderId, OrderItemId) — too much ceremony for single bounded context. Revisit when Check-in adds cross-ID references.
- **Command/Query objects** — deferred until Phase 7 CQRS refactor. Current use cases accept primitives.

## Completed Phases

| Phase | What was built |
|-------|---------------|
| 0.1 | Domain selection — Event Ticketing Platform |
| 0.2 | Ubiquitous language (DOMAIN.md) |
| 0.3 | Bounded contexts: Event Management, Ordering, Check-in |
| 0.4 | Aggregate mapping: Order root + OrderItem child + 8 invariants + 4 events |
| 0.5 | Database design: orders, order_items, tickets tables |
| 0.6 | API design: 5 endpoints with status codes and error format |
| 0.7 | Project setup: NestJS + MikroORM + PostgreSQL via Docker + Biome |
| 1.1 | Shared base classes: Entity, AggregateRoot, ValueObject, DomainEvent |
| 1.2 | Value objects: Money (integer cents), Quantity, OrderStatus (state machine) |
| 1.3 | Domain errors: DomainError base + InvalidMoney, InvalidQuantity, InvalidOrderTransition |
| 1.4 | Order aggregate + OrderItem entity + 4 domain events + EmptyOrderItem error |
| 1.5 | OrderRepository port (abstract class) |
| 1.6 | EventAvailabilityChecker + PaymentGateway ports |
| 2.1 | All 5 use cases: Create, Pay, Cancel, Expire, ListAttendeeOrders |
| 3.1 | MikroORM entities (OrderEntity, OrderItemEntity) |
| 3.2 | Initial migration |
| 3.3 | Repository impl + OrderMapper (toDomain/toPersistence/applyStateChanges) + IdGenerator + Clock ports + OrderNotFound error + Biome config consolidation |
| 3.4 | Fake adapters (FakePaymentGateway, FakeEventAvailabilityChecker) |
| 3.5 | HTTP layer: OrderController, all DTOs, ValidationPipe, all 4 endpoints + REST Client .http file |
| 3.5.7 | Money column fix: numeric → integer (pg returns numeric as strings) |
| 3.6 | DomainExceptionFilter + marker error categories (NotFoundError, ConflictError, ValidationError) |
| 3.7 | Module wiring review |

## Roadmap

### Phase 3.8 — Outbox pattern + concurrency control
- `outbox_events` table + migration
- `OutboxEventEntity` MikroORM entity
- `DomainEventPublisher` port
- `OutboxDomainEventPublisher` adapter (inserts events in same transaction as aggregate write)
- Background worker (NestJS @Cron) polls outbox and publishes via EventEmitter2
- **Idempotency keys** — add idempotency key header to POST /orders and POST /orders/:id/pay. Prevent double-charges. Store key + response in DB, return cached response on retry. Every fintech API does this (Stripe, Nubank, PayPal).
- **Optimistic locking** — add `@Version()` column to Order entity. MikroORM throws on concurrent writes. Prevents two people paying the same order simultaneously.
- **Database transaction isolation levels** — configure and test READ COMMITTED vs SERIALIZABLE on the payment flow. Understand phantom reads, lost updates, and when each level is needed for money operations.
- **Deadlock detection + handling** — simulate concurrent payments hitting same rows. Understand PostgreSQL deadlock errors, retry strategies, and lock ordering to prevent them.

### Phase 4 — Testing + second bounded context (DDD cross-context)
- 4.1 Domain unit tests (aggregates, value objects, state transitions)
- 4.2 Integration tests with real PostgreSQL (testcontainers)
- 4.3 **Load/stress testing (k6)** — write performance tests for payment flow. Answer "how many concurrent orders can this handle?" Identify bottlenecks. Every fintech interview asks about load testing.
- 4.4 **Check-in bounded context** — new aggregate (Ticket), listens to OrderPaid. First cross-context event flow.
- 4.5 **Anti-corruption layer (ACL)** between Ordering and Check-in — translate OrderPaid event into Check-in's own language. Contexts never share domain models. *(Vernon, Ch. 3)*
- 4.6 **Context map** — document relationships between bounded contexts (Ordering ↔ Check-in = Customer/Supplier). *(Evans, Ch. 14; Vernon, Ch. 3)*
- 4.7 Swap EventEmitter2 for **Kafka** (real message broker via Docker + KRaft, no ZooKeeper)
- 4.8 **Inbox pattern** in Check-in — consumer-side dedup for exactly-once processing *(Newman, Ch. 6)*
- 4.9 **Consumer-driven contract tests** — Check-in defines what it expects from OrderPaid events, Ordering validates against it *(Newman, Ch. 7)*

### Phase 5 — Auth + microservices split + production hardening
- 5.0 JWT auth + IDOR refactor (identity from token, not request body)
- 5.1 **Microservices split** — Check-in becomes its own NestJS app with own DB. Docker Compose with 4+ containers. *(Newman, Ch. 2-3)*
- 5.2 **gRPC for inter-service communication** — replace REST between Ordering and Check-in with gRPC + protobuf. Faster serialization, type-safe contracts, streaming support. REST stays for external/client-facing APIs. *(Newman, Ch. 4)*
- 5.3 **API Gateway pattern** — single entry point routing to Ordering and Check-in services. *(Alex Xu, Ch. 1; Newman, Ch. 8)*
- 5.4 **Stripe payment gateway** (test mode with webhooks) — swap FakePaymentGateway, hexagonal adapter swap with zero domain changes
- 5.5 **Webhook ingestion** — receive Stripe webhooks reliably: signature verification (HMAC), idempotent processing, ordering guarantees, retry handling. Dedicated webhook controller + event translation into domain events.
- 5.6 **Observability** — structured JSON logging (Pino), **OpenTelemetry distributed tracing** (trace one request across Ordering → Kafka → Check-in), correlation IDs in HTTP headers + event metadata, Prometheus metrics, Grafana dashboards, health checks *(Newman, Ch. 10)*
- 5.7 **Resilience patterns** — retry with exponential backoff, circuit breaker (on PaymentGateway + EventAvailabilityChecker), timeouts on all external calls, bulkhead isolation, **graceful degradation** (Stripe down? queue payment for retry, show "processing" to user instead of crashing). *(Newman, Ch. 11; Kleppmann, Ch. 8)*
- 5.8 **Secrets management** — migrate from .env files to HashiCorp Vault or AWS Secrets Manager. API keys, DB credentials, Stripe secrets — none in plaintext on disk in production. Inject at runtime via environment.
- 5.9 **Immutable audit trail** — append-only `audit_log` table recording every state change: who, what, when, before/after values. Required for fintech compliance. Never update or delete audit rows.
- 5.10 **Zero-downtime database migrations** — backward-compatible migration strategy: expand/contract pattern (add new column → backfill → migrate code → drop old column). Never break running instances during deploy. Blue-green deployment with Docker.
- 5.11 **API versioning** — v1/v2 endpoint strategy. Backward compatibility guarantees. Deprecation headers. Can't break mobile/partner integrations when API evolves.
- 5.12 **Feature flags** — roll out new payment method to 5% of users first. Unleash or custom implementation. Toggle features without redeploying. Standard in fintech for safe releases.
- 5.13 **LGPD compliance** — Brazilian data protection law. PII anonymization, data retention policies, right to deletion (soft delete + scheduled PII wipe), consent tracking. Mandatory for any Brazilian fintech.
- 5.14 **Kubernetes basics** — deploy Ordering + Check-in on K8s (minikube or kind). Pods, Deployments, Services, ConfigMaps, Secrets, readiness/liveness probes, horizontal pod autoscaling. Most fintech runs on K8s.

### Phase 6 — Scalable data architecture *(Kleppmann-heavy)*
- 6.1 **Redis cache** with TTL + cache invalidation on domain events *(Kleppmann, Ch. 5)*
- 6.2 **Distributed locking (Redis)** — prevent double-processing of same payment across multiple service instances. Redis SETNX or Redlock. Critical when running multiple replicas. *(Kleppmann, Ch. 8)*
- 6.3 Pagination, cursor-based filtering, sorting on list endpoints
- 6.4 **Database optimization** — indexing strategies (B-tree, partial indexes, composite indexes), EXPLAIN ANALYZE to read query plans, N+1 query prevention with MikroORM populate strategies, connection pooling with PgBouncer. Daily practical skill.
- 6.5 **Event sourcing** for Order aggregate — events ARE the source of truth, state projected from event log. Compare trade-offs vs state-based. *(Vernon, Ch. 8; Kleppmann, Ch. 11)*
- 6.6 **Saga pattern** — distributed transaction across Ordering + Check-in (choreography-based via events, then orchestration-based comparison) *(Vernon, Ch. 8; Newman, Ch. 6)*
- 6.7 **Database read replicas** — write to primary, read from replica. Configure MikroORM connection routing. *(Kleppmann, Ch. 5)*
- 6.8 **Change Data Capture (CDC)** — stream DB changes to event log using Debezium or WAL tailing. Alternative to outbox polling. *(Kleppmann, Ch. 11)*
- 6.9 **Kafka advanced** — partitioning strategies, consumer groups, exactly-once semantics, dead letter topics. *(Kleppmann, Ch. 11; Newman, Ch. 6)*
- 6.10 **Multi-currency support** — extend Money value object with currency code (BRL, USD, EUR). Exchange rate service port. Rounding rules per currency. Real fintech complexity.
- 6.11 **Reconciliation jobs** — scheduled job that compares your DB state against Stripe's records. Detect discrepancies (payment succeeded in Stripe but failed in your DB). Alert on mismatches. Every fintech runs this daily.

### Phase 7 — CQRS + advanced DDD *(Vernon + Fowler)*
- 7.1 **CQRS refactor** — CommandBus/QueryBus/EventBus with @nestjs/cqrs. Commands mutate through domain, queries bypass domain. *(Vernon, Ch. 4)*
- 7.2 **Dedicated read models** — optimized projections built from events, separate from write model *(Kleppmann, Ch. 11; Vernon, Ch. 4)*
- 7.3 **Domain event versioning** — schema evolution when event shape changes (upcasting, event adapters). Critical for production event-sourced systems. *(Vernon, Ch. 8)*
- 7.4 **Shared kernel** — extract truly shared value objects (Money, DateRange) into shared library between services *(Evans, Ch. 14; Vernon, Ch. 3)*

### Phase 8 — System design capstone *(Alex Xu)*
- 8.1 **Notification system** — email/SMS/push on OrderPaid, OrderCancelled. Fan-out pattern with priority queues. *(Alex Xu, Vol 1, Ch. 10)*
- 8.2 **Rate limiter** — token bucket or sliding window on API Gateway. Protect against abuse. *(Alex Xu, Vol 1, Ch. 4)*
- 8.3 **Distributed ID generation** — Snowflake-style IDs for cross-service uniqueness at scale (replace UUID). *(Alex Xu, Vol 1, Ch. 7)*
- 8.4 **Architecture teardown doc** — what was built, every trade-off, when to use each pattern in the wild. Portfolio-grade write-up.
