import { Money } from '../domain/model/Money'
import { Order } from '../domain/model/Order'
import { OrderItem } from '../domain/model/OrderItem'
import { OrderStatus } from '../domain/model/OrderStatus'
import { Quantity } from '../domain/model/Quantity'
import { OrderEntity, OrderStatusEnum } from './OrderEntity'

const statusMap: Record<OrderStatusEnum, OrderStatus> = {
  [OrderStatusEnum.RESERVED]: OrderStatus.reserved(),
  [OrderStatusEnum.PAID]: OrderStatus.paid(),
  [OrderStatusEnum.EXPIRED]: OrderStatus.expired(),
  [OrderStatusEnum.CANCELLED]: OrderStatus.cancelled(),
}

// biome-ignore lint/complexity/noStaticOnlyClass: Mapper pattern
export class OrderMapper {
  static toDomain(entity: OrderEntity): Order {
    const items = entity.items
      .getItems()
      .map(
        (itemEntity) =>
          new OrderItem(
            itemEntity.id,
            itemEntity.ticket_type_id,
            Quantity.create(itemEntity.quantity),
            Money.create(itemEntity.unit_price),
          ),
      )

    return new Order(
      entity.id,
      entity.event_id,
      entity.attendee_id,
      items,
      statusMap[entity.status],
      entity.created_at,
      entity.expires_at,
      entity.paid_at ?? null,
      entity.cancelled_at ?? null,
      entity.cancel_reason ?? null,
    )
  }
}
