import { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Group {
  id: number;
  name: string;
  leaderId: number | null;
  leaderName: string | null;
  memberCount: number;
  createdAt: string;
}

interface User {
  id: number;
  username: string;
  role: string;
  groupId: number | null;
}

export default function GroupManagement() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newLeaderId, setNewLeaderId] = useState<number | null>(null);

  useEffect(() => {
    fetchGroups();
    fetchUsers();
  }, []);

  const fetchGroups = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('/api/groups', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setGroups(data);
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    }
  };

  const fetchUsers = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newGroupName, leaderId: newLeaderId }),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setNewGroupName('');
        setNewLeaderId(null);
        fetchGroups();
      } else {
        const error = await response.json();
        alert(error.message || '创建失败');
      }
    } catch (error) {
      console.error('Failed to create group:', error);
      alert('创建失败');
    }
  };

  const handleUpdateGroup = async () => {
    if (!selectedGroup || !newGroupName.trim()) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`/api/groups/${selectedGroup.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newGroupName, leaderId: newLeaderId }),
      });

      if (response.ok) {
        setShowEditModal(false);
        setSelectedGroup(null);
        setNewGroupName('');
        setNewLeaderId(null);
        fetchGroups();
      } else {
        const error = await response.json();
        alert(error.message || '更新失败');
      }
    } catch (error) {
      console.error('Failed to update group:', error);
      alert('更新失败');
    }
  };

  const handleDeleteGroup = async (group: Group) => {
    if (!confirm(`确定要删除小组"${group.name}"吗？`)) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`/api/groups/${group.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        fetchGroups();
      } else {
        const error = await response.json();
        alert(error.message || '删除失败');
      }
    } catch (error) {
      console.error('Failed to delete group:', error);
      alert('删除失败');
    }
  };

  const handleAddMember = async (userId: number) => {
    if (!selectedGroup) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`/api/groups/${selectedGroup.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        fetchGroups();
        fetchUsers();
      } else {
        const error = await response.json();
        alert(error.message || '添加失败');
      }
    } catch (error) {
      console.error('Failed to add member:', error);
      alert('添加失败');
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!selectedGroup) return;
    if (!confirm('确定要移除该组员吗？')) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`/api/groups/${selectedGroup.id}/members/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        fetchGroups();
        fetchUsers();
      } else {
        const error = await response.json();
        alert(error.message || '移除失败');
      }
    } catch (error) {
      console.error('Failed to remove member:', error);
      alert('移除失败');
    }
  };

  const groupMembers = users.filter(u => u.groupId === selectedGroup?.id);
  const availableUsers = users.filter(u => !u.groupId && u.role !== 'admin');

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700">权限不足</h2>
          <p className="text-gray-500 mt-2">只有管理员可以访问此页面</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Users size={28} />
          小组管理
        </h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus size={20} />
          创建小组
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">小组名称</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">组长</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">成员数</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">创建时间</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {groups.map((group) => (
              <tr key={group.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-800">{group.name}</td>
                <td className="px-6 py-4 text-gray-600">
                  {group.leaderName || <span className="text-gray-400">未指定</span>}
                </td>
                <td className="px-6 py-4 text-gray-600">{group.memberCount} 人</td>
                <td className="px-6 py-4 text-gray-600">
                  {new Date(group.createdAt).toLocaleDateString('zh-CN')}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setSelectedGroup(group);
                        setNewGroupName(group.name);
                        setNewLeaderId(group.leaderId);
                        setShowMembersModal(true);
                      }}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      title="管理成员"
                    >
                      <Users size={18} />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedGroup(group);
                        setNewGroupName(group.name);
                        setNewLeaderId(group.leaderId);
                        setShowEditModal(true);
                      }}
                      className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                      title="编辑"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(group)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="删除"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {groups.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  暂无小组，点击"创建小组"开始
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 创建小组弹窗 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">创建小组</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">小组名称 *</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="输入小组名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">组长（可选）</label>
                <select
                  value={newLeaderId || ''}
                  onChange={(e) => setNewLeaderId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">不指定组长</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username} ({u.role === 'leader' ? '组长' : u.role === 'member' ? '组员' : u.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 p-4 border-t">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleCreateGroup}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑小组弹窗 */}
      {showEditModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">编辑小组</h2>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">小组名称 *</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="输入小组名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">组长</label>
                <select
                  value={newLeaderId || ''}
                  onChange={(e) => setNewLeaderId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">不指定组长</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username} ({u.role === 'leader' ? '组长' : u.role === 'member' ? '组员' : u.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 p-4 border-t">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleUpdateGroup}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 管理成员弹窗 */}
      {showMembersModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">管理成员 - {selectedGroup.name}</h2>
              <button onClick={() => setShowMembersModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {/* 当前成员 */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">当前成员</h3>
                {groupMembers.length > 0 ? (
                  <div className="space-y-2">
                    {groupMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                            {member.username[0]}
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">{member.username}</div>
                            <div className="text-xs text-gray-500">
                              {member.role === 'leader' ? '组长' : member.role === 'admin' ? '管理员' : '组员'}
                              {selectedGroup.leaderId === member.id && ' · 组长'}
                            </div>
                          </div>
                        </div>
                        {selectedGroup.leaderId !== member.id && (
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">暂无成员</p>
                )}
              </div>

              {/* 可添加的成员 */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">添加成员</h3>
                {availableUsers.length > 0 ? (
                  <div className="space-y-2">
                    {availableUsers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-400 text-white rounded-full flex items-center justify-center text-sm font-medium">
                            {member.username[0]}
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">{member.username}</div>
                            <div className="text-xs text-gray-500">
                              {member.role === 'leader' ? '组长' : member.role === 'member' ? '组员' : member.role}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddMember(member.id)}
                          className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                        >
                          添加
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">没有可添加的成员</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}