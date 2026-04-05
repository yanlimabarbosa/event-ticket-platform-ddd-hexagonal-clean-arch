import { DomainEvent } from 'src/shared/domain/DomainEvent'

type OrderPaidItems = { ticketTypeId: string; quantity: number }[]

export class OrderPaid extends DomainEvent {
  public readonly orderId: string
  public readonly attendeeId: string
  public readonly eventId: string
  public readonly items: OrderPaidItems

  public constructor(orderId: string, attendeeId: string, eventId: string, items: OrderPaidItems) {
    super()

    this.orderId = orderId
    this.attendeeId = attendeeId
    this.eventId = eventId
    this.items = items
  }
}
