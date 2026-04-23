import type { RequiredEntityData } from '@mikro-orm/core'
import { Injectable } from '@nestjs/common'
import { Order } from '../../../../domain/entities/Order'
import { OrderItem } from '../../../../domain/entities/OrderItem'
import { Money } from '../../../../domain/value-objects/Money'
import { OrderStatus } from '../../../../domain/value-objects/OrderStatus'
import { Quantity } from '../../../../domain/value-objects/Quantity'
import type { OrderEntity } from '../entities/OrderEntity'
import { OrderStatusEnum } from '../entities/OrderEntity'

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

@Injectable()
export class OrderMapper {
  public toDomain(entity: OrderEntity): Order {
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

  public toPersistence(order: Order): RequiredEntityData<OrderEntity> {
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
      version: 1,
      items: order.getItems().map((item) => ({
        id: item.id,
        ticket_type_id: item.getTicketTypeId(),
        quantity: item.getQuantity().getValue(),
        unit_price: item.getUnitPrice().getValue(),
      })),
    }
  }

  public applyStateChanges(entity: OrderEntity, order: Order): void {
    entity.status = domainToEnum[order.getStatus().getValue()]
    entity.total = order.getTotal().getValue()
    entity.paid_at = order.getPaidAt()
    entity.cancelled_at = order.getCancelledAt()
    entity.cancel_reason = order.getCancelReason()
  }
}
