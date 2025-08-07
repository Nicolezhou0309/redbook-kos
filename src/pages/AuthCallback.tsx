import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Typography, Result } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const { Title } = Typography;

const AuthCallback: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          setError('认证失败：' + error.message);
          return;
        }

        if (data.session) {
          setUser(data.session.user);
          setSuccess(true);
          // 直接跳转到主页面，不显示成功动画
          navigate('/employee-data');
        } else {
          setError('未找到有效的会话');
        }
      } catch (err) {
        setError('处理认证回调时出错');
      }
    };

    handleAuthCallback();
  }, [navigate, setUser]);

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        padding: '20px'
      }}>
        <Card style={{ maxWidth: '500px', width: '100%' }}>
          <Result
            status="error"
            icon={<ExclamationCircleOutlined />}
            title="认证失败"
            subTitle={error}
            extra={[
              <button
                key="login"
                onClick={() => navigate('/login')}
                style={{
                  background: '#1890ff',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                返回登录
              </button>
            ]}
          />
        </Card>
      </div>
    );
  }

  // 如果认证成功，直接返回null，让页面跳转
  if (success) {
    return null;
  }

  // 默认情况下不显示任何内容，让Loading组件处理
  return null;
};

export default AuthCallback; 