import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Steps, Divider } from 'antd';
import { MailOutlined, LockOutlined, SafetyOutlined, CheckCircleOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { validateInviteCode, sendRegistrationEmail, registerUser } from '../lib/authApi';

const { Title, Text } = Typography;
const { Step } = Steps;

interface RegisterFormData {
  inviteCode: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const Register: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [inviteCodeValid, setInviteCodeValid] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  const validateInviteCodeHandler = async (inviteCode: string) => {
    setLoading(true);
    try {
      const response = await validateInviteCode(inviteCode);
      
      if (response.success) {
        setInviteCodeValid(true);
        message.success('邀请码验证成功！');
        setCurrentStep(1);
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error('验证邀请码时出错');
    } finally {
      setLoading(false);
    }
  };

  const sendRegistrationEmailHandler = async (email: string, password: string) => {
    setLoading(true);
    try {
      // 先尝试注册用户
      const registerResponse = await registerUser({
        email,
        password,
        inviteCode: 'vlinker888' // 这里应该从之前验证的邀请码获取
      });

      if (registerResponse.success) {
        // 发送注册邮件
        const emailResponse = await sendRegistrationEmail(email);
        
        if (emailResponse.success) {
          setEmailSent(true);
          message.success('注册邮件已发送到您的邮箱，请查收并完成注册！');
          setCurrentStep(2);
        } else {
          message.error(emailResponse.message);
        }
      } else {
        message.error(registerResponse.message);
      }
    } catch (error) {
      message.error('发送注册邮件失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteCodeSubmit = (values: { inviteCode: string }) => {
    validateInviteCodeHandler(values.inviteCode);
  };

  const handleEmailSubmit = (values: { email: string; password: string; confirmPassword: string }) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }
    sendRegistrationEmailHandler(values.email, values.password);
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  const steps = [
    {
      title: '验证邀请码',
      description: '请输入邀请码',
      icon: <SafetyOutlined />
    },
    {
      title: '填写信息',
      description: '输入邮箱密码',
      icon: <MailOutlined />
    },
    {
      title: '完成注册',
      description: '等待邮件确认',
      icon: <CheckCircleOutlined />
    }
  ];

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
        maxWidth: '500px',
        background: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        padding: '48px 40px',
        minHeight: '600px'
      }}>
        {/* Logo 和标题 */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
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
            用户注册
          </Title>
          <Text type="secondary" style={{ fontSize: '14px' }}>
            请按照步骤完成注册
          </Text>
        </div>

        <div style={{ 
          marginBottom: '40px',
          overflow: 'visible'
        }}>
          <Steps
            current={currentStep}
            items={steps}
            style={{ 
              padding: '0 16px'
            }}
            responsive={true}
          />
        </div>

        {currentStep === 0 && (
          <Form
            name="inviteCode"
            onFinish={handleInviteCodeSubmit}
            layout="vertical"
          >
            <Form.Item
              name="inviteCode"
              rules={[
                { required: true, message: '请输入邀请码' },
                { min: 8, message: '邀请码至少8位字符' }
              ]}
            >
              <Input
                prefix={<SafetyOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="请输入邀请码"
                style={{
                  height: '44px',
                  borderRadius: '6px',
                  border: '1px solid #d9d9d9'
                }}
              />
            </Form.Item>

            <Form.Item>
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
                验证邀请码
              </Button>
            </Form.Item>
          </Form>
        )}

        {currentStep === 1 && (
          <Form
            name="register"
            onFinish={handleEmailSubmit}
            layout="vertical"
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

            <Form.Item
              name="confirmPassword"
              rules={[
                { required: true, message: '请确认密码' },
                { min: 6, message: '密码至少6位字符' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="确认密码"
                style={{
                  height: '44px',
                  borderRadius: '6px',
                  border: '1px solid #d9d9d9'
                }}
              />
            </Form.Item>

            <Form.Item>
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
                发送注册邮件
              </Button>
            </Form.Item>
          </Form>
        )}

        {currentStep === 2 && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircleOutlined 
              style={{ 
                fontSize: '64px', 
                color: '#52c41a',
                marginBottom: '16px'
              }} 
            />
            <Title level={3} style={{ color: '#52c41a', marginBottom: '16px' }}>
              注册邮件已发送！
            </Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: '24px' }}>
              我们已向您的邮箱发送了注册确认邮件，请查收并点击邮件中的链接完成注册。
            </Text>
            <Button
              type="primary"
              size="large"
              onClick={handleBackToLogin}
              style={{
                borderRadius: '8px',
                height: '48px',
                fontSize: '16px',
                background: '#ff4d4f',
                border: 'none',
                boxShadow: '0 2px 4px rgba(255, 77, 79, 0.2)'
              }}
            >
              返回登录
            </Button>
          </div>
        )}

        <Divider style={{ margin: '24px 0', color: '#bfbfbf' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>或者</Text>
        </Divider>

        <div style={{ textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: '14px' }}>
            已有账户？
          </Text>
          <Button
            type="link"
            onClick={handleBackToLogin}
            style={{
              padding: '0 8px',
              fontSize: '14px',
              color: '#ff4d4f',
              fontWeight: 500
            }}
          >
            立即登录
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Register; 