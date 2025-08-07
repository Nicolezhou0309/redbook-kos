import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);

// 违规状态类型
export interface ViolationStatus {
  employeeId: string;
  employeeName: string;
  currentYellowCards: number; // 当前黄牌数量
  currentRedCards: number;    // 当前红牌数量（通过计算得出）
  totalViolations: number;    // 总违规次数
  status: 'normal' | 'yellow' | 'red'; // 当前状态
  lastViolationWeek?: string; // 最后违规周
  lastRecoveryWeek?: string;  // 最后恢复周
  statusHistory: ViolationStatusChange[];
}

// 违规状态变化记录
export interface ViolationStatusChange {
  week: string;
  changeType: 'violation' | 'recovery' | 'escalation';
  cardType: 'yellow' | 'red';
  reason: string;
  timestamp: string;
}

// 违规记录类型（对应数据库中的disciplinary_record表）
export interface ViolationRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  type: string;
  reason: string;
  created_at: string;
  week: string; // ISO周格式 YYYY-WW
}

/**
 * 计算员工的违规状态
 * 注意：违规记录表中只存储黄牌记录，红牌通过计算得出
 * @param violations 员工的违规记录（都是黄牌）
 * @param currentWeek 当前周（可选，默认为当前周）
 * @returns 违规状态
 */
export function calculateViolationStatus(
  violations: ViolationRecord[]): ViolationStatus {
  
  // 按周分组违规记录
  const violationsByWeek = groupViolationsByWeek(violations);
  
  // 计算状态历史
  const statusHistory: ViolationStatusChange[] = [];
  let yellowCards = 0;
  let redCards = 0;
  let lastViolationWeek: string | undefined;
  let lastRecoveryWeek: string | undefined;
  
  // 获取所有周并排序
  const allWeeks = Object.keys(violationsByWeek).sort();
  
  for (const week of allWeeks) {
    const weekViolations = violationsByWeek[week];
    
    if (weekViolations.length > 0) {
      // 本周有违规（获得黄牌）
      lastViolationWeek = week;
      
      // 计算本周新增的黄牌数量
      const newYellowCards = weekViolations.length;
      yellowCards += newYellowCards;
      
      // 检查是否升级为红牌（2张黄牌=1张红牌）
      if (yellowCards >= 2) {
        const newRedCards = Math.floor(yellowCards / 2);
        redCards += newRedCards;
        yellowCards = yellowCards % 2;
        
        statusHistory.push({
          week,
          changeType: 'escalation',
          cardType: 'red',
          reason: `累计${yellowCards + redCards * 2}张黄牌，升级为${newRedCards}张红牌`,
          timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss')
        });
      }
      
      // 记录违规（获得黄牌）
      statusHistory.push({
        week,
        changeType: 'violation',
        cardType: 'yellow',
        reason: `本周违规${newYellowCards}次，获得${newYellowCards}张黄牌`,
        timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss')
      });
    } else {
      // 本周无违规，检查是否可以恢复黄牌
      // 只有在没有红牌的情况下才能恢复黄牌，且最多恢复到0张
      if (yellowCards > 0 && redCards === 0) {
        yellowCards = Math.max(0, yellowCards - 1);
        lastRecoveryWeek = week;
        
        statusHistory.push({
          week,
          changeType: 'recovery',
          cardType: 'yellow',
          reason: '本周无违规，恢复1张黄牌',
          timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss')
        });
      }
    }
  }
  
  // 确定当前状态
  let status: 'normal' | 'yellow' | 'red' = 'normal';
  if (redCards > 0) {
    status = 'red';
  } else if (yellowCards > 0) {
    status = 'yellow';
  }
  
  return {
    employeeId: violations[0]?.employeeId || '',
    employeeName: violations[0]?.employeeName || '',
    currentYellowCards: yellowCards,
    currentRedCards: redCards,
    totalViolations: violations.length,
    status,
    lastViolationWeek,
    lastRecoveryWeek,
    statusHistory
  };
}

/**
 * 按周分组违规记录
 */
function groupViolationsByWeek(violations: ViolationRecord[]): Record<string, ViolationRecord[]> {
  const grouped: Record<string, ViolationRecord[]> = {};
  
  violations.forEach(violation => {
    const week = dayjs(violation.created_at).format('YYYY-WW');
    if (!grouped[week]) {
      grouped[week] = [];
    }
    grouped[week].push(violation);
  });
  
  return grouped;
}

/**
 * 获取状态显示文本
 */
export function getStatusDisplayText(status: ViolationStatus): string {
  if (status.status === 'red') {
    return `红牌 ${status.currentRedCards}张`;
  } else if (status.status === 'yellow') {
    return `黄牌 ${status.currentYellowCards}张`;
  } else {
    return '正常';
  }
}

/**
 * 获取状态颜色
 */
export function getStatusColor(status: ViolationStatus): string {
  if (status.status === 'red') {
    return 'red';
  } else if (status.status === 'yellow') {
    return 'orange';
  } else {
    return 'green';
  }
}

/**
 * 检查是否接近红牌
 */
export function isNearRedCard(status: ViolationStatus): boolean {
  return status.currentYellowCards >= 1 && status.currentRedCards === 0;
}

/**
 * 获取本周违规记录
 */
export function getCurrentWeekViolations(violations: ViolationRecord[]): ViolationRecord[] {
  const currentWeek = dayjs().format('YYYY-WW');
  return violations.filter(v => dayjs(v.created_at).format('YYYY-WW') === currentWeek);
}

/**
 * 获取上周违规记录
 */
export function getLastWeekViolations(violations: ViolationRecord[]): ViolationRecord[] {
  const lastWeek = dayjs().subtract(1, 'week').format('YYYY-WW');
  return violations.filter(v => dayjs(v.created_at).format('YYYY-WW') === lastWeek);
}

/**
 * 预测下周状态
 */
export function predictNextWeekStatus(currentStatus: ViolationStatus): {
  willRecover: boolean;
  willEscalate: boolean;
  predictedYellowCards: number;
  predictedRedCards: number;
} {
  let predictedYellowCards = currentStatus.currentYellowCards;
  const predictedRedCards = currentStatus.currentRedCards;
  
  // 如果当前有黄牌且无红牌，下周无违规会恢复1张黄牌
  // 红牌不会自动恢复
  const willRecover = predictedYellowCards > 0 && predictedRedCards === 0;
  
  if (willRecover) {
    predictedYellowCards = Math.max(0, predictedYellowCards - 1);
  }
  
  return {
    willRecover,
    willEscalate: false, // 需要新的违规才会升级
    predictedYellowCards,
    predictedRedCards
  };
}

/**
 * 计算需要多少张黄牌才能升级为红牌
 */
export function getYellowCardsToRedCard(currentYellowCards: number): number {
  return Math.max(0, 2 - currentYellowCards);
}

/**
 * 获取状态详细说明
 */
export function getStatusDescription(status: ViolationStatus): string {
  if (status.status === 'normal') {
    return '当前状态正常，无违规记录';
  } else if (status.status === 'yellow') {
    const toRed = getYellowCardsToRedCard(status.currentYellowCards);
    return `当前有${status.currentYellowCards}张黄牌，再获得${toRed}张黄牌将升级为红牌`;
  } else if (status.status === 'red') {
    return `当前有${status.currentRedCards}张红牌，红牌不会自动恢复，需要等待黄牌恢复后重新累积`;
  }
  return '';
} 