import type { RequiredEntityData } from '@mikro-orm/core'
import { Money } from '../domain/model/Money'
import { Order } from '../domain/model/Order'
import { OrderItem } from '../domain/model/OrderItem'
import { OrderStatus } from '../domain/model/OrderStatus'
import { Quantity } from '../domain/model/Quantity'
import type { OrderEntity } from './OrderEntity'
import { OrderStatusEnum } from './OrderEntity'

const enumToDomain: Record<OrderStatusEnum, OrderStatus> = {
  [OrderStatusEnum.RESERVED]: OrderStatus.reserved(),
  [OrderStatusEnum.PAID]: OrderStatus.paid(),
  [OrderStatusEnum.EXPIRED]: OrderStatus.expired(),
  [OrderStatusEnum.CANCELLED]: OrderStatus.cancelled(),
}

const domainToEnum: Record<string, OrderStatusEnum> = {
  reserved: OrderStatusEnum.RESERVED,
  paid: OrderStatusEnum.PAID,
  expired: OrderStatusEnum.EXPIRED,
  cancelled: OrderStatusEnum.CANCELLED,
}

// biome-ignore lint/complexity/noStaticOnlyClass: Mapper pattern
export class OrderMapper {
  public static toDomain(entity: OrderEntity): Order {
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
      enumToDomain[entity.status],
      entity.created_at,
      entity.expires_at,
      entity.paid_at ?? null,
      entity.cancelled_at ?? null,
      entity.cancel_reason ?? null,
    )
  }

  public static toPersistence(order: Order): RequiredEntityData<OrderEntity> {
    return {
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
    }
  }

  public static applyStateChanges(entity: OrderEntity, order: Order): void {
    entity.status = domainToEnum[order.getStatus().getValue()]
    entity.total = order.getTotal().getValue()
    entity.paid_at = order.getPaidAt()
    entity.cancelled_at = order.getCancelledAt()
    entity.cancel_reason = order.getCancelReason()
  }
}
