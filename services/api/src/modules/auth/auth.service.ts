import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as jwt from 'jsonwebtoken';
import { Repository } from 'typeorm';
import { verifyPassword } from '../../common/password';
import { User } from '../user/user.entity';

type BindCodeRecord = {
  userId: string;
  username: string;
  expiresAt: number;
};

@Injectable()
export class AuthService {
  private readonly bindCodes = new Map<string, BindCodeRecord>();

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async login(username: string, password: string) {
    const user = await this.userRepository.findOne({
      where: { username },
      relations: ['store'],
    });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    return {
      token: this.createToken(user),
      user: this.toSafeUser(user),
    };
  }

  async me(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['store'],
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    return this.toSafeUser(user);
  }

  async wxLogin(code: string) {
    const openId = await this.resolveWechatOpenId(code);
    const user = await this.userRepository.findOne({
      where: { wechatOpenId: openId },
      relations: ['store'],
    });

    if (!user) {
      throw new UnauthorizedException('请先绑定账号');
    }

    return {
      token: this.createToken(user),
      user: this.toSafeUser(user),
    };
  }

  async getBindStatus(code: string) {
    const openId = await this.resolveWechatOpenId(code);
    const user = await this.userRepository.findOne({
      where: { wechatOpenId: openId },
      relations: ['store'],
    });

    return {
      bound: Boolean(user),
      user: user ? this.toSafeUser(user) : null,
    };
  }

  async bindCode(bindCode: string, code: string) {
    const openId = await this.resolveWechatOpenId(code);
    const normalizedBindCode = bindCode.trim();
    const record = this.bindCodes.get(normalizedBindCode);

    if (!record || record.expiresAt < Date.now()) {
      this.bindCodes.delete(normalizedBindCode);
      throw new UnauthorizedException('绑定码已失效，请重新获取');
    }

    const existingBinding = await this.userRepository.findOne({
      where: { wechatOpenId: openId },
    });

    if (existingBinding && existingBinding.id !== record.userId) {
      throw new UnauthorizedException('当前微信已绑定其他账号');
    }

    const user = await this.userRepository.findOne({
      where: { id: record.userId },
      relations: ['store'],
    });

    if (!user) {
      this.bindCodes.delete(normalizedBindCode);
      throw new UnauthorizedException('绑定目标账号不存在');
    }

    user.wechatOpenId = openId;
    await this.userRepository.save(user);
    this.bindCodes.delete(normalizedBindCode);

    return {
      token: this.createToken(user),
      user: this.toSafeUser(user),
    };
  }

  async generateBindCode(operatorUserId: string, username: string) {
    const operator = await this.userRepository.findOneBy({ id: operatorUserId });
    if (!operator) {
      throw new UnauthorizedException('当前登录状态无效');
    }

    const targetUser = await this.userRepository.findOne({
      where: { username: username.trim() },
      relations: ['store'],
    });

    if (!targetUser) {
      throw new UnauthorizedException('要绑定的员工不存在');
    }

    const bindCode = this.createBindCode();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    this.bindCodes.set(bindCode, {
      userId: targetUser.id,
      username: targetUser.username,
      expiresAt,
    });

    return {
      code: bindCode,
      expiresAt: new Date(expiresAt).toISOString(),
      user: this.toSafeUser(targetUser),
    };
  }

  private createToken(user: User) {
    return jwt.sign(
      {
        sub: user.id,
        username: user.username,
        role: user.role,
        storeId: user.storeId,
        station: user.station,
      },
      (process.env.JWT_SECRET || 'dev-secret') as jwt.Secret,
      {
        expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'],
      },
    );
  }

  private async resolveWechatOpenId(code: string) {
    const normalizedCode = code?.trim();
    if (!normalizedCode) {
      throw new UnauthorizedException('缺少微信登录凭证');
    }

    return `mock-openid:${normalizedCode}`;
  }

  private createBindCode() {
    let bindCode = '';
    do {
      bindCode = String(Math.floor(100000 + Math.random() * 900000));
    } while (this.bindCodes.has(bindCode));
    return bindCode;
  }

  private toSafeUser(user: User) {
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      storeId: user.storeId,
      storeName: user.store?.name,
      station: user.station,
      wechatOpenId: user.wechatOpenId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
