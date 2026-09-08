import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetMeQuery } from '../queries/get-me.query';
import { IServiceResponse } from '@app/shared';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { UserNotFound } from '../exceptions';

@QueryHandler(GetMeQuery)
export class GetMeQueryHandler implements IQueryHandler<
  GetMeQuery,
  IServiceResponse<{ id: string; email: string }>
> {
  constructor(private readonly prismaService: PrismaService) {}

  async execute(
    query: GetMeQuery,
  ): Promise<IServiceResponse<{ id: string; email: string }>> {
    const { userId } = query;

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new UserNotFound(`User with id ${userId} not found`);

    return {
      hasError: false,
      data: { id: user.id, email: user.email },
    };
  }
}
