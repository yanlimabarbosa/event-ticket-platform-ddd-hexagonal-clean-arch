import { IsEnum, IsNotEmpty, IsString } from 'class-validator'
import { PaymentMethod } from '../../../../../application/ports/out/PaymentGateway'

export class PayOrderRequestDto {
  @IsString()
  @IsNotEmpty()
  public readonly paymentToken!: string

  @IsEnum(PaymentMethod)
  public readonly paymentMethod!: PaymentMethod
}
