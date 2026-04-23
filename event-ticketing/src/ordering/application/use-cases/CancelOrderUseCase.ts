import { Injectable } from '@nestjs/common'
import { Clock } from '../../../shared/application/ports/out/Clock'
import { UnitOfWork } from '../../../shared/application/ports/out/UnitOfWork'
import { Order } from '../../domain/entities/Order'
import { OrderNotFound } from '../../domain/errors/OrderNotFound'
import { DomainEventPublisher } from '../ports/out/DomainEventPublisher'
import { OrderRepository } from '../ports/out/OrderRepository'

@Injectable()
export class CancelOrderUseCase {
  public constructor(
    private readonly orderRepository: OrderRepository,
    private readonly clock: Clock,
    private readonly domainEventPublisher: DomainEventPublisher,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  public async execute(orderId: string, cancelReason: string | null): Promise<Order> {
    const order = await this.orderRepository.findById(orderId)

    if (!order) {
      throw new OrderNotFound(orderId)
    }

    order.cancel(cancelReason, this.clock.now())

    await this.unitOfWork.run(async () => {
      await this.orderRepository.save(order)
      await this.domainEventPublisher.publish(order.pullDomainEvents())
    })

    return order
  }
}
