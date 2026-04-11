import type { Ref } from '@mikro-orm/core'
import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy'
import { OrderEntity } from './OrderEntity'

@Entity({ tableName: 'order_items' })
export class OrderItemEntity {
  @PrimaryKey({ type: 'string' })
  id!: string

  @ManyToOne(() => OrderEntity)
  order!: Ref<OrderEntity>

  @Property({ type: 'integer' })
  quantity!: number

  @Property({ type: 'decimal' })
  unit_price!: number

  @Property({ type: 'string' })
  ticket_type_id!: string
}
