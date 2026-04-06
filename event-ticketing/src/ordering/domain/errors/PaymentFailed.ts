import { DomainError } from 'src/shared/domain/DomainError'

export class PaymentFailed extends DomainError {
  constructor(id: string) {
    super(`Payment failed for order ${id}`)
  }
}
