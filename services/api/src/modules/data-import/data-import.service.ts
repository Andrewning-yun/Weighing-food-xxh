import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as XLSX from 'xlsx';
import { Dish, MealType, Station } from '../dish/dish.entity';
import { DishTypeTagService } from '../dish-type-tag/dish-type-tag.service';
import { Ingredient } from '../ingredient/ingredient.entity';
import { DataImportMode, DataImportType, ExecuteDataImportDto } from './dto/data-import.dto';

/** Chinese → English dish category mapping */
const CATEGORY_MAP: Record<string, string> = {
  '蒸菜': 'steam', '煎扒': 'panfry', '油炸': 'fry', '砂锅': 'casserole',
  '炒菜': 'stir', '水果': 'fruit', '凉菜': 'cold', '汤品': 'soup',
  '茶饮': 'tea', '粥品': 'porridge', '面点': 'pastry', '饮品': 'breakfast_drink',
  '饭类': 'rice', '铁板': 'griddle', '备菜': 'prep', '荤菜': 'meat', '素菜': 'vegetable',
};

/** Chinese → English ingredient category mapping */
const INGREDIENT_CATEGORY_MAP: Record<string, string> = {
  '蔬菜': 'vegetable', '肉类': 'meat', '禽类': 'poultry', '菌菇': 'mushroom',
  '水产': 'seafood', '豆制品': 'soy_product', '蛋类': 'egg', '主食': 'staple',
  '调味料': 'seasoning', '油脂': 'oil', '面食': 'noodle', '干货': 'dry_goods',
  '水果': 'fruit', '乳制品': 'dairy', '腌制品': 'pickled', '冷冻品': 'frozen',
  '其他': 'other',
};

/** Chinese → English meal type mapping */
const MEAL_TYPE_MAP: Record<string, string> = {
  '早餐': 'breakfast', '午餐': 'lunch', '正餐': 'lunch',
};

/** Column name alias map (Chinese or English → normalized field) */
const INGREDIENT_COLUMN_MAP: Record<string, string> = {
  '名称': 'name', 'name': 'name',
  '分类': 'category', 'category': 'category',
  '单位': 'unit', 'unit': 'unit',
  '单价': 'pricePerUnit', 'pricePerUnit': 'pricePerUnit', 'price': 'pricePerUnit',
  '易损耗': 'isPerishable', 'isPerishable': 'isPerishable', 'perishable': 'isPerishable',
};

const DISH_COLUMN_MAP: Record<string, string> = {
  '名称': 'name', 'name': 'name',
  '分类': 'category', 'category': 'category',
  '餐别': 'mealType', 'mealType': 'mealType',
  '食材': 'ingredients', 'ingredients': 'ingredients',
  '成本': 'ingredientCost', 'ingredientCost': 'ingredientCost', 'cost': 'ingredientCost',
};

function normalizeValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function resolveCategory(value: string): string {
  return CATEGORY_MAP[value] || value;
}

function resolveIngredientCategory(value: string): string {
  return INGREDIENT_CATEGORY_MAP[value] || value;
}

function resolveMealType(value: string): string {
  return MEAL_TYPE_MAP[value] || value;
}

function resolveBool(value: string): boolean {
  const v = value.toLowerCase();
  return v === 'yes' || v === 'true' || v === '是' || v === '1';
}

type ParsedPreview = {
  type: DataImportType;
  mode: DataImportMode;
  valid: boolean;
  total: number;
  items: Record<string, any>[];
  issues: Array<{ row: number; message: string }>;
};

@Injectable()
export class DataImportService {
  constructor(
    @InjectRepository(Dish)
    private readonly dishRepository: Repository<Dish>,
    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,
    private readonly dishTypeTagService: DishTypeTagService,
  ) {}

