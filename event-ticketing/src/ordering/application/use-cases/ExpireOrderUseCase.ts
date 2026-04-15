import { Injectable } from '@nestjs/common'
import { OrderNotFound } from '../../domain/errors/OrderNotFound'
import { OrderRepository } from '../ports/out/OrderRepository'

@Injectable()
export class ExpireOrderUseCase {
  public constructor(private readonly orderRepository: OrderRepository) {}

  public async execute(orderId: string): Promise<void> {
    const order = await this.orderRepository.findById(orderId)

    if (!order) {
      throw new OrderNotFound(orderId)
    }

    order.expire()

    await this.orderRepository.save(order)
  }
}
