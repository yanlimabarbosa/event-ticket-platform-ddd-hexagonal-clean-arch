# Aggregate Mapping — How to Think

A step-by-step thinking guide for discovering aggregates, entities, value objects, and invariants in any domain.

---

## Step 1 — Find the Main "Thing" (Aggregate Root)

Ask yourself: **What is the central noun that the business tracks and cares about in this context?**

Clues:
- It has a **lifecycle** (it gets created, changes state, and eventually ends)
- It has an **identity** (you'd say "Order #123", not just "an order")
- The business would have a **page or screen** dedicated to it
- Multiple actions/operations revolve around it

**Question to ask:** "If I had to name the one thing this context manages, what would it be?"

---

## Step 2 — Find What Lives Inside It (Child Entities & Value Objects)

Ask yourself: **Does the main thing contain smaller things?**

Clues for **child entities** (have identity, live inside the aggregate):
- They are a **list of items** inside the main thing (Order Items inside an Order)
- Each one is **distinguishable** — "item #1" vs "item #2" matters
- They **don't exist independently** — an Order Item without an Order makes no sense

Clues for **value objects** (no identity, defined by their attributes):
- They describe a **quality or measurement** (price, email, date range, address)
- Two with the same values are **interchangeable** — $10 is $10 regardless of "which" $10
- They are **immutable** — you don't change a price, you replace it with a new one

**Question to ask:** "If I delete the main thing, what else disappears with it? Those are its children."

**Question to ask:** "Is this thing defined by WHAT it is (value object) or WHO/WHICH it is (entity)?"

---

## Step 3 — Find the Invariants (Business Rules)

Ask yourself: **What must ALWAYS be true, no matter what operations happen?**

Techniques to discover invariants:

### The "Can it...?" technique
Go through impossible/invalid scenarios:
- "Can an Order exist with zero items?" → No → **Invariant: Order must have at least one item**
- "Can someone reserve more tickets than available?" → No → **Invariant: quantity cannot exceed availability**
- "Can a paid order go back to reserved?" → No → **Invariant: state transitions are one-directional**

### The "What if...?" technique
Think about what could go wrong:
- "What if two people buy the last ticket simultaneously?" → Need concurrency control
- "What if the reservation expires mid-payment?" → Need to handle timing
- "What if someone edits the price after items are added?" → Order items capture price at time of reservation

### The "Who enforces this?" technique
For each rule ask: **who prevents this from being violated?**
- If the rule involves data INSIDE one aggregate → the aggregate enforces it
- If the rule involves data across aggregates → might need a domain service or eventual consistency

**Question to ask:** "If a junior developer could call any method in any order, what bad state could they create? Each bad state reveals a missing invariant."

---

## Step 4 — Find the State Transitions

Ask yourself: **What states does the aggregate go through, and what triggers each transition?**

Draw it out:
```
[State A] --action--> [State B] --action--> [State C]
                                 \--failure--> [State D]
```

For each transition ask:
- **What triggers it?** (user action, time passing, external event)
- **What conditions must be true?** (guards/preconditions)
- **What happens as a result?** (side effects, domain events)
- **Can it be reversed?**

---

## Step 5 — Find the Domain Events

Ask yourself: **When something important happens, who else in the system needs to know?**

Clues:
- State transitions often produce events: Order **confirmed** → `OrderConfirmed`
- Use **past tense** — events are facts that already happened
- If another bounded context needs to react → that's a domain event
- If it triggers a side effect (send email, update analytics) → that's a domain event

**Question to ask:** "If this action succeeds, would I announce it? To whom? What would they need to know?"

---

## Step 6 — Check Aggregate Boundaries

Ask yourself: **Is this aggregate too big or too small?**

Too big if:
- You're loading tons of data just to change one thing
- Two parts of it change for completely different reasons
- Multiple users would frequently conflict trying to modify it simultaneously

Too small if:
- You need to coordinate two aggregates to enforce a single business rule
- Saving one without the other would leave the system in a broken state

**The golden rule:** Things that MUST be consistent in the same transaction belong in the same aggregate. Things that CAN be eventually consistent should be separate aggregates.

---

## Quick Checklist

When mapping any new domain context, answer these in order:

1. [ ] What is the aggregate root? (the main tracked thing)
2. [ ] What lives inside it? (child entities and value objects)
3. [ ] What are the invariants? (rules that must always hold)
4. [ ] What are the state transitions? (lifecycle with happy and unhappy paths)
5. [ ] What domain events does it produce? (who else needs to know?)
6. [ ] Is the boundary right? (not too big, not too small)
