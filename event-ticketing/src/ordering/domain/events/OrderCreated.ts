import { DomainEvent } from 'src/shared/domain/base/DomainEvent'

export class OrderCreated extends DomainEvent {
  public constructor(
    public readonly orderId: string,
    public readonly expiresAt: Date,
  ) {
    super()
  }
}
