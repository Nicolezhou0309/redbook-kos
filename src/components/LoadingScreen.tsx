import React from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import './LoadingScreen.css';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = '正在登录中...' 
}) => {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="logo-container">
          <img 
            src="/logo.svg" 
            alt="Logo" 
            className="loading-logo"
          />
        </div>
        <div className="loading-text">
          <Spin 
            indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} 
            size="large"
          />
          <p className="loading-message">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen; 