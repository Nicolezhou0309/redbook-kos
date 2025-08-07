import React, { useState } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Alert, 
  Button, 
  Space,
  Divider,
  Tag,
  message
} from 'antd';
import { 
  MessageOutlined, 
  DatabaseOutlined, 
  UserOutlined, 
  TeamOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { notify, NotificationLevel } from '../lib/notificationService';
import MessageSender from '../components/MessageSender';

const { Title, Paragraph } = Typography;

const NotificationTest: React.FC = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, { success: boolean; error?: string }>>({});

  const handleTest = async (testName: string, testFunction: () => Promise<{ success: boolean; error?: string }>) => {
    setLoading(testName);
    try {
      const result = await testFunction();
      setResults(prev => ({ ...prev, [testName]: result }));
      
      if (result.success) {
        message.success(`${testName} 测试成功！`);
      } else {
        message.error(`${testName} 测试失败: ${result.error}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      setResults(prev => ({ ...prev, [testName]: { success: false, error: errorMsg } }));
      message.error(`${testName} 测试失败: ${errorMsg}`);
    } finally {
      setLoading(null);
    }
  };

  const getResultDisplay = (testName: string) => {
    const result = results[testName];
    if (!result) return null;
    
    return (
      <Tag 
        color={result.success ? 'green' : 'red'} 
        icon={result.success ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
      >
        {result.success ? '成功' : '失败'}
      </Tag>
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Typography.Title level={2}>通知功能测试</Typography.Title>
        <Typography.Text type="secondary">测试企业微信通知的各种功能</Typography.Text>
      </div>

      <Alert
        message="测试说明"
        description="此页面用于测试企业微信通知的各种功能。每个测试都会发送一条实际的消息到企业微信。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* 基础消息发送测试 */}
      <Card title="基础消息发送" style={{ marginBottom: 24 }}>
        <MessageSender
          title="手动发送消息"
          showConnectionTest={true}
          defaultMessageType="markdown"
          defaultRecipient="@all"
        />
      </Card>

      {/* 系统通知测试 */}
      <Card title="系统通知测试" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Button
              type="primary"
              icon={<MessageOutlined />}
              loading={loading === 'system-info'}
              onClick={() => handleTest('system-info', () => 
                notify.system.info('系统信息', '这是一条系统信息通知')
              )}
              block
            >
              信息通知
            </Button>
            {getResultDisplay('system-info')}
          </Col>
          <Col span={6}>
            <Button
              type="primary"
              icon={<ExclamationCircleOutlined />}
              loading={loading === 'system-warning'}
              onClick={() => handleTest('system-warning', () => 
                notify.system.warning('系统警告', '这是一条系统警告通知')
              )}
              block
            >
              警告通知
            </Button>
            {getResultDisplay('system-warning')}
          </Col>
          <Col span={6}>
            <Button
              type="primary"
              icon={<CloseCircleOutlined />}
              loading={loading === 'system-error'}
              onClick={() => handleTest('system-error', () => 
                notify.system.error('系统错误', '这是一条系统错误通知')
              )}
              block
            >
              错误通知
            </Button>
            {getResultDisplay('system-error')}
          </Col>
          <Col span={6}>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              loading={loading === 'system-success'}
              onClick={() => handleTest('system-success', () => 
                notify.system.success('系统成功', '这是一条系统成功通知')
              )}
              block
            >
              成功通知
            </Button>
            {getResultDisplay('system-success')}
          </Col>
        </Row>
      </Card>

      {/* 数据通知测试 */}
      <Card title="数据通知测试" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Button
              type="primary"
              icon={<DatabaseOutlined />}
              loading={loading === 'data-import-success'}
              onClick={() => handleTest('data-import-success', () => 
                notify.data.import('test_data.xlsx', 150, true)
              )}
              block
            >
              数据导入成功
            </Button>
            {getResultDisplay('data-import-success')}
          </Col>
          <Col span={8}>
            <Button
              type="primary"
              icon={<DatabaseOutlined />}
              loading={loading === 'data-import-fail'}
              onClick={() => handleTest('data-import-fail', () => 
                notify.data.import('invalid_data.xlsx', 0, false)
              )}
              block
            >
              数据导入失败
            </Button>
            {getResultDisplay('data-import-fail')}
          </Col>
          <Col span={8}>
            <Button
              type="primary"
              icon={<DatabaseOutlined />}
              loading={loading === 'data-update'}
              onClick={() => handleTest('data-update', () => 
                notify.data.update('employee_data', 'emp_001', 'create')
              )}
              block
            >
              数据更新通知
            </Button>
            {getResultDisplay('data-update')}
          </Col>
        </Row>
      </Card>

      {/* 用户操作通知测试 */}
      <Card title="用户操作通知测试" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Button
              type="primary"
              icon={<UserOutlined />}
              loading={loading === 'user-login'}
              onClick={() => handleTest('user-login', () => 
                notify.user.action('user@example.com', '用户登录', '从IP: 192.168.1.100登录')
              )}
              block
            >
              用户登录
            </Button>
            {getResultDisplay('user-login')}
          </Col>
          <Col span={6}>
            <Button
              type="primary"
              icon={<UserOutlined />}
              loading={loading === 'user-logout'}
              onClick={() => handleTest('user-logout', () => 
                notify.user.action('user@example.com', '用户登出', '正常退出系统')
              )}
              block
            >
              用户登出
            </Button>
            {getResultDisplay('user-logout')}
          </Col>
          <Col span={6}>
            <Button
              type="primary"
              icon={<UserOutlined />}
              loading={loading === 'user-action'}
              onClick={() => handleTest('user-action', () => 
                notify.user.action('admin@example.com', '数据操作', '批量删除员工数据')
              )}
              block
            >
              用户操作
            </Button>
            {getResultDisplay('user-action')}
          </Col>
          <Col span={6}>
            <Button
              type="primary"
              icon={<TeamOutlined />}
              loading={loading === 'employee-notification'}
              onClick={() => handleTest('employee-notification', () => 
                notify.employee('张三', '绩效更新', '本月绩效评分已更新，请及时查看')
              )}
              block
            >
              员工通知
            </Button>
            {getResultDisplay('employee-notification')}
          </Col>
        </Row>
      </Card>

      {/* 批量操作通知测试 */}
      <Card title="批量操作通知测试" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Button
              type="primary"
              icon={<DatabaseOutlined />}
              loading={loading === 'batch-success'}
              onClick={() => handleTest('batch-success', () => 
                notify.batch('数据导入', 500, true)
              )}
              block
            >
              批量操作成功
            </Button>
            {getResultDisplay('batch-success')}
          </Col>
          <Col span={6}>
            <Button
              type="primary"
              icon={<DatabaseOutlined />}
              loading={loading === 'batch-fail'}
              onClick={() => handleTest('batch-fail', () => 
                notify.batch('数据删除', 100, false)
              )}
              block
            >
              批量操作失败
            </Button>
            {getResultDisplay('batch-fail')}
          </Col>
          <Col span={6}>
            <Button
              type="primary"
              icon={<MessageOutlined />}
              loading={loading === 'custom-notification'}
              onClick={() => handleTest('custom-notification', () => 
                notify.custom('自定义通知', '这是一条自定义通知消息', NotificationLevel.INFO)
              )}
              block
            >
              自定义通知
            </Button>
            {getResultDisplay('custom-notification')}
          </Col>
          <Col span={6}>
            <Button
              type="primary"
              icon={<MessageOutlined />}
              loading={loading === 'test-notification'}
              onClick={() => handleTest('test-notification', () => 
                notify.test()
              )}
              block
            >
              测试通知
            </Button>
            {getResultDisplay('test-notification')}
          </Col>
        </Row>
      </Card>

      {/* 连接测试 */}
      <Card title="连接测试" style={{ marginBottom: 24 }}>
        <Space>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            loading={loading === 'connection-test'}
            onClick={() => handleTest('connection-test', () => 
              notify.testConnection()
            )}
          >
            测试连接
          </Button>
          {getResultDisplay('connection-test')}
        </Space>
      </Card>

      {/* 配置信息 */}
      <Card title="配置信息">
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Title level={5}>企业ID (CorpId)</Title>
            <Paragraph copyable>ww68a125fce698cb59</Paragraph>
          </Col>
          <Col span={8}>
            <Title level={5}>应用密钥 (CorpSecret)</Title>
            <Paragraph copyable>ocrsCpRalvhbUSw9HVYrkFaoPZMIGh10VGDGl_hGbk</Paragraph>
          </Col>
          <Col span={8}>
            <Title level={5}>应用ID (AgentId)</Title>
            <Paragraph copyable>1000110</Paragraph>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default NotificationTest; 