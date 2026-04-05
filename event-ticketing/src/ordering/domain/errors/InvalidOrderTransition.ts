import { DomainError } from 'src/shared/domain/DomainError'
import type { OrderStatusType } from '../model/OrderStatus'

export class InvalidOrderTransition extends DomainError {
  public constructor(currentStatus: OrderStatusType, attemptedStatus: OrderStatusType) {
    super(`Cannot transition from ${currentStatus} to ${attemptedStatus}`)
  }
}
