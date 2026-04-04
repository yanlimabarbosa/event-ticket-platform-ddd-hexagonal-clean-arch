# Database Design — How to Think

A step-by-step guide for designing the database schema from your domain model.

---

## Key Principle

The database schema does NOT have to mirror the domain model 1:1. The domain model is optimized for **business rules**. The database is optimized for **storage and queries**. They can diverge.

---

## Step 1 — Identify Tables from Your Aggregate Map

Ask: **"What things need their own table?"**

- The **aggregate root** → gets a table (e.g., `orders`)
- **Child entities** → usually get their own table with a foreign key to the parent (e.g., `order_items` with `order_id`)
- **Value objects** → usually become **columns** on the parent table (e.g., `email` column), not their own table. Exception: if a value object is complex (e.g., Address with 5 fields), consider an embedded set of columns or a separate table.
- Things that are **generated as a result** of a state change → might need their own table (e.g., `tickets` generated after payment)

**Question to ask:** "Does this thing have its own identity and lifecycle separate from its parent? If yes → own table. If no → columns on the parent."

---

## Step 2 — Define Columns for Each Table

For every table, go through this checklist:

### Identity
- Every table needs a **primary key** (`id`). Usually a UUID or auto-increment.

### Relationships (Foreign Keys)
- **Who does this belong to?** → add a FK column (e.g., `order_id`)
- **What is this referencing?** → add a FK column (e.g., `event_id`, `ticket_type_id`)

### State
- If the thing has a **lifecycle** (changes states) → add a `status` column (usually an ENUM)
- Possible states come from your aggregate mapping's state transitions

### Data
- What **attributes** does the business need to track? (e.g., `quantity`, `unit_price`, `total`)
- Use precise types: `DECIMAL` for money (never `FLOAT`), `ENUM` for fixed sets of values

### Timestamps
- **When was it created?** → `created_at` (almost every table needs this)
- **When did important state changes happen?** → `paid_at`, `used_at`, `cancelled_at` (nullable — only filled when the event occurs)
- **Time-based rules?** → add the relevant timestamp (e.g., `expires_at` for the 15-minute reservation window)

---

## Step 3 — Define Relationships

Ask: **"How are these tables connected?"**

| Relationship | Pattern | Example |
|---|---|---|
| One-to-Many | Child table has FK to parent | `order_items.order_id → orders.id` |
| One-to-One | FK with unique constraint | `user_profiles.user_id → users.id` |
| Many-to-Many | Junction/join table | `event_tags` with `event_id` + `tag_id` |

**Rule:** In a one-to-many relationship, the FK always lives on the **"many" side** (the child), not the parent. The parent doesn't store its children — the children point to the parent.

---

## Step 4 — Decide on Denormalization

Ask: **"Should I duplicate data for query performance?"**

Normalized (no duplication):
- To get a ticket's event, join through the order: `tickets → orders → events`
- Correct but slow for frequent queries

Denormalized (intentional duplication):
- Add `event_id` directly on the `tickets` table
- Faster reads, but you must keep it in sync

**When to denormalize:**
- The query happens very frequently (e.g., door scanning happens thousands of times)
- The duplicated data rarely changes (event_id on a ticket never changes)
- The join would be expensive or unnecessary

**When NOT to denormalize:**
- The data changes often (you'd need to update it everywhere)
- The query is rare (premature optimization)

Always document WHY you denormalized — future developers need to know it's intentional.

---

## Step 5 — Add Indexes

Ask: **"What queries will hit this table, and what columns do they filter by?"**

### When to add an index

| Scenario | Example |
|---|---|
| Columns in WHERE clauses frequently | `WHERE event_id = 10` |
| Columns used in JOINs frequently | `JOIN ON order_items.order_id = orders.id` |
| Columns used in ORDER BY on large tables | `ORDER BY created_at DESC` |
| Foreign keys that are queried often | `attendee_id` on orders |

### When to skip an index

| Scenario | Example |
|---|---|
| Column is rarely queried alone | `ticket_type_id` on tickets (read but not searched) |
| Table is very small | A config table with 10 rows |
| Column has very low cardinality | A boolean `is_active` (only 2 values — index barely helps) |

### The trade-off
- Indexes speed up **reads** (SELECT, WHERE, JOIN)
- Indexes slow down **writes** (INSERT, UPDATE, DELETE — the index must be updated too)
- Don't index everything — only columns you search by frequently

**Tip:** Start with indexes on frequently-queried FKs. Add more indexes later when you identify slow queries. Don't optimize for queries that don't exist yet.

---

## Step 6 — Check for Common Mistakes

### Never delete data to represent state changes
- Wrong: delete the order when it expires
- Right: set `status = 'expired'` — keep the historical record

### Use DECIMAL for money, never FLOAT
- `FLOAT` has rounding errors: `0.1 + 0.2 = 0.30000000000000004`
- `DECIMAL(10, 2)` stores exact values: `0.10 + 0.20 = 0.30`

### Don't store derived data without reason
- If `total = sum of (quantity * unit_price)` for all items, do you need to store `total` on the order?
- Yes — because the price might change later, and you need to know what the customer actually paid. The stored total is a **snapshot**, not a calculation.

### Nullable columns should have a reason
- `paid_at` is nullable because the order might not be paid yet — that's valid
- If a column is never null, make it `NOT NULL`

---

## Quick Checklist

1. [ ] Every aggregate root has its own table
2. [ ] Child entities have their own table with FK to parent
3. [ ] Value objects are embedded as columns (not separate tables, unless complex)
4. [ ] Every table has a primary key
5. [ ] Foreign keys are defined for all relationships
6. [ ] Status/state columns use ENUMs
7. [ ] Timestamps exist for creation and important state changes
8. [ ] Money uses DECIMAL, not FLOAT
9. [ ] Denormalization is documented with a reason
10. [ ] Indexes exist on frequently-queried FKs and filter columns
11. [ ] No data deletion for state changes — use status fields
