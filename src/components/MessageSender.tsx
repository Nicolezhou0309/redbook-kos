import React, { useState } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Select, 
  message, 
  Space, 
  Divider,
  Typography,
  Alert,
  Row,
  Col,
  Tag
} from 'antd';
import { SendOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { wecomNotification } from '../lib/wecomNotification';

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Option } = Select;

interface MessageSenderProps {
  title?: string;
  showConnectionTest?: boolean;
  defaultMessageType?: 'text' | 'markdown';
  defaultRecipient?: string;
  onSendSuccess?: (result: any) => void;
  onSendError?: (error: string) => void;
}

const MessageSender: React.FC<MessageSenderProps> = ({
  title = '企业微信消息发送',
  showConnectionTest = true,
  defaultMessageType = 'text',
  defaultRecipient = '@all',
  onSendSuccess,
  onSendError
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'success' | 'error'>('unknown');
  const [lastSendResult, setLastSendResult] = useState<{ success: boolean; error?: string } | null>(null);

  // 测试连接
  const testConnection = async () => {
    setLoading(true);
    try {
      const result = await wecomNotification.testConnection();
      setConnectionStatus(result.success ? 'success' : 'error');
      if (result.success) {
        message.success('连接测试成功！');
      } else {
        message.error(`连接测试失败: ${result.error}`);
      }
    } catch (error) {
      setConnectionStatus('error');
      message.error('连接测试失败');
    } finally {
      setLoading(false);
    }
  };

  // 发送消息
  const sendMessage = async (values: any) => {
    setLoading(true);
    try {
      let result;
      
      if (values.messageType === 'markdown') {
        result = await wecomNotification.sendMarkdownMessage(values.content, values.recipient);
      } else {
        result = await wecomNotification.sendTextMessage(values.content, values.recipient);
      }

      setLastSendResult(result);
      
      if (result.success) {
        message.success('消息发送成功！');
        onSendSuccess?.(result);
      } else {
        message.error(`消息发送失败: ${result.error}`);
        onSendError?.(result.error || '未知错误');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      message.error(`发送失败: ${errorMsg}`);
      onSendError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // 发送测试消息
  const sendTestMessage = async () => {
    const testContent = `🧪 **测试消息**
    
**发送时间:** ${new Date().toLocaleString('zh-CN')}
**测试类型:** 企业微信消息发送测试

这是一条测试消息，用于验证企业微信通知功能是否正常工作。

✅ 如果收到此消息，说明配置正确！`;

    setLoading(true);
    try {
      const result = await wecomNotification.sendMarkdownMessage(testContent, '@all');
      setLastSendResult(result);
      
      if (result.success) {
        message.success('测试消息发送成功！');
      } else {
        message.error(`测试消息发送失败: ${result.error}`);
      }
    } catch (error) {
      message.error('测试消息发送失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取连接状态显示
  const getConnectionStatusDisplay = () => {
    switch (connectionStatus) {
      case 'success':
        return <Tag color="green" icon={<CheckCircleOutlined />}>连接正常</Tag>;
      case 'error':
        return <Tag color="red" icon={<CloseCircleOutlined />}>连接失败</Tag>;
      default:
        return <Tag color="orange">未测试</Tag>;
    }
  };

  return (
    <Card title={title} style={{ margin: '16px 0' }}>
      {/* 连接状态 */}
      {showConnectionTest && (
        <Alert
          message={
            <Space>
              <Text>企业微信连接状态:</Text>
              {getConnectionStatusDisplay()}
              <Button 
                size="small" 
                onClick={testConnection} 
                loading={loading}
              >
                测试连接
              </Button>
            </Space>
          }
          type={connectionStatus === 'success' ? 'success' : connectionStatus === 'error' ? 'error' : 'info'}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* 发送表单 */}
      <Form
        form={form}
        layout="vertical"
        onFinish={sendMessage}
        initialValues={{
          messageType: defaultMessageType,
          recipient: defaultRecipient,
          content: ''
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="消息类型"
              name="messageType"
              rules={[{ required: true, message: '请选择消息类型' }]}
            >
              <Select>
                <Option value="text">文本消息</Option>
                <Option value="markdown">Markdown消息</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="接收人"
              name="recipient"
              rules={[{ required: true, message: '请输入接收人' }]}
              extra="支持用户ID、部门ID，多个用逗号分隔，@all表示所有人"
            >
              <Input placeholder="例如: @all 或 zhangsan,lisi" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="消息内容"
          name="content"
          rules={[{ required: true, message: '请输入消息内容' }]}
          extra={
            form.getFieldValue('messageType') === 'markdown' 
              ? '支持Markdown格式，如: **粗体**、*斜体*、[链接](url)等'
              : '纯文本消息'
          }
        >
          <TextArea 
            rows={6} 
            placeholder={
              form.getFieldValue('messageType') === 'markdown'
                ? '请输入Markdown格式的消息内容...'
                : '请输入消息内容...'
            }
          />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              icon={<SendOutlined />}
            >
              发送消息
            </Button>
            <Button 
              onClick={sendTestMessage} 
              loading={loading}
            >
              发送测试消息
            </Button>
          </Space>
        </Form.Item>
      </Form>

      {/* 发送结果 */}
      {lastSendResult && (
        <>
          <Divider />
          <Alert
            message={
              <Space>
                <Text>发送结果:</Text>
                {lastSendResult.success ? (
                  <Tag color="green" icon={<CheckCircleOutlined />}>成功</Tag>
                ) : (
                  <Tag color="red" icon={<CloseCircleOutlined />}>失败</Tag>
                )}
              </Space>
            }
            description={
              lastSendResult.error && (
                <Text type="danger">错误信息: {lastSendResult.error}</Text>
              )
            }
            type={lastSendResult.success ? 'success' : 'error'}
          />
        </>
      )}

      {/* 使用说明 */}
      <Divider />
      <Title level={5}>使用说明</Title>
      <ul>
        <li><Text>接收人格式：</Text>
          <ul>
            <li><Text code>@all</Text> - 发送给所有人</li>
            <li><Text code>zhangsan</Text> - 发送给指定用户</li>
            <li><Text code>zhangsan,lisi</Text> - 发送给多个用户</li>
            <li><Text code>1</Text> - 发送给指定部门</li>
          </ul>
        </li>
        <li><Text>Markdown支持：</Text>
          <ul>
            <li><Text code>**粗体**</Text> - 粗体文本</li>
            <li><Text code>*斜体*</Text> - 斜体文本</li>
            <li><Text code>[链接](url)</Text> - 超链接</li>
            <li><Text code>### 标题</Text> - 标题</li>
          </ul>
        </li>
      </ul>
    </Card>
  );
};

export default MessageSender; 