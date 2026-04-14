import { DomainError } from 'src/shared/domain/DomainError'

export class OrderNotFound extends DomainError {
  public constructor(id: string) {
    super(`Order with id ${id} was not found`)
  }
}
