export interface EventAvailabilityChecker {
  isEventOpenForSales(eventId: string): Promise<boolean>
  hasEnoughTickets(ticketTypeId: string, quantity: number): Promise<boolean>
}
