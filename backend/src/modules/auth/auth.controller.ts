import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private static readonly LOGIN_LIMIT =
    process.env.NODE_ENV === 'test' ? 500 : 15;

  private static readonly REGISTER_LIMIT =
    process.env.NODE_ENV === 'test' ? 200 : 10;

  @Post('login')
  @Throttle({
    default: { ttl: 60, limit: AuthController.LOGIN_LIMIT },
  })
  login(@Body() dto: LoginDto, @Headers('x-app-version') appVersion?: string) {
    return this.authService.login(dto, appVersion);
  }

  @Post('register')
  @Throttle({
    default: { ttl: 60, limit: AuthController.REGISTER_LIMIT },
  })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: { id: string }) {
    return this.authService.me(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('onboarding/complete')
  @Throttle({
    default: { ttl: 300, limit: 30 },
  })
  completeOnboarding(
    @CurrentUser() user: { id: string },
    @Body()
    body: {
      propertyId: string;
      balances: Array<{
        species: 'bovino' | 'bubalino';
        sex: 'male' | 'female';
        ageGroupId: string;
        quantity: number;
      }>;
    },
  ) {
    return this.authService.completeOnboarding(user.id, body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @Throttle({
    default: { ttl: 60, limit: 20 },
  })
  changePassword(
    @CurrentUser() user: { id: string },
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.id, dto);
  }
}
