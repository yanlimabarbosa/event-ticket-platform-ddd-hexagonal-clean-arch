import { Injectable } from '@nestjs/common'
import { Clock } from '../../../application/ports/out/Clock'

@Injectable()
export class SystemClock extends Clock {
  public override now(): Date {
    return new Date()
  }
}
