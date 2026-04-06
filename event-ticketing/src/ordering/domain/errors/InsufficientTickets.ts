import { DomainError } from 'src/shared/domain/DomainError'

export class InsufficientTickets extends DomainError {
  public constructor(ticketTypeId: string) {
    super(`Ticket ${ticketTypeId} not available`)
  }
}
