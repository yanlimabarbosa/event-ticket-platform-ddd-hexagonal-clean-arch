import { Injectable, NotFoundException } from '@nestjs/common'
import type { OrderRepository } from '../domain/ports/OrderRepository'

@Injectable()
export class CancelOrderUseCase {
  public constructor(private readonly orderRepository: OrderRepository) {}

  public async execute(orderId: string, cancelReason: string): Promise<void> {
    const order = await this.orderRepository.findById(orderId)

    if (!order) {
      throw new NotFoundException()
    }

    order.cancel(cancelReason)

    await this.orderRepository.save(order)
  }
}
