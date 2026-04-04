# API Design — How to Think

A step-by-step guide for designing REST APIs from your domain model.

---

## Key Principle

The API is a **translation layer** between the outside world and your domain. It receives simple data, triggers domain actions, and returns structured responses. The client should never need to know about your database schema, aggregate structure, or internal architecture.

---

## Step 1 — List the Actions from the User's Perspective

Ask: **"What does the user need to do?"**

Don't think about tables or code. Think about what a person clicks on a screen:

- "I want to buy tickets" → create something
- "I want to pay" → trigger an action
- "I want to see my orders" → read something
- "I want to cancel" → trigger an action

Each action becomes a candidate endpoint.

---

## Step 2 — Choose HTTP Methods

Ask: **"What kind of operation is this?"**

| Intent | HTTP Method | Example |
|---|---|---|
| Create a new resource | **POST** | `POST /orders` |
| Read a resource | **GET** | `GET /orders/:id` |
| Update fields on a resource | **PATCH** | `PATCH /orders/:id` |
| Replace a resource entirely | **PUT** | `PUT /orders/:id` |
| Delete a resource | **DELETE** | `DELETE /orders/:id` |
| Trigger a business action | **POST** to sub-resource | `POST /orders/:id/pay` |

**Key distinction:**
- Changing data fields (name, email) → **PATCH**
- Triggering a business action (pay, cancel, confirm) → **POST** to a sub-path

The action endpoints read like commands: "post a pay action to order 456."

---

## Step 3 — Design URL Paths

Ask: **"What is the resource, and does it belong to a parent?"**

### Rules

- URLs are **nouns**, not verbs: `/orders` not `/create-order`
- Use **plural** for collections: `/orders` not `/order`
- Nest **child resources** under parents: `/orders/:id/tickets` not `/tickets?orderId=123`
- Keep nesting **shallow** (max 2 levels): `/orders/:id/tickets` is fine, `/events/:id/orders/:id/tickets/:id/scans` is too deep

### Common patterns

```
GET    /resources           → list (with pagination)
POST   /resources           → create
GET    /resources/:id       → read one
PATCH  /resources/:id       → update fields
DELETE /resources/:id       → delete
POST   /resources/:id/verb  → trigger action
```

---

## Step 4 — Design Request Bodies

Ask: **"What is the MINIMUM data the server needs to execute this action?"**

### Rules

- Only include data the server **doesn't already have**
- IDs in the URL, not in the body: `:id` is in the path, don't repeat it in JSON
- User identity comes from the **auth token**, not the request body
- Calculated fields (totals, timestamps) are set by the **server**, not sent by the client
- Prices come from the **server's database**, not from the client (never trust the client with money)

### Example thought process

```
POST /orders — what does the server need?
  ✗ attendee_id    → comes from auth token
  ✗ status         → server sets to "reserved"
  ✗ total          → server calculates from prices
  ✗ created_at     → server sets to now
  ✓ eventId        → client chooses which event
  ✓ items          → client chooses what tickets and how many
```

---

## Step 5 — Design Response Bodies

Ask: **"What does the frontend need to render the next screen?"**

### Rules

- Return the **full resource** after creation or update (saves the client a GET request)
- Return **human-readable data**, not just IDs: `"ticketType": "VIP"` not just `"ticketTypeId": "vip-123"`
- The response mirrors the **aggregate structure**: root object with nested children
- Include **timestamps** that drive UI behavior (e.g., `expiresAt` for countdown timers)
- The API returns **data**, the frontend builds **messages**. Don't return `"message": "You have 15 minutes"` — return `"expiresAt": "..."` and let the UI format it

### Response structure pattern

```json
{
  "resourceId": "...",
  "status": "...",
  "key fields": "...",
  "timestamps": "...",
  "children": [...]
}
```

---

## Step 6 — Define Status Codes

Ask: **"What happened, and whose fault is it?"**

### Success codes

| Code | Meaning | When to use |
|---|---|---|
| **200** | OK | Successful read, update, or action |
| **201** | Created | A new resource was created |
| **204** | No Content | Success with nothing to return (rare) |

### Client error codes

| Code | Meaning | When to use |
|---|---|---|
| **400** | Bad Request | Invalid input — missing fields, wrong types, bad JSON. The request is structurally wrong. |
| **401** | Unauthorized | Not authenticated — no token or invalid token |
| **403** | Forbidden | Authenticated but not allowed — wrong role or permissions |
| **404** | Not Found | Resource doesn't exist |
| **409** | Conflict | Business rule violation — request is valid but conflicts with current state (already cancelled, sold out, expired) |
| **422** | Unprocessable Entity | Valid JSON but semantically wrong (alternative to 409 for some teams) |

### Server error codes

| Code | Meaning | When to use |
|---|---|---|
| **500** | Internal Server Error | Unexpected server failure |
| **503** | Service Unavailable | Server is down or overloaded |

### The key distinction: 400 vs 409

- **400** = the request is **broken**. The server can't even parse or validate it.
- **409** = the request is **valid** but the **business says no** given the current state.

Example: `POST /orders/:id/cancel` with `{ "reason": 123 }` → **400** (reason should be a string).
Same endpoint with `{ "reason": "changed mind" }` but order is already cancelled → **409** (business rule).

---

## Step 7 — Design Error Responses

Ask: **"Can the frontend show a meaningful message from this error?"**

### Standard error format

```json
{
  "statusCode": 409,
  "error": "AlreadyCancelled",
  "message": "Order 456 is already cancelled"
}
```

Rules:
- `error` matches the **domain error class name** — keeps ubiquitous language consistent
- `message` is human-readable with **context** (which order, what went wrong)
- The frontend uses `error` for logic (which error screen to show) and `message` for display

---

## Step 8 — Add Pagination for List Endpoints

Ask: **"Can this list grow unbounded?"**

If yes, paginate:

```
GET /orders?page=1&limit=10

Response:
{
  "data": [...],
  "page": 1,
  "limit": 10,
  "totalPages": 5,
  "totalItems": 48
}
```

Common pagination styles:
- **Offset-based** (`page` + `limit`) — simple, good for most cases
- **Cursor-based** (`after=lastId`) — better for large/real-time datasets, no "page 47" skipping

---

## Quick Checklist

1. [ ] Every endpoint maps to a user action (not a database operation)
2. [ ] URLs are nouns, HTTP methods express the intent
3. [ ] Business actions use POST to sub-resources (`/orders/:id/pay`)
4. [ ] Request bodies contain only what the server doesn't already know
5. [ ] Responses return the full resource with human-readable data
6. [ ] Status codes distinguish success (2xx), bad input (400), not found (404), and business violations (409)
7. [ ] Error responses include error name, message, and status code
8. [ ] List endpoints are paginated
9. [ ] Client never sends prices, totals, or user IDs — server handles those
