---
name: Always use explicit modifiers
description: Never leave access modifiers, override, or return types implicit — always write them out explicitly
type: feedback
---

Always use explicit access modifiers (`public`, `private`, `protected`), `override` keyword, and return types on all class members. Nothing implicit.

**Why:** Student values readability and wants code that is self-documenting. Implicit defaults hide intent and can cause confusion about what's public vs private.

**How to apply:** When writing or reviewing class code, ensure every method, constructor, and property has an explicit access modifier. When overriding a parent method, always add `override`. Always add return types to methods. The `noImplicitOverride: true` flag is set in tsconfig.json to enforce override at compiler level.
