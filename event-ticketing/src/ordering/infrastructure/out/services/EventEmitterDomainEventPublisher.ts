import { Injectable, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { DomainEvent } from '../../../../shared/domain/base/DomainEvent'
import { DomainEventPublisher } from '../../../application/ports/out/DomainEventPublisher'

@Injectable()
export class EventEmitterDomainEventPublisher extends DomainEventPublisher {
  private readonly logger = new Logger(EventEmitterDomainEventPublisher.name)

  public constructor(private readonly eventEmitter: EventEmitter2) {
    super()
  }

  public override async publish(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      const eventName = event.constructor.name
      this.logger.log(`Publishing: ${eventName}`)
      this.eventEmitter.emit(eventName, event)
    }
  }
}
