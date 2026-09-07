import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { randomUUID } from 'node:crypto';
import { AuthGuard } from '../auth.guard';
import { IS_PUBLIC_KEY } from '../public.decorator';

describe('AuthGuard', () => {
  let guard: AuthGuard;

  let jwtService: {
    verifyAsync: jest.Mock;
  };

  let reflector: {
    getAllAndOverride: jest.Mock;
  };

  beforeEach(() => {
    jwtService = {
      verifyAsync: jest.fn(),
    };

    reflector = {
      getAllAndOverride: jest.fn(),
    };

    guard = new AuthGuard(
      jwtService as unknown as JwtService,
      reflector as unknown as Reflector,
    );
  });

  const createMockExecutionContext = (
    request: Partial<Request> = {},
    handler = jest.fn(),
    cls = class {},
  ): ExecutionContext => {
    return {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(request),
        getResponse: jest.fn(),
        getNext: jest.fn(),
      }),
      getHandler: jest.fn().mockReturnValue(handler),
      getClass: jest.fn().mockReturnValue(cls),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    };
  };

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('when route is public', () => {
    it('should return true and skip token verification', async () => {
      // Given
      reflector.getAllAndOverride.mockReturnValue(true);
      const context = createMockExecutionContext();

      // When
      const result = await guard.canActivate(context);

      // Then
      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    });
  });

  describe('when route is protected (not public)', () => {
    beforeEach(() => {
      reflector.getAllAndOverride.mockReturnValue(false);
    });

    it('should throw UnauthorizedException when authorization header is missing', async () => {
      // Given
      const request = { headers: {} };
      const context = createMockExecutionContext(request);

      // When & Then
      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when authorization header is not Bearer', async () => {
      // Given
      const request = {
        headers: {
          authorization: 'Basic dXNlcjpwYXNz',
        },
      };
      const context = createMockExecutionContext(request);

      // When & Then
      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when Bearer token is missing in header', async () => {
      // Given
      const request = {
        headers: {
          authorization: 'Bearer',
        },
      };
      const context = createMockExecutionContext(request);

      // When & Then
      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException("Invalid token") when jwt verification fails', async () => {
      // Given
      const token = 'invalid.token.value';
      const request = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      };
      const context = createMockExecutionContext(request);
      jwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));

      // When & Then
      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Invalid token'),
      );
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(token);
    });

    it('should throw UnauthorizedException("Invalid token payload") when payload is missing sub', async () => {
      // Given
      const token = 'valid.jwt.token';
      const request = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      };
      const context = createMockExecutionContext(request);
      jwtService.verifyAsync.mockResolvedValue({
        email: 'test@example.com',
      });

      // When & Then
      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Invalid token payload'),
      );
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(token);
    });

    it('should throw UnauthorizedException("Invalid token payload") when sub is not a valid uuid', async () => {
      // Given
      const token = 'valid.jwt.token';
      const request = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      };
      const context = createMockExecutionContext(request);
      jwtService.verifyAsync.mockResolvedValue({
        sub: 'invalid-non-uuid-string',
      });

      // When & Then
      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Invalid token payload'),
      );
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(token);
    });

    it('should attach user id to request and return true when token is valid and payload matches schema', async () => {
      // Given
      const userId = randomUUID();
      const token = 'valid.jwt.token';
      const request: Record<string, unknown> = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      };
      const context = createMockExecutionContext(request);
      jwtService.verifyAsync.mockResolvedValue({ sub: userId });

      // When
      const result = await guard.canActivate(context);

      // Then
      expect(result).toBe(true);
      expect(request['user']).toBe(userId);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(token);
    });
  });
});
