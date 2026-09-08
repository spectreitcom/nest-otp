export abstract class TokenService {
  abstract createAccessToken(userId: string): string;
  abstract createRefreshToken(userId: string, refreshTokenId: string): string;
  abstract verifyAccessToken(token: string): { sub: string };
  abstract verifyRefreshToken(token: string): {
    sub: string;
    refreshTokenId: string;
  };
}
