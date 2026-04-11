import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy'
import { OrderEntity } from './OrderEntity'

@Entity({ tableName: 'order_items' })
export class OrderItemEntity {
  @PrimaryKey()
  id!: string

  @ManyToOne(() => OrderEntity)
  order!: OrderEntity

  @Property()
  quantity!: number

  @Property({ columnType: 'decimal' })
  unit_price!: number

  @Property()
  ticket_type_id!: string
}
