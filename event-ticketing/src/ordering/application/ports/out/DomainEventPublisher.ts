import { DomainEvent } from '../../../../shared/domain/base/DomainEvent'

export abstract class DomainEventPublisher {
  public abstract publish(events: DomainEvent[]): Promise<void>
}
