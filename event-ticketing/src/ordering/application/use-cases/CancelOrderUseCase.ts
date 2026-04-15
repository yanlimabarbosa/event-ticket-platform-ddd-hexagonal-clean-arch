import { Injectable } from '@nestjs/common'
import { Order } from '../../domain/entities/Order'
import { OrderNotFound } from '../../domain/errors/OrderNotFound'
import { Clock } from '../ports/out/Clock'
import { OrderRepository } from '../ports/out/OrderRepository'

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
