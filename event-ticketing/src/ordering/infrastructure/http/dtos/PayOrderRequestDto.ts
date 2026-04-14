import { IsIn, IsNotEmpty, IsString } from 'class-validator'
import type { PaymentMethod } from '../../../domain/ports/PaymentGateway'

const PAYMENT_METHODS: PaymentMethod[] = ['credit_card', 'pix', 'boleto']

export class PayOrderRequestDto {
  @IsString()
  @IsNotEmpty()
  public readonly paymentToken!: string

  @IsIn(PAYMENT_METHODS)
  public readonly paymentMethod!: PaymentMethod
}
