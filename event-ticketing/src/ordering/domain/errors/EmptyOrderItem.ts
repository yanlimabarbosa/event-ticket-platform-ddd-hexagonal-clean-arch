import { ValidationError } from 'src/shared/domain/errors/ValidationError'

export class EmptyOrderItem extends ValidationError {
  public constructor() {
    super('An order must have at least 1 item')
  }
}
