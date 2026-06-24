import { Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OperationLogService } from '../operation-log/operation-log.service';
import { User } from '../user/user.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { Store } from './store.entity';

type RequestUser = {
  sub?: string;
  username?: string;
  storeId?: string;
};

type RequestLike = {
  user?: RequestUser;
};

@Injectable({ scope: Scope.REQUEST })
export class StoreService {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly operationLogService: OperationLogService,
    @Inject(REQUEST)
    private readonly request: RequestLike,
  ) {}

  async create(createStoreDto: CreateStoreDto) {
    const store = this.storeRepository.create(createStoreDto);
    const saved = await this.storeRepository.save(store);
    await this.logOperation({
      storeId: saved.id,
      action: 'create',
      targetId: saved.id,
      targetName: saved.name,
      before: null,
      after: saved,
      summary: `Created store ${saved.name}`,
    });
    return saved;
  }

  findAll() {
    return this.storeRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const store = await this.storeRepository.findOneBy({ id });
    if (!store) {
      throw new NotFoundException('Store not found');
    }
    return store;
  }

  async update(id: string, updateStoreDto: UpdateStoreDto) {
    const before = await this.findOne(id);
    await this.storeRepository.update(id, updateStoreDto);
    const after = await this.findOne(id);
    await this.logOperation({
      storeId: after.id,
      action: 'update',
      targetId: after.id,
      targetName: after.name,
      before,
      after,
      summary: `Updated store ${after.name}`,
    });
    return after;
  }

  async remove(id: string) {
    const before = await this.findOne(id);
    await this.storeRepository.delete(id);
    await this.logOperation({
      storeId: before.id,
      action: 'remove',
      targetId: before.id,
      targetName: before.name,
      before,
      after: null,
      summary: `Removed store ${before.name}`,
    });
    return { id };
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
      'store',
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
    };
  }
}
