export abstract class DomainEvent {
  readonly occurredOn: Date

  public constructor() {
    this.occurredOn = new Date()
  }
}
