import type { Order } from '../../../domain/entities/Order'

export abstract class OrderRepository {
  public abstract save(order: Order): Promise<void>
  public abstract findById(id: string): Promise<Order | null>
  public abstract findByAttendeeId(attendeeId: string): Promise<Order[]>
}
