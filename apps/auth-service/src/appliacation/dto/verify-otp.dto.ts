import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class VerifyOtpDto {
  @IsNotEmpty()
  @IsString()
  readonly code: string;

  @IsNotEmpty()
  @IsUUID()
  readonly challengeId: string;
}
