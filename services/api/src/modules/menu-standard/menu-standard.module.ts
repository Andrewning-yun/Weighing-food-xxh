import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuStandardController } from './menu-standard.controller';
import { MenuStandard } from './menu-standard.entity';
import { MenuStandardService } from './menu-standard.service';

@Module({
  imports: [TypeOrmModule.forFeature([MenuStandard])],
  controllers: [MenuStandardController],
  providers: [MenuStandardService],
  exports: [MenuStandardService],
})
export class MenuStandardModule {}
