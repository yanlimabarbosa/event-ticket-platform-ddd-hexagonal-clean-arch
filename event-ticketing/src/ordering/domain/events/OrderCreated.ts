import { DomainEvent } from 'src/shared/domain/DomainEvent'

export class OrderCreated extends DomainEvent {
  public constructor(
    public readonly orderId: string,
    public readonly expiresAt: Date,
  ) {
    super()
  }
}
