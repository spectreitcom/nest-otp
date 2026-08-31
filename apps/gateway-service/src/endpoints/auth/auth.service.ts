import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { ClientProxy } from '@nestjs/microservices';
import { AUTH_SERVICE } from '../../constants';
import { firstValueFrom } from 'rxjs';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import {
  handleServiceUnavailable,
  IServiceResponse,
  serviceResponseSchema,
  errorMapper,
} from '@app/shared';
import { z } from 'zod';

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_SERVICE) private readonly authService: ClientProxy,
  ) {}

  async registerUser(dto: RegisterUserDto) {
    const response = await firstValueFrom<IServiceResponse<{ id: string }>>(
      this.authService
        .send('auth.register', dto)
        .pipe(handleServiceUnavailable()),
    );

    const schema = serviceResponseSchema(z.object({ id: z.uuid() }));
    const validationResult = schema.safeParse(response);

    if (!validationResult.success) {
      throw new InternalServerErrorException('Invalid response schema');
    }

    if (validationResult.data.hasError) {
      throw errorMapper(validationResult.data);
    }

    return validationResult.data.data.id;
  }

  async requestOtp(dto: RequestOtpDto) {
    const response = await firstValueFrom<
      IServiceResponse<{ challengeId: string }>
    >(
      this.authService
        .send('auth.requestOtp', dto)
        .pipe(handleServiceUnavailable()),
    );

    const schema = serviceResponseSchema(z.object({ challengeId: z.uuid() }));
    const validationResult = schema.safeParse(response);

    if (!validationResult.success) {
      throw new InternalServerErrorException('Invalid response schema');
    }

    if (validationResult.data.hasError) {
      throw errorMapper(validationResult.data);
    }

    return validationResult.data.data.challengeId;
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const response = await firstValueFrom<
      IServiceResponse<{ accessToken: string; refreshToken: string }>
    >(
      this.authService
        .send('auth.verifyOtp', dto)
        .pipe(handleServiceUnavailable()),
    );

    const schema = serviceResponseSchema(
      z.object({ accessToken: z.string(), refreshToken: z.string() }),
    );
    const validationResult = schema.safeParse(response);

    if (!validationResult.success) {
      throw new InternalServerErrorException('Invalid response schema');
    }

    if (validationResult.data.hasError) {
      throw errorMapper(validationResult.data);
    }

    return validationResult.data.data;
  }
}
