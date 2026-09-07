import { GetMeQueryHandler } from '../get-me.query-handler';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { GetMeQuery } from '../../queries/get-me.query';
import { IServiceSuccessResponse } from '@app/shared';
import { UserNotFound } from '../../exceptions';
import { randomUUID } from 'node:crypto';

jest.mock('../../../../generated/prisma/client', () => ({
  PrismaClient: class {},
}));

describe('GetMeQueryHandler', () => {
  let handler: GetMeQueryHandler;

  let prismaService: {
    user: {
      findUnique: jest.Mock;
    };
  };

  beforeEach(() => {
    prismaService = {
      user: {
        findUnique: jest.fn(),
      },
    };

    handler = new GetMeQueryHandler(prismaService as unknown as PrismaService);
  });

  it('should return user details when user exists', async () => {
    // Given
    const userId = randomUUID();
    const email = 'test@example.com';
    const query = new GetMeQuery(userId);
    const user = {
      id: userId,
      email,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    prismaService.user.findUnique.mockResolvedValue(user);

    // When
    const result = (await handler.execute(query)) as IServiceSuccessResponse<{
      id: string;
      email: string;
    }>;

    // Then
    expect(handler).toBeDefined();
    expect(result).toBeDefined();
    expect(result).toEqual({
      hasError: false,
      data: {
        id: user.id,
        email: user.email,
      },
    });
    expect(prismaService.user.findUnique).toHaveBeenCalledWith({
      where: { id: userId },
    });
  });

  it('should throw UserNotFound when user is not found', async () => {
    // Given
    const userId = randomUUID();
    const query = new GetMeQuery(userId);

    prismaService.user.findUnique.mockResolvedValue(null);

    // When & Then
    await expect(handler.execute(query)).rejects.toThrow(UserNotFound);
    expect(prismaService.user.findUnique).toHaveBeenCalledWith({
      where: { id: userId },
    });
  });

  it('should rethrow unexpected errors', async () => {
    // Given
    const userId = randomUUID();
    const query = new GetMeQuery(userId);
    const databaseError = new Error('Database connection failure');

    prismaService.user.findUnique.mockRejectedValue(databaseError);

    // When & Then
    await expect(handler.execute(query)).rejects.toThrow(databaseError);
    expect(prismaService.user.findUnique).toHaveBeenCalledWith({
      where: { id: userId },
    });
  });
});
