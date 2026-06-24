import { Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CostingService } from '../costing/costing.service';
import { OperationLogService } from '../operation-log/operation-log.service';
import { User } from '../user/user.entity';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { Ingredient } from './ingredient.entity';

type RequestUser = {
  sub?: string;
  username?: string;
  storeId?: string;
};

type RequestLike = {
  user?: RequestUser;
};

@Injectable({ scope: Scope.REQUEST })
export class IngredientService {
  constructor(
    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly costingService: CostingService,
    private readonly operationLogService: OperationLogService,
    @Inject(REQUEST)
    private readonly request: RequestLike,
  ) {}

  async create(createIngredientDto: CreateIngredientDto) {
    const ingredient = this.ingredientRepository.create({
      ...createIngredientDto,
      costPerUnit: createIngredientDto.costPerUnit ?? createIngredientDto.price,
      isActive: createIngredientDto.isActive ?? true,
    });
    const saved = await this.ingredientRepository.save(ingredient);
    await this.logOperation({
      action: 'create',
      targetId: saved.id,
      targetName: saved.name,
      before: null,
      after: saved,
      summary: `Created ingredient ${saved.name}`,
    });
    return saved;
  }

  findAll() {
    return this.ingredientRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string) {
    const ingredient = await this.ingredientRepository.findOneBy({ id });
    if (!ingredient) {
      throw new NotFoundException('Ingredient not found');
    }
    return ingredient;
  }

  async update(id: string, updateIngredientDto: UpdateIngredientDto) {
    const before = await this.findOne(id);
    await this.ingredientRepository.update(id, updateIngredientDto);
    await this.costingService.recalculateAllDishes();
    const after = await this.findOne(id);
    await this.logOperation({
      action: 'update',
      targetId: after.id,
      targetName: after.name,
      before,
      after,
      summary: `Updated ingredient ${after.name} and recalculated dish costs`,
    });
    return after;
  }

  async remove(id: string) {
    const before = await this.findOne(id);
    await this.ingredientRepository.delete(id);
    await this.logOperation({
      action: 'remove',
      targetId: before.id,
      targetName: before.name,
      before,
      after: null,
      summary: `Removed ingredient ${before.name}`,
    });
    return { id };
  }

  private async logOperation(options: {
    action: 'create' | 'update' | 'remove';
    targetId: string;
    targetName?: string;
    before?: unknown;
    after?: unknown;
    summary: string;
  }) {
    const actor = await this.resolveActor();
    await this.operationLogService.log(
      actor.storeId,
      actor.id,
      actor.name,
      'ingredient',
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
