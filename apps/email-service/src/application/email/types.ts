export abstract class BaseEmail {
  abstract getData(): { subject: string; body: string };
}
