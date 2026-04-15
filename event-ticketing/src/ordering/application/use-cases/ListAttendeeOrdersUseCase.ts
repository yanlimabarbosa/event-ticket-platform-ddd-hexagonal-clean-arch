import { Injectable } from '@nestjs/common'
import type { Order } from '../../domain/entities/Order'
import { OrderRepository } from '../ports/out/OrderRepository'

@Injectable()
export class ListAttendeeOrdersUseCase {
  public constructor(private readonly orderRepository: OrderRepository) {}

  public async execute(attendeeId: string): Promise<Order[]> {
    return this.orderRepository.findByAttendeeId(attendeeId)
  }
}
