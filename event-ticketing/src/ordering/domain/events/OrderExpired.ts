import { DomainEvent } from 'src/shared/domain/DomainEvent'

export class OrderExpired extends DomainEvent {
  public readonly orderId: string
  public readonly attendeeId: string

  public constructor(orderId: string, attendeeId: string) {
    super()
    this.orderId = orderId
    this.attendeeId = attendeeId
  }
}
