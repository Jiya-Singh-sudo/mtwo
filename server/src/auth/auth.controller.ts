import { Controller, Post, Body, Req, Get, UseGuards, Res, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../gaurds/jwt/jwt.guard';
import { LoginMDto } from './dto/loginM.dto';
import { LoginDto } from './dto/login.dto';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  @Throttle({ default: { ttl: 60000, limit: 5 } }) // 5 attempts per minute per IP
  async login(
    @Body() dto: LoginDto,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response, // 👈 ADD THIS
  ) {
    const ip =
      req.headers['x-forwarded-for'] ||
      req.ip ||
      req.connection?.remoteAddress ||
      null;
    const result = await this.authService.login(dto, ip);

        // ✅ SET COOKIE HERE (correct place)
    // res.cookie("refreshToken", result.refreshToken, {
    //   httpOnly: true,
    //   secure: false, // true in production
    //   sameSite: "none",
    // });
    // res.cookie("refreshToken", result.refreshToken, {
    //   httpOnly: true,
    //   secure: false,        // ✅ MUST be true in production
    //   sameSite: "lax",    // ✅ REQUIRED for cross-domain
    //   // domain: ".myapp.local", // ✅ IMPORTANT (shared across subdomains)
    //   // domain: "10.73.252.234",
    //   path: "/",
    // });
    console.log("COOKIE:", req.cookies);
    // console.log('DTO received:', dto);
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      payload: result.payload,
    };
    // return this.authService.login(dto, ip);
  }
  @Post('loginM') 
  @Throttle({ default: { ttl: 6000, limit: 500 } }) // 5 attempts per minute per IP
  async loginM(
    @Body() dto: LoginMDto,
    @Req() req: any,
  ) {
    const ip =
      req.headers['x-forwarded-for'] ||
      req.ip ||
      req.connection?.remoteAddress ||
      null;
    // console.log('DTO received:', dto);
    return this.authService.loginM(dto, ip);
  }
  
  @Post('refresh')
  @Throttle({ default: { ttl: 600000, limit: 100 } })
  async refresh(
    @Body('refreshToken') refreshToken: string,
    @Req() req: any,
  ) {
    if (!refreshToken) {
      throw new UnauthorizedException(
        'No refresh token provided',
      );
    }

    const ip =
      req.headers['x-forwarded-for'] ||
      req.ip ||
      req.connection?.remoteAddress ||
      null;

    const result = await this.authService.refresh(
      refreshToken,
      ip,
    );

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      payload: result.payload,
    };
  }
  // @Post('refresh')
  // @Throttle({ default: { ttl: 600000, limit: 100 } })
  // async refresh(@Req() req: any) {
  //   const refreshToken = req.cookies?.refreshToken; // ✅ GET FROM COOKIE

  //   if (!refreshToken) {
  //     throw new UnauthorizedException('No refresh token provided');
  //   }

  //   const ip =
  //     req.headers['x-forwarded-for'] ||
  //     req.ip ||
  //     req.connection?.remoteAddress ||
  //     null;

  //   return this.authService.refresh(refreshToken, ip);
  // }
  // @Post('refresh')
  // @Throttle({ default: { ttl: 600000, limit: 100 } }) // 10 attempts per minute per IP
  // async refresh(@Body('refreshToken') refreshToken: string, @Req() req: any) {
  //   const ip =
  //     req.headers['x-forwarded-for'] ||
  //     req.ip ||
  //     req.connection?.remoteAddress ||
  //     null;

  //   return this.authService.refresh(refreshToken, ip);
  // }
  @Post('logout')
  async logout(@Body('refreshToken') refreshToken: string) {
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }
    return { success: true };
  }
  // @Post('logout')
  // @Throttle({ default: { ttl: 60000, limit: 20 } }) // 20 attempts per minute per IP
  // async logout(@Body('refreshToken') refreshToken: string) {
  //   return this.authService.logout(refreshToken);
  // }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: any) {
    return req.user;
  }
}
