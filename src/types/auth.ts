export interface User {
  id: string;
  name: string;
  avatar: string;
  role: string;
  email: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export const users: User[] = [
  {
    id: '1',
    name: '张三',
    avatar: 'ZS',
    role: '项目经理',
    email: 'zhangsan@example.com',
  },
  {
    id: '2',
    name: '李四',
    avatar: 'LS',
    role: '后端开发',
    email: 'lisi@example.com',
  },
  {
    id: '3',
    name: '王五',
    avatar: 'WW',
    role: '前端开发',
    email: 'wangwu@example.com',
  },
  {
    id: '4',
    name: '赵六',
    avatar: 'ZL',
    role: 'UI设计',
    email: 'zhaoliu@example.com',
  },
];
