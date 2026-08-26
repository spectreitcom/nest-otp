import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SendOtpDto {
  @IsEmail()
  readonly email: string;

  @IsNotEmpty()
  @IsString()
  readonly code: string;
}
