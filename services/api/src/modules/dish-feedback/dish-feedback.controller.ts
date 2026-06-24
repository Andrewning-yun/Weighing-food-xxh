import { Body, Controller, Get, Param, Put, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../user/user.entity';
import { CostingService } from '../costing/costing.service';
import { CreateDishFeedbackDto, UpdateDishFeedbackDto } from './dto/create-dish-feedback.dto';
import { DishFeedbackService } from './dish-feedback.service';

@Controller('dish-feedback')
@UseGuards(AuthGuard)
export class DishFeedbackController {
  constructor(
    private readonly dishFeedbackService: DishFeedbackService,
    private readonly costingService: CostingService,
  ) {}

  @Get()
  findByQuery(
    @Query('storeId') storeId: string,
    @Query('date') date?: string,
    @Query('mealType') mealType?: string,
  ) {
    return this.dishFeedbackService.findByQuery(storeId, date, mealType);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER)
  async create(@Body() dto: CreateDishFeedbackDto, @Req() req: any) {
    const result = await this.dishFeedbackService.create(dto, req.user?.sub);
    this.costingService.invalidateStoreCache(dto.storeId);
    return result;
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER)
  update(@Param('id') id: string, @Body() dto: UpdateDishFeedbackDto) {
    return this.dishFeedbackService.update(id, dto);
  }
}
