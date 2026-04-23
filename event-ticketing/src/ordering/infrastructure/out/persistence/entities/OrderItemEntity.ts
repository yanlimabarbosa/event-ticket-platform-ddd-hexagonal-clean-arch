import type { Ref } from '@mikro-orm/core'
import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy'
import { OrderEntity } from './OrderEntity'

@Entity({ tableName: 'order_items' })
export class OrderItemEntity {
  @PrimaryKey({ type: 'string' })
  public id!: string

  @ManyToOne(() => OrderEntity)
  public order!: Ref<OrderEntity>

  @Property({ type: 'integer' })
  public quantity!: number

  @Property({ type: 'integer' })
  public unit_price!: number

  @Property({ type: 'string' })
  public ticket_type_id!: string
}
