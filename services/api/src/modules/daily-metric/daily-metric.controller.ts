import { Body, Controller, Get, Param, Put, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../user/user.entity';
import { CostingService } from '../costing/costing.service';
import { CreateDailyMetricDto, UpdateDailyMetricDto } from './dto/create-daily-metric.dto';
import { DailyMetricService } from './daily-metric.service';

@Controller('daily-metrics')
@UseGuards(AuthGuard)
export class DailyMetricController {
  constructor(
    private readonly dailyMetricService: DailyMetricService,
    private readonly costingService: CostingService,
  ) {}

  @Get()
  findByQuery(
    @Query('storeId') storeId: string,
    @Query('date') date?: string,
    @Query('mealType') mealType?: string,
  ) {
    return this.dailyMetricService.findByQuery(storeId, date, mealType);
  }

  @Get('latest')
  findLatest(@Query('storeId') storeId: string, @Query('mealType') mealType?: string) {
    return this.dailyMetricService.findLatest(storeId, mealType);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER)
  async create(@Body() dto: CreateDailyMetricDto, @Req() req: any) {
    const result = await this.dailyMetricService.create(dto, req.user?.sub);
    this.costingService.invalidateStoreCache(dto.storeId);
    return result;
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER)
  update(@Param('id') id: string, @Body() dto: UpdateDailyMetricDto) {
    return this.dailyMetricService.update(id, dto);
  }
}
