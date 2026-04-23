import { Injectable, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { OrderCancelled } from 'src/ordering/domain/events/OrderCancelled'
import { OrderCreated } from 'src/ordering/domain/events/OrderCreated'
import { OrderExpired } from 'src/ordering/domain/events/OrderExpired'
import { OrderPaid } from '../../../domain/events/OrderPaid'

@Injectable()
export class OrderEventLogger {
  private readonly logger = new Logger(OrderEventLogger.name)

  @OnEvent('OrderPaid')
  public onOrderPaid(event: OrderPaid): void {
    this.logger.log(`========================================`)
    this.logger.log(`EVENT RECEIVED: OrderPaid`)
    this.logger.log(`  Order ID:    ${event.orderId}`)
    this.logger.log(`  Attendee:    ${event.attendeeId}`)
    this.logger.log(`  Event ID:    ${event.eventId}`)
    this.logger.log(`  Items:       ${JSON.stringify(event.items)}`)
    this.logger.log(`  Occurred at: ${event.occurredOn.toISOString()}`)
    this.logger.log(`========================================`)
  }

  @OnEvent('OrderCreated')
  public onOrderCreated(event: OrderCreated): void {
    this.logger.log(`========================================`)
    this.logger.log(`EVENT RECEIVED: OrderCreated`)
    this.logger.log(`  Order ID:    ${event.orderId}`)
    this.logger.log(`  Ocurred On:    ${event.occurredOn}`)
    this.logger.log(`  Expires At:    ${event.expiresAt}`)
    this.logger.log(`========================================`)
  }

  @OnEvent('OrderCancelled')
  public onOrderCancelled(event: OrderCancelled): void {
    this.logger.log(`========================================`)
    this.logger.log(`EVENT RECEIVED: OrderCancelled`)
    this.logger.log(`  Order ID:    ${event.orderId}`)
    this.logger.log(`  Attendee ID:    ${event.attendeeId}`)
    this.logger.log(`  Reason:    ${event.reason}`)
    this.logger.log(`  OcurredOn:    ${event.occurredOn}`)
    this.logger.log(`========================================`)
  }

  @OnEvent('OrderExpired')
  public onOrderExpired(event: OrderExpired): void {
    this.logger.log(`========================================`)
    this.logger.log(`EVENT RECEIVED: OrderExpired`)
    this.logger.log(`  Order ID:    ${event.orderId}`)
    this.logger.log(`  Attendee ID:    ${event.attendeeId}`)
    this.logger.log(`  Ocurred On:    ${event.occurredOn}`)
    this.logger.log(`========================================`)
  }
}
