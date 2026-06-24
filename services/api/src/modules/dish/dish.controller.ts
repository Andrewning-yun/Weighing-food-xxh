import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../user/user.entity';
import { CreateDishDto } from './dto/create-dish.dto';
import { UpdateDishDto } from './dto/update-dish.dto';
import { DishService } from './dish.service';

@Controller('dishes')
@UseGuards(AuthGuard)
export class DishController {
  constructor(private readonly dishService: DishService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.CHEF_MANAGER, UserRole.BREAKFAST_CHEF, UserRole.BREAKFAST_ASSISTANT)
  create(@Body() createDishDto: CreateDishDto) {
    return this.dishService.create(createDishDto);
  }

  @Get()
  findAll() {
    return this.dishService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dishService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.CHEF_MANAGER, UserRole.BREAKFAST_CHEF, UserRole.BREAKFAST_ASSISTANT)
  update(@Param('id') id: string, @Body() updateDishDto: UpdateDishDto) {
    return this.dishService.update(id, updateDishDto);
  }

  @Patch(':id/type-tag')
  @Roles(UserRole.ADMIN, UserRole.CHEF_MANAGER, UserRole.BREAKFAST_CHEF, UserRole.BREAKFAST_ASSISTANT)
  updateTypeTag(
    @Param('id') id: string,
    @Body() body: { dishTypeTag?: string | null; manualOverride?: boolean },
  ) {
    return this.dishService.updateTypeTag(id, body.dishTypeTag ?? null, body.manualOverride);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.CHEF_MANAGER, UserRole.BREAKFAST_CHEF, UserRole.BREAKFAST_ASSISTANT)
  remove(@Param('id') id: string) {
    return this.dishService.remove(id);
  }
}
