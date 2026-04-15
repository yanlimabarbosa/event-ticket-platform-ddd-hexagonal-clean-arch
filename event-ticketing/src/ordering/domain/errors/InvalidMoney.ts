import { ValidationError } from 'src/shared/domain/errors/ValidationError'

export class InvalidMoney extends ValidationError {
  public constructor(value: number) {
    super(`Invalid money amount: ${value}. Must be a non-negative integer (cents)`)
  }
}
