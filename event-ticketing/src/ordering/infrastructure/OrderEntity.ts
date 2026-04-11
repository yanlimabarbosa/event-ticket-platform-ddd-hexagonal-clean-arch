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
  @PrimaryKey()
  id!: string

  @Property({ columnType: 'decimal' })
  total!: number

  @Property()
  event_id!: string

  @Property()
  attendee_id!: string

  @Enum(() => OrderStatusEnum)
  status!: OrderStatusEnum

  @Property()
  created_at!: Date

  @Property({ nullable: true })
  paid_at?: Date

  @Property({ nullable: true })
  cancelled_at?: Date

  @Property({ nullable: true })
  cancel_reason?: string

  @Property()
  expires_at!: Date

  @OneToMany(() => OrderItemEntity, (item) => item.order)
  items = new Collection<OrderItemEntity>(this)
}
