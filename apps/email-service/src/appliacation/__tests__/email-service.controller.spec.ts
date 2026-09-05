import { EmailServiceController } from '../email-service.controller';
import { SendOtpDto } from '../dto/send-otp.dto';
import { OtpEmail } from '../email/otp.email';

describe('EmailServiceController', () => {
  let controller: EmailServiceController;
  let emailSender: {
    send: jest.Mock;
  };

  beforeEach(() => {
    emailSender = {
      send: jest.fn(),
    };

    controller = new EmailServiceController(emailSender);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('handleSendOpt', () => {
    it('should create OtpEmail and call emailSender.send with recipient and email object', async () => {
      // Given
      const data: SendOtpDto = {
        email: 'user@example.com',
        code: '654321',
      };
      emailSender.send.mockResolvedValue(undefined);

      // When
      await controller.handleSendOpt(data);

      // Then
      expect(emailSender.send).toHaveBeenCalledTimes(1);
      expect(emailSender.send).toHaveBeenCalledWith(
        data.email,
        expect.any(OtpEmail),
      );

      const calledEmail = (
        emailSender.send.mock.calls as [string, OtpEmail][]
      )[0][1];
      expect(calledEmail.getData()).toEqual({
        subject: 'Your OTP',
        body: `Your OTP is: ${data.code}`,
      });
    });

    it('should rethrow error when emailSender.send throws an exception', async () => {
      // Given
      const data: SendOtpDto = {
        email: 'user@example.com',
        code: '654321',
      };
      const error = new Error('SMTP connection error');
      emailSender.send.mockRejectedValue(error);

      // When & Then
      await expect(controller.handleSendOpt(data)).rejects.toThrow(error);
      expect(emailSender.send).toHaveBeenCalledWith(
        data.email,
        expect.any(OtpEmail),
      );
    });
  });
});
