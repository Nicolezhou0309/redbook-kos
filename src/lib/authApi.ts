import { supabase } from './supabase';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  inviteCode: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: any;
}

// 验证邀请码
export const validateInviteCode = async (inviteCode: string): Promise<AuthResponse> => {
  try {
    // 这里可以连接到数据库验证邀请码
    // 目前使用硬编码的邀请码进行演示
    const validInviteCode = 'vlinker888';
    
    if (inviteCode === validInviteCode) {
      return {
        success: true,
        message: '邀请码验证成功'
      };
    } else {
      return {
        success: false,
        message: '邀请码无效'
      };
    }
  } catch (error) {
    return {
      success: false,
      message: '验证邀请码时出错'
    };
  }
};

// 发送注册邮件
export const sendRegistrationEmail = async (email: string): Promise<AuthResponse> => {
  try {
    // 这里应该调用邮件服务API
    // 目前模拟发送邮件的过程
    console.log('发送注册邮件到:', email);
    
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      message: '注册邮件已发送，请查收邮箱'
    };
  } catch (error) {
    return {
      success: false,
      message: '发送注册邮件失败'
    };
  }
};

// 用户登录
export const loginUser = async (loginData: LoginData): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginData.email,
      password: loginData.password,
    });

    if (error) {
      return {
        success: false,
        message: error.message
      };
    }

    return {
      success: true,
      message: '登录成功',
      data: data.user
    };
  } catch (error) {
    return {
      success: false,
      message: '登录失败，请检查网络连接'
    };
  }
};

// 用户注册
export const registerUser = async (registerData: RegisterData): Promise<AuthResponse> => {
  try {
    // 首先验证邀请码
    const inviteCodeValidation = await validateInviteCode(registerData.inviteCode);
    if (!inviteCodeValidation.success) {
      return inviteCodeValidation;
    }

    // 创建用户账户
    const { data, error } = await supabase.auth.signUp({
      email: registerData.email,
      password: registerData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) {
      return {
        success: false,
        message: error.message
      };
    }

    return {
      success: true,
      message: '注册成功，请查收确认邮件',
      data: data.user
    };
  } catch (error) {
    return {
      success: false,
      message: '注册失败，请重试'
    };
  }
};

// 用户登出
export const logoutUser = async (): Promise<AuthResponse> => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return {
        success: false,
        message: error.message
      };
    }

    return {
      success: true,
      message: '登出成功'
    };
  } catch (error) {
    return {
      success: false,
      message: '登出失败'
    };
  }
};

// 获取当前用户
export const getCurrentUser = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    return null;
  }
};

// 检查用户是否已登录
export const isUserLoggedIn = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  return !!user;
}; 

// 发送密码重置邮件
export const sendPasswordResetEmail = async (email: string): Promise<AuthResponse> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`
    });

    if (error) {
      return {
        success: false,
        message: error.message
      };
    }

    return {
      success: true,
      message: '密码重置邮件已发送，请查收邮箱'
    };
  } catch (error) {
    return {
      success: false,
      message: '发送密码重置邮件失败，请重试'
    };
  }
};

// 更新用户密码
export const updateUserPassword = async (newPassword: string): Promise<AuthResponse> => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      return {
        success: false,
        message: error.message
      };
    }

    return {
      success: true,
      message: '密码更新成功'
    };
  } catch (error) {
    return {
      success: false,
      message: '密码更新失败，请重试'
    };
  }
}; 