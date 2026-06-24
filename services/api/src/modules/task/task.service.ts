import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Dish, MealType } from '../dish/dish.entity';
import { Ingredient } from '../ingredient/ingredient.entity';
import { UserRole } from '../user/user.entity';
import { Task, TaskSource, TaskStatus, TaskItem } from './task.entity';

export interface CreateTaskDto {
  storeId: string;
  date: string;
  mealType?: MealType;
  title: string;
  items: TaskItem[];
  assignedTo?: string;
}

export interface UpdateTaskStatusDto {
  status: TaskStatus;
  assignedTo?: string;
}

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Dish)
    private readonly dishRepository: Repository<Dish>,
    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,
  ) {}

  async findByQuery(storeId: string, date?: string, mealType?: MealType) {
    const qb = this.taskRepository
      .createQueryBuilder('task')
      .where('task.storeId = :storeId', { storeId });

    if (date) {
      qb.andWhere('task.date = :date', { date });
    }

    if (mealType) {
      qb.andWhere('task.mealType = :mealType', { mealType });
    }

    qb.orderBy('task.createdAt', 'DESC');
    return qb.getMany();
  }

  async create(storeId: string, dto: CreateTaskDto, userId: string): Promise<Task> {
    const task = this.taskRepository.create({
      storeId,
      date: dto.date,
      mealType: dto.mealType ?? MealType.LUNCH,
      source: TaskSource.MANUAL,
      title: dto.title,
      items: dto.items,
      assignedTo: dto.assignedTo ?? null,
      status: TaskStatus.PENDING,
    });
    return this.taskRepository.save(task);
  }

  async updateStatus(
    id: string,
    dto: UpdateTaskStatusDto,
    user: { sub: string; role: UserRole },
  ): Promise<Task> {
    const task = await this.taskRepository.findOneBy({ id });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const userId = user.sub;
    const role = user.role;

    // PREP users can only modify tasks assigned to themselves
    if (role === UserRole.PREP) {
      if (task.assignedTo && task.assignedTo !== userId) {
        throw new ForbiddenException('PREP users can only modify tasks assigned to themselves');
      }
    }

    // BREAKFAST_CHEF and BREAKFAST_ASSISTANT can only modify breakfast tasks
    if (
      role === UserRole.BREAKFAST_CHEF ||
      role === UserRole.BREAKFAST_ASSISTANT
    ) {
      if (task.mealType !== MealType.BREAKFAST) {
        throw new ForbiddenException(
          'Breakfast staff can only modify breakfast tasks',
        );
      }
    }

    const updateData: Partial<Task> = {};

    if (dto.status !== undefined) {
      updateData.status = dto.status;
    }

    if (dto.assignedTo !== undefined) {
      updateData.assignedTo = dto.assignedTo;
    }

    // If task is being marked as completed, record who completed it and when
    if (dto.status === TaskStatus.COMPLETED) {
      updateData.completedBy = userId;
      updateData.completedAt = new Date().toISOString().split('T')[0];
    }

    await this.taskRepository.update(id, updateData);
    return this.taskRepository.findOneBy({ id });
  }

  async generateFromMenu(
    storeId: string,
    date: string,
    mealType: MealType,
    userId: string,
  ): Promise<Task[]> {
    // Fetch all active dishes for the given meal type
    const dishes = await this.dishRepository
      .createQueryBuilder('dish')
      .where('dish.mealType = :mealType', { mealType })
      .andWhere('dish.isActive = :isActive', { isActive: true })
      .getMany();

    if (!dishes.length) {
      return [];
    }

    // Aggregate ingredients across all dishes (BOM roll-up)
    const ingredientMap = new Map<
      string,
      { ingredientId: string; name: string; quantity: number; unit: string }
    >();

    for (const dish of dishes) {
      for (const ing of dish.ingredients || []) {
        const key = ing.ingredientId;
        const existing = ingredientMap.get(key);
        if (existing) {
          existing.quantity += ing.quantity;
        } else {
          ingredientMap.set(key, {
            ingredientId: ing.ingredientId,
            name: '', // name resolved from ingredient catalog if available
            quantity: ing.quantity,
            unit: ing.unit,
          });
        }
      }
    }

    const ingredientIds = Array.from(ingredientMap.keys());
    const ingredientNames = new Map<string, string>();

    if (ingredientIds.length > 0) {
      const ingredients = await this.ingredientRepository.findBy({ id: In(ingredientIds) });
      ingredients.forEach((ingredient) => {
        ingredientNames.set(ingredient.id, ingredient.name);
      });
    }

    const items: TaskItem[] = Array.from(ingredientMap.values()).map((entry) => ({
      ingredientId: entry.ingredientId,
      name: ingredientNames.get(entry.ingredientId) || entry.name || entry.ingredientId,
      quantity: Math.round(entry.quantity * 100) / 100,
      unit: entry.unit,
    }));

    const mealLabel = mealType === MealType.BREAKFAST ? 'Breakfast' : 'Lunch';
    const task = this.taskRepository.create({
      storeId,
      date,
      mealType,
      source: TaskSource.AUTO,
      title: `${mealLabel} prep - ${date} (auto-generated)`,
      items,
      status: TaskStatus.PENDING,
    });

    const saved = await this.taskRepository.save(task);
    return [saved];
  }
}
