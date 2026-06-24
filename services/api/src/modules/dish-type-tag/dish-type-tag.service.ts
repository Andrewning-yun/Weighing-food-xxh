import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dish, MealType } from '../dish/dish.entity';
import { CreateDishTypeTagDto, UpdateDishTypeTagDto } from './dto/create-dish-type-tag.dto';
import { DishTypeTagRule } from './dish-type-tag.entity';

@Injectable()
export class DishTypeTagService {
  constructor(
    @InjectRepository(DishTypeTagRule)
    private readonly dishTypeTagRepository: Repository<DishTypeTagRule>,
  ) {}

  findAll() {
    return this.dishTypeTagRepository.find({ order: { priority: 'DESC', createdAt: 'ASC' } });
  }

  create(dto: CreateDishTypeTagDto) {
    return this.dishTypeTagRepository.save(this.dishTypeTagRepository.create(dto));
  }

  async update(id: string, dto: UpdateDishTypeTagDto) {
    await this.ensureExists(id);
    await this.dishTypeTagRepository.update(id, dto);
    return this.ensureExists(id);
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.dishTypeTagRepository.delete(id);
    return { id };
  }

  async classifyDish(dishLike: Pick<Dish, 'name' | 'category' | 'mealType' | 'relatedIngredients'>) {
    const rules = await this.dishTypeTagRepository.find({
      where: { isActive: true },
      order: { priority: 'DESC', createdAt: 'ASC' },
    });
    const haystack = [
      dishLike.name || '',
      dishLike.category || '',
      dishLike.relatedIngredients || '',
    ]
      .join(' ')
      .toLowerCase();

    for (const rule of rules) {
      const mealTypeHints = rule.mealTypeHints || [];
      const categoryHints = rule.categoryHints || [];
      const keywords = rule.keywords || [];
      const mealTypeMatched =
        mealTypeHints.length === 0 || mealTypeHints.includes(dishLike.mealType || MealType.LUNCH);
      const categoryMatched =
        categoryHints.length === 0 || categoryHints.includes(String(dishLike.category || ''));
      const keywordMatched = keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
      if (mealTypeMatched && categoryMatched && (keywords.length === 0 || keywordMatched)) {
        return rule.code;
      }
    }

    return 'vegetable';
  }

  async resolveDishTypeTag(dishLike: Pick<Dish, 'name' | 'category' | 'mealType' | 'relatedIngredients'>) {
    return this.classifyDish(dishLike);
  }

  private async ensureExists(id: string) {
    const entity = await this.dishTypeTagRepository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('Dish type tag not found');
    }
    return entity;
  }
}
