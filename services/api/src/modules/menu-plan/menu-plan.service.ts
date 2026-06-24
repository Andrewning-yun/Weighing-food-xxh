import { ForbiddenException, Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CostingService } from '../costing/costing.service';
import { MealType } from '../dish/dish.entity';
import { OperationLogService } from '../operation-log/operation-log.service';
import { User, UserRole } from '../user/user.entity';
import { CreateMenuPlanDto, UpdateMenuPlanDto } from './dto/create-menu-plan.dto';
import { MenuPlan, MenuPlanStatus } from './menu-plan.entity';

type RequestUser = {
  sub?: string;
  username?: string;
  storeId?: string;
};

type RequestLike = {
  user?: RequestUser;
};

@Injectable({ scope: Scope.REQUEST })
export class MenuPlanService {
  constructor(
    @InjectRepository(MenuPlan)
    private readonly menuPlanRepository: Repository<MenuPlan>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly operationLogService: OperationLogService,
    private readonly costingService: CostingService,
    @Inject(REQUEST)
    private readonly request: RequestLike,
  ) {}

  async create(storeId: string, dto: CreateMenuPlanDto, userId: string) {
    const menuPlan = this.menuPlanRepository.create({
      ...dto,
      storeId,
      createdBy: userId,
      status: MenuPlanStatus.DRAFT,
    });
    const saved = await this.menuPlanRepository.save(menuPlan);
    await this.logOperation({
      storeId: saved.storeId,
      action: 'create',
      targetId: saved.id,
      targetName: `${saved.date} ${saved.mealType}`,
      before: null,
      after: saved,
      summary: `Created menu plan for ${saved.date} ${saved.mealType}`,
    });
    return this.decoratePlan(saved);
  }

  async findByQuery(storeId: string, date?: string, mealType?: MealType) {
    const where: Record<string, unknown> = { storeId };
    if (date) {
      where.date = date;
    }
    if (mealType) {
      where.mealType = mealType;
    }
    const plans = await this.menuPlanRepository.find({
      where,
      order: { date: 'DESC', createdAt: 'DESC' },
    });
    return Promise.all(plans.map((plan) => this.decoratePlan(plan)));
  }

  async findById(id: string) {
    const menuPlan = await this.menuPlanRepository.findOneBy({ id });
    if (!menuPlan) {
      throw new NotFoundException('Menu plan not found');
    }
    return this.decoratePlan(menuPlan);
  }

  async update(id: string, dto: UpdateMenuPlanDto, user: { sub: string; role: UserRole }) {
    const menuPlan = await this.findPlainById(id);

    this.enforceRoleMealTypeRestriction(user.role, menuPlan.mealType);

    await this.menuPlanRepository.update(id, dto);
    const after = await this.findPlainById(id);
    await this.logOperation({
      storeId: after.storeId,
      action: 'update',
      targetId: after.id,
      targetName: `${after.date} ${after.mealType}`,
      before: menuPlan,
      after,
      summary: `Updated menu plan for ${after.date} ${after.mealType}`,
    });
    return this.decoratePlan(after);
  }

  async publish(id: string, userId: string) {
    const before = await this.findPlainById(id);

    await this.menuPlanRepository.update(id, {
      status: MenuPlanStatus.PUBLISHED,
      reviewedBy: userId,
    });
    const after = await this.findPlainById(id);
    await this.logOperation({
      storeId: after.storeId,
      action: 'publish',
      targetId: after.id,
      targetName: `${after.date} ${after.mealType}`,
      before,
      after,
      summary: `Published menu plan for ${after.date} ${after.mealType}`,
    });
    return this.decoratePlan(after);
  }

  private async decoratePlan(plan: MenuPlan) {
    const menuScore = await this.costingService.scoreMenuSelection({
      storeId: plan.storeId,
      date: plan.date,
      mealType: plan.mealType,
      dishes: plan.dishes || [],
    });
    return {
      ...plan,
      menuScore,
      score: menuScore.total,
      pairingGaps: menuScore.pairingGaps.map((gap) => ({
        tagName: gap.tagName,
        currentCount: gap.currentCount,
        minCount: gap.minCount,
        maxCount: gap.maxCount,
        gap: gap.gap,
        description: gap.description,
      })),
    };
  }

  private async findPlainById(id: string) {
    const menuPlan = await this.menuPlanRepository.findOneBy({ id });
    if (!menuPlan) {
      throw new NotFoundException('Menu plan not found');
    }
    return menuPlan;
  }

  private enforceRoleMealTypeRestriction(role: UserRole, mealType: MealType) {
    if (role === UserRole.BREAKFAST_CHEF && mealType !== MealType.BREAKFAST) {
      throw new ForbiddenException('Breakfast chef can only manage breakfast menu plans');
    }
    if (role === UserRole.CHEF_MANAGER && mealType !== MealType.LUNCH) {
      throw new ForbiddenException('Chef manager can only manage lunch menu plans');
    }
  }

  private async logOperation(options: {
    storeId: string;
    action: 'create' | 'update' | 'publish';
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
      'menu-plan',
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
