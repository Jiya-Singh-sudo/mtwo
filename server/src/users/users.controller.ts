import { Controller, Get, Post, Put, Delete, Body, Param, Req, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserTableQueryDto } from './dto/user-table-query.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../gaurds/jwt/jwt.guard';
import { PermissionsGuard } from '../gaurds/permissions/permissions.guard';
import { Permissions } from '../decorators/permissions/permissions.decorator';
import { getRequestContext } from 'common/utlis/request-context.util';

@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) { }
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('user.view')
  @Get()
  findAll(@Query() query: UserTableQueryDto) {
    return this.service.findAll(query);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('user.view')
  @Get('all')
  findAllIncludingInactive(@Query() query: UserTableQueryDto) {
    return this.service.findAll({
      ...query,
      status: 'All'
    });
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('user.create')
  @Post()
  create(@Body() dto: CreateUserDto, @Req() req: any) {
    const { user, ip } = getRequestContext(req);
    return this.service.create(dto, user, ip);
  }
  @Post('forgot-password')
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
    @Req() req: any,
  ) {
    const { user, ip } = getRequestContext(req);
    return this.service.forgotPassword(dto, ip);
  }

  @Post('reset-password')
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Req() req: any,
  ) {
    const { user, ip } = getRequestContext(req);
    return this.service.resetPassword(dto, ip);
  }
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('user.update')
  // Update by username (frontend should pass username in URL)
  @Put(':username')
  update(@Param('username') username: string, @Body() dto: UpdateUserDto, @Req() req: any) {
    const { user, ip } = getRequestContext(req);
    return this.service.update(username, dto, user, ip);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('user.delete')
  @Delete(':username')
  softDelete(@Param('username') username: string, @Req() req: any) {
    const { user, ip } = getRequestContext(req);
    return this.service.softDelete(username, user, ip);
  }

  // Login endpoint: returns user (without password) and updates last_login
  @Post('login')
  async login(@Body() body: { username: string; password: string }, @Req() req: any) {
    const { user, ip } = getRequestContext(req);
    const res = await this.service.login(body.username, body.password, ip);
    if (!res) {
      return { success: false, message: 'Invalid credentials' };
    }
    return { success: true, user: res };
  }
}
