import React from 'react';
import { Layout, Menu, Typography, Modal } from 'antd';
import {
  DatabaseOutlined,
  UserOutlined,
  FileTextOutlined as NotesOutlined,
  MergeCellsOutlined,
  TeamOutlined,
  ExclamationCircleOutlined,
  MessageOutlined,
  LogoutOutlined,
  IdcardOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { logoutUser } from '../../lib/authApi';

const { Sider } = Layout;
const { Title, Text } = Typography;

interface SidebarProps {
  collapsed: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, user } = useAuth();

  const handleLogout = async () => {
    Modal.confirm({
      title: '确认退出登录',
      content: '您确定要退出登录吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          const result = await logoutUser();
          if (result.success) {
            setUser(null);
            navigate('/login');
          } else {
            Modal.error({
              title: '退出登录失败',
              content: result.message,
            });
          }
        } catch (error) {
          Modal.error({
            title: '退出登录失败',
            content: '退出登录时发生错误，请重试',
          });
        }
      },
    });
  };

  const menuItems = [
    {
      key: '/employee-simple-join',
      icon: <MergeCellsOutlined />,
      label: '员工数据宽表',
    },
    {
      key: 'employee-details',
      icon: <DatabaseOutlined />,
      label: '员工数据明细',
      children: [
        {
          key: '/employee-data',
          icon: <DatabaseOutlined />,
          label: '员工回复率',
        },
        {
          key: '/employee-leads',
          icon: <UserOutlined />,
          label: '员工线索明细',
        },
        {
          key: '/employee-notes',
          icon: <NotesOutlined />,
          label: '员工笔记数据',
        },
      ],
    },
    {
      key: '/disciplinary-record',
      icon: <ExclamationCircleOutlined />,
      label: '红黄牌记录',
    },
    {
      key: 'account-manage',
      icon: <TeamOutlined />,
      label: '账号管理',
      children: [
        {
          key: '/employee-manage',
          icon: <TeamOutlined />,
          label: '账号管理',
        },
        {
          key: '/employee-roster',
          icon: <IdcardOutlined />,
          label: '人员花名册',
        },
      ],
    },
    {
      key: 'notification',
      icon: <MessageOutlined />,
      label: '通知功能',
      children: [
        {
          key: '/message-test',
          icon: <MessageOutlined />,
          label: '基础消息测试',
        },
        {
          key: '/notification-test',
          icon: <MessageOutlined />,
          label: '高级通知测试',
        },
      ],
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      style={{
        background: '#fff',
        boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
        position: 'fixed',
        left: 0,
        top: 0,
        height: '100vh',
        zIndex: 1000,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '16px', textAlign: 'center' }}>
        <img
          src="/tag.svg"
          alt="Logo"
          style={{ 
            width: collapsed ? 40 : 64,
            height: collapsed ? 40 : 64,
            marginBottom: collapsed ? 0 : 8,
            display: 'block',
            margin: '0 auto'
          }}
        />
        {!collapsed && (
          <Title level={5} style={{ margin: '8px 0 0 0', color: '#ff2442' }}>
            员工号运营通
          </Title>
        )}
      </div>
      
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{
          border: 'none',
          background: 'transparent',
          height: 'calc(100vh - 180px)',
          overflowY: 'auto',
        }}
      />
      
      <div style={{ 
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '16px', 
        borderTop: '1px solid #f0f0f0',
        background: '#fafafa',
      }}>
        {!collapsed && user?.email && (
          <div style={{ 
            marginBottom: '12px',
            textAlign: 'center',
          }}>
            <Text 
              type="secondary" 
              style={{ 
                fontSize: '12px',
                wordBreak: 'break-all',
              }}
            >
              {user.email}
            </Text>
          </div>
        )}
        <Menu
          mode="inline"
          items={[
            {
              key: 'logout',
              icon: <LogoutOutlined />,
              label: '退出登录',
              onClick: handleLogout,
            }
          ]}
          style={{
            border: 'none',
            background: 'transparent',
          }}
        />
      </div>
    </Sider>
  );
};

export default Sidebar; 