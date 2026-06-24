import { Body, Controller, Get, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../user/user.entity';
import { UpsertDefaultDishesDto } from './dto/upsert-default-dishes.dto';
import { DefaultDishService } from './default-dish.service';

@Controller('default-dishes')
@UseGuards(AuthGuard)
export class DefaultDishController {
  constructor(private readonly defaultDishService: DefaultDishService) {}

  @Get()
  findByQuery(
    @Query('storeId') storeId: string,
    @Query('mealType') mealType?: string,
    @Query('dayOfWeek') dayOfWeek?: string,
  ) {
    return this.defaultDishService.findByQuery(
      storeId,
      mealType,
      dayOfWeek == null ? undefined : parseInt(dayOfWeek, 10),
    );
  }

  @Put()
  @Roles(UserRole.ADMIN, UserRole.CHEF_MANAGER, UserRole.STORE_MANAGER)
  upsert(@Body() dto: UpsertDefaultDishesDto) {
    return this.defaultDishService.upsert(dto);
  }
}
