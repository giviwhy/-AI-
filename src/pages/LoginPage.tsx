import { useState } from 'react';
import { users } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserCircle } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [selectedUser, setSelectedUser] = useState(users[0]);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!password) {
      setError('请输入密码');
      return;
    }

    setIsLoading(true);
    setError('');

    const success = await login(selectedUser.email, password);

    if (!success) {
      setError('邮箱或密码错误');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-2xl mb-4 shadow-lg">
            <UserCircle size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">任务看板</h1>
          <p className="text-gray-500">小组协作管理平台</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <LogIn size={20} className="text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-800">登录</h2>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">选择用户</label>
            <select
              value={selectedUser.id}
              onChange={(e) => {
                const user = users.find((u) => u.id === e.target.value);
                if (user) {
                  setSelectedUser(user);
                  setError('');
                }
              }}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} - {user.role} ({user.email})
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              密码 <span className="text-gray-400">(演示密码: 123456)</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="请输入密码"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleLogin();
                }
              }}
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                登录中...
              </>
            ) : (
              <>
                <LogIn size={20} />
                登录
              </>
            )}
          </button>
        </div>

        <p className="text-center text-gray-400 text-sm mt-6">
          这是一个演示系统，所有用户密码均为 <code className="bg-gray-100 px-1 rounded">123456</code>
        </p>
      </div>
    </div>
  );
}
