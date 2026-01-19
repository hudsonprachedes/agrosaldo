import { Body, Controller, Get, Headers, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(
    @Body() dto: LoginDto,
    @Headers('x-app-version') appVersion?: string,
  ) {
    return this.authService.login(dto, appVersion);
  }

  @Post('register')
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
}
