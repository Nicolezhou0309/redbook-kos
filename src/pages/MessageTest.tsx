import React from 'react';
import { Card, Row, Col, Typography, Alert } from 'antd';
import MessageSender from '../components/MessageSender';

const { Title, Paragraph } = Typography;

const MessageTest: React.FC = () => {
  const handleSendSuccess = (result: any) => {
    console.log('消息发送成功:', result);
  };

  const handleSendError = (error: string) => {
    console.error('消息发送失败:', error);
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Typography.Title level={2}>企业微信消息测试</Typography.Title>
        <Typography.Text type="secondary">测试企业微信消息发送功能</Typography.Text>
      </div>

      <Alert
        message="测试说明"
        description="此页面用于测试企业微信消息发送功能。请确保已正确配置企业微信应用，并且接收人已加入企业微信。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Row gutter={[24, 24]}>
        <Col span={24}>
          <MessageSender
            title="基础消息发送测试"
            showConnectionTest={true}
            defaultMessageType="text"
            defaultRecipient="@all"
            onSendSuccess={handleSendSuccess}
            onSendError={handleSendError}
          />
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title="Markdown消息测试" style={{ marginBottom: 16 }}>
            <MessageSender
              title="Markdown格式消息"
              showConnectionTest={false}
              defaultMessageType="markdown"
              defaultRecipient="@all"
              onSendSuccess={handleSendSuccess}
              onSendError={handleSendError}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col span={12}>
          <Card title="指定用户测试">
            <MessageSender
              title="发送给指定用户"
              showConnectionTest={false}
              defaultMessageType="text"
              defaultRecipient="zhangsan"
              onSendSuccess={handleSendSuccess}
              onSendError={handleSendError}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="部门消息测试">
            <MessageSender
              title="发送给部门"
              showConnectionTest={false}
              defaultMessageType="text"
              defaultRecipient="1"
              onSendSuccess={handleSendSuccess}
              onSendError={handleSendError}
            />
          </Card>
        </Col>
      </Row>

      <Card title="配置信息" style={{ marginTop: 24 }}>
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Title level={5}>企业ID (CorpId)</Title>
            <Paragraph copyable>ww30ead8f4b3e9e84d</Paragraph>
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

export default MessageTest; 