import { ScrollView, Text, View } from '@tarojs/components';
import PopupPanel from '../PopupPanel';
import './index.scss';

type DateOption = {
  value: string;
  label: string;
  weekday: string;
  isToday?: boolean;
};

export function DatePickerPopup(props: {
  open: boolean;
  selectedDate: string;
  options: DateOption[];
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <PopupPanel open={props.open} title='选择日期' onClose={props.onClose} compact>
      <ScrollView scrollX>
        <View className='date-picker-scroll'>
          <View className='date-picker-list'>
            {props.options.map((option) => (
              <View
                key={option.value}
                className={`date-picker-item ${props.selectedDate === option.value ? 'date-picker-item-active' : ''}`}
                onClick={() => props.onSelect(option.value)}
              >
                <Text className='date-picker-weekday'>{option.weekday}</Text>
                <Text className='date-picker-label'>{option.label}</Text>
                {option.isToday ? <Text className='date-picker-today'>今天</Text> : null}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </PopupPanel>
  );
}

export default DatePickerPopup;
