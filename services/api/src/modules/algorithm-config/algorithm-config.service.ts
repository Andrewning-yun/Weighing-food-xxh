import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateAlgorithmConfigDto } from './dto/update-algorithm-config.dto';
import { AlgorithmConfig } from './algorithm-config.entity';

type WebAdminConfigPayload = {
  ticketPrice?: {
    deviationThreshold?: number;
    scaleCap?: number;
  };
  freshness?: {
    lookbackDays?: number;
  };
  diversity?: {
    perAttributeBonus?: number;
  };
  category?: {
    lowBonus?: number;
  };
  feedback?: {
    mediumLeftoverPenalty?: number;
  };
};

@Injectable()
export class AlgorithmConfigService {
  constructor(
    @InjectRepository(AlgorithmConfig)
    private readonly algorithmConfigRepository: Repository<AlgorithmConfig>,
  ) {}

  async findByStore(storeId: string) {
    const existing = await this.ensureExisting(storeId);
    return {
      storeId,
      config: this.serialize(existing),
    };
  }

  async upsert(dto: UpdateAlgorithmConfigDto & { config?: WebAdminConfigPayload }) {
    const normalized = this.normalizePayload(dto);
    const existing = await this.algorithmConfigRepository.findOne({ where: { storeId: dto.storeId } });
    if (!existing) {
      const created = await this.algorithmConfigRepository.save(
        this.algorithmConfigRepository.create(normalized),
      );
      return { storeId: dto.storeId, config: this.serialize(created) };
    }
    await this.algorithmConfigRepository.update(existing.id, normalized);
    const updated = await this.ensureExisting(dto.storeId);
    return { storeId: dto.storeId, config: this.serialize(updated) };
  }

  private async ensureExisting(storeId: string) {
    const existing = await this.algorithmConfigRepository.findOne({ where: { storeId } });
    if (existing) {
      return existing;
    }
    return this.algorithmConfigRepository.save(this.algorithmConfigRepository.create({ storeId }));
  }

  private normalizePayload(dto: UpdateAlgorithmConfigDto & { config?: WebAdminConfigPayload }) {
    const config = dto.config || {};
    return {
      storeId: dto.storeId,
      ticketPriceBonusWeight: dto.ticketPriceBonusWeight ?? config.ticketPrice?.scaleCap ?? 1,
      pairingBonusWeight: dto.pairingBonusWeight ?? 1,
      feedbackBonusWeight:
        dto.feedbackBonusWeight ?? Math.abs(config.feedback?.mediumLeftoverPenalty ?? 8) / 8,
      diversityBonusWeight:
        dto.diversityBonusWeight ?? (config.diversity?.perAttributeBonus ?? 8) / 8,
      categoryBonusWeight: dto.categoryBonusWeight ?? (config.category?.lowBonus ?? 5) / 5,
      menuCompletenessWeight: dto.menuCompletenessWeight ?? 1,
      menuFreshnessWeight: dto.menuFreshnessWeight ?? 1,
      menuGrossMarginWeight: dto.menuGrossMarginWeight ?? 1,
      defaultDishPenalty: dto.defaultDishPenalty ?? 1,
      ticketPriceThreshold: dto.ticketPriceThreshold ?? config.ticketPrice?.deviationThreshold ?? 0.1,
      ticketPriceCapMultiplier: dto.ticketPriceCapMultiplier ?? config.ticketPrice?.scaleCap ?? 3,
      recentDaysWindow: dto.recentDaysWindow ?? config.freshness?.lookbackDays ?? 7,
    };
  }

  private serialize(entity: AlgorithmConfig) {
    return {
      ticketPrice: {
        deviationThreshold: Number(entity.ticketPriceThreshold ?? 0.1),
        lowTicketMeatBonus: Number(entity.ticketPriceBonusWeight ?? 1) * 12,
        lowTicketVegPenalty: 10,
        highTicketHighMarginBonus: Number(entity.ticketPriceBonusWeight ?? 1) * 10,
        highTicketLowMarginPenalty: 6,
        scaleCap: Number(entity.ticketPriceCapMultiplier ?? 3),
      },
      freshness: {
        lookbackDays: Number(entity.recentDaysWindow ?? 7),
        freshnessBonus: 10,
        freshnessPenalty: -8,
      },
      profit: {
        highMarginBalance: Number(entity.menuGrossMarginWeight ?? 1) * 10,
        mediumMarginBalance: Number(entity.menuGrossMarginWeight ?? 1) * 8,
        trafficBalance: 5,
      },
      diversity: {
        perAttributeBonus: Number(entity.diversityBonusWeight ?? 1) * 8,
        diversityPenalty: -2,
      },
      category: {
        lowThreshold: 2,
        lowBonus: Number(entity.categoryBonusWeight ?? 1) * 5,
        highThreshold: 5,
        highPenalty: -3,
      },
      feedback: {
        highLeftoverPenalty: -15 * Number(entity.feedbackBonusWeight ?? 1),
        mediumLeftoverPenalty: -8 * Number(entity.feedbackBonusWeight ?? 1),
        lowLeftoverBonus: 5 * Number(entity.feedbackBonusWeight ?? 1),
      },
      output: {
        recommendLimit: 20,
      },
    };
  }
}
