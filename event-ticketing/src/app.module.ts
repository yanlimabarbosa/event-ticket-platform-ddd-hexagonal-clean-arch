import { MikroOrmModule } from '@mikro-orm/nestjs'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { EventEmitterModule } from '@nestjs/event-emitter'
import mikroOrmConfig from './mikro-orm.config'
import { OrderingModule } from './ordering/ordering.module'
import { SharedInfrastructureModule } from './shared/infrastructure/SharedInfrastructureModule'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MikroOrmModule.forRoot(mikroOrmConfig),
    EventEmitterModule.forRoot(),
    SharedInfrastructureModule,
    OrderingModule,
  ],
})
export class AppModule {}
