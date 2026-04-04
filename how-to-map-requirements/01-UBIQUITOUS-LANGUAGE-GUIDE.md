# Ubiquitous Language Discovery — How to Think

A step-by-step guide for discovering the business vocabulary that your code should use.

---

## What is Ubiquitous Language?

One shared vocabulary used by everyone — developers, product, business. The same words appear in conversations, documents, AND code. No mental translation needed.

If the business says "Attendee" but your code says "User," every developer translates constantly. That translation causes bugs, miscommunication, and wrong assumptions.

---

## Step 1 — Identify the People

Ask: **"Who are the people involved? What does the business call them?"**

- Never start with "User" — that's a technical/auth term
- Ask: "What role does this person play in the business?"
- Different roles = different names: Organizer, Attendee, Reviewer, Host

**Red flags:** If you catch yourself saying "user," "admin," or "manager" — dig deeper. The business almost always has more specific words.

---

## Step 2 — Walk Through the Business Flow

Ask: **"What happens from start to finish? Walk me through it like I know nothing about software."**

- Use the format: "First, the ___ does ___. Then the ___ happens. Then..."
- Listen for **nouns** (these become entities/value objects) and **verbs** (these become methods/commands)
- Every noun the business uses naturally is a candidate for your model

**Technique:** Pretend you're explaining the business to someone who will run it manually with paper and pen. No technology. What words do they need?

---

## Step 3 — Challenge Every Technical Term

When you catch a technical term in the vocabulary, ask: **"Is that what the business calls it, or is that what developers call it?"**

Common traps:

| Developer says | Business might say |
|---|---|
| User | Attendee, Organizer, Member, Guest |
| Record | Order, Reservation, Booking, Application |
| Lock | Reservation, Hold |
| Data | Profile, Details, Specification |
| Payload | Request, Submission |
| Blob/File | Document, Receipt, Certificate |
| Flag | Status, State |
| Timestamp | Date, Deadline, Window |

---

## Step 4 — Find the Lifecycle Verbs

For each main noun, ask: **"What actions happen to this thing? Use the words the business uses."**

- Not `updateStatus()` → but `cancel()`, `confirm()`, `expire()`
- Not `setActive(false)` → but `suspend()`, `archive()`, `deactivate()`
- Not `create()` → but `place()` (an order), `register()` (a user), `schedule()` (an event)

The verb tells you the **intent**. `cancel()` carries meaning that `update({ status: 'cancelled' })` does not.

---

## Step 5 — Name the Unhappy Paths

Ask: **"What can go wrong? What does the business call those situations?"**

- Not "error" or "exception" → but "Insufficient Stock," "Expired Reservation," "Already Cancelled"
- These become your **domain error** names
- If the business has a word for the problem, your code should use that exact word

---

## Step 6 — Build the Glossary

Create a table with every term, its definition, and stick to it everywhere:

| Term | Definition |
|---|---|
| Order | A customer's intent to purchase tickets for an event |
| Reservation | A temporary hold before payment... |

Rules:
- If a word isn't in the glossary, it shouldn't be in the code
- If the glossary changes, the code changes with it
- Review the glossary with business stakeholders — they should recognize every term

---

## Quick Checklist

1. [ ] Identified all people/roles with business names (not "user")
2. [ ] Walked through the full business flow in plain language
3. [ ] Replaced all technical terms with business terms
4. [ ] Named all actions with business verbs (not CRUD)
5. [ ] Named all error scenarios with business language
6. [ ] Built a glossary table
