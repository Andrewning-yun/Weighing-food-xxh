import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiController } from './ai.controller';
import { AiSuggestion } from './ai-suggestion.entity';
import { AiService } from './ai.service';

@Module({
  imports: [TypeOrmModule.forFeature([AiSuggestion])],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
