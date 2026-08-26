import { IsEmail, IsNotEmpty } from 'class-validator';

export class RequestOtpDto {
  @IsEmail()
  @IsNotEmpty()
  readonly email: string;
}
