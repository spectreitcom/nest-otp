import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RegisterUserCommand } from '../commands/register-user.command';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { UserAlreadyExists } from '../exceptions';
import { IServiceResponse } from '@app/shared';
import { hasConflictError } from '../../infrastructure/prisma/errors';

@CommandHandler(RegisterUserCommand)
export class RegisterUserCommandHandler implements ICommandHandler<
  RegisterUserCommand,
  IServiceResponse<{ id: string }>
> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(
    command: RegisterUserCommand,
  ): Promise<IServiceResponse<{ id: string }>> {
    const { email } = command;
    try {
      const user = await this.prismaService.user.create({
        data: { email },
      });

      return {
        hasError: false,
        data: { id: user.id },
      };
    } catch (e) {
      if (hasConflictError(e)) {
        throw new UserAlreadyExists(`User with email ${email} already exists`);
      }
      throw e;
    }
  }
}
