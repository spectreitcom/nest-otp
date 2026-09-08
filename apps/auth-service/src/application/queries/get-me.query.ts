import { IQuery } from '@nestjs/cqrs';
import { IsUUID, validateSync } from 'class-validator';

export class GetMeQuery implements IQuery {
  @IsUUID()
  readonly userId: string;

  constructor(userId: string) {
    this.userId = userId;
    this.validate();
  }

  private validate() {
    const errors = validateSync(this);
    if (errors.length > 0) {
      throw new Error('Invalid GetMeQuery');
    }
  }
}
