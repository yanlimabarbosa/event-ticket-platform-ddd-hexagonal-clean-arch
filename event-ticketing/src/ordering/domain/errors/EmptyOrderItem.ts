import { DomainError } from 'src/shared/domain/DomainError'

export class EmptyOrderItem extends DomainError {
  public constructor() {
    super('An order must have at least 1 item')
  }
}
