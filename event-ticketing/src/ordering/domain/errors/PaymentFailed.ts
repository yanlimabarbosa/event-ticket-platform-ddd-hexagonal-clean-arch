import { ConflictError } from 'src/shared/domain/ConflictError'

export class PaymentFailed extends ConflictError {
  public constructor(id: string) {
    super(`Payment failed for order ${id}`)
  }
}
