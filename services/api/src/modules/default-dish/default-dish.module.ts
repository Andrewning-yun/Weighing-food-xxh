import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dish } from '../dish/dish.entity';
import { DefaultDishController } from './default-dish.controller';
import { DefaultDish } from './default-dish.entity';
import { DefaultDishService } from './default-dish.service';

@Module({
  imports: [TypeOrmModule.forFeature([DefaultDish, Dish])],
  controllers: [DefaultDishController],
  providers: [DefaultDishService],
  exports: [DefaultDishService],
})
export class DefaultDishModule {}
