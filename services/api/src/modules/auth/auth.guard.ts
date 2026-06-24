import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import { UserRole } from '../user/user.entity';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('缺少登录凭证');
    }

    const token = authorization.slice('Bearer '.length);

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as jwt.JwtPayload & {
        sub: string;
        role: UserRole;
        username: string;
      };

      request.user = payload;

      const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

      if (requiredRoles?.length && !requiredRoles.includes(payload.role)) {
        throw new ForbiddenException('当前角色无权访问');
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException('登录状态已失效');
    }
  }
}
