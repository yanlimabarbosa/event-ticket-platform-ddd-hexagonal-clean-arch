import { ValueObject } from 'src/shared/domain/ValueObject'
import { InvalidMoney } from '../errors/InvalidMoney'

export class Money extends ValueObject {
  private readonly value: number

  private constructor(value: number) {
    super()

    if (!Number.isInteger(value)) {
      throw new InvalidMoney(value)
    }

    if (value < 0) {
      throw new InvalidMoney(value)
    }

    this.value = value
  }

  public static create(value: number): Money {
    return new Money(value)
  }

  public override equals(other: Money): boolean {
    if (!(other instanceof Money)) return false
    return this.value === other.value
  }

  public getValue(): number {
    return this.value
  }
}
