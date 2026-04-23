import { MikroOrmModule } from '@mikro-orm/nestjs'
import { Module } from '@nestjs/common'
import { DomainEventPublisher } from './application/ports/out/DomainEventPublisher'
import { EventAvailabilityChecker } from './application/ports/out/EventAvailabilityChecker'
import { OrderRepository } from './application/ports/out/OrderRepository'
import { PaymentGateway } from './application/ports/out/PaymentGateway'
import { TicketTypePricing } from './application/ports/out/TicketTypePricing'
import { CancelOrderUseCase } from './application/use-cases/CancelOrderUseCase'
import { CreateOrderUseCase } from './application/use-cases/CreateOrderUseCase'
import { ExpireOrderUseCase } from './application/use-cases/ExpireOrderUseCase'
import { ListAttendeeOrdersUseCase } from './application/use-cases/ListAttendeeOrdersUseCase'
import { PayOrderUseCase } from './application/use-cases/PayOrderUseCase'
import { OrderResponseMapper } from './infrastructure/in/http/orders/mappers/OrderResponseMapper'
import { OrdersController } from './infrastructure/in/http/orders/OrdersController'
import { OrderEventLogger } from './infrastructure/in/listeners/OrderEventLogger'
import { OrderEntity } from './infrastructure/out/persistence/entities/OrderEntity'
import { OrderItemEntity } from './infrastructure/out/persistence/entities/OrderItemEntity'
import { OutboxEventEntity } from './infrastructure/out/persistence/entities/OutboxEventEntity'
import { OrderMapper } from './infrastructure/out/persistence/mappers/OrderMapper'
import { MikroOrmOrderRepository } from './infrastructure/out/persistence/repositories/MikroOrmOrderRepository'
import { FakeEventAvailabilityChecker } from './infrastructure/out/services/FakeEventAvailabilityChecker'
import { FakePaymentGateway } from './infrastructure/out/services/FakePaymentGateway'
import { FakeTicketTypePricing } from './infrastructure/out/services/FakeTicketTypePricing'
import { OutboxDomainEventPublisher } from './infrastructure/out/services/OutboxDomainEventPublisher'

@Module({
  imports: [MikroOrmModule.forFeature([OrderEntity, OrderItemEntity, OutboxEventEntity])],
  controllers: [OrdersController],
  providers: [
    CreateOrderUseCase,
    PayOrderUseCase,
    CancelOrderUseCase,
    ExpireOrderUseCase,
    ListAttendeeOrdersUseCase,
    OrderMapper,
    OrderResponseMapper,
    OrderEventLogger,
    { provide: OrderRepository, useClass: MikroOrmOrderRepository },
    { provide: PaymentGateway, useClass: FakePaymentGateway },
    { provide: EventAvailabilityChecker, useClass: FakeEventAvailabilityChecker },
    { provide: DomainEventPublisher, useClass: OutboxDomainEventPublisher },
    { provide: TicketTypePricing, useClass: FakeTicketTypePricing },
  ],
})
export class OrderingModule {}
