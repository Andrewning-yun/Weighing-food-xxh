import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuPairingRuleController } from './menu-pairing-rule.controller';
import { MenuPairingRule } from './menu-pairing-rule.entity';
import { MenuPairingRuleService } from './menu-pairing-rule.service';

@Module({
  imports: [TypeOrmModule.forFeature([MenuPairingRule])],
  controllers: [MenuPairingRuleController],
  providers: [MenuPairingRuleService],
  exports: [MenuPairingRuleService],
})
export class MenuPairingRuleModule {}
