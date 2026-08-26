export abstract class OtpGenerator {
  abstract generate(): string;
  abstract hashOtp(challengeId: string, code: string, secret: string): string;
}
