import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../user/user.entity';
import { OperationLogService } from './operation-log.service';

@Controller('operation-logs')
@UseGuards(AuthGuard)
export class OperationLogController {
  constructor(private readonly operationLogService: OperationLogService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER)
  findByQuery(
    @Query('storeId') storeId: string,
    @Query('module') module?: string,
    @Query('action') action?: string,
    @Query('operatedBy') operatedBy?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.operationLogService.findByQuery(
      storeId,
      module,
      action,
      operatedBy,
      startDate,
      endDate,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('stats')
  @Roles(UserRole.ADMIN)
  getStats(@Query('storeId') storeId: string) {
    return this.operationLogService.getStats(storeId);
  }
}
