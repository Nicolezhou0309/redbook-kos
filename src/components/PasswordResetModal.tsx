import React, { useState } from 'react';
import { Modal, Form, Input, Button, Typography, App } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { sendPasswordResetEmail } from '../lib/authApi';

const { Text } = Typography;

interface PasswordResetModalProps {
  visible: boolean;
  onCancel: () => void;
}

const PasswordResetModal: React.FC<PasswordResetModalProps> = ({ visible, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const { message } = App.useApp();
  const [form] = Form.useForm();

  const handleSubmit = async (values: { email: string }) => {
    setLoading(true);
    try {
      const response = await sendPasswordResetEmail(values.email);
      
      if (response.success) {
        message.success(response.message);
        form.resetFields();
        onCancel();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error('发送密码重置邮件失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="重置密码"
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={400}
      centered
    >
      <div style={{ marginBottom: '16px' }}>
        <Text type="secondary">
          请输入您的邮箱地址，我们将向您发送密码重置链接。
        </Text>
      </div>

      <Form
        form={form}
        onFinish={handleSubmit}
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

        <Form.Item style={{ marginBottom: '0' }}>
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
              background: '#1890ff',
              border: 'none',
              boxShadow: '0 2px 4px rgba(24, 144, 255, 0.2)'
            }}
          >
            发送重置邮件
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PasswordResetModal; 