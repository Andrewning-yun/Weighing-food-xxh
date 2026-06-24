import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '../user/user.entity';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Roles } from './roles.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.username, loginDto.password);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@Req() request: { user: { sub: string } }) {
    return this.authService.me(request.user.sub);
  }

  @Post('wx-login')
  wxLogin(@Body() body: { code: string }) {
    return this.authService.wxLogin(body.code);
  }

  @Get('bind-status')
  getBindStatus(@Query('code') code: string) {
    return this.authService.getBindStatus(code);
  }

  @Post('bind-code')
  bindCode(@Body() body: { code: string; bindCode: string }) {
    return this.authService.bindCode(body.bindCode, body.code);
  }

  @Post('generate-bind-code')
  @UseGuards(AuthGuard)
  @Roles(UserRole.ADMIN)
  generateBindCode(
    @Req() request: { user: { sub: string } },
    @Body() body: { username: string },
  ) {
    return this.authService.generateBindCode(request.user.sub, body.username);
  }
}
