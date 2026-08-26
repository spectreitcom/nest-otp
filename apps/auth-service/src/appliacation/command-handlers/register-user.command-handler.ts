import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RegisterUserCommand } from '../commands/register-user.command';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@CommandHandler(RegisterUserCommand)
export class RegisterUserCommandHandler implements ICommandHandler<
  RegisterUserCommand,
  string
> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(command: RegisterUserCommand): Promise<string> {
    const { email } = command;

    const record = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (record) {
      throw new Error('User already exists');
    }

    const user = await this.prismaService.user.create({
      data: { email },
    });

    return user.id;
  }
}
