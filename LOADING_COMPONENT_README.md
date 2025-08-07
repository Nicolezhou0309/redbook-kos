# Loading 组件使用说明

## 概述

本项目提供了两个Loading组件，用于在应用加载和用户操作时显示加载状态：

1. **LoadingScreen** - 简单的全屏加载组件
2. **LoadingOverlay** - 可配置的全屏加载组件

## 组件特性

### LoadingScreen
- 固定显示"正在登录中..."文案
- 始终显示Logo
- 适用于登录状态检查

### LoadingOverlay
- 可自定义加载文案
- 可选择是否显示Logo
- 可控制显示/隐藏状态
- 适用于各种加载场景

## 使用方法

### 1. 在AuthContext中使用（已集成）

```typescript
// src/contexts/AuthContext.tsx
import LoadingOverlay from '../components/LoadingOverlay';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  
  return (
    <AuthContext.Provider value={value}>
      <LoadingOverlay 
        visible={loading} 
        message="正在登录中..." 
        showLogo={true}
      />
      {children}
    </AuthContext.Provider>
  );
};
```

### 2. 在其他组件中使用

```typescript
import React, { useState } from 'react';
import LoadingOverlay from '../components/LoadingOverlay';

const MyComponent: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleAsyncOperation = async () => {
    setLoading(true);
    try {
      // 执行异步操作
      await someAsyncOperation();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleAsyncOperation}>
        执行操作
      </button>
      
      <LoadingOverlay 
        visible={loading} 
        message="正在处理数据..." 
        showLogo={true}
      />
    </div>
  );
};
```

## 组件属性

### LoadingOverlay Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `visible` | `boolean` | - | 是否显示加载界面 |
| `message` | `string` | `'加载中...'` | 显示的加载文案 |
| `showLogo` | `boolean` | `true` | 是否显示Logo |

### LoadingScreen Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `message` | `string` | `'正在登录中...'` | 显示的加载文案 |

## 样式特性

- **渐变背景**: 使用紫色渐变背景
- **毛玻璃效果**: 半透明背景配合模糊效果
- **Logo动画**: Logo有呼吸动画效果
- **响应式设计**: 支持移动端适配
- **高z-index**: 确保显示在最顶层

## 示例页面

访问 `/loading-example` 页面可以查看各种Loading效果的使用示例：

1. 带Logo的登录Loading
2. 不带Logo的Loading
3. 自定义消息的Loading

## 文件结构

```
src/
├── components/
│   ├── LoadingScreen.tsx      # 简单Loading组件
│   ├── LoadingScreen.css      # Loading样式
│   └── LoadingOverlay.tsx     # 可配置Loading组件
├── contexts/
│   └── AuthContext.tsx        # 已集成Loading
└── pages/
    └── LoadingExample.tsx     # 使用示例页面
```

## 注意事项

1. Loading组件使用固定定位，会覆盖整个屏幕
2. Logo图片路径为 `/logo.svg`，确保该文件存在
3. 组件会自动处理显示/隐藏状态
4. 建议在异步操作开始时显示，操作完成后隐藏 