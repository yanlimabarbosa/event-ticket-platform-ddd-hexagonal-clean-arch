import { type ArgumentsHost, Catch, type ExceptionFilter, Logger } from '@nestjs/common'
import type { Response } from 'express'
import { ConflictError } from '../../domain/ConflictError'
import { DomainError } from '../../domain/DomainError'
import { NotFoundError } from '../../domain/NotFoundError'
import { ValidationError } from '../../domain/ValidationError'

const DEFAULT_STATUS = 409

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter<DomainError> {
  private readonly logger = new Logger(DomainExceptionFilter.name)

  public catch(exception: DomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>()
    const status = this.resolveStatus(exception)

    this.logger.warn(`${exception.name}: ${exception.message}`)

    response.status(status).json({
      statusCode: status,
      error: exception.name,
      message: exception.message,
    })
  }

  private resolveStatus(exception: DomainError): number {
    if (exception instanceof NotFoundError) return 404
    if (exception instanceof ValidationError) return 400
    if (exception instanceof ConflictError) return 409
    return DEFAULT_STATUS
  }
}
