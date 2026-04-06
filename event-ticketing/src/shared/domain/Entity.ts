export abstract class Entity {
  public constructor(public readonly id: string) {}

  public equals(entity: Entity): boolean {
    return this.id === entity.id
  }
}
