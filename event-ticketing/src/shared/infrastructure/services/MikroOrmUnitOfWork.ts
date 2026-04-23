import { EntityManager } from '@mikro-orm/postgresql'
import { Injectable } from '@nestjs/common'
import { UnitOfWork } from '../../application/ports/out/UnitOfWork'

@Injectable()
export class MikroOrmUnitOfWork extends UnitOfWork {
  public constructor(private readonly em: EntityManager) {
    super()
  }

  public override run<T>(work: () => Promise<T>): Promise<T> {
    return this.em.transactional(work)
  }
}
