import { Injectable } from '@nestjs/common'
import type { Order } from '../domain/model/Order'
import { OrderRepository } from '../domain/ports/OrderRepository'

@Injectable()
export class ListAttendeeOrdersUseCase {
  public constructor(private readonly orderRepository: OrderRepository) {}

  public async execute(attendeeId: string): Promise<Order[]> {
    return this.orderRepository.findByAttendeeId(attendeeId)
  }
}
