import { IsUUID } from 'class-validator';

export class GetMeDto {
  @IsUUID()
  readonly userId: string;
}
