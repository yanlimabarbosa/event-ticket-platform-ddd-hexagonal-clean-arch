import { DomainError } from 'src/shared/domain/DomainError'

export class EventNotAvailable extends DomainError {
  constructor(eventId: string) {
    super(`The event ${eventId} is not available`)
  }
}
