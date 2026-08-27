export type OtpChallenge = {
  email: string;
  codeHash: string;
  attempts: number;
  createdAt: number;
};

export abstract class OtpStore {
  abstract create(
    data: Pick<OtpChallenge, 'codeHash' | 'email'> & { challengeId: string },
  ): Promise<void>;

  abstract get(challengeId: string): Promise<OtpChallenge | null>;

  abstract delete(challengeId: string): Promise<void>;

  abstract incrementAttempts(challengeId: string): Promise<number>;
}
