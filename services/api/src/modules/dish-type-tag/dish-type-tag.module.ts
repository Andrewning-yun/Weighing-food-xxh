import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DishTypeTagController } from './dish-type-tag.controller';
import { DishTypeTagRule } from './dish-type-tag.entity';
import { DishTypeTagService } from './dish-type-tag.service';

@Module({
  imports: [TypeOrmModule.forFeature([DishTypeTagRule])],
  controllers: [DishTypeTagController],
  providers: [DishTypeTagService],
  exports: [DishTypeTagService],
})
export class DishTypeTagModule {}
