import { Inject, Injectable } from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { ClientProxy } from '@nestjs/microservices';
import { AUTH_SERVICE } from '../../constants';
import { firstValueFrom } from 'rxjs';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_SERVICE) private readonly authService: ClientProxy,
  ) {}

  async registerUser(dto: RegisterUserDto) {
    return await firstValueFrom<string>(
      this.authService.send('auth.register', dto),
    );
  }

  async requestOtp(dto: RequestOtpDto) {
    return await firstValueFrom<string>(
      this.authService.send('auth.requestOtp', dto),
    );
  }

  async verifyOtp(dto: VerifyOtpDto) {
    return await firstValueFrom<string>(
      this.authService.send('auth.verifyOtp', dto),
    );
  }
}
