import { DomainEvent } from 'src/shared/domain/DomainEvent'

type OrderPaidItems = { ticketTypeId: string; quantity: number }[]

export class OrderPaid extends DomainEvent {
  public constructor(
    public readonly orderId: string,
    public readonly attendeeId: string,
    public readonly eventId: string,
    public readonly items: OrderPaidItems,
  ) {
    super()
  }
}
