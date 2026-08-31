import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RegisterUserDto } from './dto/register-user.dto';
import { AuthService } from './auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register a new user' })
  @ApiBadRequestResponse({ description: 'Wrong input data' })
  @ApiCreatedResponse({
    description: 'User registered successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
      },
    },
  })
  @ApiConflictResponse({
    description: 'User already exists',
  })
  @ApiServiceUnavailableResponse({
    description: 'Service unavailable',
  })
  @Post()
  async registerUser(@Body() dto: RegisterUserDto) {
    const id = await this.authService.registerUser(dto);
    return { id };
  }

  @ApiOperation({ summary: 'Request OTP' })
  @ApiOkResponse({
    description: 'OTP request successful',
    schema: {
      type: 'object',
      properties: {
        challengeId: { type: 'string', format: 'uuid' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiServiceUnavailableResponse({
    description: 'Service unavailable',
  })
  @Post('request-otp')
  @HttpCode(HttpStatus.OK)
  async requestOtp(@Body() dto: RequestOtpDto) {
    const challengeId = await this.authService.requestOtp(dto);
    return { challengeId };
  }

  @ApiOperation({ summary: 'Verify OTP' })
  @ApiOkResponse({
    description: 'OTP verified successfully',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Wrong OTP' })
  @ApiServiceUnavailableResponse({
    description: 'Service unavailable',
  })
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return await this.authService.verifyOtp(dto);
  }
}
