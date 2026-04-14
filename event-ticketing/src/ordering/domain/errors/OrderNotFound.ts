import { NotFoundError } from 'src/shared/domain/NotFoundError'

export class OrderNotFound extends NotFoundError {
  public constructor(id: string) {
    super(`Order with id ${id} was not found`)
  }
}
