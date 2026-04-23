import { Type } from 'class-transformer'
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator'

export class CreateOrderItemDto {
  @IsString()
  @IsNotEmpty()
  public readonly ticketTypeId!: string

  @IsInt()
  @Min(1)
  public readonly quantity!: number
}

export class CreateOrderRequestDto {
  @IsString()
  @IsNotEmpty()
  public readonly eventId!: string

  @IsString()
  @IsNotEmpty()
  public readonly attendeeId!: string

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  public readonly items!: CreateOrderItemDto[]
}
