import { Injectable } from '@nestjs/common'
import { EventNotAvailable } from '../domain/errors/EventNotAvailable'
import { InsufficientTickets } from '../domain/errors/InsufficientTickets'
import { Money } from '../domain/model/Money'
import { Order } from '../domain/model/Order'
import { OrderItem } from '../domain/model/OrderItem'
import { Quantity } from '../domain/model/Quantity'
import { Clock } from '../domain/ports/Clock'
import { EventAvailabilityChecker } from '../domain/ports/EventAvailabilityChecker'
import { IdGenerator } from '../domain/ports/IdGenerator'
import { OrderRepository } from '../domain/ports/OrderRepository'

interface CreateOrderItem {
  ticketTypeId: string
  quantity: number
  unitPrice: number
}

@Injectable()
export class CreateOrderUseCase {
  public constructor(
    private readonly orderRepository: OrderRepository,
    private readonly availabilityChecker: EventAvailabilityChecker,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
  ) {}

  public async execute(
    eventId: string,
    attendeeId: string,
    items: CreateOrderItem[],
  ): Promise<Order> {
    const isEventOpenForSales = await this.availabilityChecker.isEventOpenForSales(eventId)
    if (!isEventOpenForSales) throw new EventNotAvailable(eventId)

    for (const item of items) {
      const isAvailable = await this.availabilityChecker.hasEnoughTickets(
        item.ticketTypeId,
        item.quantity,
      )

      if (!isAvailable) {
        throw new InsufficientTickets(item.ticketTypeId)
      }
    }

    const orderItems = items.map((item) => {
      return new OrderItem(
        this.idGenerator.generate(),
        item.ticketTypeId,
        Quantity.create(item.quantity),
        Money.create(item.unitPrice),
      )
    })

    const order = Order.create(
      this.idGenerator.generate(),
      eventId,
      attendeeId,
      orderItems,
      this.clock.now(),
    )

    await this.orderRepository.save(order)

    return order
  }
}
