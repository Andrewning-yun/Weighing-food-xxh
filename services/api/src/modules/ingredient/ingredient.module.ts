import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CostingModule } from '../costing/costing.module';
import { User } from '../user/user.entity';
import { IngredientController } from './ingredient.controller';
import { Ingredient } from './ingredient.entity';
import { IngredientService } from './ingredient.service';

@Module({
  imports: [TypeOrmModule.forFeature([Ingredient, User]), CostingModule],
  controllers: [IngredientController],
  providers: [IngredientService],
  exports: [IngredientService],
})
export class IngredientModule {}
