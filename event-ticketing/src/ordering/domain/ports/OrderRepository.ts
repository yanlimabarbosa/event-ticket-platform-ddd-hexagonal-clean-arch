import type { Order } from '../model/Order'

export interface OrderRepository {
  save(order: Order): Promise<void>
  findById(id: string): Promise<Order | null>
  findByAttendeeId(attendeeId: string): Promise<Order[]>
}
