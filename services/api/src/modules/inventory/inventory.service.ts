import { Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OperationLogService } from '../operation-log/operation-log.service';
import { User } from '../user/user.entity';
import { CreateInventoryDto, UpdateInventoryDto } from './dto/create-inventory.dto';
import { DailyInventory } from './inventory.entity';

type RequestUser = {
  sub?: string;
  username?: string;
  storeId?: string;
};

type RequestLike = {
  user?: RequestUser;
};

@Injectable({ scope: Scope.REQUEST })
export class InventoryService {
  constructor(
    @InjectRepository(DailyInventory)
    private readonly inventoryRepository: Repository<DailyInventory>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly operationLogService: OperationLogService,
    @Inject(REQUEST)
    private readonly request: RequestLike,
  ) {}

  async create(storeId: string, createInventoryDto: CreateInventoryDto, userId: string) {
    const inventory = this.inventoryRepository.create({
      ...createInventoryDto,
      storeId,
      reportedBy: userId,
    });
    const saved = await this.inventoryRepository.save(inventory);
    await this.logOperation({
      storeId: saved.storeId,
      action: 'create',
      targetId: saved.id,
      targetName: saved.date,
      before: null,
      after: saved,
      summary: `Created inventory for ${saved.date}`,
    });
    return saved;
  }

  async findByStoreAndDate(storeId: string, date: string) {
    const inventory = await this.inventoryRepository.findOneBy({ storeId, date });
    if (!inventory) {
      throw new NotFoundException('Inventory not found for the given store and date');
    }
    return inventory;
  }

  async findLatest(storeId: string) {
    const inventory = await this.inventoryRepository.findOne({
      where: { storeId },
      order: { date: 'DESC' },
    });
    if (!inventory) {
      throw new NotFoundException('No inventory found for the given store');
    }
    return inventory;
  }

  async update(id: string, updateInventoryDto: UpdateInventoryDto) {
    const inventory = await this.inventoryRepository.findOneBy({ id });
    if (!inventory) {
      throw new NotFoundException('Inventory not found');
    }
    const before = inventory;
    await this.inventoryRepository.update(id, updateInventoryDto);
    const after = await this.inventoryRepository.findOneBy({ id });
    await this.logOperation({
      storeId: after?.storeId || before.storeId,
      action: 'update',
      targetId: before.id,
      targetName: before.date,
      before,
      after,
      summary: `Updated inventory for ${before.date}`,
    });
    return after;
  }

  private async logOperation(options: {
    storeId: string;
    action: 'create' | 'update';
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
      'inventory',
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
