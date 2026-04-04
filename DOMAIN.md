# Event Ticketing Platform — Domain Discovery

## Ubiquitous Language

| Term | Definition |
|---|---|
| **Event** | A scheduled occasion people attend. Has a name, date, venue, and ticket types. Created by an Organizer. |
| **Ticket Type** | A category of ticket with its own name, price, and quantity limit (e.g., VIP, General Admission, Early Bird). |
| **Reservation** | A temporary hold on tickets before payment. Expires after a time window (e.g., 15 minutes). |
| **Ticket** | Proof of purchase. What the attendee receives after payment and presents at the door for validation. |
| **Organizer** | The person or entity that creates and manages events. |
| **Attendee** | The person who buys tickets and attends the event. |
| **Refund** | Money returned to the attendee when a purchased ticket is cancelled. Tracked with amount, reason, and date. |
| **Check-in** | The act of validating a ticket at the door. Marks the ticket as used. |

## Ticket Lifecycle

```
Available → Reserved → Purchased → Used

Unhappy paths:
  Reserved  → Expired   (didn't pay in time → quantity returns to pool)
  Purchased → Cancelled  (refund requested → quantity returns to pool)
```

## Bounded Contexts

| Context | Responsibility |
|---|---|
| **Event Management** | Creating events, setting up ticket types, publishing, event details — the Organizer's world. |
| **Ordering** | Reservations, payment, purchasing tickets, refunds — the Attendee's buying journey. |
| **Check-in** | Validating tickets at the door, marking as used, preventing reuse. |

### How contexts communicate

Contexts do NOT import each other's models. They communicate through **domain events**.

Example flow:
1. Organizer publishes an Event (Event Management context)
2. Attendee reserves and pays for tickets (Ordering context)
3. `TicketPurchased` event is published
4. Check-in context listens and creates its own record for door validation

---

## Ordering Context — Aggregate Mapping

### Aggregate: Order

**Aggregate Root:** Order
**Child Entity:** Order Item (ticket type reference, quantity, unit price)

### Invariants

| # | Rule |
|---|---|
| 1 | An Order must have at least one Order Item |
| 2 | Quantity requested cannot exceed available tickets |
| 3 | State transitions are one-directional — cancelled/expired orders cannot be reactivated |
| 4 | Order total must equal the sum of (quantity x price) for all Order Items |
| 5 | A reservation expires after 15 minutes — if not paid, tickets return to the pool |
| 6 | An Order can only be created for an event that is open for sales and has a future date |
| 7 | Customer refunds are only allowed before the event date (e.g., up to 24h before) |
| 8 | If the organizer cancels the event, all orders are refunded regardless of time restrictions |

### Domain Events

| Event | Published by | Reacts | What they do |
|---|---|---|---|
| `OrderCreated` | Ordering | Ordering (internal) | Starts the 15-min reservation timer |
| `OrderPaid` | Ordering | Check-in | Creates a valid ticket record for door scanning |
| `OrderPaid` | Ordering | Notifications | Sends confirmation email with ticket/QR code |
| `OrderExpired` | Ordering | Ordering (internal) | Releases tickets back to pool |
| `OrderExpired` | Ordering | Notifications | Notifies attendee that reservation expired |
| `OrderCancelled` | Ordering | Check-in | Invalidates the ticket record |
| `OrderCancelled` | Ordering | Notifications | Sends refund confirmation email |
| `EventCancelled` | Event Management | Ordering | Refunds all orders for that event |
| `EventCancelled` | Event Management | Notifications | Sends cancellation email to all attendees |

### Refund Policies

| Scenario | Rule |
|---|---|
| Customer requests refund | Only allowed before the event date (up to 24h before) |
| Organizer cancels event | All orders refunded automatically, no time restriction |

---

## Database Design — Ordering Context

### Tables

