import { RegisterUserCommandHandler } from '../register-user.command-handler';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { RegisterUserCommand } from '../../commands/register-user.command';
import { IServiceSuccessResponse } from '@app/shared';
import { randomUUID } from 'node:crypto';
import { UserAlreadyExists } from '../../exceptions';
import { Prisma } from '../../../../generated/prisma/client';

jest.mock('../../../../generated/prisma/client', () => {
  class PrismaClientKnownRequestError extends Error {
    code: string;
    clientVersion: string;

    constructor(
      message: string,
      { code, clientVersion }: { code: string; clientVersion: string },
    ) {
      super(message);
      this.name = 'PrismaClientKnownRequestError';
      this.code = code;
      this.clientVersion = clientVersion;
    }
  }

  return {
    PrismaClient: class {},
    Prisma: {
      PrismaClientKnownRequestError,
    },
  };
});

describe('RegisterUserCommandHandler', () => {
  let handler: RegisterUserCommandHandler;

  let prismaService: {
    user: {
      create: jest.Mock;
    };
  };

  beforeEach(() => {
    prismaService = {
      user: {
        create: jest.fn(),
      },
    };

    handler = new RegisterUserCommandHandler(
      prismaService as unknown as PrismaService,
    );
  });

  it('should create a new user', async () => {
    // Given
    const email = 'test@example.com';
    const command = new RegisterUserCommand(email);
    const user = {
      id: randomUUID(),
      email,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    prismaService.user.create.mockResolvedValue(user);

    // When
    const result = (await handler.execute(command)) as IServiceSuccessResponse<{
      id: string;
    }>;

    // Then
    expect(handler).toBeDefined();
    expect(result).toBeDefined();
    expect(result).toEqual({
      hasError: false,
      data: { id: user.id },
    });
    expect(prismaService.user.create).toHaveBeenCalledWith({ data: { email } });
  });

  it('should throw UserAlreadyExists when user already exists', async () => {
    // Given
    const email = 'test@email.com';
    const command = new RegisterUserCommand(email);

    const prismaConflictError = new Prisma.PrismaClientKnownRequestError('', {
      clientVersion: '',
      code: 'P2002',
    });

    prismaService.user.create.mockRejectedValue(prismaConflictError);

    // Given & Then
    await expect(handler.execute(command)).rejects.toThrow(UserAlreadyExists);
  });

  it('should rethrow unexpected errors', async () => {
    // Given
    const email = 'test@example.com';
    const command = new RegisterUserCommand(email);
    const databaseError = new Error('Database connection failure');

    prismaService.user.create.mockRejectedValue(databaseError);

    // When & Then
    await expect(handler.execute(command)).rejects.toThrow(databaseError);
  });
});
