import { useEffect, useState } from 'react';
import { getDB, User } from '../utils/db';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Edit, Trash2, X } from 'lucide-react';

export function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { user: currentUser, addAuditLog } = useAuth();

  const [formData, setFormData] = useState<Partial<User>>({
    username: '',
    password: '',
    rank: '',
    fullName: '',
    role: 'Viewer',
  });

  useEffect(() => {
    if (currentUser?.role !== 'Admin') {
      return;
    }
    loadUsers();
  }, [currentUser]);

  const loadUsers = async () => {
    const db = await getDB();
    const allUsers = await db.getAll('users');
    setUsers(allUsers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const db = await getDB();

    if (editingUser) {
      const updated: User = {
        ...editingUser,
        ...formData,
      } as User;
      await db.put('users', updated);
      await addAuditLog('Edit User', `Updated user: ${updated.username}`, updated.id);
    } else {
      const newUser: User = {
        id: `user-${Date.now()}`,
        ...formData,
        createdAt: new Date().toISOString(),
      } as User;
      await db.add('users', newUser);
      await addAuditLog('Add User', `Created user: ${newUser.username}`, newUser.id);
    }

    loadUsers();
    closeModal();
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Delete user ${user.username}?`)) return;

    const db = await getDB();
    await db.delete('users', user.id);
    await addAuditLog('Delete User', `Deleted user: ${user.username}`, user.id);
    loadUsers();
  };

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      rank: '',
      fullName: '',
      role: 'Viewer',
    });
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData(user);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-red-600';
      case 'Supply Officer': return 'bg-blue-600';
      case 'Viewer': return 'bg-slate-600';
      default: return 'bg-gray-600';
    }
  };

  if (currentUser?.role !== 'Admin') {
    return (
      <div className="p-8">
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-6">
          <h2 className="text-xl text-red-300 mb-2">Access Denied</h2>
          <p className="text-slate-400">Only administrators can manage users.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl text-white mb-2">User Management</h1>
          <p className="text-slate-400">Manage system users and roles</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add User
        </button>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm text-slate-300">Username</th>
                <th className="px-4 py-3 text-left text-sm text-slate-300">Full Name</th>
                <th className="px-4 py-3 text-left text-sm text-slate-300">Rank</th>
                <th className="px-4 py-3 text-left text-sm text-slate-300">Role</th>
                <th className="px-4 py-3 text-left text-sm text-slate-300">Created</th>
                <th className="px-4 py-3 text-left text-sm text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-slate-700 hover:bg-slate-700/50">
                  <td className="px-4 py-3 text-white">{user.username}</td>
                  <td className="px-4 py-3 text-white">{user.fullName}</td>
                  <td className="px-4 py-3 text-slate-300">{user.rank}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 ${getRoleBadgeColor(user.role)} text-white text-xs rounded`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="p-1 hover:bg-slate-600 rounded"
                      >
                        <Edit className="w-4 h-4 text-blue-400" />
                      </button>
                      {user.id !== currentUser?.id && (
                        <button
                          onClick={() => handleDelete(user)}
                          className="p-1 hover:bg-slate-600 rounded"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-slate-700">
              <h2 className="text-xl text-white">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h2>
              <button onClick={closeModal}>
                <X className="w-6 h-6 text-slate-400 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Username *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded"
                  required={!editingUser}
                  placeholder={editingUser ? 'Leave blank to keep current' : ''}
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">Full Name *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">Rank *</label>
                <input
                  type="text"
                  value={formData.rank}
                  onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded"
                  placeholder="e.g., Captain, Lieutenant"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded"
                >
                  <option value="Admin">Admin</option>
                  <option value="Supply Officer">Supply Officer</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                >
                  {editingUser ? 'Update' : 'Create'} User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
