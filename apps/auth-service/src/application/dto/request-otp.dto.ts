import { IsEmail } from 'class-validator';

export class RequestOtpDto {
  @IsEmail()
  readonly email: string;
}
