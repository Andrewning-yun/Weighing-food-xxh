import { Body, Controller, Get, Patch, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../user/user.entity';
import { AuditService } from './audit.service';
import { CreateAuditDto } from './dto/create-audit.dto';
import { RejectAuditDto } from './dto/reject-audit.dto';

@Controller('audit')
@UseGuards(AuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.CHEF_MANAGER, UserRole.STORE_MANAGER, UserRole.BUYER)
  create(@Body() dto: CreateAuditDto, @Req() req: any) {
    return this.auditService.create(dto, req.user?.sub);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER, UserRole.BUYER)
  findByQuery(
    @Query('storeId') storeId: string,
    @Query('module') module?: string,
    @Query('status') status?: string,
    @Query('action') action?: string,
    @Query('keyword') keyword?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditService.findByQuery({
      storeId,
      module,
      status,
      action,
      keyword,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER)
  getStats(@Query('storeId') storeId: string) {
    return this.auditService.getStats(storeId);
  }

  @Patch(':id/approve')
  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER, UserRole.BUYER)
  approve(@Param('id') id: string, @Req() req: any) {
    return this.auditService.approve(id, req.user?.sub);
  }

  @Patch(':id/reject')
  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER, UserRole.BUYER)
  reject(@Param('id') id: string, @Body() dto: RejectAuditDto, @Req() req: any) {
    return this.auditService.reject(id, dto.rejectReason, req.user?.sub);
  }
}
