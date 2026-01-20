import { Controller, Post, Body, Req, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../gaurds/jwt/jwt.guard';
import { LoginDto } from './dto/login.dto';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  @Throttle({ default: { ttl: 60000, limit: 5 } }) // 5 attempts per minute per IP
  async login(
    @Body() dto: LoginDto,
    @Req() req: any,
  ) {
    const ip =
      req.headers['x-forwarded-for'] ||
      req.ip ||
      req.connection?.remoteAddress ||
      null;
    // console.log('DTO received:', dto);
    return this.authService.login(dto, ip);
  }

  @Post('refresh')
  @Throttle({ default: { ttl: 60000, limit: 10 } }) // 10 attempts per minute per IP
  async refresh(@Body('refreshToken') refreshToken: string, @Req() req: any) {
    const ip =
      req.headers['x-forwarded-for'] ||
      req.ip ||
      req.connection?.remoteAddress ||
      null;

    return this.authService.refresh(refreshToken, ip);
  }

  @Post('logout')
  @Throttle({ default: { ttl: 60000, limit: 20 } }) // 20 attempts per minute per IP
  async logout(@Body('refreshToken') refreshToken: string) {
    return this.authService.logout(refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: any) {
    return req.user;
  }
}
