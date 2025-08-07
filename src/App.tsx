import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { App as AntApp } from 'antd';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import MainLayout from './components/Layout/MainLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback';
import EmployeeData from './pages/EmployeeData';
import EmployeeLeads from './pages/EmployeeLeads';
import EmployeeNotes from './pages/EmployeeNotes';
import EmployeeSimpleJoin from './pages/EmployeeSimpleJoin';
import EmployeeManage from './pages/EmployeeManage';
import DisciplinaryRecord from './pages/DisciplinaryRecord';

function App() {
  return (
    <AuthProvider>
      <AntApp>
        <Router>
          <Routes>
            {/* 公开路由 */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            {/* 受保护的路由 */}
            <Route path="/" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/employee-data" replace />} />
              <Route path="employee-data" element={<EmployeeData />} />
              <Route path="employee-leads" element={<EmployeeLeads />} />
              <Route path="employee-notes" element={<EmployeeNotes />} />
              <Route path="employee-simple-join" element={<EmployeeSimpleJoin />} />
              <Route path="employee-manage" element={<EmployeeManage />} />
              <Route path="disciplinary-record" element={<DisciplinaryRecord />} />
            </Route>
            
            {/* 默认重定向到登录页面 */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </AntApp>
    </AuthProvider>
  );
}

export default App;
