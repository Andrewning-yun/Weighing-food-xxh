import { Text, View } from '@tarojs/components';
import { Segmented } from '@nutui/nutui-react-taro';

type MealType = 'breakfast' | 'lunch';

const MEAL_OPTIONS = [
  { label: '早餐', value: 'breakfast' },
  { label: '正餐', value: 'lunch' },
];

export function MenuActionBar(props: {
  dateLabel: string;
  mealType: MealType;
  onOpenDatePicker: () => void;
  onChangeMealType: (mealType: MealType) => void;
}) {
  return (
    <View className='menu-action-bar'>
      <View className='menu-action-date' onClick={props.onOpenDatePicker}>
        <Text className='menu-action-date-label'>{props.dateLabel}</Text>
      </View>
      <View className='menu-action-tabs'>
        <Segmented
          options={MEAL_OPTIONS}
          value={props.mealType}
          onChange={(value) => props.onChangeMealType(value as MealType)}
        />
      </View>
    </View>
  );
}

export default MenuActionBar;
