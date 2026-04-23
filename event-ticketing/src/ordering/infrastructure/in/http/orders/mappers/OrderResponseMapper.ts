import { Injectable } from '@nestjs/common'
import type { Order } from '../../../../../domain/entities/Order'
import { OrderItemResponseDto, OrderResponseDto } from '../responses/OrderResponseDto'

@Injectable()
export class OrderResponseMapper {
  public toResponse(order: Order): OrderResponseDto {
    return new OrderResponseDto(
      order.id,
      order.getEventId(),
      order.getAttendeeId(),
      order.getStatus().getValue(),
      order.getTotal().getValue(),
      order.getItems().map(
        (item) =>
          new OrderItemResponseDto(
            item.id,
            item.getTicketTypeId(),
            item.getQuantity().getValue(),
            item.getUnitPrice().getValue(),
          ),
      ),
      order.getCreatedAt().toISOString(),
      order.getExpiresAt().toISOString(),
      order.getPaidAt()?.toISOString() ?? null,
      order.getCancelledAt()?.toISOString() ?? null,
      order.getCancelReason(),
    )
  }
}
