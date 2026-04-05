import { DomainEvent } from 'src/shared/domain/DomainEvent'

export class OrderCancelled extends DomainEvent {
  public readonly orderId: string
  public readonly attendeeId: string
  public readonly reason: string | null

  public constructor(orderId: string, attendeeId: string, reason: string | null) {
    super()
    this.orderId = orderId
    this.attendeeId = attendeeId
    this.reason = reason
  }
}
