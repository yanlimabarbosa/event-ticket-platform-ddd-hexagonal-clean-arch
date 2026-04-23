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
  public id!: string

  @Property({ type: 'integer' })
  public total!: number

  @Property({ type: 'string' })
  public event_id!: string

  @Property({ type: 'string' })
  public attendee_id!: string

  @Enum(() => OrderStatusEnum)
  public status!: OrderStatusEnum

  @Property({ type: 'timestamptz' })
  public created_at!: Date

  @Property({ type: 'timestamptz', nullable: true })
  public paid_at!: Date | null

  @Property({ type: 'timestamptz', nullable: true })
  public cancelled_at!: Date | null

  @Property({ type: 'string', nullable: true })
  public cancel_reason!: string | null

  @Property({ type: 'timestamptz' })
  public expires_at!: Date

  @Property({ version: true, type: 'integer' })
  public version!: number

  @OneToMany(
    () => OrderItemEntity,
    (item) => item.order,
  )
  public items = new Collection<OrderItemEntity>(this)
}
