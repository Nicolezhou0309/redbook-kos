import { wecomNotification } from './wecomNotification';

// 通知类型
export enum NotificationType {
  SYSTEM_INFO = 'system_info',
  SYSTEM_WARNING = 'system_warning',
  SYSTEM_ERROR = 'system_error',
  DATA_IMPORT = 'data_import',
  DATA_UPDATE = 'data_update',
  USER_ACTION = 'user_action',
  BATCH_OPERATION = 'batch_operation',
  EMPLOYEE_NOTIFICATION = 'employee_notification'
}

// 通知级别
export enum NotificationLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success'
}

// 通知配置
export interface NotificationConfig {
  type: NotificationType;
  level: NotificationLevel;
  title: string;
  content: string;
  recipient?: string;
  details?: Record<string, any>;
}

// 通知服务类
export class NotificationService {
  
  // 发送系统通知
  static async sendSystemNotification(
    level: NotificationLevel,
    title: string,
    content: string,
    recipient?: string
  ): Promise<{ success: boolean; error?: string }> {
    const icons = {
      [NotificationLevel.INFO]: 'ℹ️',
      [NotificationLevel.WARNING]: '⚠️',
      [NotificationLevel.ERROR]: '❌',
      [NotificationLevel.SUCCESS]: '✅'
    };

    const markdownContent = `${icons[level]} **${title}**
    
${content}

**时间:** ${new Date().toLocaleString('zh-CN')}`;

    return wecomNotification.sendMarkdownMessage(markdownContent, recipient);
  }

  // 发送数据导入通知
  static async sendDataImportNotification(
    fileName: string,
    recordCount: number,
    success: boolean,
    recipient?: string
  ): Promise<{ success: boolean; error?: string }> {
    const status = success ? '✅ 成功' : '❌ 失败';
    const content = `📊 **数据导入通知**
    
**文件名称:** ${fileName}
**记录数量:** ${recordCount}
**导入状态:** ${status}
**时间:** ${new Date().toLocaleString('zh-CN')}

${success ? '数据已成功导入到系统' : '请检查文件格式和数据内容'}`;

    return wecomNotification.sendMarkdownMessage(content, recipient);
  }

  // 发送数据更新通知
  static async sendDataUpdateNotification(
    tableName: string,
    recordId: string,
    operation: 'create' | 'update' | 'delete',
    recipient?: string
  ): Promise<{ success: boolean; error?: string }> {
    const operationText = {
      create: '创建',
      update: '更新', 
      delete: '删除'
    }[operation];

    const content = `📝 **数据更新通知**
    
**表名:** ${tableName}
**记录ID:** ${recordId}
**操作类型:** ${operationText}
**更新时间:** ${new Date().toLocaleString('zh-CN')}`;

    return wecomNotification.sendMarkdownMessage(content, recipient);
  }

  // 发送用户操作通知
  static async sendUserActionNotification(
    userEmail: string,
    action: string,
    details?: string,
    recipient?: string
  ): Promise<{ success: boolean; error?: string }> {
    const content = `👤 **用户操作通知**
    
**用户邮箱:** ${userEmail}
**操作类型:** ${action}
${details ? `**详细信息:** ${details}` : ''}
**操作时间:** ${new Date().toLocaleString('zh-CN')}`;

    return wecomNotification.sendMarkdownMessage(content, recipient);
  }

  // 发送批量操作通知
  static async sendBatchOperationNotification(
    operation: string,
    count: number,
    success: boolean,
    recipient?: string
  ): Promise<{ success: boolean; error?: string }> {
    const status = success ? '✅ 成功' : '❌ 失败';
    const content = `🔄 **批量操作通知**
    
**操作类型:** ${operation}
**操作数量:** ${count}
**操作状态:** ${status}
**操作时间:** ${new Date().toLocaleString('zh-CN')}`;

    return wecomNotification.sendMarkdownMessage(content, recipient);
  }

