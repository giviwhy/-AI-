export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high';
  assignee: string;
  assigneeId?: string;
  dueDate: string;
  tags: string[];
  createdAt: string;
}

export interface Column {
  id: TaskStatus;
  title: string;
  color: string;
  bgColor: string;
}

export interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  role: string;
}
