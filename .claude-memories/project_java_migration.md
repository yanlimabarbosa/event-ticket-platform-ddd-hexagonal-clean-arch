---
name: Java/Spring migration decision
description: Student will migrate to Java + Spring Boot after finishing the Event Ticketing project — TS's type erasure and DI friction confirmed the decision
type: project
---

After hitting TS's type-erasure + DI wiring friction (abstract classes needed to work around vanishing interfaces), the student explicitly concluded: **will migrate to Java + Spring Boot after this project**, Kotlin later as a differentiator.

**Why:** TS is genuinely weaker for DDD/OOP — erased interfaces, lint-only `private`, structural typing, bad enums, experimental decorators. Java gives reified types (Spring resolves interfaces by type), JVM-enforced access modifiers, nominal typing, real enums.

**Job-market context (2026):** Brazilian and European enterprise work is ~10x more Java than Kotlin. Kotlin grows but is minority. Export package = English + Java + Spring + DDD + cloud (AWS/GCP) + Kubernetes.

**How to apply:** When the student brings up a concept that would look cleaner in Java (interfaces as ports, real private, DI without tokens), acknowledge the friction honestly instead of defending TS. When this project is done, offer to do a comparison exercise: re-implement one bounded context in Java + Spring to cement the transfer.

**How to apply to architectural choices:** prefer patterns that transfer 1:1 to Java (interface-shaped ports even when using abstract classes, standard Spring-like DI, constructor injection, CQRS with command buses). Avoid TS-idiomatic shortcuts that won't map.
