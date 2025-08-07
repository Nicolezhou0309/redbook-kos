import React from 'react';
import { Card, Typography, Space, Button } from 'antd';
import { useAuth } from '../../../contexts/AuthContext';

const { Title, Text } = Typography;

const AuthTest: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();

  return (
    <Card title="认证状态测试" style={{ margin: '20px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Text strong>加载状态: </Text>
          <Text>{loading ? '加载中...' : '已完成'}</Text>
        </div>
        
        <div>
          <Text strong>认证状态: </Text>
          <Text type={isAuthenticated ? 'success' : 'danger'}>
            {isAuthenticated ? '已登录' : '未登录'}
          </Text>
        </div>
        
        {user && (
          <div>
            <Text strong>用户信息: </Text>
            <div style={{ marginTop: '8px', padding: '12px', background: '#f5f5f5', borderRadius: '6px' }}>
              <Text>邮箱: {user.email}</Text>
              <br />
              <Text>用户ID: {user.id}</Text>
              <br />
              <Text>创建时间: {new Date(user.created_at).toLocaleString()}</Text>
            </div>
          </div>
        )}
        
        <div>
          <Text type="secondary">
            此组件用于测试认证功能是否正常工作。
          </Text>
        </div>
      </Space>
    </Card>
  );
};

export default AuthTest; 