import { ValueObject } from 'src/shared/domain/ValueObject'

export class Money extends ValueObject {
  private readonly value: number

  private constructor(value: number) {
    super()

    if (!Number.isInteger(value)) {
      throw new Error('Money amount must be a whole number (cents)')
    }

    if (value < 0) {
      throw new Error('Money amount cannot be negative')
    }

    this.value = value
  }

  public static create(value: number): Money {
    return new Money(value)
  }

  public equals(other: Money): boolean {
    if (!(other instanceof Money)) return false
    return this.value === other.value
  }

  public getValue(): number {
    return this.value
  }
}
