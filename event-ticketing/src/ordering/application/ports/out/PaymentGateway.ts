export enum PaymentMethod {
  CreditCard = 'credit_card',
  Pix = 'pix',
  Boleto = 'boleto',
}

export abstract class PaymentGateway {
  public abstract charge(
    orderId: string,
    amount: number,
    paymentToken: string,
    paymentMethod: PaymentMethod,
  ): Promise<boolean>
}