```
orders
──────────────────────────────────────────────────
id            PK
event_id      FK       → references events table
attendee_id   FK       → references attendees/users
status        ENUM     → reserved, paid, cancelled, expired
total         DECIMAL
created_at    TIMESTAMP
paid_at       TIMESTAMP (nullable)
cancelled_at  TIMESTAMP (nullable)
cancel_reason VARCHAR   (nullable)
expires_at    TIMESTAMP

Indexes: event_id, attendee_id


order_items
──────────────────────────────────────────────────
id              PK
order_id        FK       → references orders
ticket_type_id  FK       → references ticket types
quantity        INTEGER
unit_price      DECIMAL

Indexes: order_id


tickets
──────────────────────────────────────────────────
id              PK       (encoded in QR code for door scanning)
order_id        FK       → references orders
event_id        FK       → denormalized for query performance
ticket_type_id  FK       → references ticket types
status          ENUM     → purchased, used, cancelled
used_at         TIMESTAMP (nullable)

Indexes: order_id, event_id
```

### Relationships

- One Order has many Order Items (1:N)
- One Order has many Tickets (1:N, generated after payment)
- One Order Item with quantity N produces N Ticket rows

### Notes

- Order Items and Tickets are NOT the same thing. Order Items exist from reservation (the intent). Tickets exist after payment (the result).
- `event_id` on tickets is denormalized — it could be derived through the order, but having it directly avoids a join during door scanning.
- Data is never deleted to represent state changes. Status fields track the lifecycle.
- Expired/cancelled orders keep their Order Items as historical records.

---

## API Design — Ordering Context

### Endpoints

#### 1. Create Order (Reserve Tickets)
```
POST /orders → 201 Created

Request:
{
  "eventId": "10",
  "items": [
    { "ticketTypeId": "vip-123", "quantity": 3 },
    { "ticketTypeId": "general-456", "quantity": 2 }
  ]
}

Response:
{
  "orderId": "456",
  "status": "reserved",
  "total": 500,
  "expiresAt": "2026-04-04T15:15:00Z",
  "items": [
    { "ticketType": "VIP", "quantity": 3, "unitPrice": 100 },
    { "ticketType": "General", "quantity": 2, "unitPrice": 100 }
  ]
}
```

#### 2. List My Orders
```
GET /orders?page=1&limit=10 → 200 OK

Response:
{
  "orders": [
    { "orderId": "456", "eventName": "Saturday Jazz Night", "status": "paid", "total": 500, "createdAt": "..." },
    ...
  ],
  "page": 1,
  "totalPages": 3
}
```

#### 3. Pay Order
```
POST /orders/:id/pay → 200 OK

Request:
{
  "paymentMethod": "credit_card",
  "paymentToken": "tok_abc123"
}

Response:
{
  "orderId": "456",
  "status": "paid",
  "total": 500,
  "paidAt": "2026-04-04T15:03:00Z",
  "items": [...]
}
```

#### 4. Cancel Order
```
POST /orders/:id/cancel → 200 OK

Request:
{
  "reason": "changed my mind"
}

Response:
{
  "orderId": "456",
  "status": "cancelled",
  "total": 500,
  "cancelledAt": "2026-04-04T16:00:00Z",
  "reason": "changed my mind",
  "items": [...]
}
```

#### 5. Get Order Tickets
```
GET /orders/:id/tickets → 200 OK

Response:
{
  "tickets": [
    {
      "ticketId": "abc-123",
      "eventName": "Saturday Jazz Night",
      "ticketType": "VIP",
      "status": "purchased",
      "usedAt": null
    },
    ...
  ]
}
```

### HTTP Status Codes

| Status | Meaning | When |
|---|---|---|
| 200 | OK | Successful read or update |
| 201 | Created | New resource created (POST /orders) |
| 400 | Bad Request | Invalid input (missing fields, wrong types, bad JSON) |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Business rule violation (expired order, already cancelled, sold out) |

### Error Response Format
```json
{
  "statusCode": 409,
  "error": "AlreadyCancelled",
  "message": "Order 456 is already cancelled"
}
```
