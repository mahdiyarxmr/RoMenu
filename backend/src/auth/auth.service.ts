import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(mobile: string, pass: string): Promise<any> {
    const user = await this.usersService.findByMobile(mobile);
    if (!user) {
      throw new UnauthorizedException('شماره موبایل یا رمز عبور اشتباه است');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('حساب کاربری شما غیرفعال شده است');
    }
    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('شماره موبایل یا رمز عبور اشتباه است');
    }
    const { passwordHash, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = { sub: user.id, mobile: user.mobile, role: user.role };
    return {
      token: this.jwtService.sign(payload),
      user,
    };
  }

  async register(params: { name: string; mobile: string; password: string }) {
    if (!params.mobile || !params.mobile.match(/^09\d{9}$/)) {
      throw new BadRequestException('شماره موبایل باید با ۰۹ شروع شده و ۱۱ رقم باشد');
    }
    if (!params.password || params.password.length < 6) {
      throw new BadRequestException('رمز عبور باید حداقل ۶ کاراکتر باشد');
    }
    if (!params.name || params.name.trim().length === 0) {
      throw new BadRequestException('نام و نام خانوادگی الزامی است');
    }

    const user = await this.usersService.create(params);
    const { passwordHash, ...cleanUser } = user;
    return this.login(cleanUser);
  }
}
