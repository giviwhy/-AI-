import { LayoutDashboard, Bell, Search, ChevronDown, LogOut, RefreshCw, Users, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import SendNotificationModal from './SendNotificationModal';

export default function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitchUser = () => {
    logout();
    setShowUserMenu(false);
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-500 rounded-lg">
              <LayoutDashboard size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">任务看板</h1>
              <p className="text-xs text-gray-500">小组协作管理</p>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg transition-colors ${location.pathname === '/'
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              任务看板
            </Link>
            {user?.role === 'admin' && (
              <Link
                to="/groups"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${location.pathname === '/groups'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                <Users size={18} />
                小组管理
              </Link>
            )}
            {(user?.role === 'leader' || user?.role === 'admin') && (
              <button
                onClick={() => setShowNotificationModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Send size={18} />
                发布通知
              </button>
            )}
          </nav>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="搜索任务..."
                className="pl-10 pr-4 py-2 w-64 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              />
            </div>

            <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Bell size={20} className="text-gray-500" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                  {user?.avatar}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-medium text-gray-800">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.role}</p>
                </div>
                <ChevronDown size={16} className="text-gray-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500">
                    <p className="text-white font-semibold">{user?.name}</p>
                    <p className="text-blue-100 text-sm">{user?.email}</p>
                    <p className="text-blue-100 text-xs mt-1">{user?.role}</p>
                  </div>

                  <div className="p-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSwitchUser();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-blue-600 hover:bg-blue-50 transition-colors text-left"
                    >
                      <RefreshCw size={16} />
                      <span className="text-sm">切换用户</span>
                    </button>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors text-left border-t border-gray-100"
                  >
                    <LogOut size={16} />
                    <span className="text-sm">退出登录</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showNotificationModal && (
        <SendNotificationModal
          isOpen={showNotificationModal}
          onClose={() => setShowNotificationModal(false)}
        />
      )}
    </header>
  );
}
