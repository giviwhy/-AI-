import { useState, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Task, TaskStatus } from './types';
import { columns } from './data/mockData';
import Header from './components/Header';
import Column from './components/Column';
import AddTaskModal from './components/AddTaskModal';
import TaskDetailModal from './components/TaskDetailModal';
import GroupManagement from './pages/GroupManagement';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';

const API_URL = ''; // 部署到 Vercel 后使用相对路径

function App() {
  const { isAuthenticated, user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dropTargetColumn, setDropTargetColumn] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>('todo');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }

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
            assignee: task.assigneeName || task.assignee || '未分配',
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
        body: JSON.stringify(taskData),
      });

      if (response.ok) {
        const data = await response.json();
        const newTask: Task = {
          ...data,
          id: String(data.id),
        };
        setTasks((prevTasks) => [...prevTasks, newTask]);
      }
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  }, []);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await fetch(`${API_URL}/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  }, []);

  const handleViewTask = useCallback((task: Task) => {
    setSelectedTask(task);
    setIsDetailModalOpen(true);
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
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Header />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Routes>
            <Route path="/" element={
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
                    onDeleteTask={handleDeleteTask}
                    onViewTask={handleViewTask}
                    isDropTarget={dropTargetColumn === column.id}
                    canAddTask={user?.role === 'leader' || user?.role === 'admin'}
                  />
                ))}
              </div>
            } />
            <Route path="/groups" element={<GroupManagement />} />
          </Routes>
        </main>

        <AddTaskModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAdd={handleAddTask}
          initialStatus={newTaskStatus}
        />

        {selectedTask && (
          <TaskDetailModal
            task={selectedTask}
            onClose={() => {
              setIsDetailModalOpen(false);
              setSelectedTask(null);
            }}
          />
        )}
      </div>
    </BrowserRouter>
  );
}

export default App;
