---
name: feedback_visual_and_incremental
description: Explain with ASCII diagrams and always show flow → problem → pattern fix. Never jump straight to a pattern.
type: feedback
---

Two key rules for teaching:

**1. ASCII diagrams for every new pattern** — show database table state (before/after), request flow with arrows, side-by-side concurrent operations, exact SQL generated, and the difference the pattern makes. Don't just describe in text.

**Why:** Student said "THATS PERFECT EXPLANATION, THATS HOW I LIKE TO LEARN" after optimistic locking was explained with table diagrams, flow arrows, SQL, and before/after.

**2. Build incrementally: flow → problem → pattern**
- First make the basic flow work (naive version)
- Then demonstrate the failure/limitation visually (logs, DB state, crash simulation)
- Then introduce the pattern as the fix
- Then implement the solution
- Then show the same scenario working

**Why:** Student said "I need the flow working, then the problem, then the problem that the pattern solves, that's the best way to recognize value of something, and I want to actually visualize."

**How to apply:** Never jump straight to implementing a pattern. Let the student see things break before fixing them.
