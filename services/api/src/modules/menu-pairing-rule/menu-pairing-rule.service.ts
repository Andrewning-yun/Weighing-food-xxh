import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuPairingRule } from './menu-pairing-rule.entity';
import { UpsertMenuPairingRulesDto } from './dto/upsert-menu-pairing-rules.dto';

@Injectable()
export class MenuPairingRuleService {
  constructor(
    @InjectRepository(MenuPairingRule)
    private readonly menuPairingRuleRepository: Repository<MenuPairingRule>,
  ) {}

  async findByQuery(storeId: string, mealType?: string) {
    const records = await this.menuPairingRuleRepository.find({
      where: mealType ? { storeId, mealType: mealType as any } : { storeId },
      order: { createdAt: 'ASC' },
    });
    return records.map((record) => this.serialize(record));
  }

  async upsert(dto: UpsertMenuPairingRulesDto) {
    await this.menuPairingRuleRepository.delete({
      storeId: dto.storeId,
      mealType: dto.mealType,
    });
    const entities = dto.items.map((item) =>
      this.menuPairingRuleRepository.create({
        storeId: dto.storeId,
        mealType: dto.mealType,
        tagCode: this.normalizeTag(item.tagCode || item.tagName || ''),
        minCount: item.minCount,
        maxCount: item.maxCount ?? 0,
        description: item.description,
        isActive: item.isActive ?? true,
      }),
    );
    const saved = await this.menuPairingRuleRepository.save(entities);
    return saved.map((record) => this.serialize(record));
  }

  private serialize(record: MenuPairingRule) {
    return {
      ...record,
      tagName: this.toDisplayTag(record.tagCode),
    };
  }

  private normalizeTag(value: string) {
    if (value === '大荤') return 'big_meat';
    if (value === '小荤') return 'small_meat';
    if (value === '素菜') return 'vegetable';
    return value;
  }

  private toDisplayTag(value: string) {
    if (value === 'big_meat') return '大荤';
    if (value === 'small_meat') return '小荤';
    if (value === 'vegetable') return '素菜';
    return value;
  }
}
