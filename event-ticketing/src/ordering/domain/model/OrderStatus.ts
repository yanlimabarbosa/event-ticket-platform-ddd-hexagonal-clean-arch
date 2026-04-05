import { ValueObject } from 'src/shared/domain/ValueObject'
import { InvalidOrderTransition } from '../errors/InvalidOrderTransition'

export type OrderStatusType = 'reserved' | 'paid' | 'expired' | 'cancelled'

export class OrderStatus extends ValueObject {
  private readonly value: OrderStatusType

  private constructor(value: OrderStatusType) {
    super()
    this.value = value
  }

  public static reserved(): OrderStatus {
    return new OrderStatus('reserved')
  }

  public static paid(): OrderStatus {
    return new OrderStatus('paid')
  }

  public static expired(): OrderStatus {
    return new OrderStatus('expired')
  }

  public static cancelled(): OrderStatus {
    return new OrderStatus('cancelled')
  }

  public equals(other: OrderStatus): boolean {
    if (!(other instanceof OrderStatus)) return false
    return this.value === other.value
  }

  public toPaid(): OrderStatus {
    if (this.value !== 'reserved') {
      throw new InvalidOrderTransition(this.value, 'paid')
    }

    return OrderStatus.paid()
  }

  public toExpired(): OrderStatus {
    if (this.value !== 'reserved') {
      throw new InvalidOrderTransition(this.value, 'expired')
    }

    return OrderStatus.expired()
  }

  public toCancelled(): OrderStatus {
    if (this.value !== 'paid') {
      throw new InvalidOrderTransition(this.value, 'cancelled')
    }

    return OrderStatus.cancelled()
  }

  public getValue(): OrderStatusType {
    return this.value
  }
}
