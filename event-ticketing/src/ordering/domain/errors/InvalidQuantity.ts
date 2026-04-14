import { ValidationError } from 'src/shared/domain/ValidationError'

export class InvalidQuantity extends ValidationError {
  public constructor(value: number) {
    super(`Invalid quantity amount: ${value}. Must be a whole number greater than 0`)
  }
}
