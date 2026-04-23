import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common'
import { CancelOrderUseCase } from 'src/ordering/application/use-cases/CancelOrderUseCase'
import { CreateOrderUseCase } from 'src/ordering/application/use-cases/CreateOrderUseCase'
import { ListAttendeeOrdersUseCase } from 'src/ordering/application/use-cases/ListAttendeeOrdersUseCase'
import { PayOrderUseCase } from 'src/ordering/application/use-cases/PayOrderUseCase'
import { OrderResponseMapper } from './mappers/OrderResponseMapper'
import { CancelOrderRequestDto } from './requests/CancelOrderRequestDto'
import { CreateOrderRequestDto } from './requests/CreateOrderRequestDto'
import { PayOrderRequestDto } from './requests/PayOrderRequestDto'
import { OrderResponseDto } from './responses/OrderResponseDto'

@Controller('orders')
export class OrdersController {
  public constructor(
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly listAttendeeOrdersUseCase: ListAttendeeOrdersUseCase,
    private readonly payOrderUseCase: PayOrderUseCase,
    private readonly cancelOrderUseCase: CancelOrderUseCase,
    private readonly responseMapper: OrderResponseMapper,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  public async create(@Body() body: CreateOrderRequestDto): Promise<OrderResponseDto> {
    const order = await this.createOrderUseCase.execute(body.eventId, body.attendeeId, body.items)
    return this.responseMapper.toResponse(order)
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  public async findByAttendeeId(
    @Query('attendeeId') attendeeId: string,
  ): Promise<OrderResponseDto[]> {
    const orders = await this.listAttendeeOrdersUseCase.execute(attendeeId)
    return orders.map((order) => this.responseMapper.toResponse(order))
  }

  @Post(':id/pay')
  @HttpCode(HttpStatus.OK)
  public async pay(
    @Param('id') id: string,
    @Body() body: PayOrderRequestDto,
  ): Promise<OrderResponseDto> {
    const order = await this.payOrderUseCase.execute(id, body.paymentToken, body.paymentMethod)
    return this.responseMapper.toResponse(order)
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  public async cancel(
    @Param('id') id: string,
    @Body() body: CancelOrderRequestDto,
  ): Promise<OrderResponseDto> {
    const order = await this.cancelOrderUseCase.execute(id, body.reason ?? null)
    return this.responseMapper.toResponse(order)
  }
}
