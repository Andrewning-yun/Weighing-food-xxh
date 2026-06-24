import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../user/user.entity';
import { CreateSupplementaryOrderDto } from './dto/create-supplementary-order.dto';
import { SupplementaryOrderService } from './supplementary-order.service';

@Controller('supplementary-orders')
@UseGuards(AuthGuard)
export class SupplementaryOrderController {
  constructor(private readonly service: SupplementaryOrderService) {}

  @Post()
  @Roles(
    UserRole.ADMIN,
    UserRole.CHEF_MANAGER,
    UserRole.CHEF,
    UserRole.PREP,
    UserRole.BREAKFAST_CHEF,
    UserRole.BREAKFAST_ASSISTANT,
  )
  create(@Body() dto: CreateSupplementaryOrderDto) {
    return this.service.create(dto);
  }

  @Get()
  findByMenuPlan(@Query('menuPlanId') menuPlanId: string) {
    return this.service.findByMenuPlan(menuPlanId);
  }

  @Get('by-date')
  findByDate(@Query('date') date: string, @Query('storeId') storeId?: string) {
    return this.service.findByDate(date, storeId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.CHEF_MANAGER)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
