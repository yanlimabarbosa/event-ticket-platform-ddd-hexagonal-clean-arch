import { MikroOrmModule } from '@mikro-orm/nestjs'
import { Module } from '@nestjs/common'
import { CancelOrderUseCase } from './application/CancelOrderUseCase'
import { CreateOrderUseCase } from './application/CreateOrderUseCase'
import { ExpireOrderUseCase } from './application/ExpireOrderUseCase'
import { PayOrderUseCase } from './application/PayOrderUseCase'
import { Clock } from './domain/ports/Clock'
import { EventAvailabilityChecker } from './domain/ports/EventAvailabilityChecker'
import { IdGenerator } from './domain/ports/IdGenerator'
import { OrderRepository } from './domain/ports/OrderRepository'
import { PaymentGateway } from './domain/ports/PaymentGateway'
import { CryptoIdGenerator } from './infrastructure/CryptoIdGenerator'
import { FakeEventAvailabilityChecker } from './infrastructure/FakeEventAvailabilityChecker'
import { FakePaymentGateway } from './infrastructure/FakePaymentGateway'
import { OrderController } from './infrastructure/http/OrderController'
import { MikroOrmOrderRepository } from './infrastructure/MikroOrmOrderRepository'
import { OrderEntity } from './infrastructure/OrderEntity'
import { OrderItemEntity } from './infrastructure/OrderItemEntity'
import { SystemClock } from './infrastructure/SystemClock'

@Module({
  imports: [MikroOrmModule.forFeature([OrderEntity, OrderItemEntity])],
  controllers: [OrderController],
  providers: [
    CreateOrderUseCase,
    PayOrderUseCase,
    CancelOrderUseCase,
    ExpireOrderUseCase,
    { provide: OrderRepository, useClass: MikroOrmOrderRepository },
    { provide: IdGenerator, useClass: CryptoIdGenerator },
    { provide: Clock, useClass: SystemClock },
    { provide: PaymentGateway, useClass: FakePaymentGateway },
    { provide: EventAvailabilityChecker, useClass: FakeEventAvailabilityChecker },
  ],
})
export class OrderingModule {}
