import { ConflictError } from 'src/shared/domain/errors/ConflictError'
import type { OrderStatusType } from '../value-objects/OrderStatus'

export class InvalidOrderTransition extends ConflictError {
  public constructor(currentStatus: OrderStatusType, attemptedStatus: OrderStatusType) {
    super(`Cannot transition from ${currentStatus} to ${attemptedStatus}`)
  }
}
