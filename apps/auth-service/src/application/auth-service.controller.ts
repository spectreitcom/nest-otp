import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RegisterUserDto } from './dto/register-user.dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { RegisterUserCommand } from './commands/register-user.command';
import { RequestOtpDto } from './dto/request-otp.dto';
import { OtpRequestCommand } from './commands/otp-request.command';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { VerifyOtpCommand } from './commands/verify-otp.command';
import { IServiceResponse } from '@app/shared';
import { GetMeDto } from './dto/get-me.dto';
import { GetMeQuery } from './queries/get-me.query';

@Controller()
export class AuthServiceController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @MessagePattern('auth.register')
  async registerUser(@Payload() payload: RegisterUserDto) {
    return await this.commandBus.execute<
      RegisterUserCommand,
      IServiceResponse<{ id: string }>
    >(new RegisterUserCommand(payload.email));
  }

  @MessagePattern('auth.requestOtp')
  async requestOtp(@Payload() payload: RequestOtpDto) {
    return await this.commandBus.execute<
      OtpRequestCommand,
      IServiceResponse<{ challengeId: string }>
    >(new OtpRequestCommand(payload.email));
  }

  @MessagePattern('auth.verifyOtp')
  async verifyOtp(@Payload() payload: VerifyOtpDto) {
    return await this.commandBus.execute<
      VerifyOtpCommand,
      IServiceResponse<{ accessToken: string; refreshToken: string }>
    >(new VerifyOtpCommand(payload.challengeId, payload.code));
  }

  @MessagePattern('auth.get-me')
  async getMe(@Payload() payload: GetMeDto) {
    return await this.queryBus.execute<
      GetMeQuery,
      IServiceResponse<{ id: string; email: string }>
    >(new GetMeQuery(payload.userId));
  }
}
