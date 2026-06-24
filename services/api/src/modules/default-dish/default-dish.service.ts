import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Dish } from '../dish/dish.entity';
import { UpsertDefaultDishesDto } from './dto/upsert-default-dishes.dto';
import { DefaultDish } from './default-dish.entity';

@Injectable()
export class DefaultDishService {
  constructor(
    @InjectRepository(DefaultDish)
    private readonly defaultDishRepository: Repository<DefaultDish>,
    @InjectRepository(Dish)
    private readonly dishRepository: Repository<Dish>,
  ) {}

  findByQuery(storeId: string, mealType?: string, dayOfWeek?: number) {
    const where: Record<string, unknown> = { storeId };
    if (mealType) where.mealType = mealType;
    if (typeof dayOfWeek === 'number' && !Number.isNaN(dayOfWeek)) where.dayOfWeek = dayOfWeek;
    return this.defaultDishRepository.find({
      where,
      order: { dayOfWeek: 'ASC', createdAt: 'ASC' },
    });
  }

  async upsert(dto: UpsertDefaultDishesDto) {
    await this.defaultDishRepository.delete({
      storeId: dto.storeId,
      mealType: dto.mealType,
      dayOfWeek: dto.dayOfWeek,
    });

    // Resolve missing dishNames from dishId
    const itemsNeedingName = dto.items.filter(
      (item) => item.dishName == null || String(item.dishName).trim() === '',
    );
    if (itemsNeedingName.length > 0) {
      const dishIds = [...new Set(itemsNeedingName.map((item) => item.dishId))];
      const dishes = dishIds.length
        ? await this.dishRepository.findBy({ id: In(dishIds) })
        : [];
      const nameMap = new Map(dishes.map((d) => [d.id, d.name]));
      for (const item of itemsNeedingName) {
        item.dishName = nameMap.get(item.dishId) ?? '';
      }
    }

    const entities = dto.items.map((item) =>
      this.defaultDishRepository.create({
        storeId: dto.storeId,
        mealType: dto.mealType,
        dayOfWeek: dto.dayOfWeek,
        dishId: item.dishId,
        dishName: item.dishName ?? '',
        isActive: item.isActive ?? true,
        remark: item.remark,
      }),
    );
    return this.defaultDishRepository.save(entities);
  }
}
