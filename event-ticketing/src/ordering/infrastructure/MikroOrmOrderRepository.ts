import type { EntityManager } from '@mikro-orm/postgresql'
import { Injectable } from '@nestjs/common'
import type { Order } from '../domain/model/Order'
import type { OrderRepository } from '../domain/ports/OrderRepository'
import { OrderEntity, OrderStatusEnum } from './OrderEntity'
import { OrderMapper } from './OrderMapper'

const domainToEnum: Record<string, OrderStatusEnum> = {
  reserved: OrderStatusEnum.RESERVED,
  paid: OrderStatusEnum.PAID,
  expired: OrderStatusEnum.EXPIRED,
  cancelled: OrderStatusEnum.CANCELLED,
}

@Injectable()
export class MikroOrmOrderRepository implements OrderRepository {
  constructor(private readonly em: EntityManager) {}

  async save(order: Order): Promise<void> {
    const existing = await this.em.findOne(OrderEntity, { id: order.id })

    if (existing) {
      existing.status = domainToEnum[order.getStatus().getValue()]
      existing.paid_at = order.getPaidAt()
      existing.cancelled_at = order.getCancelledAt()
      existing.cancel_reason = order.getCancelReason()
      existing.total = order.getTotal().getValue()
    } else {
      this.em.create(OrderEntity, {
        id: order.id,
        event_id: order.getEventId(),
        attendee_id: order.getAttendeeId(),
        status: domainToEnum[order.getStatus().getValue()],
        total: order.getTotal().getValue(),
        created_at: order.getCreatedAt(),
        expires_at: order.getExpiresAt(),
        paid_at: order.getPaidAt(),
        cancelled_at: order.getCancelledAt(),
        cancel_reason: order.getCancelReason(),
        items: order.getItems().map((item) => ({
          id: item.id,
          ticket_type_id: item.getTicketTypeId(),
          quantity: item.getQuantity().getValue(),
          unit_price: item.getUnitPrice().getValue(),
        })),
      })
    }

    await this.em.flush()
  }

  async findById(id: string): Promise<Order | null> {
    const order = await this.em.findOne(OrderEntity, { id }, { populate: ['items'] })

    if (!order) {
      return null
    }

    return OrderMapper.toDomain(order)
  }

  async findByAttendeeId(attendeeId: string): Promise<Order[]> {
    const orders = await this.em.find(
      OrderEntity,
      { attendee_id: attendeeId },
      { populate: ['items'] },
    )

    return orders.map((entity) => OrderMapper.toDomain(entity))
  }
}
