import { EntityManager } from '@mikro-orm/core'
import { Injectable } from '@nestjs/common'
import { DomainEventPublisher } from 'src/ordering/application/ports/out/DomainEventPublisher'
import { IdGenerator } from 'src/shared/application/ports/out/IdGenerator'
import { DomainEvent } from 'src/shared/domain/base/DomainEvent'
import { OutboxEventEntity } from '../persistence/entities/OutboxEventEntity'

@Injectable()
export class OutboxDomainEventPublisher extends DomainEventPublisher {
  public constructor(
    private readonly em: EntityManager,
    private readonly idGenerator: IdGenerator,
  ) {
    super()
  }

  public override async publish(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      this.em.create(OutboxEventEntity, {
        id: this.idGenerator.generate(),
        eventType: event.constructor.name,
        payload: JSON.parse(JSON.stringify(event)),
        processed: false,
        processedAt: null,
        createdAt: new Date(),
        retryCount: 0,
      })
    }
  }
}
