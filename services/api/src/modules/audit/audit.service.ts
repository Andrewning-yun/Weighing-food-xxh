import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dish } from '../dish/dish.entity';
import { OperationLogService } from '../operation-log/operation-log.service';
import { User } from '../user/user.entity';
import { AuditAction, AuditModuleName, AuditRecord, AuditStatus } from './audit.entity';
import { CreateAuditDto } from './dto/create-audit.dto';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditRecord)
    private readonly auditRepository: Repository<AuditRecord>,
    @InjectRepository(Dish)
    private readonly dishRepository: Repository<Dish>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly operationLogService: OperationLogService,
  ) {}

  async create(dto: CreateAuditDto, actorId?: string) {
    const actor = await this.resolveUser(dto.operatedBy || actorId);
    const record = this.auditRepository.create({
      storeId: dto.storeId,
      module: dto.module,
      action: dto.action,
      targetId: dto.targetId,
      targetName: dto.targetName || null,
      operatedBy: dto.operatedBy || actor.id,
      operatedByName: dto.operatedByName || actor.name,
      before: dto.before ?? null,
      after: dto.after ?? null,
      status: AuditStatus.PENDING,
      reviewedBy: null,
      reviewedByName: null,
      reviewedAt: null,
      rejectReason: null,
    });
    const saved = await this.auditRepository.save(record);
    return this.serialize(saved);
  }

  async findByQuery(options: {
    storeId: string;
    module?: string;
    status?: string;
    action?: string;
    keyword?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 20));
    const query = this.auditRepository.createQueryBuilder('audit').where('audit.storeId = :storeId', {
      storeId: options.storeId,
    });

    if (options.module) {
      query.andWhere('audit.module = :module', { module: options.module });
    }

    if (options.status) {
      query.andWhere('audit.status = :status', { status: options.status });
    }

    if (options.action) {
      query.andWhere('audit.action = :action', { action: options.action });
    }

    if (options.keyword) {
      query.andWhere(
        '(audit.targetName LIKE :keyword OR audit.operatedByName LIKE :keyword OR audit.targetId LIKE :keyword)',
        { keyword: `%${options.keyword}%` },
      );
    }

    const [records, total] = await query
      .orderBy('audit.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: records.map((record) => this.serialize(record)),
      total,
      page,
      limit,
    };
  }

  async getStats(storeId: string) {
    const byStatusRaw = await this.auditRepository
      .createQueryBuilder('audit')
      .select('audit.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('audit.storeId = :storeId', { storeId })
      .groupBy('audit.status')
      .getRawMany<{ status: string; count: string }>();

    const byModuleRaw = await this.auditRepository
      .createQueryBuilder('audit')
      .select('audit.module', 'module')
      .addSelect('COUNT(*)', 'count')
      .where('audit.storeId = :storeId', { storeId })
      .groupBy('audit.module')
      .getRawMany<{ module: string; count: string }>();

    return {
      byStatus: byStatusRaw.map((item) => ({ status: item.status, count: Number(item.count) })),
      byModule: byModuleRaw.map((item) => ({ module: item.module, count: Number(item.count) })),
    };
  }

  async approve(id: string, reviewerId?: string) {
    const record = await this.findOneRaw(id);
    if (record.status !== AuditStatus.PENDING) {
      throw new BadRequestException('该审核记录已处理');
    }

    const reviewer = await this.resolveUser(reviewerId);
    await this.applyAudit(record);
    record.status = AuditStatus.APPROVED;
    record.reviewedBy = reviewer.id;
    record.reviewedByName = reviewer.name;
    record.reviewedAt = new Date();
    record.rejectReason = null;
    const saved = await this.auditRepository.save(record);
    return this.serialize(saved);
  }

  async reject(id: string, rejectReason?: string, reviewerId?: string) {
    const record = await this.findOneRaw(id);
    if (record.status !== AuditStatus.PENDING) {
      throw new BadRequestException('该审核记录已处理');
    }

    const reviewer = await this.resolveUser(reviewerId);
    record.status = AuditStatus.REJECTED;
    record.reviewedBy = reviewer.id;
    record.reviewedByName = reviewer.name;
    record.reviewedAt = new Date();
    record.rejectReason = rejectReason?.trim() || '未填写原因';
    const saved = await this.auditRepository.save(record);
    return this.serialize(saved);
  }

  private async applyAudit(record: AuditRecord) {
    if (record.module !== AuditModuleName.DISH) {
      return;
    }

    if (record.action === AuditAction.UPDATE) {
      await this.applyDishUpdate(record);
      return;
    }

    if (record.action === AuditAction.DELETE) {
      await this.applyDishDelete(record);
      return;
    }

    if (record.action === AuditAction.CREATE) {
      await this.applyDishCreate(record);
    }
  }

  private async applyDishUpdate(record: AuditRecord) {
    const payload = this.normalizeDishPayload(record.after);
    if (!payload) {
      throw new BadRequestException('审核记录缺少更新内容');
    }

    const dish = await this.dishRepository.findOne({ where: { id: record.targetId } });
    if (!dish) {
      throw new NotFoundException('待审核的菜品不存在');
    }

    await this.dishRepository.update(record.targetId, payload);
    const updated = await this.dishRepository.findOne({ where: { id: record.targetId } });
    if (!updated) {
      throw new NotFoundException('菜品更新后未找到记录');
    }

    await this.operationLogService.log(
      record.storeId,
      record.operatedBy,
      record.operatedByName,
      'dish',
      'update',
      updated.id,
      updated.name,
      (record.before as Record<string, any>) || undefined,
      this.toOperationSnapshot(updated),
      `${updated.name} 审核通过并已更新`,
    );
  }

  private async applyDishDelete(record: AuditRecord) {
    const dish = await this.dishRepository.findOne({ where: { id: record.targetId } });
    if (!dish) {
      throw new NotFoundException('待删除的菜品不存在');
    }

    await this.dishRepository.delete(record.targetId);
    await this.operationLogService.log(
      record.storeId,
      record.operatedBy,
      record.operatedByName,
      'dish',
      'remove',
      dish.id,
      dish.name,
      (record.before as Record<string, any>) || undefined,
      undefined,
      `${dish.name} 审核通过并已删除`,
    );
  }

  private async applyDishCreate(record: AuditRecord) {
    const payload = this.normalizeDishPayload(record.after);
    if (!payload) {
      throw new BadRequestException('审核记录缺少创建内容');
    }

    const created = this.dishRepository.create({
      ...payload,
      id: record.targetId || undefined,
    });
    const saved = await this.dishRepository.save(created);
    await this.operationLogService.log(
      record.storeId,
      record.operatedBy,
      record.operatedByName,
      'dish',
      'create',
      saved.id,
      saved.name,
      undefined,
      this.toOperationSnapshot(saved),
      `${saved.name} 审核通过并已创建`,
    );
  }

  private normalizeDishPayload(data?: Record<string, unknown> | null): Partial<Dish> | null {
    if (!data) {
      return null;
    }

    return {
      name: typeof data.name === 'string' ? data.name : undefined,
      category: typeof data.category === 'string' ? (data.category as Dish['category']) : undefined,
      station: typeof data.station === 'string' ? (data.station as Dish['station']) : undefined,
      description: typeof data.description === 'string' ? data.description : undefined,
      coverImageUrl: typeof data.coverImageUrl === 'string' ? data.coverImageUrl : undefined,
      ingredients: Array.isArray(data.ingredients) ? (data.ingredients as Dish['ingredients']) : undefined,
      steps: Array.isArray(data.steps) ? (data.steps as Dish['steps']) : undefined,
      ingredientCost:
        typeof data.ingredientCost === 'number'
          ? data.ingredientCost
          : Number(data.ingredientCost ?? 0),
      isActive: typeof data.isActive === 'boolean' ? data.isActive : true,
      recommendWeight:
        typeof data.recommendWeight === 'number' ? data.recommendWeight : Number(data.recommendWeight ?? 1),
      mealType: typeof data.mealType === 'string' ? (data.mealType as Dish['mealType']) : undefined,
      relatedIngredients: typeof data.relatedIngredients === 'string' ? data.relatedIngredients : undefined,
      dishTypeTag: typeof data.dishTypeTag === 'string' ? data.dishTypeTag : null,
      dishTypeTagManualOverride:
        typeof data.dishTypeTagManualOverride === 'boolean' ? data.dishTypeTagManualOverride : false,
    };
  }

  private toOperationSnapshot(dish: Dish) {
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

  private async findOneRaw(id: string) {
    const record = await this.auditRepository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException('审核记录不存在');
    }
    return record;
  }

  private async resolveUser(userId?: string) {
    if (!userId) {
      return {
        id: 'unknown',
        name: '未知用户',
      };
    }

    const user = await this.userRepository.findOne({ where: { id: userId } }).catch(() => null);
    return {
      id: userId,
      name: user?.name || user?.username || userId,
    };
  }

  private serialize(record: AuditRecord) {
    return {
      ...record,
      before: record.before || null,
      after: record.after || null,
    };
  }
}
