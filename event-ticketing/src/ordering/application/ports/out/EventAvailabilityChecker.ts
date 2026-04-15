export abstract class EventAvailabilityChecker {
  public abstract isEventOpenForSales(eventId: string): Promise<boolean>
  public abstract hasEnoughTickets(ticketTypeId: string, quantity: number): Promise<boolean>
}
