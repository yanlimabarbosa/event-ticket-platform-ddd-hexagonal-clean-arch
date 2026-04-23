import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy'

@Entity({ tableName: 'outbox_events' })
export class OutboxEventEntity {
  @PrimaryKey({ type: 'string' })
  public id!: string

  @Property({ type: 'string' })
  public eventType!: string

  @Property({ type: 'jsonb' })
  public payload!: Record<string, unknown>

  @Property({ type: 'boolean', default: false })
  public processed: boolean = false

  @Property({ type: 'timestamptz' })
  public createdAt: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  public processedAt?: Date | null

  @Property({ type: 'integer', default: 0 })
  public retryCount: number = 0

  @Property({ type: 'string', nullable: true })
  public lastError?: string | null
}
