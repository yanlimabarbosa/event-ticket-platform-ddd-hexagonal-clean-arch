import { Injectable } from '@nestjs/common'
import { OrderNotFound } from '../domain/errors/OrderNotFound'
import { Order } from '../domain/model/Order'
import { Clock } from '../domain/ports/Clock'
import { OrderRepository } from '../domain/ports/OrderRepository'

@Injectable()
export class CancelOrderUseCase {
  public constructor(
    private readonly orderRepository: OrderRepository,
    private readonly clock: Clock,
  ) {}

  public async execute(orderId: string, cancelReason: string | null): Promise<Order> {
    const order = await this.orderRepository.findById(orderId)

    if (!order) {
      throw new OrderNotFound(orderId)
    }

    order.cancel(cancelReason, this.clock.now())

    await this.orderRepository.save(order)

    return order
  }
}
