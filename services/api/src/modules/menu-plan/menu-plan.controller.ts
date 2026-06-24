import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { MealType } from '../dish/dish.entity';
import { UserRole } from '../user/user.entity';
import { CreateMenuPlanDto, UpdateMenuPlanDto } from './dto/create-menu-plan.dto';
import { MenuPlanService } from './menu-plan.service';

@Controller('menu-plans')
@UseGuards(AuthGuard)
export class MenuPlanController {
  constructor(private readonly menuPlanService: MenuPlanService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.CHEF_MANAGER, UserRole.BREAKFAST_CHEF)
  create(
    @Body() createMenuPlanDto: CreateMenuPlanDto,
    @Req() request: { user: { sub: string; role: UserRole } },
  ) {
    return this.menuPlanService.create(
      createMenuPlanDto.storeId,
      createMenuPlanDto,
      request.user.sub,
    );
  }

  @Get()
  findAll(
    @Query('storeId') storeId: string,
    @Query('date') date?: string,
    @Query('mealType') mealType?: MealType,
  ) {
    return this.menuPlanService.findByQuery(storeId, date, mealType);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.menuPlanService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.CHEF_MANAGER, UserRole.BREAKFAST_CHEF)
  update(
    @Param('id') id: string,
    @Body() updateMenuPlanDto: UpdateMenuPlanDto,
    @Req() request: { user: { sub: string; role: UserRole } },
  ) {
    return this.menuPlanService.update(id, updateMenuPlanDto, request.user);
  }

  @Post(':id/publish')
  @Roles(UserRole.ADMIN, UserRole.CHEF_MANAGER, UserRole.BREAKFAST_CHEF)
  publish(
    @Param('id') id: string,
    @Req() request: { user: { sub: string } },
  ) {
    return this.menuPlanService.publish(id, request.user.sub);
  }
}
