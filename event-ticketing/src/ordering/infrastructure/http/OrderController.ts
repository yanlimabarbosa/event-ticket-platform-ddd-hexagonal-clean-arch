import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { CreateOrderUseCase } from '../../application/CreateOrderUseCase'
import { CreateOrderRequestDto } from './dtos/CreateOrderRequestDto'
import { type OrderResponseDto, toOrderResponseDto } from './dtos/OrderResponseDto'

@Controller('orders')
export class OrderController {
  public constructor(private readonly createOrderUseCase: CreateOrderUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  public async create(@Body() body: CreateOrderRequestDto): Promise<OrderResponseDto> {
    const order = await this.createOrderUseCase.execute(body.eventId, body.attendeeId, body.items)

    return toOrderResponseDto(order)
  }
}
