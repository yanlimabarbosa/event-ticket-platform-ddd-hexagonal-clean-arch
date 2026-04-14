import { Injectable } from '@nestjs/common'
import { Clock } from '../domain/ports/Clock'

@Injectable()
export class SystemClock extends Clock {
  public override now(): Date {
    return new Date()
  }
}
