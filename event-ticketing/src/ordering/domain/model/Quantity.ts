import { ValueObject } from 'src/shared/domain/ValueObject'

export class Quantity extends ValueObject {
  private readonly value: number

  private constructor(value: number) {
    super()

    if (!Number.isInteger(value)) {
      throw new Error('Quantity must be a whole number')
    }

    if (value < 1) {
      throw new Error('Quantity must be at least 1')
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
