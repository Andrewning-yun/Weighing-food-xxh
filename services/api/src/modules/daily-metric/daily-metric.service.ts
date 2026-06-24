import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDailyMetricDto, UpdateDailyMetricDto } from './dto/create-daily-metric.dto';
import { DailyMetric } from './daily-metric.entity';

@Injectable()
export class DailyMetricService {
  constructor(
    @InjectRepository(DailyMetric)
    private readonly dailyMetricRepository: Repository<DailyMetric>,
  ) {}

  async create(dto: CreateDailyMetricDto, userId?: string) {
    const saved = await this.dailyMetricRepository.save(
      this.dailyMetricRepository.create({
        storeId: dto.storeId,
        date: dto.date,
        mealType: dto.mealType,
        ticketPrice: dto.ticketPrice ?? dto.avgTicketPrice ?? 0,
        guestCount: dto.guestCount ?? dto.customerCount ?? 0,
        weather: dto.weather,
        reportedBy: userId,
      }),
    );
    return this.serialize(saved);
  }

  async findByQuery(storeId: string, date?: string, mealType?: string) {
    const where: Record<string, unknown> = { storeId };
    if (date) where.date = date;
    if (mealType) where.mealType = mealType;
    const records = await this.dailyMetricRepository.find({
      where,
      order: { date: 'DESC', createdAt: 'DESC' },
    });
    return records.map((record) => this.serialize(record));
  }

  async findLatest(storeId: string, mealType?: string) {
    const metric = await this.dailyMetricRepository.findOne({
      where: mealType ? { storeId, mealType: mealType as any } : { storeId },
      order: { date: 'DESC', createdAt: 'DESC' },
    });
    return metric ? this.serialize(metric) : null;
  }

  async update(id: string, dto: UpdateDailyMetricDto) {
    await this.dailyMetricRepository.update(id, {
      ...dto,
      ticketPrice: dto.ticketPrice ?? dto.avgTicketPrice,
      guestCount: dto.guestCount ?? dto.customerCount,
    });
    const record = await this.dailyMetricRepository.findOneBy({ id });
    return record ? this.serialize(record) : null;
  }

  private serialize(record: DailyMetric) {
    const avgTicketPrice = Number(record.ticketPrice || 0);
    const customerCount = Number(record.guestCount || 0);
    return {
      ...record,
      ticketPrice: avgTicketPrice,
      guestCount: customerCount,
      avgTicketPrice,
      customerCount,
      totalRevenue: Number((avgTicketPrice * customerCount).toFixed(2)),
      recordedBy: record.reportedBy,
    };
  }
}
