import { OptimisticLockError } from '@mikro-orm/core'
import { type ArgumentsHost, Catch, type ExceptionFilter, Logger } from '@nestjs/common'
import type { Response } from 'express'

@Catch(OptimisticLockError)
export class OptimisticLockErrorFilter implements ExceptionFilter<OptimisticLockError> {
  private readonly logger = new Logger(OptimisticLockErrorFilter.name)

  public catch(exception: OptimisticLockError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>()

    this.logger.warn(`OptimisticLockError: ${exception.message}`)

    response.status(409).json({
      statusCode: 409,
      error: 'OptimisticLockError',
      message: 'This order was modified by another request. Please retry.',
    })
  }
}
