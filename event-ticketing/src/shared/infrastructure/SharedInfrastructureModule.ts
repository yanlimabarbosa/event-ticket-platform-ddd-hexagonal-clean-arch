import { Global, Module } from '@nestjs/common'
import { Clock } from '../application/ports/out/Clock'
import { IdGenerator } from '../application/ports/out/IdGenerator'
import { UnitOfWork } from '../application/ports/out/UnitOfWork'
import { CryptoIdGenerator } from './services/CryptoIdGenerator'
import { MikroOrmUnitOfWork } from './services/MikroOrmUnitOfWork'
import { SystemClock } from './services/SystemClock'

@Global()
@Module({
  providers: [
    { provide: Clock, useClass: SystemClock },
    { provide: IdGenerator, useClass: CryptoIdGenerator },
    { provide: UnitOfWork, useClass: MikroOrmUnitOfWork },
  ],
  exports: [Clock, IdGenerator, UnitOfWork],
})
export class SharedInfrastructureModule {}
