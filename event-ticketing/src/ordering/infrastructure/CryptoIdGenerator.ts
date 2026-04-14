import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import { IdGenerator } from '../domain/ports/IdGenerator'

@Injectable()
export class CryptoIdGenerator extends IdGenerator {
  public override generate(): string {
    return randomUUID()
  }
}
