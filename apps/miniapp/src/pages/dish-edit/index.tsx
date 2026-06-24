import { ScrollView, Text, Textarea, View } from '@tarojs/components';
import { Button as NutButton, Input as NutInput } from '@nutui/nutui-react-taro';
import Taro from '@tarojs/taro';
import { useEffect, useMemo, useState } from 'react';
import { createDish, fetchDish, updateDish, type DishAuditSubmission, type DishPayload } from '../../api/dish';
import { fetchDishTypeTags, type DishTypeTagRecord } from '../../api/dish-type-tag';
import { fetchIngredients, type IngredientSummary } from '../../api/ingredient';
import { getSessionUser, hasSession } from '../../utils/session';
import './index.scss';

type Role =
  | 'admin'
  | 'chef_manager'
  | 'chef'
  | 'prep'
  | 'breakfast_chef'
  | 'breakfast_assistant'
  | 'buyer'
  | 'store_manager';

type IngredientRow = {
  ingredientId: string;
  quantity: string;
  unit: string;
  wasteRate: string;
};

type StepRow = {
  id: number;
  title: string;
  description: string;
  duration: string;
  station: string;
};

type DishForm = {
  name: string;
  category: string;
  station: string;
  description: string;
  mealType: 'breakfast' | 'lunch';
  recommendWeight: '1' | '2' | '3';
  relatedIngredients: string;
  dishTypeTag: string;
  ingredients: IngredientRow[];
  steps: StepRow[];
};

const CATEGORY_OPTIONS = [
  { value: 'steam', label: '蒸菜' },
  { value: 'panfry', label: '煎菜' },
  { value: 'fry', label: '炸菜' },
  { value: 'casserole', label: '煲类' },
  { value: 'stir', label: '小炒' },
  { value: 'fruit', label: '水果' },
  { value: 'cold', label: '凉菜' },
  { value: 'soup', label: '汤品' },
  { value: 'tea', label: '茶饮' },
  { value: 'porridge', label: '粥品' },
  { value: 'pastry', label: '面点' },
  { value: 'breakfast_drink', label: '早餐饮品' },
];

const STATION_OPTIONS = [
  { value: 'wok', label: '炒锅' },
  { value: 'grill_fry_steam', label: '煎扒蒸菜' },
  { value: 'prep', label: '切配' },
  { value: 'breakfast_wok', label: '早餐炒锅' },
  { value: 'breakfast_assist', label: '早餐副手' },
];

function createEmptyForm(): DishForm {
  return {
    name: '',
    category: 'stir',
    station: 'wok',
    description: '',
    mealType: 'lunch',
    recommendWeight: '1',
    relatedIngredients: '',
    dishTypeTag: '',
    ingredients: [{ ingredientId: '', quantity: '1', unit: '份', wasteRate: '0' }],
    steps: [{ id: 1, title: '准备食材', description: '', duration: '5', station: 'prep' }],
  };
}

function redirectToLogin() {
  Taro.reLaunch({ url: '/pages/login/index' });
}

function normalizeIngredientRows(rows: IngredientRow[]) {
  return rows
    .filter((row) => row.ingredientId.trim())
    .map((row) => ({
      ingredientId: row.ingredientId.trim(),
      quantity: Number(row.quantity) || 0,
      unit: row.unit.trim() || '份',
      wasteRate: Number(row.wasteRate) || 0,
    }));
}

function normalizeStepRows(rows: StepRow[]) {
  return rows
    .filter((row) => row.title.trim())
    .map((row, index) => ({
      id: index + 1,
      title: row.title.trim(),
      description: row.description.trim(),
      duration: Number(row.duration) || 0,
      station: row.station.trim() || undefined,
    }));
}

function isAuditSubmission(result: unknown): result is DishAuditSubmission {
  return Boolean(result && typeof result === 'object' && 'auditSubmitted' in result);
}

