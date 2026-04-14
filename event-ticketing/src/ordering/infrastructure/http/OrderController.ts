import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common'
import { CancelOrderUseCase } from 'src/ordering/application/CancelOrderUseCase'
import { CreateOrderUseCase } from 'src/ordering/application/CreateOrderUseCase'
import { ListAttendeeOrdersUseCase } from 'src/ordering/application/ListAttendeeOrdersUseCase'
import { PayOrderUseCase } from 'src/ordering/application/PayOrderUseCase'
import { CancelOrderRequestDto } from './dtos/CancelOrderRequestDto'
import { CreateOrderRequestDto } from './dtos/CreateOrderRequestDto'
import { type OrderResponseDto, toOrderResponseDto } from './dtos/OrderResponseDto'
import { PayOrderRequestDto } from './dtos/PayOrderRequestDto'

@Controller('orders')
export class OrderController {
  public constructor(
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly listAttendeeOrdersUseCase: ListAttendeeOrdersUseCase,
    private readonly payOrderUseCase: PayOrderUseCase,
    private readonly cancelOrderUseCase: CancelOrderUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  public async create(@Body() body: CreateOrderRequestDto): Promise<OrderResponseDto> {
    const order = await this.createOrderUseCase.execute(body.eventId, body.attendeeId, body.items)
    return toOrderResponseDto(order)
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  public async findByAttendeeId(
    @Query('attendeeId') attendeeId: string,
  ): Promise<OrderResponseDto[]> {
    const orders = await this.listAttendeeOrdersUseCase.execute(attendeeId)
    return orders.map((order) => toOrderResponseDto(order))
  }

  @Post(':id/pay')
  @HttpCode(HttpStatus.OK)
  public async pay(
    @Param('id') id: string,
    @Body() body: PayOrderRequestDto,
  ): Promise<OrderResponseDto> {
    const order = await this.payOrderUseCase.execute(id, body.paymentToken, body.paymentMethod)
    return toOrderResponseDto(order)
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  public async cancel(
    @Param('id') id: string,
    @Body() body: CancelOrderRequestDto,
  ): Promise<OrderResponseDto> {
    const order = await this.cancelOrderUseCase.execute(id, body.reason ?? null)
    return toOrderResponseDto(order)
  }
}
