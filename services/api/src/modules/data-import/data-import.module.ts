import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DishTypeTagModule } from '../dish-type-tag/dish-type-tag.module';
import { Dish } from '../dish/dish.entity';
import { Ingredient } from '../ingredient/ingredient.entity';
import { DataImportController } from './data-import.controller';
import { DataImportService } from './data-import.service';

@Module({
  imports: [TypeOrmModule.forFeature([Dish, Ingredient]), DishTypeTagModule],
  controllers: [DataImportController],
  providers: [DataImportService],
  exports: [DataImportService],
})
export class DataImportModule {}
