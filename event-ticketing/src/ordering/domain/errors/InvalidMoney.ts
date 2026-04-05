import { DomainError } from 'src/shared/domain/DomainError'

export class InvalidMoney extends DomainError {
  public constructor(value: number) {
    super(`Invalid money amount: ${value}. Must be a non-negative integer (cents)`)
  }
}
