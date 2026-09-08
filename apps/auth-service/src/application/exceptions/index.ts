export class UserAlreadyExists extends Error {
  constructor(message?: string) {
    super(message);
  }
}

export class UserNotFound extends Error {
  constructor(message?: string) {
    super(message);
  }
}

export class InvalidOtp extends Error {
  constructor(message?: string) {
    super(message);
  }
}

export class TooManyAttempts extends Error {
  constructor(message?: string) {
    super(message);
  }
}
