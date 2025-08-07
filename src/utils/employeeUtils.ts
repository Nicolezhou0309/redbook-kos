import dayjs from 'dayjs';

// 计算持有周期（开通周数）
export const calculateHoldingPeriod = (activationTime: string | null): string => {
  if (!activationTime) {
    return '未开通';
  }

  const activationDate = dayjs(activationTime);
  const currentDate = dayjs();
  
  if (!activationDate.isValid()) {
    return '日期无效';
  }

  // 计算天数差
  const daysDiff = currentDate.diff(activationDate, 'day');
  
  if (daysDiff < 0) {
    return '未到开通时间';
  }

  // 计算周数
  const weeks = Math.floor(daysDiff / 7);
  const remainingDays = daysDiff % 7;

  if (weeks === 0) {
    return `${daysDiff}天`;
  } else if (remainingDays === 0) {
    return `${weeks}周`;
  } else {
    return `${weeks}周${remainingDays}天`;
  }
};

// 获取持有周期的详细信息
export const getHoldingPeriodDetails = (activationTime: string | null) => {
  if (!activationTime) {
    return {
      text: '未开通',
      color: 'default',
      days: 0,
      weeks: 0
    };
  }

  const activationDate = dayjs(activationTime);
  const currentDate = dayjs();
  
  if (!activationDate.isValid()) {
    return {
      text: '日期无效',
      color: 'red',
      days: 0,
      weeks: 0
    };
  }

  const daysDiff = currentDate.diff(activationDate, 'day');
  
  if (daysDiff < 0) {
    return {
      text: '未到开通时间',
      color: 'orange',
      days: Math.abs(daysDiff),
      weeks: 0
    };
  }

  const weeks = Math.floor(daysDiff / 7);
  const remainingDays = daysDiff % 7;

  let text = '';
  let color = 'green';

  if (weeks === 0) {
    text = `${daysDiff}天`;
    color = 'blue';
  } else if (remainingDays === 0) {
    text = `${weeks}周`;
    color = weeks >= 52 ? 'red' : weeks >= 26 ? 'orange' : 'green';
  } else {
    text = `${weeks}周${remainingDays}天`;
    color = weeks >= 52 ? 'red' : weeks >= 26 ? 'orange' : 'green';
  }

  return {
    text,
    color,
    days: daysDiff,
    weeks
  };
}; 