import { Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditAction, AuditModuleName } from '../audit/audit.entity';
import { AuditService } from '../audit/audit.service';
import { DishTypeTagService } from '../dish-type-tag/dish-type-tag.service';
import { OperationLogService } from '../operation-log/operation-log.service';
import { User, UserRole } from '../user/user.entity';
import { CreateDishDto } from './dto/create-dish.dto';
import { UpdateDishDto } from './dto/update-dish.dto';
import { Dish, MealType } from './dish.entity';

type RequestUser = {
  sub?: string;
  username?: string;
  storeId?: string;
};

type RequestLike = {
  user?: RequestUser;
};

@Injectable({ scope: Scope.REQUEST })
export class DishService {
  constructor(
    @InjectRepository(Dish)
    private readonly dishRepository: Repository<Dish>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly auditService: AuditService,
    private readonly operationLogService: OperationLogService,
    private readonly dishTypeTagService: DishTypeTagService,
    @Inject(REQUEST)
    private readonly request: RequestLike,
  ) {}

  async create(createDishDto: CreateDishDto) {
    const manualTagCode = this.normalizeDishTypeTag(createDishDto.dishTypeTag);
    const dishTypeTag =
      manualTagCode ||
      (await this.dishTypeTagService.resolveDishTypeTag({
        name: createDishDto.name,
        category: createDishDto.category,
        mealType: createDishDto.mealType ?? MealType.LUNCH,
        relatedIngredients: createDishDto.relatedIngredients,
      }));

    const dishData = {
      ...createDishDto,
      dishTypeTag,
      ingredientCost: 0,
      isActive: createDishDto.isActive ?? true,
      mealType: createDishDto.mealType ?? MealType.LUNCH,
      dishTypeTagManualOverride: Boolean(manualTagCode),
    };

    const actor = await this.resolveActor();
    const isBreakfastRole =
      actor.role === UserRole.BREAKFAST_CHEF || actor.role === UserRole.BREAKFAST_ASSISTANT;

    if (isBreakfastRole) {
      const audit = await this.auditService.create(
        {
          storeId: actor.storeId,
          module: AuditModuleName.DISH,
          action: AuditAction.CREATE,
          targetId: '',
          targetName: dishData.name,
          before: null,
          after: dishData as unknown as Record<string, unknown>,
        },
        actor.id,
      );

      return {
        auditSubmitted: true,
        auditId: audit.id,
        status: audit.status,
        message: `${dishData.name} 已提交审核`,
      };
    }

    const dish = this.dishRepository.create(dishData);
    const saved = await this.dishRepository.save(dish);
    await this.logOperation({
      action: 'create',
      targetId: saved.id,
      targetName: saved.name,
      before: null,
      after: saved,
      summary: `Created dish ${saved.name}`,
    });
    return this.serialize(saved);
  }

  async findAll() {
    const dishes = await this.dishRepository.find({ order: { createdAt: 'DESC' } });
    return dishes.map((dish) => this.serialize(dish));
  }

  async findOne(id: string) {
    const dish = await this.dishRepository.findOneBy({ id });
    if (!dish) {
      throw new NotFoundException('Dish not found');
    }
    return this.serialize(dish);
  }

  async update(id: string, updateDishDto: UpdateDishDto) {
    const before = await this.findRawOne(id);
    const actor = await this.resolveActor();
    const after = await this.buildAuditPreview(before, updateDishDto);
    const audit = await this.auditService.create(
      {
        storeId: actor.storeId,
        module: AuditModuleName.DISH,
        action: AuditAction.UPDATE,
        targetId: before.id,
        targetName: before.name,
        before: this.toAuditSnapshot(before),
        after: this.toAuditSnapshot(after),
      },
      actor.id,
    );

    return {
      auditSubmitted: true,
      auditId: audit.id,
      status: audit.status,
      message: `${before.name} 已提交审核`,
    };
  }

