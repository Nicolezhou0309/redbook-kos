import React from 'react';
import { Layout, Button, Avatar, Dropdown, Space, Typography, Badge, Tooltip, App } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  BellOutlined,
  SettingOutlined,
  LogoutOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../../lib/authApi';
import { useAuth } from '../../contexts/AuthContext';

const { Header: AntHeader } = Layout;
const { Title } = Typography;
const { Text } = Typography;

interface HeaderProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

const AppHeader: React.FC<HeaderProps> = ({ collapsed, onCollapse }) => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const { message } = App.useApp();

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
    },
  ];

  const handleUserMenuClick: MenuProps['onClick'] = async ({ key }) => {
    switch (key) {
      case 'logout':
        try {
          const response = await logoutUser();
          if (response.success) {
            setUser(null);
            message.success('已退出登录');
            navigate('/login');
          } else {
            message.error(response.message);
          }
        } catch (error) {
          message.error('退出登录失败');
        }
        break;
      default:
        console.log('点击菜单项:', key);
    }
  };

  return (
    <AntHeader
      style={{
        padding: '0 24px',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => onCollapse(!collapsed)}
          style={{
            fontSize: '16px',
            width: 64,
            height: 64,
          }}
        />
        <Title level={4} style={{ margin: '0 0 0 16px', color: '#ff2442' }}>
          员工号运营通
        </Title>
      </div>

      <Space size="middle">
        <Button
          type="text"
          icon={<BellOutlined />}
          style={{ fontSize: '16px' }}
        />
        <Dropdown
          menu={{
            items: userMenuItems,
            onClick: handleUserMenuClick,
          }}
          placement="bottomRight"
        >
          <Space style={{ cursor: 'pointer' }}>
            <Avatar icon={<UserOutlined />} />
            <span>{user?.email || '管理员'}</span>
          </Space>
        </Dropdown>
      </Space>
    </AntHeader>
  );
};

export default AppHeader; 