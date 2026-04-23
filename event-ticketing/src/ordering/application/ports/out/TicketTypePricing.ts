export abstract class TicketTypePricing {
  public abstract getPrice(ticketTypeId: string): Promise<number>
}