  async parseExcel(buffer: Buffer, type: DataImportType, mode: DataImportMode): Promise<ParsedPreview> {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return { type, mode, valid: false, total: 0, items: [], issues: [{ row: 0, message: 'Excel 文件中没有找到工作表' }] };
    }

    const sheet = workbook.Sheets[sheetName];
    const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (rawRows.length === 0) {
      return { type, mode, valid: false, total: 0, items: [], issues: [{ row: 0, message: 'Excel 文件中没有数据行' }] };
    }

    // Map column names
    const columnMap = type === DataImportType.INGREDIENT ? INGREDIENT_COLUMN_MAP : DISH_COLUMN_MAP;
    const rows = rawRows.map((raw) => {
      const mapped: Record<string, any> = {};
      for (const [colName, value] of Object.entries(raw)) {
        const field = columnMap[colName.trim()];
        if (field) {
          if (!mapped[field]) {
            mapped[field] = value;
          }
        }
      }
      return mapped;
    });

    // Validate
    const issues =
      type === DataImportType.INGREDIENT
        ? this.validateIngredientExcelRows(rows)
        : await this.validateDishExcelRows(rows);

    // Normalize values
    const normalized = type === DataImportType.INGREDIENT
      ? rows.map((row) => this.normalizeIngredientRow(row))
      : rows.map((row) => this.normalizeDishRow(row));

