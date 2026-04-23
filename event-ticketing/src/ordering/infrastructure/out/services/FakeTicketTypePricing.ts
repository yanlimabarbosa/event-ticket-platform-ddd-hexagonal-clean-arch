import { Injectable } from '@nestjs/common'
import { TicketTypePricing } from 'src/ordering/application/ports/out/TicketTypePricing'
import { TicketTypeNotFound } from 'src/ordering/domain/errors/TicketTypeNotFound'

@Injectable()
export class FakeTicketTypePricing extends TicketTypePricing {
  private readonly prices: Map<string, number>

  public constructor() {
    super()
    this.prices = new Map<string, number>([
      ['ticket-vip', 5000],
      ['ticket-general', 1000],
    ])
  }

  public override async getPrice(ticketTypeId: string): Promise<number> {
    const price = this.prices.get(ticketTypeId)
    if (price === undefined) {
      throw new TicketTypeNotFound(ticketTypeId)
    }
    return price
  }
}
