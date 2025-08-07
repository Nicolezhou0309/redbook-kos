import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DisciplinaryRecord from '../DisciplinaryRecord';

// Mock the API
jest.mock('../../lib/disciplinaryRecordApi', () => ({
  disciplinaryRecordApi: {
    getAllDisciplinaryRecords: jest.fn(),
    createDisciplinaryRecord: jest.fn(),
    updateDisciplinaryRecord: jest.fn(),
    deleteDisciplinaryRecord: jest.fn(),
    getStatistics: jest.fn(),
  },
}));

const mockDisciplinaryRecordApi = require('../../lib/disciplinaryRecordApi').disciplinaryRecordApi;

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('DisciplinaryRecord Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders disciplinary record page title', () => {
    mockDisciplinaryRecordApi.getAllDisciplinaryRecords.mockResolvedValue([]);
    mockDisciplinaryRecordApi.getStatistics.mockResolvedValue({
      totalRecords: 0,
      employeeCount: 0,
      employeeStats: {},
      monthlyStats: {},
    });

    renderWithRouter(<DisciplinaryRecord />);
    
    expect(screen.getByText('红黄牌记录管理')).toBeInTheDocument();
  });

  test('shows loading state when fetching data', () => {
    mockDisciplinaryRecordApi.getAllDisciplinaryRecords.mockImplementation(() => 
      new Promise(() => {}) // Never resolves
    );
    mockDisciplinaryRecordApi.getStatistics.mockResolvedValue({
      totalRecords: 0,
      employeeCount: 0,
      employeeStats: {},
      monthlyStats: {},
    });

    renderWithRouter(<DisciplinaryRecord />);
    
    // The table should show loading state
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  test('displays records in table', async () => {
    const mockRecords = [
      {
        id: '1',
        employee_name: '张三',
        reason: '工作态度不端正',
        created_at: '2024-01-01T10:00:00Z',
      },
      {
        id: '2',
        employee_name: '李四',
        reason: '违反公司规定',
        created_at: '2024-01-02T10:00:00Z',
      },
    ];

    mockDisciplinaryRecordApi.getAllDisciplinaryRecords.mockResolvedValue(mockRecords);
    mockDisciplinaryRecordApi.getStatistics.mockResolvedValue({
      totalRecords: 2,
      employeeCount: 2,
      employeeStats: { '张三': 1, '李四': 1 },
      monthlyStats: { '2024-01': 2 },
    });

    renderWithRouter(<DisciplinaryRecord />);
    
    await waitFor(() => {
      expect(screen.getByText('张三')).toBeInTheDocument();
      expect(screen.getByText('李四')).toBeInTheDocument();
      expect(screen.getByText('工作态度不端正')).toBeInTheDocument();
      expect(screen.getByText('违反公司规定')).toBeInTheDocument();
    });
  });

  test('shows statistics cards', async () => {
    const mockStats = {
      totalRecords: 5,
      employeeCount: 3,
      employeeStats: { '张三': 2, '李四': 2, '王五': 1 },
      monthlyStats: { '2024-01': 3, '2023-12': 2 },
    };

    mockDisciplinaryRecordApi.getAllDisciplinaryRecords.mockResolvedValue([]);
    mockDisciplinaryRecordApi.getStatistics.mockResolvedValue(mockStats);

    renderWithRouter(<DisciplinaryRecord />);
    
    await waitFor(() => {
      expect(screen.getByText('总记录数')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('涉及员工数')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  test('opens add modal when clicking add button', async () => {
    mockDisciplinaryRecordApi.getAllDisciplinaryRecords.mockResolvedValue([]);
    mockDisciplinaryRecordApi.getStatistics.mockResolvedValue({
      totalRecords: 0,
      employeeCount: 0,
      employeeStats: {},
      monthlyStats: {},
    });

    renderWithRouter(<DisciplinaryRecord />);
    
    const addButton = screen.getByText('添加红黄牌记录');
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText('添加红黄牌记录')).toBeInTheDocument();
      expect(screen.getByText('员工姓名')).toBeInTheDocument();
      expect(screen.getByText('红黄牌原因')).toBeInTheDocument();
    });
  });

  test('can search by employee name', async () => {
    const mockRecords = [
      {
        id: '1',
        employee_name: '张三',
        reason: '工作态度不端正',
        created_at: '2024-01-01T10:00:00Z',
      },
    ];

    mockDisciplinaryRecordApi.getAllDisciplinaryRecords.mockResolvedValue([]);
    mockDisciplinaryRecordApi.getDisciplinaryRecordsByEmployeeName.mockResolvedValue(mockRecords);
    mockDisciplinaryRecordApi.getStatistics.mockResolvedValue({
      totalRecords: 0,
      employeeCount: 0,
      employeeStats: {},
      monthlyStats: {},
    });

    renderWithRouter(<DisciplinaryRecord />);
    
    const searchInput = screen.getByPlaceholderText('搜索员工姓名');
    fireEvent.change(searchInput, { target: { value: '张三' } });
    
    const searchButton = screen.getByText('搜索');
    fireEvent.click(searchButton);
    
    await waitFor(() => {
      expect(mockDisciplinaryRecordApi.getDisciplinaryRecordsByEmployeeName).toHaveBeenCalledWith('张三');
    });
  });
}); 