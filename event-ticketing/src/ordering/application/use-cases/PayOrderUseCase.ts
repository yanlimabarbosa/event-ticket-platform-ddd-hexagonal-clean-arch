import { Injectable } from '@nestjs/common'
import { Clock } from '../../../shared/application/ports/out/Clock'
import { UnitOfWork } from '../../../shared/application/ports/out/UnitOfWork'
import { Order } from '../../domain/entities/Order'
import { OrderNotFound } from '../../domain/errors/OrderNotFound'
import { PaymentFailed } from '../../domain/errors/PaymentFailed'
import { DomainEventPublisher } from '../ports/out/DomainEventPublisher'
import { OrderRepository } from '../ports/out/OrderRepository'
import { PaymentGateway, PaymentMethod } from '../ports/out/PaymentGateway'

@Injectable()
export class PayOrderUseCase {
  public constructor(
    private readonly orderRepository: OrderRepository,
    private readonly paymentGateway: PaymentGateway,
    private readonly clock: Clock,
    private readonly domainEventPublisher: DomainEventPublisher,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  public async execute(
    orderId: string,
    paymentToken: string,
    paymentMethod: PaymentMethod,
  ): Promise<Order> {
    const order = await this.orderRepository.findById(orderId)

    if (!order) {
      throw new OrderNotFound(orderId)
    }

    const paymentCharge = await this.paymentGateway.charge(
      orderId,
      order.getTotal().getValue(),
      paymentToken,
      paymentMethod,
    )

    if (!paymentCharge) {
      throw new PaymentFailed(orderId)
    }

    order.pay(this.clock.now())

    await this.unitOfWork.run(async () => {
      await this.orderRepository.save(order)
      await this.domainEventPublisher.publish(order.pullDomainEvents())
    })

    return order
  }
}
