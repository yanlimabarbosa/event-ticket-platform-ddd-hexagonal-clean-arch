import type { EntityManager } from '@mikro-orm/postgresql'
import { Injectable } from '@nestjs/common'
import type { Order } from '../domain/model/Order'
import { OrderRepository } from '../domain/ports/OrderRepository'
import { OrderEntity } from './OrderEntity'
import { OrderMapper } from './OrderMapper'

@Injectable()
export class MikroOrmOrderRepository extends OrderRepository {
  public constructor(private readonly em: EntityManager) {
    super()
  }

  public override async save(order: Order): Promise<void> {
    const existing = await this.em.findOne(OrderEntity, { id: order.id })

    if (existing) {
      OrderMapper.applyStateChanges(existing, order)
    } else {
      this.em.create(OrderEntity, OrderMapper.toPersistence(order))
    }

    await this.em.flush()
  }

  public override async findById(id: string): Promise<Order | null> {
    const order = await this.em.findOne(OrderEntity, { id }, { populate: ['items'] })

    if (!order) {
      return null
    }

    return OrderMapper.toDomain(order)
  }

  public override async findByAttendeeId(attendeeId: string): Promise<Order[]> {
    const orders = await this.em.find(
      OrderEntity,
      { attendee_id: attendeeId },
      { populate: ['items'] },
    )

    return orders.map((entity) => OrderMapper.toDomain(entity))
  }
}
