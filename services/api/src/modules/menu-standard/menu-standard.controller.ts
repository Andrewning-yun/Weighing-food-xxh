import { Body, Controller, Get, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../user/user.entity';
import { UpsertMenuStandardsDto } from './dto/upsert-menu-standards.dto';
import { MenuStandardService } from './menu-standard.service';

@Controller('menu-standards')
@UseGuards(AuthGuard)
export class MenuStandardController {
  constructor(private readonly menuStandardService: MenuStandardService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.CHEF_MANAGER, UserRole.STORE_MANAGER)
  findByQuery(@Query('storeId') storeId: string, @Query('mealType') mealType?: string) {
    return this.menuStandardService.findByQuery(storeId, mealType);
  }

  @Put()
  @Roles(UserRole.ADMIN, UserRole.CHEF_MANAGER, UserRole.STORE_MANAGER)
  upsert(@Body() dto: UpsertMenuStandardsDto) {
    return this.menuStandardService.upsert(dto);
  }
}