  async updateTypeTag(id: string, dishTypeTag: string | null, manualOverride?: boolean) {
    const before = await this.findRawOne(id);
    const resolvedTag =
      this.normalizeDishTypeTag(dishTypeTag) ||
      (await this.dishTypeTagService.resolveDishTypeTag({
        name: before.name,
        category: before.category,
        mealType: before.mealType,
        relatedIngredients: before.relatedIngredients,
      }));

    await this.dishRepository.update(id, {
      dishTypeTag: resolvedTag,
      dishTypeTagManualOverride: dishTypeTag ? manualOverride !== false : false,
    });

    const after = await this.findRawOne(id);
    await this.logOperation({
      action: 'update',
      targetId: after.id,
      targetName: after.name,
      before,
      after,
      summary: `Updated dish type tag for ${after.name}`,
    });
    return this.serialize(after);
  }

  async remove(id: string) {
    const before = await this.findRawOne(id);
    const actor = await this.resolveActor();
    const audit = await this.auditService.create(
      {
        storeId: actor.storeId,
        module: AuditModuleName.DISH,
        action: AuditAction.DELETE,
        targetId: before.id,
        targetName: before.name,
        before: this.toAuditSnapshot(before),
        after: null,
      },
      actor.id,
    );

    return {
      auditSubmitted: true,
      auditId: audit.id,
      status: audit.status,
      message: `${before.name} 已提交删除审核`,
    };
  }

  private async findRawOne(id: string) {
    const dish = await this.dishRepository.findOneBy({ id });
    if (!dish) {
      throw new NotFoundException('Dish not found');
    }
    return dish;
  }

  private serialize(dish: Dish) {
    return {
      ...dish,
      dishTypeTag: this.displayDishTypeTag(dish.dishTypeTag),
    };
  }

  private async buildAuditPreview(before: Dish, updateDishDto: UpdateDishDto): Promise<Dish> {
    const manualTagCode = this.normalizeDishTypeTag(updateDishDto.dishTypeTag);
    const merged = this.dishRepository.create({
      ...before,
      ...updateDishDto,
      dishTypeTag: manualTagCode ?? before.dishTypeTag,
      dishTypeTagManualOverride: manualTagCode ? true : (updateDishDto.dishTypeTagManualOverride ?? before.dishTypeTagManualOverride),
    });

    if (!merged.dishTypeTagManualOverride) {
      merged.dishTypeTag = await this.dishTypeTagService.resolveDishTypeTag({
        name: merged.name,
        category: merged.category,
        mealType: merged.mealType,
        relatedIngredients: merged.relatedIngredients,
      });
      merged.dishTypeTagManualOverride = false;
    }

    return merged;
  }

  private toAuditSnapshot(dish: Dish | null) {
    if (!dish) {
      return null;
    }

    return {
      id: dish.id,
      name: dish.name,
      category: dish.category,
      station: dish.station,
      description: dish.description,
      coverImageUrl: dish.coverImageUrl,
      ingredients: dish.ingredients,
      steps: dish.steps,
      ingredientCost: Number(dish.ingredientCost ?? 0),
      isActive: dish.isActive,
      recommendWeight: dish.recommendWeight,
      mealType: dish.mealType,
      relatedIngredients: dish.relatedIngredients,
      dishTypeTag: dish.dishTypeTag,
      dishTypeTagManualOverride: dish.dishTypeTagManualOverride,
    };
  }

  private normalizeDishTypeTag(tag?: string | null) {
    if (!tag) {
      return null;
    }
    if (tag === '大荤') return 'big_meat';
    if (tag === '小荤') return 'small_meat';
    if (tag === '素菜') return 'vegetable';
    return tag;
  }

  private displayDishTypeTag(tag?: string | null) {
    if (tag === 'big_meat') return '大荤';
    if (tag === 'small_meat') return '小荤';
    if (tag === 'vegetable') return '素菜';
    return tag;
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
      'dish',
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
    const actor = await this.userRepository
      .findOne({
        where: { id: actorId },
        relations: ['store'],
      })
      .catch(() => null);

    return {
      id: actorId,
      name: actor?.name || requestUser?.username || actorId,
      role: actor?.role || 'chef',
      storeId: requestUser?.storeId || actor?.storeId || 'unknown',
    };
  }
}
