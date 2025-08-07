import React, { useState } from 'react';
import { Form, Input, Button, Typography, Divider, App } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginUser } from '../lib/authApi';
import { useAuth } from '../contexts/AuthContext';
import PasswordResetModal from '../components/PasswordResetModal';

const { Title, Text } = Typography;

interface LoginFormData {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const { message } = App.useApp();

  const onFinish = async (values: LoginFormData) => {
    setLoading(true);
    try {
      const response = await loginUser(values);
      
      if (response.success) {
        setUser(response.data);
        message.success('登录成功！');
        
        // 如果有重定向路径，则跳转到该路径，否则跳转到默认页面
        const from = location.state?.from?.pathname || '/employee-data';
        navigate(from, { replace: true });
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error('登录失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    navigate('/register');
  };

  const handleForgotPassword = () => {
    setResetModalVisible(true);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f5f5f5',
      padding: '24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        padding: '48px 40px',
        minHeight: '500px'
      }}>
        {/* Logo 和标题 */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img 
              src="/logo.svg" 
              alt="Logo" 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
            />
          </div>
          <Title level={3} style={{ margin: 0, color: '#262626', fontWeight: 600 }}>
            欢迎回来
          </Title>
          <Text type="secondary" style={{ fontSize: '14px' }}>
            请登录您的账户
          </Text>
        </div>

        {/* 登录表单 */}
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱地址' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="邮箱地址"
              style={{
                height: '44px',
                borderRadius: '6px',
                border: '1px solid #d9d9d9'
              }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6位字符' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="密码"
              style={{
                height: '44px',
                borderRadius: '6px',
                border: '1px solid #d9d9d9'
              }}
            />
          </Form.Item>

          {/* 忘记密码链接 */}
          <div style={{ 
            textAlign: 'right', 
            marginBottom: '24px',
            marginTop: '-8px'
          }}>
            <Button
              type="link"
              onClick={handleForgotPassword}
              style={{
                padding: '0',
                fontSize: '14px',
                color: '#ff4d4f',
                fontWeight: 400,
                height: 'auto'
              }}
            >
              忘记密码？
            </Button>
          </div>

          <Form.Item style={{ marginBottom: '24px' }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{
                width: '100%',
                height: '44px',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: 500,
                background: '#ff4d4f',
                border: 'none',
                boxShadow: '0 2px 4px rgba(255, 77, 79, 0.2)'
              }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        {/* 分割线 */}
        <Divider style={{ margin: '24px 0', color: '#bfbfbf' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>或者</Text>
        </Divider>

        {/* 注册链接 */}
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: '14px' }}>
            还没有账户？
          </Text>
          <Button
            type="link"
            onClick={handleRegister}
            style={{
              padding: '0 8px',
              fontSize: '14px',
              color: '#ff4d4f',
              fontWeight: 500
            }}
          >
            立即注册
          </Button>
        </div>
      </div>

      {/* 密码重置模态框 */}
      <PasswordResetModal
        visible={resetModalVisible}
        onCancel={() => setResetModalVisible(false)}
      />
    </div>
  );
};

export default Login; 