import type { DomainEvent } from './DomainEvent'
import { Entity } from './Entity'

export abstract class AggregateRoot extends Entity {
  private domainEvents: DomainEvent[] = []

  protected addDomainEvent(domainEvent: DomainEvent) {
    this.domainEvents.push(domainEvent)
  }

  public pullDomainEvents() {
    const domainEvents = [...this.domainEvents]
    this.domainEvents = []
    return domainEvents
  }
}
