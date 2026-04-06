import { Injectable, NotFoundException } from '@nestjs/common'
import { PaymentFailed } from '../domain/errors/PaymentFailed'
import type { OrderRepository } from '../domain/ports/OrderRepository'
import type { PaymentGateway, PaymentMethod } from '../domain/ports/PaymentGateway'

@Injectable()
export class PayOrderUseCase {
  public constructor(
    private readonly orderRepository: OrderRepository,
    private readonly paymentGateway: PaymentGateway,
  ) {}

  public async execute(
    orderId: string,
    paymentToken: string,
    paymentMethod: PaymentMethod,
  ): Promise<void> {
    const order = await this.orderRepository.findById(orderId)

    if (!order) {
      throw new NotFoundException()
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

    order.pay()

    await this.orderRepository.save(order)
  }
}
