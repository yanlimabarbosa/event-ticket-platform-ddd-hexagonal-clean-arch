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
