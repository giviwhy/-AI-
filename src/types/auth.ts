export interface User {
  id: string;
  studentId?: string;
  phone?: string;
  name: string;
  avatar: string;
  role: 'member' | 'leader' | 'admin';
  email: string;
  groupId?: number;
  groupName?: string;
  isLeader?: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}