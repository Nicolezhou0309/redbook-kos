import React from 'react';
import { Card, Typography, Space, Button } from 'antd';

const { Title, Text } = Typography;

const LayoutTest: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <Card title="布局测试" style={{ marginBottom: '20px' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Text strong>测试文字显示:</Text>
            <div style={{ 
              marginTop: '8px', 
              padding: '12px', 
              background: '#f5f5f5', 
              borderRadius: '6px',
              minHeight: '100px'
            }}>
              <Text>验证邀请码 - 请输入邀请码</Text>
              <br />
              <Text>填写信息 - 输入邮箱密码</Text>
              <br />
              <Text>完成注册 - 等待邮件确认</Text>
            </div>
          </div>
          
          <div>
            <Text strong>容器高度测试:</Text>
            <div style={{ 
              marginTop: '8px', 
              padding: '12px', 
              background: '#fff', 
              borderRadius: '6px',
              border: '1px solid #d9d9d9',
              minHeight: '600px'
            }}>
              <Text>这是一个最小高度为600px的容器，用于测试文字是否被截断。</Text>
            </div>
          </div>
          
          <div>
            <Text type="secondary">
              如果上面的文字都能正常显示，说明布局修复成功。
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default LayoutTest; 