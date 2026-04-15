import { DomainEvent } from 'src/shared/domain/base/DomainEvent'

export class OrderCancelled extends DomainEvent {
  public constructor(
    public readonly orderId: string,
    public readonly attendeeId: string,
    public readonly reason: string | null,
  ) {
    super()
  }
}
