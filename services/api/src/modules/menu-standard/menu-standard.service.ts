import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpsertMenuStandardsDto } from './dto/upsert-menu-standards.dto';
import { MenuStandard } from './menu-standard.entity';

@Injectable()
export class MenuStandardService {
  constructor(
    @InjectRepository(MenuStandard)
    private readonly menuStandardRepository: Repository<MenuStandard>,
  ) {}

  findByQuery(storeId: string, mealType?: string) {
    return this.menuStandardRepository.find({
      where: mealType ? { storeId, mealType: mealType as any } : { storeId },
      order: { category: 'ASC' },
    });
  }

  async upsert(dto: UpsertMenuStandardsDto) {
    await this.menuStandardRepository.delete({
      storeId: dto.storeId,
      mealType: dto.mealType,
    });

    const entities = dto.items.map((item) =>
      this.menuStandardRepository.create({
        storeId: dto.storeId,
        mealType: dto.mealType,
        category: item.category,
        targetCount: item.targetCount,
        remark: item.remark,
      }),
    );
    return this.menuStandardRepository.save(entities);
  }
}
