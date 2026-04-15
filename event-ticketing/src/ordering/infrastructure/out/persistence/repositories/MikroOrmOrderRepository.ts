import { EntityManager } from '@mikro-orm/postgresql'
import { Injectable } from '@nestjs/common'
import type { Order } from '../../../../domain/entities/Order'
import { OrderRepository } from '../../../../application/ports/out/OrderRepository'
import { OrderEntity } from '../entities/OrderEntity'
import { OrderMapper } from '../mappers/OrderMapper'

@Injectable()
export class MikroOrmOrderRepository extends OrderRepository {
  public constructor(
    private readonly em: EntityManager,
    private readonly mapper: OrderMapper,
  ) {
    super()
  }

  public override async save(order: Order): Promise<void> {
    await this.em.transactional(async (em) => {
      const existing = await em.findOne(OrderEntity, { id: order.id })

      if (existing) {
        this.mapper.applyStateChanges(existing, order)
      } else {
        em.create(OrderEntity, this.mapper.toPersistence(order))
      }
    })
  }

  public override async findById(id: string): Promise<Order | null> {
    const order = await this.em.findOne(OrderEntity, { id }, { populate: ['items'] })

    if (!order) {
      return null
    }

    return this.mapper.toDomain(order)
  }

  public override async findByAttendeeId(attendeeId: string): Promise<Order[]> {
    const orders = await this.em.find(
      OrderEntity,
      { attendee_id: attendeeId },
      { populate: ['items'] },
    )

    return orders.map((entity) => this.mapper.toDomain(entity))
  }
}
