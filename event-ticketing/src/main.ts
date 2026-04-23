import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { apiReference } from '@scalar/nestjs-api-reference'
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

  const config = new DocumentBuilder()
    .setTitle('Event Ticketing API')
    .setDescription('DDD + Hexagonal + Clean Architecture reference implementation')
    .setVersion('1.0')
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('swagger', app, document)

  app.use(
    '/docs',
    apiReference({
      content: document,
      layout: 'modern',
      defaultOpenAllTags: true,
      expandAllModelSections: true,
      expandAllResponses: true,
      theme: 'kepler',
      hideClientButton: false,
      showSidebar: true,
      showDeveloperTools: 'localhost',
      operationTitleSource: 'summary',
      persistAuth: false,
      telemetry: true,
      // externalUrls: {
      //   dashboardUrl: 'https://dashboard.scalar.com',
      //   registryUrl: 'https://registry.scalar.com',
      //   proxyUrl: 'https://proxy.scalar.com',
      //   apiBaseUrl: 'https://api.scalar.com',
      // },
      isEditable: false,
      isLoading: false,
      hideModels: false,
      documentDownloadType: 'both',
      hideTestRequestButton: false,
      hideSearch: false,
      showOperationId: false,
      hideDarkModeToggle: false,
      withDefaultFonts: true,
      defaultOpenFirstTag: true,
      orderSchemaPropertiesBy: 'alpha',
      orderRequiredPropertiesFirst: true,
      _integration: 'nestjs',
      darkMode: true,
      default: false,
      slug: 'event-ticketing-api',
      title: 'Event Ticketing API',
    }),
  )

  await app.listen(process.env.PORT ?? 3000)
}
void bootstrap()
