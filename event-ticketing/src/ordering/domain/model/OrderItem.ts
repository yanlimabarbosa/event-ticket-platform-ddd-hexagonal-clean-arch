import { Entity } from 'src/shared/domain/Entity'
import { Money } from './Money'
import type { Quantity } from './Quantity'

export class OrderItem extends Entity {
  public constructor(
    id: string,
    private readonly ticketTypeId: string,
    private readonly quantity: Quantity,
    private readonly unitPrice: Money,
  ) {
    super(id)
  }

  public getTicketTypeId(): string {
    return this.ticketTypeId
  }

  public getQuantity(): Quantity {
    return this.quantity
  }

  public getUnitPrice(): Money {
    return this.unitPrice
  }

  public getTotal(): Money {
    return Money.create(this.quantity.getValue() * this.unitPrice.getValue())
  }
}
