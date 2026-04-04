export abstract class Entity {
  public readonly id: string

  constructor(id: string) {
    this.id = id
  }

  equals(entity: Entity) {
    return this.id === entity.id
  }
}
