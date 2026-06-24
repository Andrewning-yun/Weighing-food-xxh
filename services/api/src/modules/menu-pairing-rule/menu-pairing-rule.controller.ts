import { Body, Controller, Get, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../user/user.entity';
import { UpsertMenuPairingRulesDto } from './dto/upsert-menu-pairing-rules.dto';
import { MenuPairingRuleService } from './menu-pairing-rule.service';

@Controller('menu-pairing-rules')
@UseGuards(AuthGuard)
export class MenuPairingRuleController {
  constructor(private readonly menuPairingRuleService: MenuPairingRuleService) {}

  @Get()
  findByQuery(@Query('storeId') storeId: string, @Query('mealType') mealType?: string) {
    return this.menuPairingRuleService.findByQuery(storeId, mealType);
  }

  @Put()
  @Roles(UserRole.ADMIN, UserRole.CHEF_MANAGER, UserRole.STORE_MANAGER)
  upsert(@Body() dto: UpsertMenuPairingRulesDto) {
    return this.menuPairingRuleService.upsert(dto);
  }
}
