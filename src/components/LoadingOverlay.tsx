import React from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import './LoadingScreen.css';

interface LoadingOverlayProps {
  message?: string;
  visible: boolean;
  showLogo?: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  message = '加载中...',
  visible,
  showLogo = true
}) => {
  if (!visible) return null;

  return (
    <div className="loading-screen">
      <div className="loading-content">
        {showLogo && (
          <div className="logo-container">
            <img 
              src="/logo.svg" 
              alt="Logo" 
              className="loading-logo"
            />
          </div>
        )}
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

export default LoadingOverlay; 