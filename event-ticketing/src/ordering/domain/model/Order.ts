import { AggregateRoot } from 'src/shared/domain/AggregateRoot'
import { EmptyOrderItem } from '../errors/EmptyOrderItem'
import { Money } from './Money'
import type { OrderItem } from './OrderItem'
import { OrderStatus } from './OrderStatus'
import { OrderPaid } from '../events/OrderPaid'
import { OrderCreated } from '../events/OrderCreated'
import { OrderExpired } from '../events/OrderExpired'
import { OrderCancelled } from '../events/OrderCancelled'

export class Order extends AggregateRoot {
  private readonly eventId: string
  private readonly attendeeId: string
  private readonly items: OrderItem[]
  private status: OrderStatus
  private readonly createdAt: Date
  private readonly expiresAt: Date
  private paidAt: Date | null
  private cancelledAt: Date | null
  private cancelReason: string | null

  public constructor(
    id: string,
    eventId: string,
    attendeeId: string,
    items: OrderItem[],
    status: OrderStatus,
    createdAt: Date,
    expiresAt: Date,
    paidAt: Date | null,
    cancelledAt: Date | null,
    cancelReason: string | null,
  ) {
    super(id)
    this.eventId = eventId
    this.attendeeId = attendeeId
    this.items = items
    this.status = status
    this.createdAt = createdAt
    this.expiresAt = expiresAt
    this.paidAt = paidAt
    this.cancelledAt = cancelledAt
    this.cancelReason = cancelReason
  }

  public static create(id: string, eventId: string, attendeeId: string, items: OrderItem[]): Order {
    if (items.length === 0) {
      throw new EmptyOrderItem()
    }

    const order = new Order(
      id,
      eventId,
      attendeeId,
      items,
      OrderStatus.reserved(),
      new Date(),
      new Date(Date.now() + 15 * 60 * 1000),
      null,
      null,
      null,
    )

    order.addDomainEvent(new OrderCreated(order.id, order.getExpiresAt()))

    return order
  }

  public pay(): void {
    this.status = this.status.toPaid()
    this.paidAt = new Date()
    this.addDomainEvent(
      new OrderPaid(
        this.id,
        this.attendeeId,
        this.eventId,
        this.items.map((item) => ({
          ticketTypeId: item.getTicketTypeId(),
          quantity: item.getQuantity().getValue(),
        })),
      ),
    )
  }

  public expire(): void {
    this.status = this.status.toExpired()
    this.addDomainEvent(new OrderExpired(this.id, this.attendeeId))
  }

  public cancel(cancelReason: string | null): void {
    this.status = this.status.toCancelled()
    this.cancelledAt = new Date()
    this.cancelReason = cancelReason
    this.addDomainEvent(new OrderCancelled(this.id, this.attendeeId, this.cancelReason))
  }

  public getTotal(): Money {
    const total = this.items.reduce((sum, item) => item.getTotal().getValue() + sum, 0)
    return Money.create(total)
  }

  public getEventId(): string {
    return this.eventId
  }

  public getAttendeeId(): string {
    return this.attendeeId
  }

  public getItems(): OrderItem[] {
    return [...this.items]
  }

  public getStatus(): OrderStatus {
    return this.status
  }

  public getCreatedAt(): Date {
    return this.createdAt
  }

  public getExpiresAt(): Date {
    return this.expiresAt
  }

  public getPaidAt(): Date | null {
    return this.paidAt
  }

  public getCancelledAt(): Date | null {
    return this.cancelledAt
  }

  public getCancelReason(): string | null {
    return this.cancelReason
  }
}
