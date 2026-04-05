import { ValueObject } from 'src/shared/domain/ValueObject'

type Status = 'reserved' | 'paid' | 'expired' | 'cancelled'

export class OrderStatus extends ValueObject {
  private readonly value: Status

  private constructor(value: Status) {
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
      throw new Error('Order must be reserved to be paid')
    }

    return OrderStatus.paid()
  }

  public toExpired(): OrderStatus {
    if (this.value !== 'reserved') {
      throw new Error('Order must be reserved to be expired')
    }

    return OrderStatus.expired()
  }

  public toCancelled(): OrderStatus {
    if (this.value !== 'paid') {
      throw new Error('Order must be paid to be cancelled')
    }

    return OrderStatus.cancelled()
  }

  public getValue(): Status {
    return this.value
  }
}
