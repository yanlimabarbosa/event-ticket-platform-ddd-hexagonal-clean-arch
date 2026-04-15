import { AggregateRoot } from 'src/shared/domain/base/AggregateRoot'
import { EmptyOrderItem } from '../errors/EmptyOrderItem'
import { OrderCancelled } from '../events/OrderCancelled'
import { OrderCreated } from '../events/OrderCreated'
import { OrderExpired } from '../events/OrderExpired'
import { OrderPaid } from '../events/OrderPaid'
import { Money } from '../value-objects/Money'
import { OrderStatus } from '../value-objects/OrderStatus'
import type { OrderItem } from './OrderItem'

export class Order extends AggregateRoot {
  public constructor(
    id: string,
    private readonly eventId: string,
    private readonly attendeeId: string,
    private readonly items: OrderItem[],
    private status: OrderStatus,
    private readonly createdAt: Date,
    private readonly expiresAt: Date,
    private paidAt: Date | null,
    private cancelledAt: Date | null,
    private cancelReason: string | null,
  ) {
    super(id)
  }

  private static readonly RESERVATION_WINDOW_MS = 15 * 60 * 1000

  public static create(
    id: string,
    eventId: string,
    attendeeId: string,
    items: OrderItem[],
    now: Date,
  ): Order {
    if (items.length === 0) {
      throw new EmptyOrderItem()
    }

    const order = new Order(
      id,
      eventId,
      attendeeId,
      items,
      OrderStatus.reserved(),
      now,
      new Date(now.getTime() + Order.RESERVATION_WINDOW_MS),
      null,
      null,
      null,
    )

    order.addDomainEvent(new OrderCreated(order.id, order.getExpiresAt()))

    return order
  }

  public pay(now: Date): void {
    this.status = this.status.toPaid()
    this.paidAt = now
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

  public cancel(cancelReason: string | null, now: Date): void {
    this.status = this.status.toCancelled()
    this.cancelledAt = now
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