export default function DishEditPage() {
  const router = Taro.useRouter();
  const dishId = router.params?.id || '';
  const isEditing = Boolean(dishId);

  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState<DishForm>(createEmptyForm());
  const [ingredients, setIngredients] = useState<IngredientSummary[]>([]);
  const [dishTypeTags, setDishTypeTags] = useState<DishTypeTagRecord[]>([]);
  const [activeIngredientIndex, setActiveIngredientIndex] = useState(0);
  const user = getSessionUser();
  const role = (user?.role || '') as Role;
  const canSave = role === 'admin' || role === 'chef_manager';

  useEffect(() => {
    if (!hasSession()) {
      redirectToLogin();
      return;
    }

    void bootstrap();
  }, [dishId]);

  async function bootstrap() {
    setBusy(true);
    setMessage('');

    try {
      const [ingredientData, tagData] = await Promise.all([
        fetchIngredients().catch(() => [] as IngredientSummary[]),
        fetchDishTypeTags().catch(() => [] as DishTypeTagRecord[]),
      ]);

      setIngredients(ingredientData);
      setDishTypeTags(tagData);

      if (!dishId) {
        return;
      }

      const dish = await fetchDish(dishId);
      setForm({
        name: dish.name || '',
        category: dish.category || 'stir',
        station: dish.station || 'wok',
        description: dish.description || '',
        mealType: dish.mealType || 'lunch',
        recommendWeight: String(dish.recommendWeight ?? 1) as '1' | '2' | '3',
        relatedIngredients: dish.relatedIngredients || '',
        dishTypeTag: dish.dishTypeTag || '',
        ingredients:
          dish.ingredients?.length > 0
            ? dish.ingredients.map((item) => ({
                ingredientId: item.ingredientId,
                quantity: String(item.quantity),
                unit: item.unit,
                wasteRate: String(item.wasteRate),
              }))
            : createEmptyForm().ingredients,
        steps:
          dish.steps?.length > 0
            ? dish.steps.map((item, index) => ({
                id: index + 1,
                title: item.title,
                description: item.description,
                duration: String(item.duration ?? 0),
                station: item.station || '',
              }))
            : createEmptyForm().steps,
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '加载菜品信息失败');
    } finally {
      setBusy(false);
    }
  }

  function updateIngredientRow(index: number, patch: Partial<IngredientRow>) {
    setForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)),
    }));
  }

  function updateStepRow(index: number, patch: Partial<StepRow>) {
    setForm((prev) => ({
      ...prev,
      steps: prev.steps.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)),
    }));
  }

  function buildPayload(): DishPayload {
    return {
      name: form.name.trim(),
      category: form.category,
      station: form.station,
      description: form.description.trim(),
      mealType: form.mealType,
      recommendWeight: Number(form.recommendWeight) as 1 | 2 | 3,
      relatedIngredients: form.relatedIngredients.trim(),
      dishTypeTag: form.dishTypeTag || undefined,
      isActive: true,
      ingredients: normalizeIngredientRows(form.ingredients),
      steps: normalizeStepRows(form.steps),
    };
  }

  async function handleSave() {
    if (!canSave || saving) {
      return;
    }

    const payload = buildPayload();
    if (!payload.name || payload.ingredients.length === 0 || payload.steps.length === 0) {
      setMessage('请至少填写菜名、一个食材和一个步骤');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      if (isEditing) {
        const result = await updateDish(dishId, payload);
        if (isAuditSubmission(result)) {
          Taro.showToast({ title: result.message || '已提交审核', icon: 'success' });
        } else {
          Taro.showToast({ title: '菜品已更新', icon: 'success' });
        }
      } else {
        const result = await createDish(payload);
        if (isAuditSubmission(result)) {
          Taro.showToast({ title: result.message || '已提交审核', icon: 'success' });
        } else {
          Taro.showToast({ title: '菜品已创建', icon: 'success' });
        }
      }

      Taro.navigateBack({ delta: 1 }).catch(() => {
        Taro.reLaunch({ url: '/pages/dishes/index' });
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '保存菜品失败');
    } finally {
      setSaving(false);
    }
  }

  const ingredientMap = useMemo(() => new Map(ingredients.map((item) => [item.id, item])), [ingredients]);

  if (busy) {
    return (
      <View className='dish-edit-page'>
        <View className='shell-card de-loading'>正在加载菜品信息...</View>
      </View>
    );
  }

  return (
    <View className='dish-edit-page'>
      <View className='shell-card de-hero'>
        <View>
          <Text className='de-eyebrow'>菜品维护</Text>
          <Text className='de-title'>{isEditing ? '编辑菜品' : '新建菜品'}</Text>
          <Text className='de-subtitle'>基础信息、配方、毛利和标签统一在这里维护</Text>
        </View>
        {!canSave ? <Text className='de-readonly'>当前角色仅可查看，不能保存</Text> : null}
      </View>

      {message ? <Text className='de-message'>{message}</Text> : null}

      <ScrollView scrollY className='de-scroll'>
        <View className='de-scroll-inner'>
          <View className='shell-card de-section'>
            <Text className='de-section-title'>基础信息</Text>
            <NutInput
              className='de-input'
              placeholder='菜品名称'
              value={form.name}
              onChange={(v) => setForm((prev) => ({ ...prev, name: v }))}
            />
            <Textarea
              className='de-textarea'
              placeholder='菜品描述'
              value={form.description}
              onInput={(e) => setForm((prev) => ({ ...prev, description: e.detail.value }))}
            />

            <View className='de-chip-group'>
              <Text className='de-label'>餐别</Text>
              {(['breakfast', 'lunch'] as const).map((value) => (
                <Text
                  key={value}
                  className={`de-chip ${form.mealType === value ? 'de-chip-active' : ''}`}
                  onClick={() => setForm((prev) => ({ ...prev, mealType: value }))}
                >
                  {value === 'breakfast' ? '早餐' : '正餐'}
                </Text>
              ))}
            </View>

            <View className='de-chip-group'>
              <Text className='de-label'>分类</Text>
              {CATEGORY_OPTIONS.map((option) => (
                <Text
                  key={option.value}
                  className={`de-chip ${form.category === option.value ? 'de-chip-active' : ''}`}
                  onClick={() => setForm((prev) => ({ ...prev, category: option.value }))}
                >
                  {option.label}
                </Text>
              ))}
            </View>

            <View className='de-chip-group'>
              <Text className='de-label'>工位</Text>
              {STATION_OPTIONS.map((option) => (
                <Text
                  key={option.value}
                  className={`de-chip ${form.station === option.value ? 'de-chip-active' : ''}`}
                  onClick={() => setForm((prev) => ({ ...prev, station: option.value }))}
                >
                  {option.label}
                </Text>
              ))}
            </View>
          </View>

          <View className='shell-card de-section'>
            <Text className='de-section-title'>BOM 配方</Text>
            <ScrollView scrollX className='de-picker-scroll'>
              <View className='de-picker-row'>
                {ingredients.map((item) => (
                  <Text
                    key={item.id}
                    className='de-picker-chip'
                    onClick={() =>
                      updateIngredientRow(activeIngredientIndex, {
                        ingredientId: item.id,
                        unit: item.unit || form.ingredients[activeIngredientIndex]?.unit || '份',
                      })
                    }
                  >
                    {item.name}
                  </Text>
                ))}
              </View>
            </ScrollView>

            {form.ingredients.map((row, index) => (
              <View
                key={`ingredient-${index}`}
                className={`de-row-card ${activeIngredientIndex === index ? 'de-row-card-active' : ''}`}
                onClick={() => setActiveIngredientIndex(index)}
              >
                <Text className='de-row-title'>食材 {index + 1}</Text>
                <Text className='de-row-hint'>{ingredientMap.get(row.ingredientId)?.name || '未选择食材'}</Text>
                <NutInput
                  className='de-input'
                  placeholder='食材 ID'
                  value={row.ingredientId}
                  onChange={(v) => updateIngredientRow(index, { ingredientId: v })}
                />
                <View className='de-grid'>
                  <NutInput
                    className='de-input'
                    type='digit'
                    placeholder='数量'
                    value={row.quantity}
                    onChange={(v) => updateIngredientRow(index, { quantity: v })}
                  />
                  <NutInput
                    className='de-input'
                    placeholder='单位'
                    value={row.unit}
                    onChange={(v) => updateIngredientRow(index, { unit: v })}
                  />
                  <NutInput
                    className='de-input'
                    type='digit'
                    placeholder='损耗率'
                    value={row.wasteRate}
                    onChange={(v) => updateIngredientRow(index, { wasteRate: v })}
                  />
                </View>
              </View>
            ))}

            <View className='de-action-row'>
              <NutButton
                size='mini'
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    ingredients: [...prev.ingredients, { ingredientId: '', quantity: '1', unit: '份', wasteRate: '0' }],
                  }))
                }
              >
                新增食材
              </NutButton>
              {form.ingredients.length > 1 ? (
                <NutButton
                  size='mini'
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      ingredients: prev.ingredients.slice(0, -1),
                    }))
                  }
                >
                  删除最后一项
                </NutButton>
              ) : null}
            </View>
          </View>

          <View className='shell-card de-section'>
            <Text className='de-section-title'>推荐设置</Text>
            <View className='de-chip-group'>
              <Text className='de-label'>推荐权重</Text>
              {(['1', '2', '3'] as const).map((value) => (
                <Text
                  key={value}
                  className={`de-chip ${form.recommendWeight === value ? 'de-chip-active' : ''}`}
                  onClick={() => setForm((prev) => ({ ...prev, recommendWeight: value }))}
                >
                  {value === '1' ? '普通' : value === '2' ? '推荐' : '重点推荐'}
                </Text>
              ))}
            </View>
          </View>

          <View className='shell-card de-section'>
            <Text className='de-section-title'>分类标签</Text>
            <NutInput
              className='de-input'
              placeholder='关联食材，用逗号分隔'
              value={form.relatedIngredients}
              onChange={(v) => setForm((prev) => ({ ...prev, relatedIngredients: v }))}
            />
            <View className='de-chip-group'>
              <Text className='de-label'>菜品标签</Text>
              <Text
                className={`de-chip ${!form.dishTypeTag ? 'de-chip-active' : ''}`}
                onClick={() => setForm((prev) => ({ ...prev, dishTypeTag: '' }))}
              >
                自动判定
              </Text>
              {dishTypeTags.map((item) => (
                <Text
                  key={item.id}
                  className={`de-chip ${form.dishTypeTag === item.name ? 'de-chip-active' : ''}`}
                  onClick={() => setForm((prev) => ({ ...prev, dishTypeTag: item.name }))}
                >
                  {item.name}
                </Text>
              ))}
            </View>
          </View>

          <View className='shell-card de-section'>
            <Text className='de-section-title'>工艺步骤</Text>
            {form.steps.map((row, index) => (
              <View key={`step-${index}`} className='de-row-card'>
                <Text className='de-row-title'>步骤 {index + 1}</Text>
                <NutInput
                  className='de-input'
                  placeholder='步骤标题'
                  value={row.title}
                  onChange={(v) => updateStepRow(index, { title: v })}
                />
                <Textarea
                  className='de-textarea'
                  placeholder='步骤说明'
                  value={row.description}
                  onInput={(e) => updateStepRow(index, { description: e.detail.value })}
                />
                <View className='de-grid'>
                  <NutInput
                    className='de-input'
                    type='digit'
                    placeholder='时长（分钟）'
                    value={row.duration}
                    onChange={(v) => updateStepRow(index, { duration: v })}
                  />
                  <NutInput
                    className='de-input'
                    placeholder='工位'
                    value={row.station}
                    onChange={(v) => updateStepRow(index, { station: v })}
                  />
                </View>
              </View>
            ))}

            <View className='de-action-row'>
              <NutButton
                size='mini'
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    steps: [...prev.steps, { id: prev.steps.length + 1, title: '', description: '', duration: '5', station: '' }],
                  }))
                }
              >
                新增步骤
              </NutButton>
              {form.steps.length > 1 ? (
                <NutButton
                  size='mini'
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      steps: prev.steps.slice(0, -1),
                    }))
                  }
                >
                  删除最后一步
                </NutButton>
              ) : null}
            </View>
          </View>

          <View className='de-footer'>
            <NutButton onClick={() => Taro.navigateBack({ delta: 1 }).catch(() => Taro.reLaunch({ url: '/pages/dishes/index' }))}>
              返回
            </NutButton>
            <NutButton type='primary' loading={saving} disabled={!canSave} onClick={handleSave}>
              保存
            </NutButton>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
