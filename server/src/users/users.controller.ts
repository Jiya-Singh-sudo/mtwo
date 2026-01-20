import {
  Controller, Get, Post, Put, Delete, Body, Param, Req
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../gaurds/jwt/jwt.guard';
import { PermissionsGuard } from '../gaurds/permissions/permissions.guard';
import { Permissions } from '../decorators/permissions/permissions.decorator';


@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  private extractIp(req: any): string {
    let ip =
      req.headers['x-forwarded-for'] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip ||
      '';
    if (ip === '::1' || ip === '127.0.0.1') return '127.0.0.1';
    ip = ip.toString().replace('::ffff:', '');
    if (ip.includes(',')) ip = ip.split(',')[0].trim();
    return ip;
  }
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('user.view')
  @Get()
  findAll() {
    return this.service.findAll(true);
  }
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('user.view')
  @Get('all')
  findAllIncludingInactive() {
    return this.service.findAll(false);
  }
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('user.create')
  @Post()
  create(@Body() dto: CreateUserDto, @Req() req: any) {
    const user = req.headers['x-user'] || 'system';
    const ip = this.extractIp(req);
    return this.service.create(dto, user, ip);
  }
  @Post('forgot-password')
    async forgotPassword(
      @Body() dto: ForgotPasswordDto,
      @Req() req: any,
    ) {
      return this.service.forgotPassword(dto, req.ip);
    }

    @Post('reset-password')
    async resetPassword(
      @Body() dto: ResetPasswordDto,
      @Req() req: any,
    ) {
      return this.service.resetPassword(dto, req.ip);
    }
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('user.update')
  // Update by username (frontend should pass username in URL)
  @Put(':username')
  update(@Param('username') username: string, @Body() dto: UpdateUserDto, @Req() req: any) {
    const user = req.headers['x-user'] || 'system';
    const ip = this.extractIp(req);
    return this.service.update(username, dto, user, ip);
  }
  
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('user.delete')
  @Delete(':username')
  softDelete(@Param('username') username: string, @Req() req: any) {
    const user = req.headers['x-user'] || 'system';
    const ip = this.extractIp(req);
    return this.service.softDelete(username, user, ip);
  }

  // Login endpoint: returns user (without password) and updates last_login
  @Post('login')
  async login(@Body() body: { username: string; password: string }, @Req() req: any) {
    const ip = this.extractIp(req);
    const res = await this.service.login(body.username, body.password, ip);
    if (!res) {
      return { success: false, message: 'Invalid credentials' };
    }
    return { success: true, user: res };
  }
}
