import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dish } from '../dish/dish.entity';
import { CreateDishFeedbackDto, UpdateDishFeedbackDto } from './dto/create-dish-feedback.dto';
import { DishFeedback } from './dish-feedback.entity';

@Injectable()
export class DishFeedbackService {
  constructor(
    @InjectRepository(DishFeedback)
    private readonly dishFeedbackRepository: Repository<DishFeedback>,
    @InjectRepository(Dish)
    private readonly dishRepository: Repository<Dish>,
  ) {}

  async create(dto: CreateDishFeedbackDto, userId?: string) {
    const dish = dto.dishName ? null : await this.dishRepository.findOne({ where: { id: dto.dishId } });
    const saved = await this.dishFeedbackRepository.save(
      this.dishFeedbackRepository.create({
        storeId: dto.storeId,
        date: dto.date,
        mealType: dto.mealType,
        dishId: dto.dishId,
        dishName: dto.dishName || dish?.name || dto.dishId,
        feedbackLevel: dto.feedbackLevel ?? dto.leftoverLevel,
        remainingQty: dto.remainingQty,
        remark: dto.remark ?? dto.note,
        reportedBy: userId,
      }),
    );
    return this.serialize(saved);
  }

  async findByQuery(storeId: string, date?: string, mealType?: string) {
    const where: Record<string, unknown> = { storeId };
    if (date) where.date = date;
    if (mealType) where.mealType = mealType;
    const records = await this.dishFeedbackRepository.find({
      where,
      order: { date: 'DESC', createdAt: 'DESC' },
    });
    return records.map((record) => this.serialize(record));
  }

  async update(id: string, dto: UpdateDishFeedbackDto) {
    const feedback = await this.dishFeedbackRepository.findOneBy({ id });
    if (!feedback) {
      throw new NotFoundException('Dish feedback not found');
    }
    await this.dishFeedbackRepository.update(id, {
      feedbackLevel: dto.feedbackLevel ?? dto.leftoverLevel,
      remainingQty: dto.remainingQty,
      remark: dto.remark ?? dto.note,
    });
    const updated = await this.dishFeedbackRepository.findOneBy({ id });
    return updated ? this.serialize(updated) : null;
  }

  private serialize(record: DishFeedback) {
    return {
      ...record,
      leftoverLevel: record.feedbackLevel,
      note: record.remark,
      recordedBy: record.reportedBy,
    };
  }
}
