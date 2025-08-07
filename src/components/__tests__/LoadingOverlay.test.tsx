import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingOverlay from '../LoadingOverlay';

describe('LoadingOverlay', () => {
  it('should render when visible is true', () => {
    render(
      <LoadingOverlay 
        visible={true} 
        message="正在登录中..." 
        showLogo={true}
      />
    );
    
    expect(screen.getByText('正在登录中...')).toBeInTheDocument();
  });

  it('should not render when visible is false', () => {
    render(
      <LoadingOverlay 
        visible={false} 
        message="正在登录中..." 
        showLogo={true}
      />
    );
    
    expect(screen.queryByText('正在登录中...')).not.toBeInTheDocument();
  });

  it('should show logo when showLogo is true', () => {
    render(
      <LoadingOverlay 
        visible={true} 
        message="正在登录中..." 
        showLogo={true}
      />
    );
    
    const logo = screen.getByAltText('Logo');
    expect(logo).toBeInTheDocument();
  });

  it('should not show logo when showLogo is false', () => {
    render(
      <LoadingOverlay 
        visible={true} 
        message="正在登录中..." 
        showLogo={false}
      />
    );
    
    expect(screen.queryByAltText('Logo')).not.toBeInTheDocument();
  });

  it('should use default message when not provided', () => {
    render(
      <LoadingOverlay 
        visible={true} 
        showLogo={true}
      />
    );
    
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });
}); 