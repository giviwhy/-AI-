import { useState, useCallback, useEffect } from 'react';
import { Task, TaskStatus } from './types';
import { columns } from './data/mockData';
import Header from './components/Header';
import Column from './components/Column';
import AddTaskModal from './components/AddTaskModal';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';

const API_URL = 'http://localhost:3001';

function App() {
  const { isAuthenticated } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dropTargetColumn, setDropTargetColumn] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>('todo');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await fetch(`${API_URL}/api/tasks`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setTasks(data.map((task: any) => ({
            ...task,
            id: String(task.id),
            assigneeId: String(task.assigneeId),
            assignee: task.assignee ? {
              id: String(task.assignee.id),
              name: task.assignee.name,
              email: task.assignee.email,
              avatar: task.assignee.avatar,
              role: task.assignee.role,
            } : null,
          })));
        }
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchTasks();
    }
  }, [isAuthenticated]);

  const handleDragStart = useCallback((_e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedTaskId(null);
    setDropTargetColumn(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, status: string) => {
    e.preventDefault();
    if (!draggedTaskId) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await fetch(`${API_URL}/api/tasks/${draggedTaskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === draggedTaskId ? { ...task, status: status as TaskStatus } : task
        )
      );
    } catch (error) {
      console.error('Failed to update task:', error);
    }

    setDraggedTaskId(null);
    setDropTargetColumn(null);
  }, [draggedTaskId]);

  const handleAddTask = useCallback(async (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...taskData,
          assigneeId: parseInt(taskData.assigneeId),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newTask: Task = {
          ...data,
          id: String(data.id),
          assigneeId: String(data.assigneeId),
          assignee: data.assignee ? {
            id: String(data.assignee.id),
            name: data.assignee.name,
            email: data.assignee.email,
            avatar: data.assignee.avatar,
            role: data.assignee.role,
          } : null,
        };
        setTasks((prevTasks) => [...prevTasks, newTask]);
      }
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  }, []);

  const handleOpenAddModal = (status: string) => {
    setNewTaskStatus(status as TaskStatus);
    setIsModalOpen(true);
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((task) => task.status === status);
  };

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((column) => (
            <Column
              key={column.id}
              column={column}
              tasks={getTasksByStatus(column.id)}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onAddTask={handleOpenAddModal}
              isDropTarget={dropTargetColumn === column.id}
            />
          ))}
        </div>
      </main>

      <AddTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddTask}
        initialStatus={newTaskStatus}
      />
    </div>
  );
}

export default App;
