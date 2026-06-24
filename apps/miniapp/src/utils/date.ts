export function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function getTodayDateStr(): string {
  return toDateStr(new Date());
}

export function getYesterdayDateStr(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return toDateStr(date);
}

export function getWeekdayLabel(dateStr: string): string {
  const labels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return labels[new Date(dateStr).getDay()];
}

