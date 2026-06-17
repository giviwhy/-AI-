export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done' | 'cancelled' | 'needs-revision' | 'overdue';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high';
  assignee: string;
  assigneeId?: number;
  assigneeAvatar?: string;
  creatorId?: number;
  creatorName?: string;
  groupId?: number;
  groupName?: string;
  dueDate: string;
  tags: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface Column {
  id: TaskStatus;
  title: string;
  color: string;
  bgColor: string;
}

export interface TeamMember {
  id: number;
  studentId?: string;
  name: string;
  username?: string;
  avatar: string;
  role: string;
  groupId?: number;
  groupName?: string;
}

export interface Comment {
  id: number;
  taskId: number;
  userId: number;
  username: string;
  avatar: string;
  content: string;
  createdAt: string;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  content?: string;
  taskId?: number;
  isRead: boolean;
  createdAt: string;
}