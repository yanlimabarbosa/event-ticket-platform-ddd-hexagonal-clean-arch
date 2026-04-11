import { Collection } from '@mikro-orm/core'
import { Entity, Enum, OneToMany, PrimaryKey, Property } from '@mikro-orm/decorators/legacy'
import { OrderItemEntity } from './OrderItemEntity'

export enum OrderStatusEnum {
  RESERVED = 'reserved',
  PAID = 'paid',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

@Entity({ tableName: 'orders' })
export class OrderEntity {
  @PrimaryKey({ type: 'string' })
  id!: string

  @Property({ type: 'decimal' })
  total!: number

  @Property({ type: 'string' })
  event_id!: string

  @Property({ type: 'string' })
  attendee_id!: string

  @Enum(() => OrderStatusEnum)
  status!: OrderStatusEnum

  @Property({ type: 'Date' })
  created_at!: Date

  @Property({ type: 'Date', nullable: true })
  paid_at?: Date

  @Property({ type: 'Date', nullable: true })
  cancelled_at?: Date

  @Property({ type: 'string', nullable: true })
  cancel_reason?: string

  @Property({ type: 'Date' })
  expires_at!: Date

  @OneToMany(() => OrderItemEntity, (item) => item.order)
  items = new Collection<OrderItemEntity>(this)
}