  // 发送员工通知
  static async sendEmployeeNotification(
    employeeName: string,
    action: string,
    details: string,
    recipient?: string
  ): Promise<{ success: boolean; error?: string }> {
    const content = `👨‍💼 **员工通知**
    
**员工姓名:** ${employeeName}
**操作类型:** ${action}
**详细信息:** ${details}
**通知时间:** ${new Date().toLocaleString('zh-CN')}`;

    return wecomNotification.sendMarkdownMessage(content, recipient);
  }

  // 发送自定义通知
  static async sendCustomNotification(
    title: string,
    content: string,
    level: NotificationLevel = NotificationLevel.INFO,
    recipient?: string
  ): Promise<{ success: boolean; error?: string }> {
    const icons = {
      [NotificationLevel.INFO]: 'ℹ️',
      [NotificationLevel.WARNING]: '⚠️',
      [NotificationLevel.ERROR]: '❌',
      [NotificationLevel.SUCCESS]: '✅'
    };

    const markdownContent = `${icons[level]} **${title}**
    
${content}

**发送时间:** ${new Date().toLocaleString('zh-CN')}`;

    return wecomNotification.sendMarkdownMessage(markdownContent, recipient);
  }

  // 发送测试通知
  static async sendTestNotification(recipient?: string): Promise<{ success: boolean; error?: string }> {
    const content = `🧪 **测试通知**
    
**发送时间:** ${new Date().toLocaleString('zh-CN')}
**测试类型:** 企业微信通知功能测试

这是一条测试消息，用于验证企业微信通知功能是否正常工作。

✅ 如果收到此消息，说明配置正确！`;

    return wecomNotification.sendMarkdownMessage(content, recipient);
  }

  // 测试连接
  static async testConnection(): Promise<{ success: boolean; error?: string }> {
    return wecomNotification.testConnection();
  }
}

// 便捷方法
export const notify = {
  // 系统通知
  system: {
    info: (title: string, content: string, recipient?: string) => 
      NotificationService.sendSystemNotification(NotificationLevel.INFO, title, content, recipient),
    warning: (title: string, content: string, recipient?: string) => 
      NotificationService.sendSystemNotification(NotificationLevel.WARNING, title, content, recipient),
    error: (title: string, content: string, recipient?: string) => 
      NotificationService.sendSystemNotification(NotificationLevel.ERROR, title, content, recipient),
    success: (title: string, content: string, recipient?: string) => 
      NotificationService.sendSystemNotification(NotificationLevel.SUCCESS, title, content, recipient),
  },

  // 数据通知
  data: {
    import: (fileName: string, recordCount: number, success: boolean, recipient?: string) =>
      NotificationService.sendDataImportNotification(fileName, recordCount, success, recipient),
    update: (tableName: string, recordId: string, operation: 'create' | 'update' | 'delete', recipient?: string) =>
      NotificationService.sendDataUpdateNotification(tableName, recordId, operation, recipient),
  },

  // 用户通知
  user: {
    action: (userEmail: string, action: string, details?: string, recipient?: string) =>
      NotificationService.sendUserActionNotification(userEmail, action, details, recipient),
  },

  // 批量操作通知
  batch: (operation: string, count: number, success: boolean, recipient?: string) =>
    NotificationService.sendBatchOperationNotification(operation, count, success, recipient),

  // 员工通知
  employee: (employeeName: string, action: string, details: string, recipient?: string) =>
    NotificationService.sendEmployeeNotification(employeeName, action, details, recipient),

  // 自定义通知
  custom: (title: string, content: string, level?: NotificationLevel, recipient?: string) =>
    NotificationService.sendCustomNotification(title, content, level, recipient),

  // 测试通知
  test: (recipient?: string) => NotificationService.sendTestNotification(recipient),

  // 测试连接
  testConnection: () => NotificationService.testConnection(),
}; 