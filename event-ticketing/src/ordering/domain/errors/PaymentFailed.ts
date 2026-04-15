import { ConflictError } from 'src/shared/domain/errors/ConflictError'

export class PaymentFailed extends ConflictError {
  public constructor(id: string) {
    super(`Payment failed for order ${id}`)
  }
}
