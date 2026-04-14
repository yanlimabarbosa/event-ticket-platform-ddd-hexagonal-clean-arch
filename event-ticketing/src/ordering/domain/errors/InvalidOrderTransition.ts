import { ConflictError } from 'src/shared/domain/ConflictError'
import type { OrderStatusType } from '../model/OrderStatus'

export class InvalidOrderTransition extends ConflictError {
  public constructor(currentStatus: OrderStatusType, attemptedStatus: OrderStatusType) {
    super(`Cannot transition from ${currentStatus} to ${attemptedStatus}`)
  }
}