    return {
      type,
      mode,
      valid: issues.length === 0,
      total: rows.length,
      items: normalized,
      issues,
    };
  }

  async execute(dto: ExecuteDataImportDto) {
    const issues =
      dto.type === DataImportType.INGREDIENT
        ? this.validateIngredientItems(dto.items)
        : await this.validateDishItems(dto.items);

    if (issues.length > 0) {
      return {
        success: false,
        total: dto.items.length,
        created: 0,
        updated: 0,
        skipped: 0,
        issues,
      };
    }

    if (dto.type === DataImportType.INGREDIENT) {
      return this.executeIngredients(dto.mode, dto.items);
    }

    return this.executeDishes(dto.mode, dto.items);
  }

  private normalizeIngredientRow(row: Record<string, any>): Record<string, any> {
    return {
      name: normalizeValue(row.name),
      category: row.category ? resolveIngredientCategory(normalizeValue(row.category)) : '',
      unit: normalizeValue(row.unit || '份'),
      pricePerUnit: Number(row.pricePerUnit ?? 0),
      isPerishable: row.isPerishable ? resolveBool(normalizeValue(row.isPerishable)) : false,
    };
  }

  private normalizeDishRow(row: Record<string, any>): Record<string, any> {
    const normalized = {
      name: normalizeValue(row.name),
      category: row.category ? resolveCategory(normalizeValue(row.category)) : '',
      mealType: row.mealType ? resolveMealType(normalizeValue(row.mealType)) : 'lunch',
      ingredients: [] as any[],
      ingredientCost: Number(row.ingredientCost ?? 0),
    };

    // Parse ingredients JSON string
    if (row.ingredients) {
      const raw = normalizeValue(row.ingredients);
      try {
        const parsed = JSON.parse(raw);
        normalized.ingredients = Array.isArray(parsed) ? parsed : [];
      } catch {
        // Invalid JSON, keep empty array — validation will catch it
      }
    }

    return normalized;
  }

  private validateIngredientExcelRows(items: Record<string, any>[]) {
    return items.flatMap((item, index) => {
      const issues: Array<{ row: number; message: string }> = [];
      if (!item?.name) issues.push({ row: index + 1, message: '食材名称不能为空' });
      if (!item?.unit) issues.push({ row: index + 1, message: '食材单位不能为空' });
      if (!item?.pricePerUnit || Number(item.pricePerUnit) <= 0) {
        issues.push({ row: index + 1, message: '食材单价不能为空' });
      }
      return issues;
    });
  }

  private validateIngredientItems(items: Record<string, any>[]) {
    return items.flatMap((item, index) => {
      const issues: Array<{ row: number; message: string }> = [];
      if (!item?.name) issues.push({ row: index + 1, message: '食材名称不能为空' });
      if (!item?.unit) issues.push({ row: index + 1, message: '食材单位不能为空' });
      if (item?.pricePerUnit === undefined && item?.price === undefined) {
        issues.push({ row: index + 1, message: '食材单价不能为空' });
      }
      return issues;
    });
  }

  private async validateDishExcelRows(items: Record<string, any>[]) {
    const ingredientNames = items.flatMap((item) => {
      if (!item?.ingredients) return [];
      try {
        const parsed = typeof item.ingredients === 'string' ? JSON.parse(item.ingredients) : item.ingredients;
        return Array.isArray(parsed) ? parsed.map((row: Record<string, any>) => String(row?.name || '').trim()) : [];
      } catch {
        return [];
      }
    });
    const uniqueNames = Array.from(new Set(ingredientNames.filter(Boolean)));
    const existing = uniqueNames.length
      ? await this.ingredientRepository.find({
          where: { name: In(uniqueNames) },
        })
      : [];
    const existingSet = new Set(existing.map((item: Ingredient) => item.name));

    return items.flatMap((item, index) => {
      const issues: Array<{ row: number; message: string }> = [];
      if (!item?.name) issues.push({ row: index + 1, message: '菜品名称不能为空' });
      if (!item?.category) issues.push({ row: index + 1, message: '菜品分类不能为空' });

      let parsedIngredients: Record<string, any>[] = [];
      if (item?.ingredients) {
        try {
          parsedIngredients = typeof item.ingredients === 'string' ? JSON.parse(item.ingredients) : item.ingredients;
          if (!Array.isArray(parsedIngredients)) parsedIngredients = [];
        } catch {
          parsedIngredients = [];
        }
      }

      if (parsedIngredients.length === 0) {
        issues.push({ row: index + 1, message: '菜品至少需要一个食材（食材列填 JSON 数组）' });
      } else {
        parsedIngredients.forEach((ingredient: Record<string, any>) => {
          const ingredientName = String(ingredient?.name || '').trim();
          if (!ingredientName) {
            issues.push({ row: index + 1, message: '菜品食材名称不能为空' });
          } else if (!existingSet.has(ingredientName)) {
            issues.push({ row: index + 1, message: `食材不存在：${ingredientName}` });
          }
        });
      }
      return issues;
    });
  }

  private async validateDishItems(items: Record<string, any>[]) {
    const ingredientNames = items.flatMap((item) =>
      Array.isArray(item?.ingredients) ? item.ingredients.map((row: Record<string, any>) => String(row?.name || '').trim()) : [],
    );
    const uniqueNames = Array.from(new Set(ingredientNames.filter(Boolean)));
    const existing = uniqueNames.length
      ? await this.ingredientRepository.find({
          where: { name: In(uniqueNames) },
        })
      : [];
    const existingSet = new Set(existing.map((item) => item.name));

    return items.flatMap((item, index) => {
      const issues: Array<{ row: number; message: string }> = [];
      if (!item?.name) issues.push({ row: index + 1, message: '菜品名称不能为空' });
      if (!item?.category) issues.push({ row: index + 1, message: '菜品分类不能为空' });
      if (!Array.isArray(item?.ingredients) || item.ingredients.length === 0) {
        issues.push({ row: index + 1, message: '菜品至少需要一个食材' });
      } else {
        item.ingredients.forEach((ingredient: Record<string, any>) => {
          const ingredientName = String(ingredient?.name || '').trim();
          if (!ingredientName) {
            issues.push({ row: index + 1, message: '菜品食材名称不能为空' });
          } else if (!existingSet.has(ingredientName)) {
            issues.push({ row: index + 1, message: `食材不存在：${ingredientName}` });
          }
        });
      }
      return issues;
    });
  }

  private async executeIngredients(mode: DataImportMode, items: Record<string, any>[]) {
    const existing = await this.ingredientRepository.find();
    const existingMap = new Map(existing.map((item) => [item.name, item]));
    let created = 0;
    let updated = 0;
    let skipped = 0;

    if (mode === DataImportMode.REPLACE) {
      await this.ingredientRepository.clear();
    }

    for (const item of items) {
      const payload = {
        name: String(item.name).trim(),
        category: item.category ? String(item.category).trim() : null,
        unit: String(item.unit || '份').trim(),
        price: Number(item.pricePerUnit ?? item.price ?? 0),
        costPerUnit: Number(item.pricePerUnit ?? item.price ?? 0),
        perishable: Boolean(item.isPerishable),
        type: item.type ? String(item.type).trim() : null,
        isActive: true,
        supplier: null,
        spec: null,
      };

      const matched = existingMap.get(payload.name);
      if (!matched || mode === DataImportMode.REPLACE) {
        await this.ingredientRepository.save(this.ingredientRepository.create(payload));
        created += 1;
        continue;
      }

      if (mode === DataImportMode.SKIP_DUPLICATE) {
        skipped += 1;
        continue;
      }

      await this.ingredientRepository.update(matched.id, payload);
      updated += 1;
    }

    return {
      success: true,
      total: items.length,
      created,
      updated,
      skipped,
      issues: [],
    };
  }

  private async executeDishes(mode: DataImportMode, items: Record<string, any>[]) {
    const ingredients = await this.ingredientRepository.find();
    const ingredientMap = new Map(ingredients.map((item) => [item.name, item]));
    const existing = await this.dishRepository.find();
    const existingMap = new Map(existing.map((item) => [item.name, item]));
    let created = 0;
    let updated = 0;
    let skipped = 0;

    if (mode === DataImportMode.REPLACE) {
      await this.dishRepository.clear();
    }

    for (const item of items) {
      const relatedIngredients = Array.isArray(item.ingredients)
        ? item.ingredients.map((row: Record<string, any>) => String(row.name || '').trim()).filter(Boolean).join(',')
        : '';

      const dishTypeTag = await this.dishTypeTagService.resolveDishTypeTag({
        name: String(item.name || '').trim(),
        category: String(item.category || 'stir') as any,
        mealType: String(item.mealType || 'lunch') as MealType,
        relatedIngredients,
      });

      const payload: Partial<Dish> = {
        name: String(item.name || '').trim(),
        category: String(item.category || 'stir') as any,
        station: String(item.station || Station.WOK) as Station,
        description: item.description ? String(item.description) : null,
        mealType: String(item.mealType || 'lunch') as MealType,
        ingredientCost: Number(item.ingredientCost ?? 0),
        isActive: true,
        recommendWeight: Number(item.recommendWeight ?? 1),
        relatedIngredients,
        dishTypeTag,
        dishTypeTagManualOverride: false,
        ingredients: Array.isArray(item.ingredients)
          ? item.ingredients.map((row: Record<string, any>) => {
              const matched = ingredientMap.get(String(row.name || '').trim());
              return {
                ingredientId: matched?.id || '',
                quantity: Number(row.qty ?? row.quantity ?? 0),
                unit: String(row.unit || matched?.unit || '份'),
                wasteRate: Number(row.wasteRate ?? 0),
              };
            })
          : [],
        steps: [],
      };

      const matched = existingMap.get(payload.name || '');
      if (!matched || mode === DataImportMode.REPLACE) {
        await this.dishRepository.save(this.dishRepository.create(payload));
        created += 1;
        continue;
      }

      if (mode === DataImportMode.SKIP_DUPLICATE) {
        skipped += 1;
        continue;
      }

      await this.dishRepository.update(matched.id, payload);
      updated += 1;
    }

    return {
      success: true,
      total: items.length,
      created,
      updated,
      skipped,
      issues: [],
    };
  }
}
