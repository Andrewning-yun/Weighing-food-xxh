import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { hashPassword } from '../common/password';
import { AlgorithmConfig } from '../modules/algorithm-config/algorithm-config.entity';
import { CostingService } from '../modules/costing/costing.service';
import { Dish, DishCategory, MealType, Station } from '../modules/dish/dish.entity';
import { DishTypeTagService } from '../modules/dish-type-tag/dish-type-tag.service';
import { DefaultDish } from '../modules/default-dish/default-dish.entity';
import { DishTypeTag } from '../modules/dish-type-tag/dish-type-tag.entity';
import { Ingredient } from '../modules/ingredient/ingredient.entity';
import { MenuPairingRule } from '../modules/menu-pairing-rule/menu-pairing-rule.entity';
import { MenuStandard } from '../modules/menu-standard/menu-standard.entity';
import { Store } from '../modules/store/store.entity';
import { User, UserRole } from '../modules/user/user.entity';

@Injectable()
export class DevSeedService {
  private readonly logger = new Logger(DevSeedService.name);

  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,
    @InjectRepository(Dish)
    private readonly dishRepository: Repository<Dish>,
    @InjectRepository(DishTypeTag)
    private readonly dishTypeTagRepository: Repository<DishTypeTag>,
    @InjectRepository(MenuStandard)
    private readonly menuStandardRepository: Repository<MenuStandard>,
    @InjectRepository(DefaultDish)
    private readonly defaultDishRepository: Repository<DefaultDish>,
    @InjectRepository(AlgorithmConfig)
    private readonly algorithmConfigRepository: Repository<AlgorithmConfig>,
    @InjectRepository(MenuPairingRule)
    private readonly menuPairingRuleRepository: Repository<MenuPairingRule>,
    private readonly dishTypeTagService: DishTypeTagService,
    private readonly costingService: CostingService,
  ) {}

  async seedIfEnabled() {
    if (process.env.SEED_ON_BOOT === 'false') {
      return;
    }

    await this.seedCoreData();
  }

  private async seedCoreData() {
    const store = await this.ensureDefaultStore();
    await this.ensureUsers(store.id);
    const ingredients = await this.ensureIngredients();
    await this.ensureDishes(ingredients);
    await this.ensureP1Defaults(store.id);
    await this.backfillDishTypeTags();
    await this.costingService.recalculateAllDishes();
    this.logger.log('Development seed is ready');
  }

  private async ensureDefaultStore() {
    const existing = await this.storeRepository.findOne({
      where: { brandId: 'demo-brand', name: 'Demo Flagship Store' },
    });

    if (existing) {
      return existing;
    }

    return this.storeRepository.save(
      this.storeRepository.create({
        name: 'Demo Flagship Store',
        address: '88 Kitchen Avenue',
        brandId: 'demo-brand',
        chefCount: 6,
        dailyCustomers: 650,
        isActive: true,
        contactName: 'Kitchen Lead',
        contactPhone: '13800000000',
      }),
    );
  }

  private async ensureUsers(storeId: string) {
    const users = [
      { username: 'admin', password: 'admin1234', name: '管理员', role: UserRole.ADMIN },
      { username: 'zhangchef', password: '123456', name: '张厨师长', role: UserRole.CHEF_MANAGER },
      { username: 'lichushi', password: '123456', name: '李厨师', role: UserRole.CHEF },
      { username: 'wangqiepei', password: '123456', name: '王切配', role: UserRole.PREP },
      { username: 'zaochanshi1', password: '123456', name: '赵早餐师', role: UserRole.BREAKFAST_CHEF },
      { username: 'zaocanfushou', password: '123456', name: '孙早餐副手', role: UserRole.BREAKFAST_ASSISTANT },
      { username: 'wangcaigou', password: '123456', name: '周采购', role: UserRole.BUYER },
      { username: 'zhangdianzhang', password: '123456', name: '吴店长', role: UserRole.STORE_MANAGER },
    ];

    for (const u of users) {
      const existing = await this.userRepository.findOne({ where: { username: u.username } });
      if (!existing) {
        await this.userRepository.save(
          this.userRepository.create({
            username: u.username,
            passwordHash: hashPassword(u.password),
            name: u.name,
            role: u.role,
            storeId,
          }),
        );
      }
    }
  }

  private async ensureIngredients() {
    const existing = await this.ingredientRepository.find({ order: { createdAt: 'ASC' } });
    if (existing.length >= 250) {
      return existing;
    }

    const toCreate = [
    { name: '紫茄子', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '散花菜', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '西蓝花', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '山药', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '水东芥菜', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '长豆角', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '扁豆', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '刀豆', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '荷兰豆', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '青瓜', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '苦瓜', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '丝瓜', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '小瓜', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '蒲瓜', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '蒜苔', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'sub' },
    { name: '胡萝卜', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '四季豆', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '莴笋', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '韭菜', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '韭菜黄', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '韭菜花', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '番茄', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '茭头', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '白萝卜', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '青茄子', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '毛豆米', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '莲藕', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '西芹', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '南瓜苗', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '冬瓜', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '老南瓜', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '茭白', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '八角丝瓜', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '东北豆', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '鱼腥草', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '秋葵', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '红薯', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '小芋头', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '大芋头', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '贝贝南瓜', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '香芋南瓜', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '板栗', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '芦笋', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '春笋', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '玉米粒', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '玉米条', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '酸菜', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '酸豆角', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '扑坛盐菜', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '川玉盐菜', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '宜宾芽菜', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '原味萝卜丁', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '榨菜', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '梅菜', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '苦笋', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '芹菜', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'sub' },
    { name: '土豆', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '小炒肉辣椒', unit: '斤', price: 0, isActive: true, category: '辣椒', perishable: true, type: 'sub' },
    { name: '海花红', unit: '斤', price: 0, isActive: true, category: '辣椒', perishable: true, type: 'main' },
    { name: '大红椒', unit: '斤', price: 0, isActive: true, category: '辣椒', perishable: true, type: 'sub' },
    { name: '湖南辣椒', unit: '斤', price: 0, isActive: true, category: '辣椒', perishable: true, type: 'sub' },
    { name: '螺丝椒', unit: '斤', price: 0, isActive: true, category: '辣椒', perishable: true, type: 'sub' },
    { name: '樟树港辣椒', unit: '斤', price: 0, isActive: true, category: '辣椒', perishable: true, type: 'sub' },
    { name: '湖南红', unit: '斤', price: 0, isActive: true, category: '辣椒', perishable: true, type: 'main' },
    { name: '小米椒', unit: '斤', price: 0, isActive: true, category: '辣椒', perishable: true, type: 'sub' },
    { name: '蒜苗', unit: '斤', price: 0, isActive: true, category: '调味配菜', perishable: true, type: 'sub' },
    { name: '葱', unit: '斤', price: 0, isActive: true, category: '调味配菜', perishable: true, type: 'sub' },
    { name: '紫苏', unit: '斤', price: 0, isActive: true, category: '调味配菜', perishable: true, type: 'sub' },
    { name: '香菜', unit: '斤', price: 0, isActive: true, category: '调味配菜', perishable: true, type: 'sub' },
    { name: '蒜米', unit: '斤', price: 0, isActive: true, category: '调味配菜', perishable: true, type: 'sub' },
    { name: '生姜', unit: '斤', price: 0, isActive: true, category: '调味配菜', perishable: true, type: 'sub' },
    { name: '白洋葱', unit: '斤', price: 0, isActive: true, category: '调味配菜', perishable: true, type: 'sub' },
    { name: '红洋葱', unit: '斤', price: 0, isActive: true, category: '调味配菜', perishable: true, type: 'sub' },
    { name: '大葱', unit: '斤', price: 0, isActive: true, category: '调味配菜', perishable: true, type: 'sub' },
    { name: '上海青', unit: '斤', price: 0, isActive: true, category: '叶菜', perishable: true, type: 'main' },
    { name: '水白苗', unit: '斤', price: 0, isActive: true, category: '叶菜', perishable: true, type: 'main' },
    { name: '红苋菜', unit: '斤', price: 0, isActive: true, category: '叶菜', perishable: true, type: 'main' },
    { name: '春菜', unit: '斤', price: 0, isActive: true, category: '叶菜', perishable: true, type: 'main' },
    { name: '红薯叶', unit: '斤', price: 0, isActive: true, category: '叶菜', perishable: true, type: 'main' },
    { name: '菠菜', unit: '斤', price: 0, isActive: true, category: '叶菜', perishable: true, type: 'main' },
    { name: '雪里红', unit: '斤', price: 0, isActive: true, category: '叶菜', perishable: true, type: 'main' },
    { name: '红菜苔', unit: '斤', price: 0, isActive: true, category: '叶菜', perishable: true, type: 'main' },
    { name: '菜心苗', unit: '斤', price: 0, isActive: true, category: '叶菜', perishable: true, type: 'main' },
    { name: '通菜', unit: '斤', price: 0, isActive: true, category: '叶菜', perishable: true, type: 'main' },
    { name: '西洋菜', unit: '斤', price: 0, isActive: true, category: '叶菜', perishable: true, type: 'main' },
    { name: '芥蓝苗', unit: '斤', price: 0, isActive: true, category: '叶菜', perishable: true, type: 'main' },
    { name: '皇帝菜', unit: '斤', price: 0, isActive: true, category: '叶菜', perishable: true, type: 'main' },
    { name: '毛白菜', unit: '斤', price: 0, isActive: true, category: '叶菜', perishable: true, type: 'main' },
    { name: '娃娃菜', unit: '斤', price: 0, isActive: true, category: '叶菜', perishable: true, type: 'main' },
    { name: '大白菜', unit: '斤', price: 0, isActive: true, category: '叶菜', perishable: true, type: 'main' },
    { name: '京包', unit: '斤', price: 0, isActive: true, category: '叶菜', perishable: true, type: 'main' },
    { name: '平包', unit: '斤', price: 0, isActive: true, category: '叶菜', perishable: true, type: 'main' },
    { name: '生菜', unit: '斤', price: 0, isActive: true, category: '叶菜', perishable: true, type: 'main' },
    { name: '鸡毛菜', unit: '斤', price: 0, isActive: true, category: '叶菜', perishable: true, type: 'main' },
    { name: '油麦菜', unit: '斤', price: 0, isActive: true, category: '叶菜', perishable: true, type: 'main' },
    { name: '衡阳油豆腐', unit: '斤', price: 0, isActive: true, category: '豆制品', perishable: true, type: 'main' },
    { name: '小油豆腐', unit: '斤', price: 0, isActive: true, category: '豆制品', perishable: true, type: 'main' },
    { name: '白豆腐（麻婆豆腐）', unit: '斤', price: 0, isActive: true, category: '豆制品', perishable: true, type: 'main' },
    { name: '黄皮豆腐', unit: '斤', price: 0, isActive: true, category: '豆制品', perishable: true, type: 'main' },
    { name: '车前豆腐', unit: '斤', price: 0, isActive: true, category: '豆制品', perishable: true, type: 'main' },
    { name: '香干', unit: '斤', price: 0, isActive: true, category: '豆制品', perishable: true, type: 'main' },
    { name: '魔芋豆腐', unit: '斤', price: 0, isActive: true, category: '豆制品', perishable: true, type: 'main' },
    { name: '千张', unit: '斤', price: 0, isActive: true, category: '豆制品', perishable: true, type: 'main' },
    { name: '茶干', unit: '斤', price: 0, isActive: true, category: '豆制品', perishable: true, type: 'main' },
    { name: '素鸡', unit: '斤', price: 0, isActive: true, category: '豆制品', perishable: true, type: 'main' },
    { name: '老豆腐', unit: '斤', price: 0, isActive: true, category: '豆制品', perishable: true, type: 'main' },
    { name: '腐竹', unit: '斤', price: 0, isActive: true, category: '豆制品', perishable: true, type: 'main' },
    { name: '肉片（去皮切片）', unit: '斤', price: 0, isActive: true, category: '肉', perishable: true, type: 'main' },
    { name: '五花肉丁', unit: '斤', price: 0, isActive: true, category: '肉', perishable: true, type: 'main' },
    { name: '扣肉', unit: '斤', price: 0, isActive: true, category: '肉', perishable: true, type: 'main' },
    { name: '粉蒸肉', unit: '斤', price: 0, isActive: true, category: '肉', perishable: true, type: 'main' },
    { name: '猪肝', unit: '斤', price: 0, isActive: true, category: '肉', perishable: true, type: 'main' },
    { name: '肥膘', unit: '斤', price: 0, isActive: true, category: '肉', perishable: true, type: 'main' },
    { name: '肉沫', unit: '斤', price: 0, isActive: true, category: '肉', perishable: true, type: 'main' },
    { name: '猪脚', unit: '斤', price: 0, isActive: true, category: '肉', perishable: true, type: 'main' },
    { name: '排骨', unit: '斤', price: 0, isActive: true, category: '肉', perishable: true, type: 'main' },
    { name: '粉肠', unit: '斤', price: 0, isActive: true, category: '肉', perishable: true, type: 'main' },
    { name: '里脊肉', unit: '斤', price: 0, isActive: true, category: '肉', perishable: true, type: 'main' },
    { name: '肉丝', unit: '斤', price: 0, isActive: true, category: '肉', perishable: true, type: 'main' },
    { name: '腊肉', unit: '斤', price: 0, isActive: true, category: '肉', perishable: true, type: 'main' },
    { name: '猪血丸子', unit: '斤', price: 0, isActive: true, category: '肉', perishable: true, type: 'main' },
    { name: '猪尾', unit: '个', price: 0, isActive: true, category: '肉', perishable: true, type: 'main' },
    { name: '鸡（整个）', unit: '个', price: 0, isActive: true, category: '禽', perishable: true, type: 'main' },
    { name: '三黄鸡块（小块）', unit: '斤', price: 0, isActive: true, category: '禽', perishable: true, type: 'main' },
    { name: '三黄鸡块（母子大小）', unit: '斤', price: 0, isActive: true, category: '禽', perishable: true, type: 'main' },
    { name: '三黄鸡（大块）', unit: '斤', price: 0, isActive: true, category: '禽', perishable: true, type: 'main' },
    { name: '乌鸡', unit: '斤', price: 0, isActive: true, category: '禽', perishable: true, type: 'main' },
    { name: '鸡杂', unit: '斤', price: 0, isActive: true, category: '禽', perishable: true, type: 'main' },
    { name: '烧鸭', unit: '斤', price: 0, isActive: true, category: '禽', perishable: true, type: 'main' },
    { name: '鸡蛋', unit: '件', price: 0, isActive: true, category: '蛋', perishable: true, type: 'main' },
    { name: '咸鸭蛋', unit: '件', price: 0, isActive: true, category: '蛋', perishable: true, type: 'main' },
    { name: '皮蛋', unit: '件', price: 0, isActive: true, category: '蛋', perishable: true, type: 'main' },
    { name: '老皮蛋', unit: '件', price: 0, isActive: true, category: '蛋', perishable: true, type: 'main' },
    { name: '鹌鹑蛋', unit: '件', price: 0, isActive: true, category: '蛋', perishable: true, type: 'main' },
    { name: '鱿鱼条', unit: '斤', price: 0, isActive: true, category: '水产海鲜', perishable: true, type: 'main' },
    { name: '黑鱼片', unit: '斤', price: 0, isActive: true, category: '水产海鲜', perishable: true, type: 'main' },
    { name: '草鱼', unit: '斤', price: 0, isActive: true, category: '水产海鲜', perishable: true, type: 'main' },
    { name: '鲈鱼', unit: '斤', price: 0, isActive: true, category: '水产海鲜', perishable: true, type: 'main' },
    { name: '黄骨鱼', unit: '斤', price: 0, isActive: true, category: '水产海鲜', perishable: true, type: 'main' },
    { name: '荷花鱼', unit: '斤', price: 0, isActive: true, category: '水产海鲜', perishable: true, type: 'main' },
    { name: '刁子鱼', unit: '斤', price: 0, isActive: true, category: '水产海鲜', perishable: true, type: 'main' },
    { name: '甲鱼', unit: '斤', price: 0, isActive: true, category: '水产海鲜', perishable: true, type: 'main' },
    { name: '泥鳅', unit: '斤', price: 0, isActive: true, category: '水产海鲜', perishable: true, type: 'main' },
    { name: '大头鱼', unit: '斤', price: 0, isActive: true, category: '水产海鲜', perishable: true, type: 'main' },
    { name: '田鸡', unit: '斤', price: 0, isActive: true, category: '水产海鲜', perishable: true, type: 'main' },
    { name: '金昌', unit: '斤', price: 0, isActive: true, category: '水产海鲜', perishable: true, type: 'main' },
    { name: '红杉', unit: '斤', price: 0, isActive: true, category: '水产海鲜', perishable: true, type: 'main' },
    { name: '带鱼', unit: '斤', price: 0, isActive: true, category: '水产海鲜', perishable: true, type: 'main' },
    { name: '多宝鱼', unit: '斤', price: 0, isActive: true, category: '水产海鲜', perishable: true, type: 'main' },
    { name: '花甲肉', unit: '斤', price: 0, isActive: true, category: '水产海鲜', perishable: true, type: 'main' },
    { name: '海带', unit: '斤', price: 0, isActive: true, category: '水产海鲜', perishable: true, type: 'main' },
    { name: '基围虾', unit: '斤', price: 0, isActive: true, category: '虾蟹贝壳', perishable: true, type: 'main' },
    { name: '九节虾', unit: '斤', price: 0, isActive: true, category: '虾蟹贝壳', perishable: true, type: 'main' },
    { name: '罗氏虾', unit: '斤', price: 0, isActive: true, category: '虾蟹贝壳', perishable: true, type: 'main' },
    { name: '螃蟹', unit: '斤', price: 0, isActive: true, category: '虾蟹贝壳', perishable: true, type: 'main' },
    { name: '扇贝', unit: '斤', price: 0, isActive: true, category: '虾蟹贝壳', perishable: true, type: 'main' },
    { name: '生蚝', unit: '斤', price: 0, isActive: true, category: '虾蟹贝壳', perishable: true, type: 'main' },
    { name: '牛肉', unit: '斤', price: 0, isActive: true, category: '牛肉', perishable: true, type: 'main' },
    { name: '牛腩', unit: '斤', price: 0, isActive: true, category: '牛肉', perishable: true, type: 'main' },
    { name: '牛肚', unit: '斤', price: 0, isActive: true, category: '牛肉', perishable: true, type: 'main' },
    { name: '牛肉丸', unit: '斤', price: 0, isActive: true, category: '牛肉', perishable: true, type: 'main' },
    { name: '牛小肠', unit: '斤', price: 0, isActive: true, category: '牛肉', perishable: true, type: 'main' },
    { name: '海鲜菇', unit: '斤', price: 0, isActive: true, category: '菌菇', perishable: true, type: 'main' },
    { name: '金针菇', unit: '斤', price: 0, isActive: true, category: '菌菇', perishable: true, type: 'main' },
    { name: '白玉菇', unit: '斤', price: 0, isActive: true, category: '菌菇', perishable: true, type: 'main' },
    { name: '杏鲍菇', unit: '斤', price: 0, isActive: true, category: '菌菇', perishable: true, type: 'main' },
    { name: '蟹味菇', unit: '斤', price: 0, isActive: true, category: '菌菇', perishable: true, type: 'main' },
    { name: '秀珍菇', unit: '斤', price: 0, isActive: true, category: '菌菇', perishable: true, type: 'main' },
    { name: '香菇', unit: '斤', price: 0, isActive: true, category: '菌菇', perishable: true, type: 'main' },
    { name: '包装平菇', unit: '斤', price: 0, isActive: true, category: '菌菇', perishable: true, type: 'main' },
    { name: '花生芽', unit: '斤', price: 0, isActive: true, category: '菌菇', perishable: true, type: 'main' },
    { name: '豆苗', unit: '斤', price: 0, isActive: true, category: '菌菇', perishable: true, type: 'main' },
    { name: '白蘑菇', unit: '斤', price: 0, isActive: true, category: '菌菇', perishable: true, type: 'main' },
    { name: '散装平菇', unit: '斤', price: 0, isActive: true, category: '菌菇', perishable: true, type: 'main' },
    { name: '茶树菇', unit: '斤', price: 0, isActive: true, category: '菌菇', perishable: true, type: 'main' },
    { name: '切香菇', unit: '斤', price: 0, isActive: true, category: '菌菇', perishable: true, type: 'main' },
    { name: '虫草花', unit: '斤', price: 0, isActive: true, category: '菌菇', perishable: true, type: 'main' },
    { name: '花生米', unit: '斤', price: 0, isActive: true, category: '杂粮', perishable: false, type: 'main' },
    { name: '薏米', unit: '斤', price: 0, isActive: true, category: '杂粮', perishable: false, type: 'main' },
    { name: '黄豆', unit: '斤', price: 0, isActive: true, category: '杂粮', perishable: false, type: 'main' },
    { name: '绿豆', unit: '斤', price: 0, isActive: true, category: '杂粮', perishable: false, type: 'main' },
    { name: '白糖', unit: '斤', price: 0, isActive: true, category: '其他辅料', perishable: false, type: 'main' },
    { name: '红枣', unit: '斤', price: 0, isActive: true, category: '其他辅料', perishable: false, type: 'main' },
    { name: '枸杞', unit: '斤', price: 0, isActive: true, category: '其他辅料', perishable: false, type: 'main' },
    { name: '蒸肉粉', unit: '件', price: 0, isActive: true, category: '其他辅料', perishable: false, type: 'main' },
    { name: '脆皮香蕉', unit: '斤', price: 0, isActive: true, category: '油炸半成品', perishable: false, type: 'main' },
    { name: '爆浆糍粑', unit: '斤', price: 0, isActive: true, category: '油炸半成品', perishable: false, type: 'main' },
    { name: '绿茶饼', unit: '斤', price: 0, isActive: true, category: '油炸半成品', perishable: false, type: 'main' },
    { name: '香芋地瓜丸', unit: '斤', price: 0, isActive: true, category: '油炸半成品', perishable: false, type: 'main' },
    { name: '南瓜饼', unit: '斤', price: 0, isActive: true, category: '油炸半成品', perishable: false, type: 'main' },
    { name: '双皮奶', unit: '斤', price: 0, isActive: true, category: '油炸半成品', perishable: false, type: 'main' },
    { name: '折耳根', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '龙须菜', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '玉米', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '红萝卜', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '香芹', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '干萝卜条', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '水果胡萝卜', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '豌豆', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '海带丝', unit: '斤', price: 0, isActive: true, category: '蔬菜', perishable: true, type: 'main' },
    { name: '韭黄', unit: '斤', price: 0, isActive: true, category: '叶菜', perishable: true, type: 'main' },
    { name: '包菜', unit: '斤', price: 0, isActive: true, category: '叶菜', perishable: true, type: 'main' },
    { name: '清江鱼', unit: '斤', price: 0, isActive: true, category: '水产海鲜', perishable: true, type: 'main' },
    { name: '海鱼', unit: '斤', price: 0, isActive: true, category: '水产海鲜', perishable: true, type: 'main' },
    { name: '墨鱼丸', unit: '斤', price: 0, isActive: true, category: '水产海鲜', perishable: true, type: 'main' },
    { name: '鱼尾', unit: '斤', price: 0, isActive: true, category: '水产海鲜', perishable: true, type: 'main' },
    { name: '牛蛙', unit: '斤', price: 0, isActive: true, category: '水产海鲜', perishable: true, type: 'main' },
    { name: '鸡块', unit: '斤', price: 0, isActive: true, category: '禽', perishable: true, type: 'main' },
    { name: '鸡扒', unit: '斤', price: 0, isActive: true, category: '禽', perishable: true, type: 'main' },
    { name: '鸡翅根', unit: '斤', price: 0, isActive: true, category: '禽', perishable: true, type: 'main' },
    { name: '鹅', unit: '斤', price: 0, isActive: true, category: '禽', perishable: true, type: 'main' },
    { name: '鸡', unit: '斤', price: 0, isActive: true, category: '禽', perishable: true, type: 'main' },
    { name: '整鸡', unit: '斤', price: 0, isActive: true, category: '禽', perishable: true, type: 'main' },
    { name: '无骨鸡爪', unit: '斤', price: 0, isActive: true, category: '禽', perishable: true, type: 'main' },
    { name: '鸡脖子', unit: '斤', price: 0, isActive: true, category: '禽', perishable: true, type: 'main' },
    { name: '鸭', unit: '斤', price: 0, isActive: true, category: '禽', perishable: true, type: 'main' },
    { name: '鸭血', unit: '斤', price: 0, isActive: true, category: '禽', perishable: true, type: 'main' },
    { name: '鸡小块', unit: '斤', price: 0, isActive: true, category: '禽', perishable: true, type: 'main' },
    { name: '鸡中翅', unit: '斤', price: 0, isActive: true, category: '禽', perishable: true, type: 'main' },
    { name: '带皮五花肉片', unit: '斤', price: 0, isActive: true, category: '肉', perishable: true, type: 'main' },
    { name: '带皮五花肉', unit: '斤', price: 0, isActive: true, category: '肉', perishable: true, type: 'main' },
    { name: '烤肠', unit: '根', price: 0, isActive: true, category: '肉', perishable: true, type: 'main' },
    { name: '猪肚', unit: '斤', price: 0, isActive: true, category: '肉', perishable: true, type: 'main' },
    { name: '猪耳朵', unit: '斤', price: 0, isActive: true, category: '肉', perishable: true, type: 'main' },
    { name: '猪骨', unit: '斤', price: 0, isActive: true, category: '肉', perishable: true, type: 'main' },
    { name: '小炒肉肉片', unit: '斤', price: 0, isActive: true, category: '肉', perishable: true, type: 'main' },
    { name: '肥肠', unit: '斤', price: 0, isActive: true, category: '肉', perishable: true, type: 'main' },
    { name: '孜然脆骨', unit: '斤', price: 0, isActive: true, category: '肉', perishable: true, type: 'main' },
    { name: '肉片', unit: '斤', price: 0, isActive: true, category: '肉', perishable: true, type: 'main' },
    { name: '猪排骨', unit: '斤', price: 0, isActive: true, category: '肉', perishable: true, type: 'main' },
    { name: '小酥肉', unit: '斤', price: 0, isActive: true, category: '肉', perishable: true, type: 'main' },
    { name: '火腿', unit: '根', price: 0, isActive: true, category: '肉', perishable: true, type: 'main' },
    { name: '猪扒', unit: '斤', price: 0, isActive: true, category: '肉', perishable: true, type: 'main' },
    { name: '羊肉', unit: '斤', price: 0, isActive: true, category: '肉', perishable: true, type: 'main' },
    { name: '鲜香菇', unit: '斤', price: 0, isActive: true, category: '菌菇', perishable: true, type: 'main' },
    { name: '鹿茸菇', unit: '斤', price: 0, isActive: true, category: '菌菇', perishable: true, type: 'main' },
    { name: '木耳', unit: '斤', price: 0, isActive: true, category: '菌菇', perishable: true, type: 'main' },
    { name: '干香菇', unit: '斤', price: 0, isActive: true, category: '菌菇', perishable: true, type: 'main' },
    { name: '黑木耳', unit: '斤', price: 0, isActive: true, category: '菌菇', perishable: true, type: 'main' },
    { name: '白木耳', unit: '斤', price: 0, isActive: true, category: '菌菇', perishable: true, type: 'main' },
    { name: '银耳', unit: '斤', price: 0, isActive: true, category: '菌菇', perishable: true, type: 'main' },
    { name: '虾仁', unit: '斤', price: 0, isActive: true, category: '虾蟹贝壳', perishable: true, type: 'main' },
    { name: '蒜蓉', unit: '斤', price: 0, isActive: true, category: '调味配菜', perishable: true, type: 'main' },
    { name: '油豆腐', unit: '斤', price: 0, isActive: true, category: '豆制品', perishable: true, type: 'main' },
    { name: '豆腐', unit: '斤', price: 0, isActive: true, category: '豆制品', perishable: true, type: 'main' },
    { name: '龙口粉丝', unit: '斤', price: 0, isActive: true, category: '豆制品', perishable: true, type: 'main' },
    { name: '剁椒酱', unit: '斤', price: 0, isActive: true, category: '辣椒', perishable: true, type: 'main' },
    { name: '黄灯笼酱', unit: '斤', price: 0, isActive: true, category: '辣椒', perishable: true, type: 'main' },
    { name: '剁椒', unit: '斤', price: 0, isActive: true, category: '辣椒', perishable: true, type: 'main' },
    { name: '酸辣椒', unit: '斤', price: 0, isActive: true, category: '辣椒', perishable: true, type: 'main' },
    { name: '干辣椒', unit: '斤', price: 0, isActive: true, category: '辣椒', perishable: true, type: 'main' },
    { name: '糯米', unit: '斤', price: 0, isActive: true, category: '杂粮', perishable: false, type: 'main' },
    { name: '花生', unit: '斤', price: 0, isActive: true, category: '杂粮', perishable: false, type: 'main' },
    { name: '红皮花生米', unit: '斤', price: 0, isActive: true, category: '杂粮', perishable: false, type: 'main' },
    { name: '荞麦', unit: '斤', price: 0, isActive: true, category: '杂粮', perishable: false, type: 'main' },
    { name: '菠萝', unit: '斤', price: 0, isActive: true, category: '水果', perishable: true, type: 'main' },
    { name: '西瓜', unit: '斤', price: 0, isActive: true, category: '水果', perishable: true, type: 'main' },
    { name: '哈密瓜', unit: '斤', price: 0, isActive: true, category: '水果', perishable: true, type: 'main' },
    { name: '阳光玫瑰 葡萄', unit: '斤', price: 0, isActive: true, category: '水果', perishable: true, type: 'main' },
    { name: '西梅', unit: '斤', price: 0, isActive: true, category: '水果', perishable: true, type: 'main' },
    { name: '雪梨', unit: '斤', price: 0, isActive: true, category: '水果', perishable: true, type: 'main' },
    { name: '金桔', unit: '斤', price: 0, isActive: true, category: '水果', perishable: true, type: 'main' },
    { name: '柠檬', unit: '斤', price: 0, isActive: true, category: '水果', perishable: true, type: 'main' },
    { name: '百香果', unit: '斤', price: 0, isActive: true, category: '水果', perishable: true, type: 'main' },
    { name: '桑葚', unit: '斤', price: 0, isActive: true, category: '水果', perishable: true, type: 'main' },
    { name: '菊花', unit: '斤', price: 0, isActive: true, category: '茶饮', perishable: false, type: 'main' },
    { name: '金银花', unit: '斤', price: 0, isActive: true, category: '茶饮', perishable: false, type: 'main' },
    { name: '茉莉花', unit: '斤', price: 0, isActive: true, category: '茶饮', perishable: false, type: 'main' },
    { name: '罗汉果', unit: '斤', price: 0, isActive: true, category: '茶饮', perishable: false, type: 'main' },
    { name: '陈皮', unit: '斤', price: 0, isActive: true, category: '茶饮', perishable: false, type: 'main' },
    { name: '甘草', unit: '斤', price: 0, isActive: true, category: '茶饮', perishable: false, type: 'main' },
    { name: '甘蔗', unit: '斤', price: 0, isActive: true, category: '茶饮', perishable: false, type: 'main' },
    { name: '茅根', unit: '斤', price: 0, isActive: true, category: '茶饮', perishable: false, type: 'main' },
    ].map((item) =>
      this.ingredientRepository.create({ ...item, isActive: true }),
    );

    await this.ingredientRepository.save(toCreate);
    return this.ingredientRepository.find({ order: { createdAt: 'ASC' } });
  }

  private async ensureDishes(ingredients: Ingredient[]) {
    const existing = await this.dishRepository.count();
    if (existing >= 100) {
      return;
    }

    const byName = (name: string) => ingredients.find((i) => i.name === name);

    const allDishes = [
    {
      name: '粉蒸肉',
      category: DishCategory.STEAM,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '猪肉',
      ingredients: [
        { ingredientName: '带皮五花肉片', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '蒸肉粉', quantity: 0.2, unit: '件', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '粉蒸肉', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '梅菜扣肉',
      category: DishCategory.STEAM,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '蔬菜, 猪肉',
      ingredients: [
        { ingredientName: '带皮五花肉', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '梅菜', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '梅菜扣肉', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '香菇蒸鸡',
      category: DishCategory.STEAM,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '鸡, 菌菇',
      ingredients: [
        { ingredientName: '鸡块', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '香菇', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '香菇蒸鸡', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '板栗蒸鸡',
      category: DishCategory.STEAM,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '鸡, 蔬菜',
      ingredients: [
        { ingredientName: '鸡块', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '板栗', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '板栗蒸鸡', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '虫草花蒸鸡',
      category: DishCategory.STEAM,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '鸡, 菌菇',
      ingredients: [
        { ingredientName: '鸡块', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '虫草花', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '虫草花蒸鸡', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '清蒸鲈鱼',
      category: DishCategory.STEAM,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '鱼, 海鲜',
      ingredients: [
        { ingredientName: '鲈鱼', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '清蒸鲈鱼', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '蒸黄骨鱼',
      category: DishCategory.STEAM,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '鱼, 海鲜, 辣椒',
      ingredients: [
        { ingredientName: '黄骨鱼', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '剁椒酱', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '黄灯笼酱', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '蒸黄骨鱼', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '蒸清江鱼',
      category: DishCategory.STEAM,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '鱼, 海鲜, 辣椒',
      ingredients: [
        { ingredientName: '清江鱼', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '剁椒', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '蒸清江鱼', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '蒸海鱼',
      category: DishCategory.STEAM,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '鱼, 海鲜',
      ingredients: [
        { ingredientName: '海鱼', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '蒸海鱼', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '酿三宝',
      category: DishCategory.STEAM,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '蔬菜, 猪肉, 豆制品, 菌菇',
      ingredients: [
        { ingredientName: '肉沫', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '苦瓜', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '鲜香菇', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '油豆腐', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '酿三宝', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '蒸老南瓜',
      category: DishCategory.STEAM,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '蔬菜',
      ingredients: [
        { ingredientName: '老南瓜', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '蒸老南瓜', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '蒸山药',
      category: DishCategory.STEAM,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '蔬菜',
      ingredients: [
        { ingredientName: '山药', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '蒸山药', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '蒸水蛋',
      category: DishCategory.STEAM,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '蛋',
      ingredients: [
        { ingredientName: '鸡蛋', quantity: 0.5, unit: '件', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '蒸水蛋', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '虾仁蒸蛋',
      category: DishCategory.STEAM,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '虾蟹贝壳, 蛋',
      ingredients: [
        { ingredientName: '虾仁', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '鸡蛋', quantity: 0.2, unit: '件', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '虾仁蒸蛋', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '梅菜蒸肉饼',
      category: DishCategory.STEAM,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '蔬菜, 猪肉',
      ingredients: [
        { ingredientName: '肉沫', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '梅菜', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '梅菜蒸肉饼', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '珍珠丸子',
      category: DishCategory.STEAM,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '猪肉, 杂粮',
      ingredients: [
        { ingredientName: '肉沫', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '糯米', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '珍珠丸子', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '蒜蓉九节虾',
      category: DishCategory.STEAM,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '虾蟹贝壳',
      ingredients: [
        { ingredientName: '蒜蓉', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '九节虾', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '蒜蓉九节虾', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '煎鸡扒',
      category: DishCategory.PAN_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '鸡',
      ingredients: [
        { ingredientName: '鸡扒', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '煎鸡扒', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '煎鸡蛋',
      category: DishCategory.PAN_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '蛋',
      ingredients: [
        { ingredientName: '鸡蛋', quantity: 0.5, unit: '件', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '煎鸡蛋', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '煎猪扒',
      category: DishCategory.PAN_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '',
      ingredients: [
        { ingredientName: '猪扒', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '煎猪扒', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '炸鸡翅根',
      category: DishCategory.PAN_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '鸡',
      ingredients: [
        { ingredientName: '鸡翅根', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '炸鸡翅根', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '炸烤肠',
      category: DishCategory.PAN_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '猪肉',
      ingredients: [
        { ingredientName: '烤肠', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '炸烤肠', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '炸脆皮香蕉',
      category: DishCategory.PAN_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '油炸半成品',
      ingredients: [
        { ingredientName: '脆皮香蕉', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '炸脆皮香蕉', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '炸双皮奶',
      category: DishCategory.PAN_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '',
      ingredients: [
        { ingredientName: '双皮奶', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '炸双皮奶', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '炸爆浆糍粑',
      category: DishCategory.PAN_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '油炸半成品',
      ingredients: [
        { ingredientName: '爆浆糍粑', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '炸爆浆糍粑', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '炸绿茶饼',
      category: DishCategory.PAN_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '油炸半成品',
      ingredients: [
        { ingredientName: '绿茶饼', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '炸绿茶饼', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '炸香芋地瓜丸',
      category: DishCategory.PAN_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '油炸半成品',
      ingredients: [
        { ingredientName: '香芋地瓜丸', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '炸香芋地瓜丸', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '炸南瓜饼',
      category: DishCategory.PAN_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '油炸半成品',
      ingredients: [
        { ingredientName: '南瓜饼', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '炸南瓜饼', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '红烧肉',
      category: DishCategory.CASSEROLE,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '猪肉',
      ingredients: [
        { ingredientName: '带皮五花肉', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '红烧肉', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '牛腩炖萝卜',
      category: DishCategory.CASSEROLE,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '牛肉, 蔬菜',
      ingredients: [
        { ingredientName: '牛腩', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '白萝卜', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '牛腩炖萝卜', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '牛腩腐竹',
      category: DishCategory.CASSEROLE,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '牛肉, 豆制品',
      ingredients: [
        { ingredientName: '牛腩', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '腐竹', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '牛腩腐竹', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '白灼虾',
      category: DishCategory.CASSEROLE,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '虾蟹贝壳',
      ingredients: [
        { ingredientName: '基围虾', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '白灼虾', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '猪脚炖莲藕',
      category: DishCategory.CASSEROLE,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '蔬菜, 猪肉, 杂粮',
      ingredients: [
        { ingredientName: '猪脚', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '莲藕', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '花生', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '猪脚炖莲藕', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '酸菜鱼',
      category: DishCategory.CASSEROLE,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '鱼, 蔬菜, 海鲜',
      ingredients: [
        { ingredientName: '黑鱼片', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '酸菜', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '酸菜鱼', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '双色丸子',
      category: DishCategory.CASSEROLE,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '牛肉, 海鲜, 鱼',
      ingredients: [
        { ingredientName: '牛肉丸', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '墨鱼丸', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '双色丸子', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '铁锅炖大鹅',
      category: DishCategory.CASSEROLE,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '鸭',
      ingredients: [
        { ingredientName: '鹅', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '铁锅炖大鹅', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '羊肉炖萝卜',
      category: DishCategory.CASSEROLE,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '牛肉, 蔬菜',
      ingredients: [
        { ingredientName: '羊肉', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '白萝卜', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '羊肉炖萝卜', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '乌鸡炖山药',
      category: DishCategory.CASSEROLE,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '鸡, 蔬菜',
      ingredients: [
        { ingredientName: '乌鸡', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '山药', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '乌鸡炖山药', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '猪肚鸡',
      category: DishCategory.CASSEROLE,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '鸡, 猪肉',
      ingredients: [
        { ingredientName: '猪肚', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '鸡', quantity: 0.2, unit: '个', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '猪肚鸡', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '红烧猪脚',
      category: DishCategory.CASSEROLE,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '猪肉',
      ingredients: [
        { ingredientName: '猪脚', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '红烧猪脚', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '白切鸡',
      category: DishCategory.COLD,
      station: Station.PREP,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '鸡, 鸭',
      ingredients: [
        { ingredientName: '整鸡', quantity: 0.5, unit: '个', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '白切鸡', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '烧鸭',
      category: DishCategory.COLD,
      station: Station.PREP,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '鸡, 鸭',
      ingredients: [
        { ingredientName: '烧鸭', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '烧鸭', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '咸鸭蛋',
      category: DishCategory.COLD,
      station: Station.PREP,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '蛋',
      ingredients: [
        { ingredientName: '咸鸭蛋', quantity: 0.5, unit: '件', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '咸鸭蛋', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '炸花生米',
      category: DishCategory.COLD,
      station: Station.PREP,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '杂粮',
      ingredients: [
        { ingredientName: '红皮花生米', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '炸花生米', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '泡椒无骨鸡爪',
      category: DishCategory.COLD,
      station: Station.PREP,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '鸡, 鸭',
      ingredients: [
        { ingredientName: '无骨鸡爪', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '泡椒无骨鸡爪', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '凉拌猪耳朵',
      category: DishCategory.COLD,
      station: Station.PREP,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '猪肉',
      ingredients: [
        { ingredientName: '猪耳朵', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '凉拌猪耳朵', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '凉拌木耳',
      category: DishCategory.COLD,
      station: Station.PREP,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '菌菇',
      ingredients: [
        { ingredientName: '木耳', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '凉拌木耳', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '凉拌腐竹',
      category: DishCategory.COLD,
      station: Station.PREP,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '豆制品',
      ingredients: [
        { ingredientName: '腐竹', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '凉拌腐竹', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '凉拌折耳根',
      category: DishCategory.COLD,
      station: Station.PREP,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '蔬菜',
      ingredients: [
        { ingredientName: '折耳根', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '凉拌折耳根', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '凉拌海带丝',
      category: DishCategory.COLD,
      station: Station.PREP,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '水产海鲜',
      ingredients: [
        { ingredientName: '海带丝', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '凉拌海带丝', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '擂辣椒皮蛋',
      category: DishCategory.COLD,
      station: Station.PREP,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '辣椒, 蛋',
      ingredients: [
        { ingredientName: '皮蛋', quantity: 0.5, unit: '件', wasteRate: 0.05 },
        { ingredientName: '小炒肉辣椒', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '擂辣椒皮蛋', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '凉拌龙须菜',
      category: DishCategory.COLD,
      station: Station.PREP,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '蔬菜',
      ingredients: [
        { ingredientName: '龙须菜', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '凉拌龙须菜', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '西瓜',
      category: DishCategory.FRUIT,
      station: Station.PREP,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '水果',
      ingredients: [
        { ingredientName: '西瓜', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '西瓜', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '哈密瓜',
      category: DishCategory.FRUIT,
      station: Station.PREP,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '',
      ingredients: [
        { ingredientName: '哈密瓜', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '哈密瓜', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '阳光玫瑰 葡萄',
      category: DishCategory.FRUIT,
      station: Station.PREP,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '水果',
      ingredients: [
        { ingredientName: '阳光玫瑰 葡萄', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '阳光玫瑰 葡萄', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '西梅',
      category: DishCategory.FRUIT,
      station: Station.PREP,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '',
      ingredients: [
        { ingredientName: '西梅', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '西梅', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '玉米红萝卜骨汤',
      category: DishCategory.SOUP,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '猪肉, 蔬菜',
      ingredients: [
        { ingredientName: '玉米', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '红萝卜', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '猪骨', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '玉米红萝卜骨汤', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '白萝卜猪骨汤',
      category: DishCategory.SOUP,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '猪肉, 蔬菜',
      ingredients: [
        { ingredientName: '白萝卜', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '猪骨', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '白萝卜猪骨汤', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '冬瓜薏米猪骨汤',
      category: DishCategory.SOUP,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '杂粮, 猪肉, 蔬菜',
      ingredients: [
        { ingredientName: '冬瓜', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '薏米', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '猪骨', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '冬瓜薏米猪骨汤', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '海带猪骨汤',
      category: DishCategory.SOUP,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '水产海鲜, 猪肉',
      ingredients: [
        { ingredientName: '海带丝', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '猪骨', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '海带猪骨汤', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '虫草花鹿茸菇鸡骨汤',
      category: DishCategory.SOUP,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '鸭, 鸡, 菌菇',
      ingredients: [
        { ingredientName: '虫草花', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '鹿茸菇', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '鸡脖子', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '虫草花鹿茸菇鸡骨汤', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '豆腐金针菇猪骨汤',
      category: DishCategory.SOUP,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '猪肉, 豆制品, 菌菇',
      ingredients: [
        { ingredientName: '豆腐', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '金针菇', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '猪骨', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '豆腐金针菇猪骨汤', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '小炒肉',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '辣椒, 猪肉',
      ingredients: [
        { ingredientName: '小炒肉肉片', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '小炒肉辣椒', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '小炒肉', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '小炒黄牛肉',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '牛肉, 蔬菜, 辣椒',
      ingredients: [
        { ingredientName: '牛肉', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '螺丝椒', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '香芹', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '小炒黄牛肉', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '西红柿炒鸡蛋',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '蔬菜, 蛋',
      ingredients: [
        { ingredientName: '番茄', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '鸡蛋', quantity: 0.2, unit: '件', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '西红柿炒鸡蛋', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '小炒猪肝',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '辣椒, 猪肉',
      ingredients: [
        { ingredientName: '猪肝', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '螺丝椒', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '小炒猪肝', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '酸辣肥肠',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '辣椒, 蔬菜, 猪肉',
      ingredients: [
        { ingredientName: '肥肠', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '蒜苔', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '酸豆角', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '酸辣椒', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '酸辣肥肠', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '血鸭',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '鸡, 鸭',
      ingredients: [
        { ingredientName: '鸭', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '鸭血', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '血鸭', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '孜然脆骨',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '猪肉',
      ingredients: [
        { ingredientName: '孜然脆骨', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '孜然脆骨', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '红烧鱼块',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '鱼, 海鲜',
      ingredients: [
        { ingredientName: '鱼尾', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '红烧鱼块', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '香干炒肉',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '猪肉, 豆制品',
      ingredients: [
        { ingredientName: '香干', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '肉片', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '香干炒肉', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '干萝卜条炒腊肉',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '猪肉, 蔬菜',
      ingredients: [
        { ingredientName: '干萝卜条', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '腊肉', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '干萝卜条炒腊肉', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '香辣泥鳅',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '鱼, 海鲜, 辣椒',
      ingredients: [
        { ingredientName: '泥鳅', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '干辣椒', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '香辣泥鳅', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '爆炒牛蛙',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '鱼, 海鲜',
      ingredients: [
        { ingredientName: '牛蛙', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '爆炒牛蛙', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '小炒鸡',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '鸡, 鸭',
      ingredients: [
        { ingredientName: '鸡小块', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '小炒鸡', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '爆炒牛小肠',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '牛肉',
      ingredients: [
        { ingredientName: '牛小肠', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '爆炒牛小肠', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '可乐鸡翅',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '鸡, 鸭',
      ingredients: [
        { ingredientName: '鸡中翅', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '可乐鸡翅', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '猪血丸子',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '猪肉',
      ingredients: [
        { ingredientName: '猪血丸子', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '猪血丸子', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '红烧排骨',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '猪肉',
      ingredients: [
        { ingredientName: '猪排骨', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '红烧排骨', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '酸辣鸡杂',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '辣椒, 鸡, 蔬菜',
      ingredients: [
        { ingredientName: '鸡杂', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '酸豆角', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '酸辣椒', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '酸辣鸡杂', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '糖醋里脊',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '蔬菜, 猪肉',
      ingredients: [
        { ingredientName: '小酥肉', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '菠萝', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '糖醋里脊', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '韭黄炒鸡蛋',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '蔬菜, 蛋',
      ingredients: [
        { ingredientName: '韭黄', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '鸡蛋', quantity: 0.2, unit: '件', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '韭黄炒鸡蛋', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '红烧茄子',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '蔬菜',
      ingredients: [
        { ingredientName: '紫茄子', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '红烧茄子', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '素炒花菜',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '蔬菜',
      ingredients: [
        { ingredientName: '散花菜', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '素炒花菜', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '素炒莴笋',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '蔬菜',
      ingredients: [
        { ingredientName: '莴笋', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '素炒莴笋', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '荷兰豆炒木耳',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '蔬菜, 菌菇',
      ingredients: [
        { ingredientName: '荷兰豆', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '黑木耳', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '荷兰豆炒木耳', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '白灼西兰花',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '蔬菜',
      ingredients: [
        { ingredientName: '西蓝花', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '白灼西兰花', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '水果胡萝卜',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '蔬菜',
      ingredients: [
        { ingredientName: '水果胡萝卜', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '水果胡萝卜', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '土豆丝',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '蔬菜',
      ingredients: [
        { ingredientName: '土豆', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '土豆丝', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '素炒丝瓜',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '蔬菜',
      ingredients: [
        { ingredientName: '八角丝瓜', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '素炒丝瓜', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '苦笋炒酸菜',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '蔬菜',
      ingredients: [
        { ingredientName: '苦笋', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '酸菜', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '苦笋炒酸菜', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '水晶粉丝',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '蔬菜, 豆制品',
      ingredients: [
        { ingredientName: '龙口粉丝', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '包菜', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '水晶粉丝', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '长豆角',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '蔬菜',
      ingredients: [
        { ingredientName: '长豆角', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '长豆角', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '金玉满堂',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '猪肉, 蔬菜',
      ingredients: [
        { ingredientName: '玉米粒', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '豌豆', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '火腿', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '金玉满堂', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '素炒杏鲍菇',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '菌菇',
      ingredients: [
        { ingredientName: '杏鲍菇', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '素炒杏鲍菇', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '素炒毛豆',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '蔬菜',
      ingredients: [
        { ingredientName: '毛豆米', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '素炒毛豆', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '手撕包菜',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '蔬菜',
      ingredients: [
        { ingredientName: '包菜', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '手撕包菜', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '干煸四季豆',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '蔬菜',
      ingredients: [
        { ingredientName: '四季豆', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '干煸四季豆', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '素炒黄皮豆腐',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '豆制品',
      ingredients: [
        { ingredientName: '黄皮豆腐', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '素炒黄皮豆腐', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '麻婆豆腐',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '豆制品',
      ingredients: [
        { ingredientName: '豆腐', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '麻婆豆腐', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '宁夏菜心',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '叶菜',
      ingredients: [
        { ingredientName: '菜心苗', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '宁夏菜心', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '芥蓝',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '叶菜',
      ingredients: [
        { ingredientName: '芥蓝苗', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '芥蓝', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '白菜',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '叶菜',
      ingredients: [
        { ingredientName: '大白菜', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '白菜', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '油麦菜',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '叶菜',
      ingredients: [
        { ingredientName: '油麦菜', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '油麦菜', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '菠菜',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '叶菜',
      ingredients: [
        { ingredientName: '菠菜', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '菠菜', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '豌豆苗',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '菌菇',
      ingredients: [
        { ingredientName: '豆苗', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '豌豆苗', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '白菜苔',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '叶菜',
      ingredients: [
        { ingredientName: '红菜苔', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '白菜苔', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '生菜',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '叶菜',
      ingredients: [
        { ingredientName: '生菜', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '生菜', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '皇帝菜',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '叶菜',
      ingredients: [
        { ingredientName: '皇帝菜', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '皇帝菜', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '萝卜苗',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '叶菜',
      ingredients: [
        { ingredientName: '菜心苗', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '萝卜苗', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '红菜苔',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '叶菜',
      ingredients: [
        { ingredientName: '红菜苔', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '红菜苔', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '耳菜',
      category: DishCategory.STIR_FRY,
      station: Station.WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '菌菇',
      ingredients: [
        { ingredientName: '豆苗', quantity: 0.5, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '耳菜', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '三花茶',
      category: DishCategory.TEA,
      station: Station.BREAKFAST_WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '茶饮',
      ingredients: [
        { ingredientName: '菊花', quantity: 0.5, unit: '克', wasteRate: 0.05 },
        { ingredientName: '金银花', quantity: 0.2, unit: '克', wasteRate: 0.05 },
        { ingredientName: '茉莉花', quantity: 0.2, unit: '克', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '三花茶', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '罗汉果茶',
      category: DishCategory.TEA,
      station: Station.BREAKFAST_WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '茶饮',
      ingredients: [
        { ingredientName: '罗汉果', quantity: 0.5, unit: '个', wasteRate: 0.05 },
        { ingredientName: '陈皮', quantity: 0.2, unit: '个', wasteRate: 0.05 },
        { ingredientName: '甘草', quantity: 0.2, unit: '克', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '罗汉果茶', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '甘蔗茅根茶',
      category: DishCategory.TEA,
      station: Station.BREAKFAST_WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '',
      ingredients: [
        { ingredientName: '甘蔗', quantity: 0.5, unit: '克', wasteRate: 0.05 },
        { ingredientName: '茅根', quantity: 0.2, unit: '克', wasteRate: 0.05 },
        { ingredientName: '雪梨', quantity: 0.2, unit: '个', wasteRate: 0.05 },
        { ingredientName: '红枣', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '甘蔗茅根茶', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '金桔柠檬茶',
      category: DishCategory.TEA,
      station: Station.BREAKFAST_WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '',
      ingredients: [
        { ingredientName: '金桔', quantity: 0.5, unit: '个', wasteRate: 0.05 },
        { ingredientName: '柠檬', quantity: 0.2, unit: '个', wasteRate: 0.05 },
        { ingredientName: '百香果', quantity: 0.2, unit: '个', wasteRate: 0.05 },
        { ingredientName: '白糖', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '金桔柠檬茶', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '桑葚茶',
      category: DishCategory.TEA,
      station: Station.BREAKFAST_WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '水果, 茶饮',
      ingredients: [
        { ingredientName: '桑葚', quantity: 0.5, unit: '克', wasteRate: 0.05 },
        { ingredientName: '枸杞', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
        { ingredientName: '菊花', quantity: 0.2, unit: '克', wasteRate: 0.05 },
        { ingredientName: '红枣', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '桑葚茶', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    {
      name: '荞麦茶',
      category: DishCategory.TEA,
      station: Station.BREAKFAST_WOK,
      mealType: MealType.LUNCH,
      recommendWeight: 1,
      relatedIngredients: '杂粮',
      ingredients: [
        { ingredientName: '荞麦', quantity: 0.5, unit: '克', wasteRate: 0.05 },
        { ingredientName: '枸杞', quantity: 0.2, unit: '斤', wasteRate: 0.05 },
      ].map(entry => {
        const found = byName(entry.ingredientName);
        return found ? { ingredientId: found.id, quantity: entry.quantity, unit: entry.unit, wasteRate: entry.wasteRate } : null;
      }).filter(Boolean),
      steps: [{ id: 1, title: '荞麦茶', description: '标准操作流程', duration: 15, station: 'prep' }],
      ingredientCost: 0,
      isActive: true,
      coverImageUrl: '',
    },
    ];

    for (const dishData of allDishes) {
      const existing = await this.dishRepository.findOne({ where: { name: dishData.name } });
      if (!existing) {
        await this.dishRepository.save(
          this.dishRepository.create(dishData),
        );
      }
    }
  }

  private async ensureP1Defaults(storeId: string) {
    await this.ensureDishTypeTags();
    await this.ensureAlgorithmConfig(storeId);
    await this.ensureMenuStandards(storeId);
    await this.ensureMenuPairingRules(storeId);
  }

  private async ensureDishTypeTags() {
    const existing = await this.dishTypeTagRepository.find({ order: { priority: 'DESC' } });
    if (existing.length >= 3) {
      return existing;
    }

    const defaults = [
      {
        code: 'big_meat',
        name: '大荤',
        description: '以肉类、禽类、鱼类为主的菜品',
        keywords: ['肉', '鸡', '鸭', '鱼', '牛', '羊', '排骨', '猪', '扣肉', '五花', '里脊'],
        categoryHints: ['steam', 'casserole', 'deep_fry', 'pan_fry', 'stir'],
        mealTypeHints: ['lunch'],
        priority: 30,
        isActive: true,
      },
      {
        code: 'small_meat',
        name: '小荤',
        description: '以豆制品、蛋类、少量荤素搭配为主的菜品',
        keywords: ['豆腐', '豆干', '千张', '香干', '素鸡', '鸡蛋', '鹌鹑蛋', '鱼块'],
        categoryHints: ['steam', 'casserole', 'stir'],
        mealTypeHints: ['lunch', 'breakfast'],
        priority: 20,
        isActive: true,
      },
      {
        code: 'vegetable',
        name: '素菜',
        description: '以蔬菜、水果、凉拌和清淡汤品为主的菜品',
        keywords: ['蔬菜', '青菜', '菜心', '菠菜', '油麦菜', '白菜', '生菜', '芥蓝', '空心菜', '水果', '茶'],
        categoryHints: ['fruit', 'cold', 'soup', 'tea', 'stir'],
        mealTypeHints: ['lunch', 'breakfast'],
        priority: 10,
        isActive: true,
      },
    ];

    return this.dishTypeTagRepository.save(
      defaults.map((item) => this.dishTypeTagRepository.create(item)),
    );
  }

  private async ensureAlgorithmConfig(storeId: string) {
    const existing = await this.algorithmConfigRepository.findOne({ where: { storeId } });
    if (existing) {
      return existing;
    }

    return this.algorithmConfigRepository.save(
      this.algorithmConfigRepository.create({
        storeId,
        ticketPriceBonusWeight: 1,
        pairingBonusWeight: 1,
        feedbackBonusWeight: 1,
        diversityBonusWeight: 1,
        categoryBonusWeight: 1,
        menuCompletenessWeight: 1,
        menuFreshnessWeight: 1,
        menuGrossMarginWeight: 1,
        defaultDishPenalty: 1,
      }),
    );
  }

  private async ensureMenuStandards(storeId: string) {
    const existing = await this.menuStandardRepository.find({ where: { storeId, mealType: MealType.LUNCH } });
    if (existing.length) {
      return existing;
    }

    const defaults = [
      { category: '蒸菜', targetCount: 6 },
      { category: '炒菜', targetCount: 10 },
      { category: '油炸', targetCount: 5 },
      { category: '砂锅', targetCount: 3 },
      { category: '凉菜', targetCount: 6 },
      { category: '例汤', targetCount: 1 },
      { category: '煎扒', targetCount: 3 },
      { category: '水果', targetCount: 2 },
      { category: '茶饮', targetCount: 1 },
    ];

    return this.menuStandardRepository.save(
      defaults.map((item) =>
        this.menuStandardRepository.create({
          storeId,
          mealType: MealType.LUNCH,
          category: item.category,
          targetCount: item.targetCount,
          remark: 'P1 默认菜单标准',
        }),
      ),
    );
  }

  private async ensureMenuPairingRules(storeId: string) {
    const existing = await this.menuPairingRuleRepository.find({ where: { storeId, mealType: MealType.LUNCH } });
    if (existing.length) {
      return existing;
    }

    const defaults = [
      { tagCode: 'big_meat', minCount: 5, maxCount: 8, description: '正餐大荤搭配规则' },
      { tagCode: 'small_meat', minCount: 8, maxCount: 12, description: '正餐小荤搭配规则' },
      { tagCode: 'vegetable', minCount: 10, maxCount: 18, description: '正餐素菜搭配规则' },
    ];

    return this.menuPairingRuleRepository.save(
      defaults.map((item) =>
        this.menuPairingRuleRepository.create({
          storeId,
          mealType: MealType.LUNCH,
          tagCode: item.tagCode,
          minCount: item.minCount,
          maxCount: item.maxCount,
          description: item.description,
          isActive: true,
        }),
      ),
    );
  }

  private async backfillDishTypeTags() {
    const dishes = await this.dishRepository.find({ order: { createdAt: 'ASC' } });
    for (const dish of dishes) {
      if (dish.dishTypeTagManualOverride) {
        continue;
      }

      const dishTypeTag = await this.dishTypeTagService.resolveDishTypeTag(dish as any);
      if (dishTypeTag !== dish.dishTypeTag) {
        await this.dishRepository.update(dish.id, {
          dishTypeTag,
          dishTypeTagManualOverride: false,
        });
      }
    }
  }
}
