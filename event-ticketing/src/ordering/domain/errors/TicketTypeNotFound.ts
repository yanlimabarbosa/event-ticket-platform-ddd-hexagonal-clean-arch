import { NotFoundError } from 'src/shared/domain/errors/NotFoundError'

export class TicketTypeNotFound extends NotFoundError {
  public constructor(ticketTypeId: string) {
    super(`Ticket ${ticketTypeId} not found`)
  }
}
