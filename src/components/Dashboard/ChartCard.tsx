import React from 'react';
import { Card, Select, Space } from 'antd';
import { Line, Pie, Column } from '@ant-design/charts';

interface ChartCardProps {
  title: string;
  type: 'line' | 'pie' | 'column';
  data: any[];
  config?: any;
  timeRange?: string;
  onTimeRangeChange?: (value: string) => void;
}

const ChartCard: React.FC<ChartCardProps> = ({
  title,
  type,
  data,
  config = {},
  timeRange,
  onTimeRangeChange,
}) => {
  const renderChart = () => {
    const baseConfig = {
      data,
      height: 300,
      ...config,
    };

    switch (type) {
      case 'line':
        return <Line {...baseConfig} />;
      case 'pie':
        return <Pie {...baseConfig} />;
      case 'column':
        return <Column {...baseConfig} />;
      default:
        return <Line {...baseConfig} />;
    }
  };

  return (
    <Card
      title={
        <Space>
          <span>{title}</span>
          {timeRange && onTimeRangeChange && (
            <Select
              value={timeRange}
              onChange={onTimeRangeChange}
              style={{ width: 120 }}
              options={[
                { label: '7天', value: '7d' },
                { label: '30天', value: '30d' },
                { label: '90天', value: '90d' },
              ]}
            />
          )}
        </Space>
      }
      style={{
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: 'none',
      }}
    >
      {renderChart()}
    </Card>
  );
};

export default ChartCard; 