import { Injectable, NotFoundException } from '@nestjs/common'
import type { OrderRepository } from '../domain/ports/OrderRepository'

@Injectable()
export class ExpireOrderUseCase {
  public constructor(private readonly orderRepository: OrderRepository) {}

  public async execute(orderId: string): Promise<void> {
    const order = await this.orderRepository.findById(orderId)

    if (!order) {
      throw new NotFoundException()
    }

    order.expire()

    await this.orderRepository.save(order)
  }
}
