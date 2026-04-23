import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { DomainExceptionFilter } from './shared/infrastructure/http/DomainExceptionFilter'
import { OptimisticLockErrorFilter } from './shared/infrastructure/http/OptimisticLockExceptionFilter'

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

  app.useGlobalFilters(new DomainExceptionFilter(), new OptimisticLockErrorFilter())
  app.enableShutdownHooks()

  const config = new DocumentBuilder().setTitle('Event Ticketing API').setVersion('1.0').build()
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config))

  await app.listen(process.env.PORT ?? 3000)
}
void bootstrap()
