import { DomainEvent } from 'src/shared/domain/DomainEvent'

export class OrderCreated extends DomainEvent {
  public readonly orderId: string
  public readonly expiresAt: Date

  public constructor(orderId: string, expiresAt: Date) {
    super()
    this.orderId = orderId
    this.expiresAt = expiresAt
  }
}
