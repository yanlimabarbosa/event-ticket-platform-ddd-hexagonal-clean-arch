import { Injectable } from '@nestjs/common'
import { UnitOfWork } from 'src/shared/application/ports/out/UnitOfWork'
import { OrderNotFound } from '../../domain/errors/OrderNotFound'
import { DomainEventPublisher } from '../ports/out/DomainEventPublisher'
import { OrderRepository } from '../ports/out/OrderRepository'

@Injectable()
export class ExpireOrderUseCase {
  public constructor(
    private readonly orderRepository: OrderRepository,
    private readonly domainEventPublisher: DomainEventPublisher,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  public async execute(orderId: string): Promise<void> {
    const order = await this.orderRepository.findById(orderId)

    if (!order) {
      throw new OrderNotFound(orderId)
    }

    order.expire()

    await this.unitOfWork.run(async () => {
      await this.orderRepository.save(order)
      await this.domainEventPublisher.publish(order.pullDomainEvents())
    })
  }
}
