import { ICommand } from '@nestjs/cqrs';

export class OtpRequestCommand implements ICommand {
  constructor(public readonly email: string) {}
}
