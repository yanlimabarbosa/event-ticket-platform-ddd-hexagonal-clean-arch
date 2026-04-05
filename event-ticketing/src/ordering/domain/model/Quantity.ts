import { ValueObject } from 'src/shared/domain/ValueObject'
import { InvalidQuantity } from '../errors/InvalidQuantity'

export class Quantity extends ValueObject {
  private readonly value: number

  private constructor(value: number) {
    super()

    if (!Number.isInteger(value)) {
      throw new InvalidQuantity(value)
    }

    if (value < 1) {
      throw new InvalidQuantity(value)
    }

    this.value = value
  }

  public static create(quantity: number): Quantity {
    return new Quantity(quantity)
  }

  public equals(other: Quantity): boolean {
    if (!(other instanceof Quantity)) return false
    return this.value === other.value
  }

  public getValue(): number {
    return this.value
  }
}
