import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../user/user.entity';
import { CreateInventoryDto, UpdateInventoryDto } from './dto/create-inventory.dto';
import { InventoryService } from './inventory.service';

@Controller('inventories')
@UseGuards(AuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.PREP)
  create(@Body() createInventoryDto: CreateInventoryDto, @Req() req: any) {
    return this.inventoryService.create(
      createInventoryDto.storeId,
      createInventoryDto,
      req.user?.sub,
    );
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.CHEF_MANAGER, UserRole.PREP, UserRole.BUYER, UserRole.STORE_MANAGER)
  findByStoreAndDate(@Query('storeId') storeId: string, @Query('date') date: string) {
    return this.inventoryService.findByStoreAndDate(storeId, date);
  }

  @Get('latest')
  @Roles(UserRole.ADMIN, UserRole.CHEF_MANAGER, UserRole.PREP, UserRole.BUYER, UserRole.STORE_MANAGER)
  findLatest(@Query('storeId') storeId: string) {
    return this.inventoryService.findLatest(storeId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.PREP)
  update(@Param('id') id: string, @Body() updateInventoryDto: UpdateInventoryDto) {
    return this.inventoryService.update(id, updateInventoryDto);
  }
}
