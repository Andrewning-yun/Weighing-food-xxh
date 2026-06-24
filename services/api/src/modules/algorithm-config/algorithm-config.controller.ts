import { Body, Controller, Get, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../user/user.entity';
import { CostingService } from '../costing/costing.service';
import { UpdateAlgorithmConfigDto } from './dto/update-algorithm-config.dto';
import { AlgorithmConfigService } from './algorithm-config.service';

@Controller('algorithm-config')
@UseGuards(AuthGuard)
export class AlgorithmConfigController {
  constructor(
    private readonly algorithmConfigService: AlgorithmConfigService,
    private readonly costingService: CostingService,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.CHEF_MANAGER, UserRole.BUYER)
  findByStore(@Query('storeId') storeId: string) {
    return this.algorithmConfigService.findByStore(storeId);
  }

  @Put()
  @Roles(UserRole.ADMIN)
  async upsert(@Body() dto: UpdateAlgorithmConfigDto) {
    const result = await this.algorithmConfigService.upsert(dto);
    if (dto.storeId) {
      this.costingService.invalidateStoreCache(dto.storeId);
    } else {
      this.costingService.invalidateAllCache();
    }
    return result;
  }
}
