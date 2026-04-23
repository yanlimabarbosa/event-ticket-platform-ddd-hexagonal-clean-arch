import { Injectable } from '@nestjs/common'
import { Clock } from '../../../shared/application/ports/out/Clock'
import { IdGenerator } from '../../../shared/application/ports/out/IdGenerator'
import { UnitOfWork } from '../../../shared/application/ports/out/UnitOfWork'
import { Order } from '../../domain/entities/Order'
import { OrderItem } from '../../domain/entities/OrderItem'
import { EventNotAvailable } from '../../domain/errors/EventNotAvailable'
import { InsufficientTickets } from '../../domain/errors/InsufficientTickets'
import { Money } from '../../domain/value-objects/Money'
import { Quantity } from '../../domain/value-objects/Quantity'
import { DomainEventPublisher } from '../ports/out/DomainEventPublisher'
import { EventAvailabilityChecker } from '../ports/out/EventAvailabilityChecker'
import { OrderRepository } from '../ports/out/OrderRepository'
import { TicketTypePricing } from '../ports/out/TicketTypePricing'

interface CreateOrderItem {
  ticketTypeId: string
  quantity: number
}

@Injectable()
export class CreateOrderUseCase {
  public constructor(
    private readonly orderRepository: OrderRepository,
    private readonly availabilityChecker: EventAvailabilityChecker,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
    private readonly domainEventPublisher: DomainEventPublisher,
    private readonly ticketTypePricing: TicketTypePricing,
    private readonly unitOfWork: UnitOfWork,
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

    const orderItems = await Promise.all(
      items.map(async (item) => {
        const price = await this.ticketTypePricing.getPrice(item.ticketTypeId)

        return new OrderItem(
          this.idGenerator.generate(),
          item.ticketTypeId,
          Quantity.create(item.quantity),
          Money.create(price),
        )
      }),
    )

    const order = Order.create(
      this.idGenerator.generate(),
      eventId,
      attendeeId,
      orderItems,
      this.clock.now(),
    )

    await this.unitOfWork.run(async () => {
      await this.orderRepository.save(order)
      await this.domainEventPublisher.publish(order.pullDomainEvents())
    })

    return order
  }
}
