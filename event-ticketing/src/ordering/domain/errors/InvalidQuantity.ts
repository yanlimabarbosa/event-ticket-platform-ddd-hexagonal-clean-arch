import { DomainError } from 'src/shared/domain/DomainError'

export class InvalidQuantity extends DomainError {
  public constructor(value: number) {
    super(`Invalid quantity amount: ${value}. Must be a whole number greater than 0`)
  }
}
