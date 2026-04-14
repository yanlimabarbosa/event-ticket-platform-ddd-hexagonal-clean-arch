import { Injectable } from '@nestjs/common'
import { PaymentGateway, PaymentMethod } from '../domain/ports/PaymentGateway'

@Injectable()
export class FakePaymentGateway extends PaymentGateway {
  public override async charge(
    orderId: string,
    amount: number,
    paymentToken: string,
    paymentMethod: PaymentMethod,
  ): Promise<boolean> {
    console.log(`[FakePaymentGateway] charging order ${orderId}, ${amount} cents, ${paymentMethod}`)

    if (paymentToken.startsWith('fail-')) {
      console.log(`[FakePaymentGateway] simulated failure`)
      return false
    }

    return true
  }
}
