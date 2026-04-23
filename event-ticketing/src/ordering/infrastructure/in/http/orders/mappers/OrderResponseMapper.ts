import { Injectable } from '@nestjs/common'
import type { Order } from '../../../../../domain/entities/Order'
import { OrderResponseDto } from '../responses/OrderResponseDto'

@Injectable()
export class OrderResponseMapper {
  public toResponse(order: Order): OrderResponseDto {
    return {
      id: order.id,
      eventId: order.getEventId(),
      attendeeId: order.getAttendeeId(),
      status: order.getStatus().getValue(),
      total: order.getTotal().getValue(),
      items: order.getItems().map((item) => ({
        id: item.id,
        ticketTypeId: item.getTicketTypeId(),
        quantity: item.getQuantity().getValue(),
        unitPrice: item.getUnitPrice().getValue(),
      })),
      createdAt: order.getCreatedAt().toISOString(),
      expiresAt: order.getExpiresAt().toISOString(),
      paidAt: order.getPaidAt()?.toISOString() ?? null,
      cancelledAt: order.getCancelledAt()?.toISOString() ?? null,
      cancelReason: order.getCancelReason(),
    }
  }
}
