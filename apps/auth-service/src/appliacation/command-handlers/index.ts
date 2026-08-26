import { RegisterUserCommandHandler } from './register-user.command-handler';
import { OtpRequestCommandHandler } from './otp-request.command-handler';
import { VerifyOtpCommandHandler } from './verify-otp.command-handler';

export const commandHandlers = [
  RegisterUserCommandHandler,
  OtpRequestCommandHandler,
  VerifyOtpCommandHandler,
];
