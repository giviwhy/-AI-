import { Column, TaskStatus } from '../types';

export const columns: Column[] = [
  { id: 'todo' as TaskStatus, title: '未开始', color: '#94a3b8', bgColor: '#f1f5f9' },
  { id: 'in-progress' as TaskStatus, title: '进行中', color: '#3b82f6', bgColor: '#dbeafe' },
  { id: 'needs-revision' as TaskStatus, title: '需修改', color: '#ef4444', bgColor: '#fee2e2' },
  { id: 'review' as TaskStatus, title: '待审核', color: '#f59e0b', bgColor: '#fef3c7' },
  { id: 'done' as TaskStatus, title: '已完成', color: '#10b981', bgColor: '#d1fae5' },
  { id: 'cancelled' as TaskStatus, title: '已取消', color: '#6b7280', bgColor: '#e5e7eb' },
  { id: 'overdue' as TaskStatus, title: '已逾期', color: '#dc2626', bgColor: '#fecaca' },
];