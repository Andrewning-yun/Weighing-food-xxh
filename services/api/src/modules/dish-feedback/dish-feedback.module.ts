import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CostingModule } from '../costing/costing.module';
import { Dish } from '../dish/dish.entity';
import { DishFeedbackController } from './dish-feedback.controller';
import { DishFeedback } from './dish-feedback.entity';
import { DishFeedbackService } from './dish-feedback.service';

@Module({
  imports: [TypeOrmModule.forFeature([DishFeedback, Dish]), CostingModule],
  controllers: [DishFeedbackController],
  providers: [DishFeedbackService],
  exports: [DishFeedbackService],
})
export class DishFeedbackModule {}
