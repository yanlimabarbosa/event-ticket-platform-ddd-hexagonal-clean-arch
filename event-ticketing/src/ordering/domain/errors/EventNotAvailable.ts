import { DomainError } from 'src/shared/domain/DomainError'

export class EventNotAvailable extends DomainError {
  public constructor(eventId: string) {
    super(`The event ${eventId} is not available`)
  }
}
