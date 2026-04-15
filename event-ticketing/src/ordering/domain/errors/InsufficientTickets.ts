import { ConflictError } from 'src/shared/domain/errors/ConflictError'

export class InsufficientTickets extends ConflictError {
  public constructor(ticketTypeId: string) {
    super(`Ticket ${ticketTypeId} not available`)
  }
}
