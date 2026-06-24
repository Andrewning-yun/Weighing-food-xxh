import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../user/user.entity';
import { CreateAiSuggestionDto } from './dto/create-ai-suggestion.dto';
import { AiService } from './ai.service';

@Controller('ai')
@UseGuards(AuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('daily-briefing')
  getDailyBriefing(@Query('storeId') storeId: string, @Query('date') date: string) {
    return this.aiService.getDailyBriefing(storeId, date);
  }

  @Get('suggestions')
  findSuggestions(@Query('storeId') storeId: string) {
    return this.aiService.findSuggestions(storeId);
  }

  @Post('suggestions')
  @Roles(UserRole.ADMIN)
  createSuggestion(@Body() dto: CreateAiSuggestionDto) {
    return this.aiService.createSuggestion(dto);
  }

  @Post('suggestions/:id/apply')
  @Roles(UserRole.ADMIN)
  applySuggestion(@Param('id') id: string) {
    return this.aiService.applySuggestion(id);
  }
}
