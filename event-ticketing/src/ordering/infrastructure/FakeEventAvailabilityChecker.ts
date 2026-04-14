import { Injectable } from '@nestjs/common'
import { EventAvailabilityChecker } from '../domain/ports/EventAvailabilityChecker'

@Injectable()
export class FakeEventAvailabilityChecker extends EventAvailabilityChecker {
  private readonly eventsOpenForSales: Map<string, boolean>
  private readonly ticketInventory: Map<string, number>

  public constructor() {
    super()
    this.eventsOpenForSales = new Map<string, boolean>([
      ['evt-rock-festival', true],
      ['evt-closed-concert', false],
    ])
    this.ticketInventory = new Map<string, number>([
      ['ticket-vip', 10],
      ['ticket-general', 100],
      ['ticket-sold-out', 0],
    ])
  }

  public override async isEventOpenForSales(eventId: string): Promise<boolean> {
    return this.eventsOpenForSales.get(eventId) ?? false
  }

  public override async hasEnoughTickets(
    ticketTypeId: string,
    quantity: number,
  ): Promise<boolean> {
    const available = this.ticketInventory.get(ticketTypeId) ?? 0
    return available >= quantity
  }
}
