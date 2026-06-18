import { X, User, Calendar, Tag, FileText } from 'lucide-react';
import { Task } from '../types';

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
}

export default function TaskDetailModal({ task, onClose }: TaskDetailModalProps) {
  const priorityLabels = {
    high: '高优先级',
    medium: '中优先级',
    low: '低优先级',
  };

  const statusLabels: Record<string, string> = {
    todo: '待办',
    'in-progress': '进行中',
    review: '审核中',
    done: '已完成',
    cancelled: '已取消',
    'needs-revision': '需要修改',
    overdue: '已逾期',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">任务详情</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 标题 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {task.title}
            </h3>
            <div className="flex gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${task.priority === 'high' ? 'bg-red-100 text-red-700' :
                  task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                }`}>
                {priorityLabels[task.priority]}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${task.status === 'done' ? 'bg-green-100 text-green-700' :
                  task.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                    task.status === 'review' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                }`}>
                {statusLabels[task.status]}
              </span>
            </div>
          </div>

          {/* 描述 */}
          {task.description && (
            <div>
              <div className="flex items-center gap-2 text-gray-700 font-medium mb-2">
                <FileText size={18} />
                <span>任务描述</span>
              </div>
              <p className="text-gray-600 leading-relaxed pl-6">
                {task.description}
              </p>
            </div>
          )}

          {/* 负责人 */}
          <div className="flex items-center gap-3">
            <User size={18} className="text-gray-500" />
            <div>
              <div className="text-sm text-gray-500">负责人</div>
              <div className="font-medium text-gray-800">
                {task.assignee || '未分配'}
              </div>
            </div>
          </div>

          {/* 创建者 */}
          {task.creatorName && (
            <div className="flex items-center gap-3">
              <User size={18} className="text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">创建者</div>
                <div className="font-medium text-gray-800">
                  {task.creatorName}
                </div>
              </div>
            </div>
          )}

          {/* 截止日期 */}
          {task.dueDate && (
            <div className="flex items-center gap-3">
              <Calendar size={18} className="text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">截止日期</div>
                <div className="font-medium text-gray-800">
                  {task.dueDate}
                </div>
              </div>
            </div>
          )}

          {/* 小组 */}
          {task.groupName && (
            <div className="flex items-center gap-3">
              <User size={18} className="text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">所属小组</div>
                <div className="font-medium text-gray-800">
                  {task.groupName}
                </div>
              </div>
            </div>
          )}

          {/* 标签 */}
          {task.tags && task.tags.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-gray-700 font-medium mb-2">
                <Tag size={18} />
                <span>标签</span>
              </div>
              <div className="flex flex-wrap gap-2 pl-6">
                {task.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 创建时间 */}
          {task.createdAt && (
            <div className="text-sm text-gray-500 pt-4 border-t border-gray-100">
              创建于 {new Date(task.createdAt).toLocaleString('zh-CN')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
