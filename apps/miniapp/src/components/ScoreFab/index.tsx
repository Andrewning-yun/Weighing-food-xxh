import { Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useMemo, useState } from 'react';
import { MenuPairingGap, MenuPlanScoreSummary } from '../../api/menu-plan';
import PopupPanel from '../PopupPanel';
import './index.scss';

export function ScoreFab(props: {
  scoreSummary: MenuPlanScoreSummary | null;
  pairingGaps: MenuPairingGap[];
}) {
  const systemInfo = useMemo(() => Taro.getSystemInfoSync(), []);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({
    left: Math.max(systemInfo.windowWidth - 138, 230),
    top: Math.max(systemInfo.windowHeight - 330, 360),
  });
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  const score = typeof props.scoreSummary?.total === 'number' ? props.scoreSummary.total.toFixed(0) : '--';
  const dimensions = props.scoreSummary?.dimensions || [];

  function handleTouchStart(event: any) {
    const touch = event.touches?.[0];
    if (!touch) return;
    setDragStart({
      x: touch.pageX - position.left,
      y: touch.pageY - position.top,
    });
  }

  function handleTouchMove(event: any) {
    const touch = event.touches?.[0];
    if (!touch || !dragStart) return;

    const nextLeft = Math.min(Math.max(touch.pageX - dragStart.x, 18), systemInfo.windowWidth - 104);
    const nextTop = Math.min(Math.max(touch.pageY - dragStart.y, 180), systemInfo.windowHeight - 220);

    setPosition({
      left: nextLeft,
      top: nextTop,
    });
  }

  return (
    <>
      <View
        className='score-fab'
        style={{ left: `${position.left}px`, top: `${position.top}px` }}
        onClick={() => setOpen(true)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        <Text className='score-fab-label'>评分</Text>
        <Text className='score-fab-value'>{score}</Text>
      </View>

      <PopupPanel open={open} title='菜单评分' onClose={() => setOpen(false)} compact>
        <View className='score-panel-summary'>
          <Text className='score-panel-total-label'>总分</Text>
          <Text className='score-panel-total-value'>{score}</Text>
        </View>

        <View className='score-panel-section'>
          {dimensions.length > 0 ? (
            dimensions.map((dimension, index) => (
              <View key={`${dimension.key || index}`} className='score-panel-item'>
                <View className='score-panel-item-top'>
                  <Text className='score-panel-item-label'>{dimension.label || '评分项'}</Text>
                  <Text className='score-panel-item-value'>
                    {dimension.score}
                    {typeof dimension.maxScore === 'number' ? ` / ${dimension.maxScore}` : ''}
                  </Text>
                </View>
                {dimension.description ? (
                  <Text className='score-panel-item-desc'>{dimension.description}</Text>
                ) : null}
              </View>
            ))
          ) : (
            <Text className='score-panel-empty'>当前还没有评分数据</Text>
          )}
        </View>

        <View className='score-panel-section'>
          <Text className='score-panel-subtitle'>搭配缺口</Text>
          {props.pairingGaps.length > 0 ? (
            props.pairingGaps.map((gap, index) => (
              <View key={`${gap.tagName}-${index}`} className='score-panel-gap'>
                <Text className='score-panel-gap-name'>{gap.tagName}</Text>
                <Text className='score-panel-gap-value'>
                  当前 {gap.currentCount}，最低 {gap.minCount}
                  {typeof gap.maxCount === 'number' ? `，最高 ${gap.maxCount}` : ''}
                </Text>
                {gap.description ? <Text className='score-panel-gap-desc'>{gap.description}</Text> : null}
              </View>
            ))
          ) : (
            <Text className='score-panel-empty'>当前没有搭配缺口</Text>
          )}
        </View>
      </PopupPanel>
    </>
  );
}

export default ScoreFab;
