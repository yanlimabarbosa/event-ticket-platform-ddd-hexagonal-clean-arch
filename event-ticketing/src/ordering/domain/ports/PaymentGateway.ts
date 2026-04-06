export type PaymentMethod = 'credit_card' | 'pix' | 'boleto'

export interface PaymentGateway {
  charge(
    orderId: string,
    amount: number,
    paymentToken: string,
    paymentMethod: PaymentMethod,
  ): Promise<boolean>
}
