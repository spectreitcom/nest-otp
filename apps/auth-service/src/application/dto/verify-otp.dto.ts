import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class VerifyOtpDto {
  @IsNotEmpty()
  @IsString()
  readonly code: string;

  @IsUUID()
  readonly challengeId: string;
}
