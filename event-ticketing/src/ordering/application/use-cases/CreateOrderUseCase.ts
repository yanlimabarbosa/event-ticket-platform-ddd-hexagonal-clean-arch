import { Injectable } from '@nestjs/common'
import { EventNotAvailable } from '../../domain/errors/EventNotAvailable'
import { InsufficientTickets } from '../../domain/errors/InsufficientTickets'
import { Order } from '../../domain/entities/Order'
import { OrderItem } from '../../domain/entities/OrderItem'
import { Money } from '../../domain/value-objects/Money'
import { Quantity } from '../../domain/value-objects/Quantity'
import { Clock } from '../ports/out/Clock'
import { EventAvailabilityChecker } from '../ports/out/EventAvailabilityChecker'
import { IdGenerator } from '../ports/out/IdGenerator'
import { OrderRepository } from '../ports/out/OrderRepository'

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
