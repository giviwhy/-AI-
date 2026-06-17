import { useState, useEffect } from 'react';
import { Bell, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface Notification {
  id: number;
  type: string;
  title: string;
  content: string;
  taskId?: number;
  isRead: boolean;
  createdAt: string;
}

interface NotificationListProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationList({ isOpen, onClose }: NotificationListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) {
      setNotifications([]);
      return;
    }

    const fetchNotifications = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await fetch('/api/notifications', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setNotifications(data);
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [isOpen]);

  const handleMarkAsRead = async (notificationId: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = notifications.filter((n) => !n.isRead);
    
    for (const notification of unreadNotifications) {
      await handleMarkAsRead(notification.id);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return <Clock size={16} className="text-blue-500" />;
      case 'new_comment':
        return <AlertCircle size={16} className="text-yellow-500" />;
      case 'group_notification':
        return <Bell size={16} className="text-green-500" />;
      default:
        return <Bell size={16} className="text-gray-500" />;
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return '任务分配';
      case 'new_comment':
        return '新评论';
      case 'group_notification':
        return '小组通知';
      default:
        return '通知';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return '刚刚';
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bell size={20} className="text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-800">通知中心</h2>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full">
              {notifications.filter((n) => !n.isRead).length} 未读
            </span>
          </div>
          <div className="flex items-center gap-2">
            {notifications.some((n) => !n.isRead) && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                全部标为已读
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <span className="text-gray-500 text-xl">&times;</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">暂无通知</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-colors cursor-pointer hover:bg-gray-50 ${
                    notification.isRead
                      ? 'border-gray-100 bg-white'
                      : 'border-blue-200 bg-blue-50'
                  }`}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 p-2 rounded-full ${
                      notification.isRead ? 'bg-gray-100' : 'bg-blue-100'
                    }`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                          {getNotificationTypeLabel(notification.type)}
                        </span>
                        {!notification.isRead && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      <h3 className="font-medium text-gray-800 mb-1">
                        {notification.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {notification.content}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {formatDate(notification.createdAt)}
                        </span>
                        {!notification.isRead && (
                          <span className="text-xs text-blue-600 flex items-center gap-1">
                            <CheckCircle size={12} />
                            点击标记已读
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
