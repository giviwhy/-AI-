import { Calendar, Tag, User, Trash2 } from 'lucide-react';
import { Task } from '../types';

interface TaskCardProps {
  task: Task;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDragEnd: () => void;
  onDelete: (taskId: string) => void;
}

const priorityStyles = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
};

const priorityLabels = {
  high: '高',
  medium: '中',
  low: '低',
};

export default function TaskCard({ task, onDragStart, onDragEnd, onDelete }: TaskCardProps) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onDragEnd={onDragEnd}
      className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-medium text-gray-800 text-sm leading-tight flex-1 pr-2">
          {task.title}
        </h3>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityStyles[task.priority]}`}>
            {priorityLabels[task.priority]}
          </span>
          <button
            onClick={() => onDelete(task.id)}
            className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
            title="删除任务"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {task.description && (
        <p className="text-gray-500 text-xs mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
            >
              <Tag size={10} />
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <User size={12} />
          <span>{task.assignee}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar size={12} />
          <span>{task.dueDate}</span>
        </div>
      </div>
    </div>
  );
}
