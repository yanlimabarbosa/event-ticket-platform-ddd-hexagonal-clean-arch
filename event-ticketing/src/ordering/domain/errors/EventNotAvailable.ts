import { ConflictError } from 'src/shared/domain/errors/ConflictError'

export class EventNotAvailable extends ConflictError {
  public constructor(eventId: string) {
    super(`The event ${eventId} is not available`)
  }
}
