import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RegisterUserDto } from './dto/register-user.dto';
import { AuthService } from './auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';

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
  @Post('request-otp')
  @HttpCode(HttpStatus.OK)
  async requestOtp(@Body() dto: RequestOtpDto) {
    const challengeId = await this.authService.requestOtp(dto);
    return { challengeId };
  }
}
