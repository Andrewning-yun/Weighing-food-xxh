import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../user/user.entity';
import { CreateDishTypeTagDto, UpdateDishTypeTagDto } from './dto/create-dish-type-tag.dto';
import { DishTypeTagService } from './dish-type-tag.service';

type WebAdminDishTypeTagPayload = {
  name: string;
  sortOrder?: number;
  rules?: {
    relatedIngredients?: string[];
    minMainIng?: number;
  };
};

@Controller('dish-type-tags')
@UseGuards(AuthGuard)
export class DishTypeTagController {
  constructor(private readonly dishTypeTagService: DishTypeTagService) {}

  @Get()
  async findAll() {
    const records = await this.dishTypeTagService.findAll();
    return records.map((record) => ({
      id: record.id,
      name: record.name,
      rules: {
        relatedIngredients: record.keywords || [],
        minMainIng: 0,
      },
      sortOrder: record.priority,
      updatedAt: record.updatedAt,
    }));
  }

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateDishTypeTagDto & WebAdminDishTypeTagPayload) {
    return this.dishTypeTagService.create({
      ...dto,
      code: dto.code || this.toCode(dto.name),
      keywords: dto.keywords || dto.rules?.relatedIngredients || [],
      priority: dto.priority ?? dto.sortOrder ?? 0,
    });
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateDishTypeTagDto & WebAdminDishTypeTagPayload) {
    return this.dishTypeTagService.update(id, {
      ...dto,
      code: dto.code || (dto.name ? this.toCode(dto.name) : undefined),
      keywords: dto.keywords || dto.rules?.relatedIngredients,
      priority: dto.priority ?? dto.sortOrder,
    });
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.dishTypeTagService.remove(id);
  }

  private toCode(name: string) {
    if (name === '大荤') return 'big_meat';
    if (name === '小荤') return 'small_meat';
    if (name === '素菜') return 'vegetable';
    return name;
  }
}
