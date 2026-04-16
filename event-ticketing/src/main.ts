import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { DomainExceptionFilter } from './shared/infrastructure/http/DomainExceptionFilter'
import { OptimisticLockExceptionFilter } from './shared/infrastructure/http/OptimisticLockExceptionFilter'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule)

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )

  app.useGlobalFilters(new DomainExceptionFilter(), new OptimisticLockExceptionFilter())

  await app.listen(process.env.PORT ?? 3000)
}
void bootstrap()
