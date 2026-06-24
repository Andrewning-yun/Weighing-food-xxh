import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAiSuggestionDto } from './dto/create-ai-suggestion.dto';
import { AiSuggestion, AiSuggestionStatus } from './ai-suggestion.entity';

@Injectable()
export class AiService {
  constructor(
    @InjectRepository(AiSuggestion)
    private readonly aiSuggestionRepository: Repository<AiSuggestion>,
  ) {}

  findSuggestions(storeId: string) {
    return this.aiSuggestionRepository.find({
      where: { storeId },
      order: { date: 'DESC', createdAt: 'DESC' },
    });
  }

  async createSuggestion(dto: CreateAiSuggestionDto) {
    return this.aiSuggestionRepository.save(this.aiSuggestionRepository.create(dto));
  }

  async getDailyBriefing(storeId: string, date: string) {
    const suggestions = await this.aiSuggestionRepository.find({
      where: { storeId, date },
      order: { createdAt: 'DESC' },
    });
    return {
      storeId,
      date,
      summary: suggestions.length > 0 ? suggestions.map((item) => item.title).join(' / ') : 'No AI briefing yet',
      suggestions,
    };
  }

  async applySuggestion(id: string) {
    const suggestion = await this.aiSuggestionRepository.findOne({ where: { id } });
    if (!suggestion) {
      throw new NotFoundException('AI suggestion not found');
    }
    await this.aiSuggestionRepository.update(id, {
      status: AiSuggestionStatus.APPLIED,
      appliedAt: new Date(),
    });
    return this.aiSuggestionRepository.findOne({ where: { id } });
  }
}
