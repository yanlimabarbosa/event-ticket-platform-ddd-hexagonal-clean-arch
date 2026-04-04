# Project Guide

This project follows **DDD + Hexagonal + Clean Architecture** with **NestJS**, **MikroORM**, and **TypeScript**.

## Reference Files

@TECHNICAL.md
@TEACH-ME.md

- **TECHNICAL.md** — The architecture bible. Contains all rules for domain/application/infrastructure layers, folder structure, base classes, code examples, patterns to follow, anti-patterns to avoid, and testing strategy.

- **TEACH-ME.md** — The teaching methodology. Defines HOW to teach: the learning loop, phases 0-4 progression, challenge difficulty curve, and mentoring rules.

## Session Continuity — CRITICAL

- **SESSION-PROGRESS.md** — Current phase, completed phases with key lessons, student profile, and what's next.

### Rules for every session:
1. **At the start of every new session:** Read `SESSION-PROGRESS.md` FIRST to understand where we left off. Resume from the exact phase/step indicated.
2. **During the session:** When the student completes a phase, sub-phase, or makes significant progress — update `SESSION-PROGRESS.md` immediately. Don't wait until the end.
3. **At the end of every session** (when the student says goodbye, switches PCs, or the conversation is ending): Update `SESSION-PROGRESS.md` with:
   - Current phase and exact step
   - Key lessons learned in this session
   - Any corrections or "aha moments" the student had
   - Updated student profile if new patterns emerged (learning style, pace, struggles)
   - What's next (specific enough that the next session can resume without guessing)
4. **Student profile section** is important — it captures HOW this student learns best, what confuses them, what teaching approaches work. Update it as you learn more about the student.
5. **Never lose detail.** Each completed phase should have enough context that a new session can reference past decisions and explain WHY they were made if the student asks.

## Domain Discovery

- **DOMAIN.md** — All project-specific decisions: ubiquitous language glossary, bounded contexts, aggregate mappings, invariants, domain events, database schema, and API design. This is the living document for the Event Ticketing platform. Everything we discover goes here.

## Thinking Guides

The `how-to-map-requirements/` folder contains reusable thinking guides that teach HOW to approach domain discovery for any system. These are learning artifacts — not project-specific docs.

- **01-UBIQUITOUS-LANGUAGE-GUIDE.md** — How to discover business vocabulary: identifying roles (not "users"), replacing technical terms with business terms, naming actions with business verbs, and building a glossary.
- **02-BOUNDED-CONTEXT-GUIDE.md** — How to find system boundaries: spotting the same word with different meanings, grouping by who cares and rate of change, defining communication through events, and identifying the core domain.
- **03-AGGREGATE-MAPPING-GUIDE.md** — How to map aggregates: finding the root, identifying children and value objects, discovering invariants (using "Can it...?", "What if...?", "Who enforces this?" techniques), mapping state transitions, and finding domain events.
- **04-DATABASE-DESIGN-GUIDE.md** — How to design the database schema from the domain model: identifying tables, defining columns (identity, FKs, state, data, timestamps), relationships, denormalization decisions, indexing strategy, and common mistakes (DECIMAL for money, never delete for state changes).
- **05-API-DESIGN-GUIDE.md** — How to design REST APIs: listing user actions, choosing HTTP methods (POST for actions, PATCH for field updates), URL patterns (nouns not verbs), request bodies (minimum data), responses (full resource with human-readable data), status codes (400 vs 409), error format, and pagination.

**Important:** When creating new guides for the student, always place them in this folder with a numbered prefix to indicate the chronological order of the steps. These guides must be system-agnostic — they teach the thinking process, not this specific project's answers.
