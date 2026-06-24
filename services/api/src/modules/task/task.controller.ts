import { Body, Controller, Get, Patch, Post, Query, Param, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../user/user.entity';
import { MealType } from '../dish/dish.entity';
import { TaskService, CreateTaskDto, UpdateTaskStatusDto } from './task.service';

@Controller('tasks')
@UseGuards(AuthGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get()
  findByQuery(
    @Query('storeId') storeId: string,
    @Query('date') date?: string,
    @Query('mealType') mealType?: MealType,
  ) {
    return this.taskService.findByQuery(storeId, date, mealType);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.CHEF_MANAGER)
  create(@Body() dto: CreateTaskDto, @Req() req: any) {
    return this.taskService.create(
      dto.storeId,
      dto,
      req.user?.sub,
    );
  }

  @Patch(':id')
  @Roles(
    UserRole.ADMIN,
    UserRole.CHEF_MANAGER,
    UserRole.PREP,
    UserRole.BREAKFAST_CHEF,
    UserRole.BREAKFAST_ASSISTANT,
  )
  updateStatus(@Param('id') id: string, @Body() dto: UpdateTaskStatusDto, @Req() req: any) {
    return this.taskService.updateStatus(id, dto, req.user);
  }

  @Post('generate-from-menu')
  @Roles(UserRole.ADMIN, UserRole.CHEF_MANAGER, UserRole.BREAKFAST_CHEF)
  generateFromMenu(
    @Body() body: { storeId: string; date: string; mealType: MealType },
    @Req() req: any,
  ) {
    return this.taskService.generateFromMenu(
      body.storeId,
      body.date,
      body.mealType,
      req.user?.sub,
    );
  }
}
