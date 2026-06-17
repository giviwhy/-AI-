import { Plus } from 'lucide-react';
import { Column as ColumnType, Task } from '../types';
import TaskCard from './TaskCard';

interface ColumnProps {
  column: ColumnType;
  tasks: Task[];
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, status: string) => void;
  onAddTask: (status: string) => void;
  onDeleteTask: (taskId: string) => void;
  isDropTarget: boolean;
  canAddTask: boolean;
}

export default function Column({
  column,
  tasks,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onAddTask,
  onDeleteTask,
  isDropTarget,
  canAddTask,
}: ColumnProps) {
  return (
    <div
      className={`flex-1 min-w-[280px] max-w-[320px] rounded-xl ${column.bgColor} p-4 transition-all duration-200 ${isDropTarget ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, column.id)}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: column.color }}
          />
          <h2 className="font-semibold text-gray-700">{column.title}</h2>
          <span className="px-2 py-0.5 bg-white/50 rounded-full text-xs text-gray-500">
            {tasks.length}
          </span>
        </div>
        {canAddTask && (
          <button
            onClick={() => onAddTask(column.id)}
            className="p-1 rounded hover:bg-white/50 transition-colors"
          >
            <Plus size={18} className="text-gray-500" />
          </button>
        )}
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDelete={onDeleteTask}
          />
        ))}

        {tasks.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            暂无任务
          </div>
        )}
      </div>
    </div>
  );
}
