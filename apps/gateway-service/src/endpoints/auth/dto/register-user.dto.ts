import { IsEmail } from 'class-validator';

export class RegisterUserDto {
  @IsEmail()
  readonly email: string;
}
