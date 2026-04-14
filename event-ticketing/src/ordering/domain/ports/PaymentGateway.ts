export type PaymentMethod = 'credit_card' | 'pix' | 'boleto'

export abstract class PaymentGateway {
  public abstract charge(
    orderId: string,
    amount: number,
    paymentToken: string,
    paymentMethod: PaymentMethod,
  ): Promise<boolean>
}
