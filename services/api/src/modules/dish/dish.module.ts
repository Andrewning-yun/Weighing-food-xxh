import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { DishTypeTagModule } from '../dish-type-tag/dish-type-tag.module';
import { User } from '../user/user.entity';
import { DishController } from './dish.controller';
import { Dish } from './dish.entity';
import { DishService } from './dish.service';

@Module({
  imports: [TypeOrmModule.forFeature([Dish, User]), DishTypeTagModule, AuditModule],
  controllers: [DishController],
  providers: [DishService],
  exports: [DishService],
})
export class DishModule {}
