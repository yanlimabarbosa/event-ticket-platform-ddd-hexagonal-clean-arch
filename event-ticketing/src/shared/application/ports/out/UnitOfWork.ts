export abstract class UnitOfWork {
  public abstract run<T>(work: () => Promise<T>): Promise<T>
}
