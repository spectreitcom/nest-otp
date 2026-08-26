import { Injectable } from '@nestjs/common';
import { TokenService } from '../../appliacation/ports/token.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtTokenService implements TokenService {
  constructor(private readonly jwtService: JwtService) {}

  createAccessToken(userId: string): string {
    return this.jwtService.sign({ sub: userId });
  }

  createRefreshToken(userId: string, refreshTokenId: string): string {
    return this.jwtService.sign(
      { sub: userId, refreshTokenId },
      { expiresIn: '7d' },
    );
  }

  verifyAccessToken(token: string): { sub: string } {
    return this.jwtService.verify(token);
  }

  verifyRefreshToken(token: string): { sub: string; refreshTokenId: string } {
    return this.jwtService.verify(token);
  }
}
