export interface PaymentGateway {
  charge(orderId: string, amount: number, paymentToken: string): Promise<boolean>
}
