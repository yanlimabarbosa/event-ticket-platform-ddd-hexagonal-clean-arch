import { MikroOrmModule } from '@mikro-orm/nestjs'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import mikroOrmConfig from './mikro-orm.config'
import { OrderingModule } from './ordering/ordering.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MikroOrmModule.forRoot(mikroOrmConfig),
    OrderingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
