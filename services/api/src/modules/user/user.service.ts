import { Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { hashPassword } from '../../common/password';
import { OperationLogService } from '../operation-log/operation-log.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole } from './user.entity';

type RequestUser = {
  sub?: string;
  username?: string;
  storeId?: string;
};

type RequestLike = {
  user?: RequestUser;
};

@Injectable({ scope: Scope.REQUEST })
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly operationLogService: OperationLogService,
    @Inject(REQUEST)
    private readonly request: RequestLike,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const user = this.userRepository.create({
      username: createUserDto.username,
      passwordHash: hashPassword(createUserDto.password),
      name: createUserDto.name,
      role: createUserDto.role || UserRole.CHEF,
      storeId: createUserDto.storeId,
      station: createUserDto.station,
      wechatOpenId: createUserDto.wechatOpenId,
    });
    const saved = await this.userRepository.save(user);
    await this.logOperation({
      storeId: saved.storeId || (await this.resolveActor()).storeId,
      action: 'create',
      targetId: saved.id,
      targetName: saved.name,
      before: null,
      after: this.sanitizeUser(saved),
      summary: `Created user ${saved.username}`,
    });
    return saved;
  }

  findAll(storeId?: string) {
    return this.userRepository.find({
      where: storeId ? { storeId } : {},
      relations: ['store'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['store'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const before = await this.findOne(id);

    const updatePayload: Partial<User> = {
      username: updateUserDto.username,
      name: updateUserDto.name,
      role: updateUserDto.role,
      storeId: updateUserDto.storeId,
      station: updateUserDto.station,
      wechatOpenId: updateUserDto.wechatOpenId,
    };

    if (updateUserDto.password) {
      updatePayload.passwordHash = hashPassword(updateUserDto.password);
    }

    await this.userRepository.update(id, updatePayload);
    const after = await this.findOne(id);
    await this.logOperation({
      storeId: after.storeId || (await this.resolveActor()).storeId,
      action: 'update',
      targetId: after.id,
      targetName: after.name,
      before: this.sanitizeUser(before),
      after: this.sanitizeUser(after),
      summary: `Updated user ${after.username}`,
    });
    return after;
  }

  async remove(id: string) {
    const before = await this.findOne(id);
    await this.userRepository.delete(id);
    await this.logOperation({
      storeId: before.storeId || (await this.resolveActor()).storeId,
      action: 'remove',
      targetId: before.id,
      targetName: before.name,
      before: this.sanitizeUser(before),
      after: null,
      summary: `Removed user ${before.username}`,
    });
    return { id };
  }

  private sanitizeUser(user: User | null | undefined) {
    if (!user) {
      return user;
    }

    const { passwordHash, store, ...rest } = user as User & { store?: unknown };
    return rest;
  }

  private async logOperation(options: {
    storeId: string;
    action: 'create' | 'update' | 'remove';
    targetId: string;
    targetName?: string;
    before?: unknown;
    after?: unknown;
    summary: string;
  }) {
    const actor = await this.resolveActor();
    await this.operationLogService.log(
      options.storeId,
      actor.id,
      actor.name,
      'user',
      options.action,
      options.targetId,
      options.targetName,
      options.before as Record<string, any> | undefined,
      options.after as Record<string, any> | undefined,
      options.summary,
    );
  }

  private async resolveActor() {
    const requestUser = this.request?.user;
    const actorId = requestUser?.sub || 'unknown';
    const actor = await this.userRepository.findOne({ where: { id: actorId } }).catch(() => null);

    return {
      id: actorId,
      name: actor?.name || requestUser?.username || actorId,
      storeId: requestUser?.storeId || actor?.storeId || 'unknown',
    };
  }
}
