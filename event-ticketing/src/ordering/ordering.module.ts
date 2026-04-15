import { MikroOrmModule } from '@mikro-orm/nestjs'
import { Module } from '@nestjs/common'
import { CancelOrderUseCase } from './application/use-cases/CancelOrderUseCase'
import { CreateOrderUseCase } from './application/use-cases/CreateOrderUseCase'
import { ExpireOrderUseCase } from './application/use-cases/ExpireOrderUseCase'
import { ListAttendeeOrdersUseCase } from './application/use-cases/ListAttendeeOrdersUseCase'
import { PayOrderUseCase } from './application/use-cases/PayOrderUseCase'
import { Clock } from './application/ports/out/Clock'
import { EventAvailabilityChecker } from './application/ports/out/EventAvailabilityChecker'
import { IdGenerator } from './application/ports/out/IdGenerator'
import { OrderRepository } from './application/ports/out/OrderRepository'
import { PaymentGateway } from './application/ports/out/PaymentGateway'
import { CryptoIdGenerator } from './infrastructure/out/services/CryptoIdGenerator'
import { FakeEventAvailabilityChecker } from './infrastructure/out/services/FakeEventAvailabilityChecker'
import { FakePaymentGateway } from './infrastructure/out/services/FakePaymentGateway'
import { SystemClock } from './infrastructure/out/services/SystemClock'
import { OrdersController } from './infrastructure/in/http/orders/OrdersController'
import { OrderResponseMapper } from './infrastructure/in/http/orders/mappers/OrderResponseMapper'
import { OrderEntity } from './infrastructure/out/persistence/entities/OrderEntity'
import { OrderItemEntity } from './infrastructure/out/persistence/entities/OrderItemEntity'
import { OrderMapper } from './infrastructure/out/persistence/mappers/OrderMapper'
import { MikroOrmOrderRepository } from './infrastructure/out/persistence/repositories/MikroOrmOrderRepository'

@Module({
  imports: [MikroOrmModule.forFeature([OrderEntity, OrderItemEntity])],
  controllers: [OrdersController],
  providers: [
    CreateOrderUseCase,
    PayOrderUseCase,
    CancelOrderUseCase,
    ExpireOrderUseCase,
    ListAttendeeOrdersUseCase,
    OrderMapper,
    OrderResponseMapper,
    { provide: OrderRepository, useClass: MikroOrmOrderRepository },
    { provide: IdGenerator, useClass: CryptoIdGenerator },
    { provide: Clock, useClass: SystemClock },
    { provide: PaymentGateway, useClass: FakePaymentGateway },
    { provide: EventAvailabilityChecker, useClass: FakeEventAvailabilityChecker },
  ],
})
export class OrderingModule {}
