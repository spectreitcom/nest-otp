import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RegisterUserDto } from './dto/register-user.dto';
import { CommandBus } from '@nestjs/cqrs';
import { RegisterUserCommand } from './commands/register-user.command';
import { RequestOtpDto } from './dto/request-otp.dto';
import { OtpRequestCommand } from './commands/otp-request.command';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { VerifyOtpCommand } from './commands/verify-otp.command';
import { VerifyOtpCommandResponse } from './command-handlers/verify-otp.command-handler';

@Controller()
export class AuthServiceController {
  constructor(private readonly commandBus: CommandBus) {}

  @MessagePattern('auth.register')
  async registerUser(@Payload() payload: RegisterUserDto) {
    return await this.commandBus.execute<RegisterUserCommand, string>(
      new RegisterUserCommand(payload.email),
    );
  }

  @MessagePattern('auth.requestOtp')
  async requestOtp(@Payload() payload: RequestOtpDto) {
    return await this.commandBus.execute<OtpRequestCommand, string>(
      new OtpRequestCommand(payload.email),
    );
  }

  @MessagePattern('auth.verifyOtp')
  async verifyOtp(@Payload() payload: VerifyOtpDto) {
    return await this.commandBus.execute<
      VerifyOtpCommand,
      VerifyOtpCommandResponse
    >(new VerifyOtpCommand(payload.challengeId, payload.code));
  }
}
