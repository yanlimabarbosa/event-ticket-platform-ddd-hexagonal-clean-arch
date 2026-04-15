import { IsOptional, IsString, MaxLength } from 'class-validator'

export class CancelOrderRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  public readonly reason?: string
}
