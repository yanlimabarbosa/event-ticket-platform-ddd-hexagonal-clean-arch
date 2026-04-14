import type { Order } from '../../../domain/model/Order'

export interface OrderItemResponseDto {
  id: string
  ticketTypeId: string
  quantity: number
  unitPrice: number
}

export interface OrderResponseDto {
  id: string
  eventId: string
  attendeeId: string
  status: string
  total: number
  items: OrderItemResponseDto[]
  createdAt: string
  expiresAt: string
  paidAt: string | null
  cancelledAt: string | null
  cancelReason: string | null
}

export function toOrderResponseDto(order: Order): OrderResponseDto {
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
