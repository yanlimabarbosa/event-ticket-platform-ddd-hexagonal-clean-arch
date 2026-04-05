---
name: Avenir mesa virtual DDD refactor
description: Student wants to revisit Avenir's mesa virtual module later to refactor it using DDD patterns learned in this course
type: project
---

Student wants to come back to the Avenir NestJS project (at /home/yanlimabarbosa/codes/jobs/avenir/) to refactor the **mesa virtual module** using DDD patterns.

**Why:** Mesa virtual has complex RBAC (3-level hierarchy), sector-specific permissions, tramite workflows with audit trails, and fine-grained actions per sector — enough complexity to benefit from DDD. The rest of Avenir is medium complexity and fine with good OOP + layers.

**How to apply:** When the student is ready, help them identify Tramite as an aggregate root, extract value objects (Cargo, SetorPermissao), define invariants, and introduce domain events. Only apply DDD to mesa virtual — keep other modules as they are.
