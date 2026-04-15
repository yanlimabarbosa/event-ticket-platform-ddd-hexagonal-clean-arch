import { Injectable } from '@nestjs/common'
import { OrderNotFound } from '../../domain/errors/OrderNotFound'
import { PaymentFailed } from '../../domain/errors/PaymentFailed'
import { Order } from '../../domain/entities/Order'
import { Clock } from '../ports/out/Clock'
import { OrderRepository } from '../ports/out/OrderRepository'
import { PaymentGateway, type PaymentMethod } from '../ports/out/PaymentGateway'

@Injectable()
export class PayOrderUseCase {
  public constructor(
    private readonly orderRepository: OrderRepository,
    private readonly paymentGateway: PaymentGateway,
    private readonly clock: Clock,
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

    await this.orderRepository.save(order)

    return order
  }
}
