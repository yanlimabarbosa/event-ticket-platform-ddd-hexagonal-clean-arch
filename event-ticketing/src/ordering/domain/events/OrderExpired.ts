import { DomainEvent } from 'src/shared/domain/DomainEvent'

export class OrderExpired extends DomainEvent {
  public constructor(
    public readonly orderId: string,
    public readonly attendeeId: string,
  ) {
    super()
  }
}
