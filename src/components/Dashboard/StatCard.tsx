import React from 'react';
import { Card, Statistic, Space } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

interface StatCardProps {
  title: string;
  value: number;
  suffix?: string;
  prefix?: React.ReactNode;
  changePercent?: number;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  suffix,
  prefix,
  changePercent,
  loading = false,
}) => {
  const getChangeIcon = () => {
    if (!changePercent) return null;
    return changePercent > 0 ? (
      <ArrowUpOutlined style={{ color: '#52c41a' }} />
    ) : (
      <ArrowDownOutlined style={{ color: '#ff4d4f' }} />
    );
  };

  const getChangeColor = () => {
    if (!changePercent) return '#666';
    return changePercent > 0 ? '#52c41a' : '#ff4d4f';
  };

  return (
    <Card
      loading={loading}
      style={{
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: 'none',
      }}
    >
      <Statistic
        title={title}
        value={value}
        suffix={suffix}
        prefix={prefix}
        valueStyle={{
          color: '#ff2442',
          fontSize: '24px',
          fontWeight: 'bold',
        }}
      />
      {changePercent !== undefined && (
        <div style={{ marginTop: 8 }}>
          <Space>
            {getChangeIcon()}
            <span style={{ color: getChangeColor(), fontSize: '14px' }}>
              {changePercent > 0 ? '+' : ''}{changePercent}%
            </span>
            <span style={{ color: '#666', fontSize: '12px' }}>较上周</span>
          </Space>
        </div>
      )}
    </Card>
  );
};

export default StatCard; 