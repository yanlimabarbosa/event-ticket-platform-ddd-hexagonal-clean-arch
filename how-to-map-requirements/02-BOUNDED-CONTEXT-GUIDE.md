# Bounded Context Discovery — How to Think

A step-by-step guide for finding where the boundaries are in your system.

---

## What is a Bounded Context?

A boundary around a part of your system where a specific model and language applies. Like departments in a company — each has its own perspective on the same business, and that's fine.

The key insight: **it's okay for different parts of the system to have different models of the same real-world thing.** In fact, it's required for keeping things manageable.

---

## Step 1 — Find the Same Word with Different Meanings

Ask: **"Does this word mean the same thing to everyone?"**

This is the #1 signal for a boundary. Examples:

| Word | Context A meaning | Context B meaning |
|---|---|---|
| Event | Has name, venue, description, schedule (Organizer's view) | Just an ID with capacity and pricing (Sales view) |
| Ticket | Available inventory with quantity (before sale) | Proof of purchase with QR code (after sale) |
| Customer | Someone browsing events (Marketing) | Someone with a payment method and order history (Billing) |

**When the same word needs different fields and different rules depending on who you ask — that's two contexts.**

---

## Step 2 — Group by Who Cares

Ask: **"Who works with this data, and what do they do with it?"**

Different people/roles often signal different contexts:

| Who | What they care about | Likely context |
|---|---|---|
| Organizer | Event details, ticket setup, publishing | Event Management |
| Attendee | Browsing, selecting, paying, getting tickets | Ordering |
| Door staff | Scanning tickets, validating, preventing reuse | Check-in |
| Finance team | Revenue, refunds, payouts | Billing/Payments |

If two groups of people rarely need each other's data to do their work, they're probably in different contexts.

---

## Step 3 — Group by Rate of Change

Ask: **"Do these things change at the same time, for the same reasons?"**

- Event details (name, description) change when the organizer edits them
- Order status changes when the customer pays or cancels
- Check-in records change when people walk through the door

These change at **different times, for different reasons, triggered by different people**. Strong signal for separate contexts.

---

## Step 4 — Check What Each Context Needs from Others

Ask: **"What does context A need to know about context B's data?"**

The answer should be **as little as possible.** Each context only needs a simplified view of the other:

- Ordering doesn't need the Event's full description — just: "Is it available for sales? What ticket types exist with prices and quantities?"
- Check-in doesn't need the Order's payment details — just: "Is this ticket valid? Has it been used?"

**Rule:** If context A needs a 50-field model from context B, the boundary is probably wrong. If it needs 2-3 fields, you're on track.

---

## Step 5 — Define How Contexts Communicate

Contexts talk through **domain events**, never by importing each other's code.

For each boundary, define:
- **What events does this context publish?** (things that happened)
- **What events does this context listen to?** (things it needs to react to)
- **What data does each event carry?** (minimal — usually just IDs and what happened)

```
Event Management                     Ordering                        Check-in
      |                                 |                               |
      |--- EventPublished ------------->|                               |
      |                                 |--- OrderPaid ---------------->|
      |                                 |--- OrderCancelled ----------->|
```

---

## Step 6 — Start with the Core

Ask: **"Which context has the most complex business rules?"**

- **Core domain** — Complex rules, competitive advantage. Use full DDD. Build first.
- **Supporting domain** — Necessary but simpler. Lighter DDD or just clean code.
- **Generic domain** — Solved problem (auth, email, payments). Use a library or service.

Don't apply full DDD everywhere. Only the core context needs aggregates, value objects, and domain events. A simple CRUD context can be a simple CRUD module.

---

## Common Mistakes

### Splitting too early
Don't create 10 contexts for a simple system. Start with 2-3 natural ones. Split more later if needed.

### Splitting by technical layer instead of business capability
Wrong: "API context," "Database context," "Email context"
Right: "Ordering context," "Event Management context," "Check-in context"

### Sharing domain models between contexts
If two contexts import the same `Event` class, they're not really separate. Each context should have its own model of what it needs.

### No communication plan
If you split into contexts but they call each other's services directly, you just have a distributed monolith. Use events.

---

## Quick Checklist

1. [ ] Identified words that mean different things to different people
2. [ ] Grouped functionality by who uses it and what they care about
3. [ ] Verified that things in each group change together for the same reasons
4. [ ] Each context needs minimal data from others (2-3 fields, not full models)
5. [ ] Communication happens through domain events, not direct imports
6. [ ] Identified which context is the core domain (build first with full DDD)
