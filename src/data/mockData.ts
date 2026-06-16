import { User, users } from '../types/auth';
import { Task, Column, TaskStatus } from '../types';

export type { User };
export type { Task };
export { users };

export const columns: Column[] = [
  { id: 'todo' as TaskStatus, title: '待办', color: '#94a3b8', bgColor: '#f1f5f9' },
  { id: 'in-progress' as TaskStatus, title: '进行中', color: '#3b82f6', bgColor: '#dbeafe' },
  { id: 'review' as TaskStatus, title: '审核', color: '#f59e0b', bgColor: '#fef3c7' },
  { id: 'done' as TaskStatus, title: '完成', color: '#10b981', bgColor: '#d1fae5' },
];

export const initialTasks: Task[] = [
  {
    id: '1',
    title: '完成项目需求文档',
    description: '整理并完善项目需求文档，包括功能需求和非功能需求',
    status: 'todo',
    priority: 'high',
    assignee: '张三',
    dueDate: '2024-02-15',
    tags: ['文档', '需求'],
    createdAt: '2024-02-10',
  },
  {
    id: '2',
    title: '设计数据库架构',
    description: '根据需求设计数据库表结构和关系',
    status: 'todo',
    priority: 'high',
    assignee: '李四',
    dueDate: '2024-02-18',
    tags: ['数据库', '设计'],
    createdAt: '2024-02-10',
  },
  {
    id: '3',
    title: '开发用户登录模块',
    description: '实现用户注册、登录、密码重置功能',
    status: 'in-progress',
    priority: 'high',
    assignee: '王五',
    dueDate: '2024-02-20',
    tags: ['前端', '用户'],
    createdAt: '2024-02-11',
  },
  {
    id: '4',
    title: '实现数据可视化图表',
    description: '使用图表库实现数据统计和可视化展示',
    status: 'in-progress',
    priority: 'medium',
    assignee: '赵六',
    dueDate: '2024-02-22',
    tags: ['前端', '图表'],
    createdAt: '2024-02-12',
  },
  {
    id: '5',
    title: '代码审查',
    description: '审查团队成员提交的代码，确保代码质量',
    status: 'review',
    priority: 'medium',
    assignee: '张三',
    dueDate: '2024-02-16',
    tags: ['审查', '代码'],
    createdAt: '2024-02-13',
  },
  {
    id: '6',
    title: '编写单元测试',
    description: '为核心模块编写单元测试用例',
    status: 'done',
    priority: 'medium',
    assignee: '李四',
    dueDate: '2024-02-14',
    tags: ['测试', '后端'],
    createdAt: '2024-02-10',
  },
  {
    id: '7',
    title: '部署测试环境',
    description: '配置并部署测试环境，确保应用正常运行',
    status: 'done',
    priority: 'high',
    assignee: '王五',
    dueDate: '2024-02-12',
    tags: ['运维', '部署'],
    createdAt: '2024-02-08',
  },
];

export const teamMembers = users.map(({ id, name, avatar, role }) => ({
  id,
  name,
  avatar,
  role,
}));