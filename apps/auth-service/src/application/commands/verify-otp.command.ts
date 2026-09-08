import { ICommand } from '@nestjs/cqrs';

export class VerifyOtpCommand implements ICommand {
  constructor(
    public readonly challengeId: string,
    public readonly code: string,
  ) {}
}
