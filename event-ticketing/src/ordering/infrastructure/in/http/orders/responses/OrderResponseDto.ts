export class OrderItemResponseDto {
  public constructor(
    public readonly id: string,
    public readonly ticketTypeId: string,
    public readonly quantity: number,
    public readonly unitPrice: number,
  ) {}
}

export class OrderResponseDto {
  public constructor(
    public readonly id: string,
    public readonly eventId: string,
    public readonly attendeeId: string,
    public readonly status: string,
    public readonly total: number,
    public readonly items: OrderItemResponseDto[],
    public readonly createdAt: string,
    public readonly expiresAt: string,
    public readonly paidAt: string | null,
    public readonly cancelledAt: string | null,
    public readonly cancelReason: string | null,
  ) {}
}
