import { IsEmail, IsNotEmpty } from 'class-validator';

export class RegisterUserDto {
  @IsEmail()
  @IsNotEmpty()
  readonly email: string;
}
