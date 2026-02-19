import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import { User, Plus, Trash2, Mail, Shield, X, Check, Pencil, Eye, AlertTriangle } from 'lucide-react';

const UserManagement = ({ token }) => {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'field_work' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);

  // View Details State
  const [selectedUser, setSelectedUser] = useState(null);

  // Delete State
  const [userToDelete, setUserToDelete] = useState(null);

  const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/auth/users`, {
        headers: { 'x-auth-token': token }
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users", err);
      if (err.response?.status === 401) {
        alert('Session expired or invalid. Please login again.');
        localStorage.removeItem('token');
        window.location.reload();
        return;
      }
      setError(err.response?.data?.msg || err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewUser({ name: '', email: '', password: '', role: 'field_work' });
    setIsEditing(false);
    setEditingUserId(null);
    setShowCreateForm(false);
    setError('');
    setSuccess('');
  };

  const handleCreateOrUpdateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!isEditing && newUser.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (isEditing && newUser.password && newUser.password.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }


    try {
      if (isEditing) {
        // Update User
        const res = await axios.put(
          `${API_URL}/api/auth/users/${editingUserId}`,
          newUser,
          {
            headers: {
              'Content-Type': 'application/json',
              'x-auth-token': token
            }
          }
        );
        setSuccess('User updated successfully!');
        toast.success('User updated successfully');
        setUsers(users.map(u => u._id === editingUserId ? res.data : u));
      } else {
        // Create User
        const res = await axios.post(
          `${API_URL}/api/auth/create-user`,
          newUser,
          {
            headers: {
              'Content-Type': 'application/json',
              'x-auth-token': token
            }
          }
        );
        setSuccess('User created successfully!');
        toast.success('Added successfully');
        setUsers([res.data.user, ...users]);
      }

      resetForm();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.errors?.[0]?.msg || err.response?.data?.msg || 'Failed to save user');
    }
  };


  const handleEditClick = (user) => {
    setIsEditing(true);
    setEditingUserId(user._id);
    setNewUser({
      name: user.name,
      email: user.email,
      password: '', // Don't pre-fill password
      role: user.role
    });
    setShowCreateForm(true);
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      await axios.delete(`${API_URL}/api/auth/users/${userToDelete._id}`, {
        headers: { 'x-auth-token': token }
      });
      setUsers(users.filter(u => u._id !== userToDelete._id));
      setSuccess('User deleted successfully');
      toast.success('User deleted successfully');
      setUserToDelete(null);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.msg || 'Failed to delete user');
      setUserToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="mt-1 text-sm text-gray-500">Manage system access and roles.</p>
        </div>
        <button
          type="button"
          onClick={() => { resetForm(); setShowCreateForm(true); }}
          disabled={loading}
          className="flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> : <Plus className="mr-2 h-5 w-5" />}
          Add User
        </button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Users</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{users.length}</p>
          </div>
          <div className="h-12 w-12 bg-red-50 rounded-full flex items-center justify-center text-red-600">
            <User className="h-6 w-6" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Admins</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{users.filter(u => u.role === 'admin').length}</p>
          </div>
          <div className="h-12 w-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
            <Shield className="h-6 w-6" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Field Reporters</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{users.filter(u => u.role === 'field_work').length}</p>
          </div>
          <div className="h-12 w-12 bg-red-50 rounded-full flex items-center justify-center text-red-600">
            <User className="h-6 w-6" />
          </div>
        </div>
      </div>

      {loading && <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div></div>}
      {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center gap-3"><X className="h-5 w-5" />{error}</div>}
      {success && <div className="p-4 bg-green-50 text-green-700 rounded-xl border border-green-200 flex items-center gap-3"><Check className="h-5 w-5" />{success}</div>}

      {/* User List Table */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-base font-semibold text-gray-900">All Users</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${user.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-red-100 text-red-600'
                          }`}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border ${user.role === 'admin'
                      ? 'bg-purple-50 text-purple-700 border-purple-100'
                      : 'bg-red-50 text-red-700 border-red-100'
                      }`}>
                      {user.role === 'admin' ? <Shield className="mr-1.5 h-3 w-3" /> : <User className="mr-1.5 h-3 w-3" />}
                      {user.role === 'field_work' ? 'Field Reporter' : 'Admin'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt || Date.now()).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditClick(user)}
                        className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-transparent hover:border-green-100"
                        title="Edit User"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(user)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                        title="Delete User"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                    <div className="mx-auto h-12 w-12 text-gray-300 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                      <User className="h-6 w-6" />
                    </div>
                    <p>No users found in the system.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-[110] bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedUser(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-red-600 to-purple-600"></div>
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 p-2 bg-black/20 text-white rounded-full hover:bg-black/40 transition-colors z-10"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="px-6 pt-12 pb-6 relative">
              <div className="absolute -top-12 left-6">
                <div className="h-24 w-24 rounded-2xl bg-white p-1.5 shadow-lg">
                  <div className={`w-full h-full rounded-xl flex items-center justify-center text-3xl font-bold ${selectedUser.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-red-100 text-red-600'}`}>
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="mt-12">
                <h3 className="text-2xl font-bold text-gray-900">{selectedUser.name}</h3>
                <p className="text-gray-500">{selectedUser.email}</p>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-sm text-gray-500">Role</span>
                    <span className={`px-2 py-1 text-xs font-bold rounded-lg ${selectedUser.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-red-100 text-red-700'}`}>
                      {selectedUser.role === 'field_work' ? 'Field Reporter' : 'Admin'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-sm text-gray-500">Status</span>
                    <span className="px-2 py-1 text-xs font-bold bg-green-100 text-green-700 rounded-lg">Active</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-sm text-gray-500">Joined</span>
                    <span className="text-sm font-semibold text-gray-900">{new Date(selectedUser.createdAt || Date.now()).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-[110] bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setUserToDelete(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete User?</h3>
              <p className="text-gray-500 mb-6">Are you sure you want to delete <span className="font-semibold text-gray-700">{userToDelete.name}</span>? This action handles the user implementation plan: <span className="text-red-600 font-medium">User ID will be deleted, but related posts will remain.</span></p>

              <div className="flex gap-3">
                <button
                  onClick={() => setUserToDelete(null)}
                  className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 hover:shadow-lg hover:shadow-red-200 transition-colors"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit User Drawer */}
      {/* Overlay */}
      {showCreateForm && (
        <div
          className="fixed inset-0 z-[100] bg-gray-900/50 backdrop-blur-sm transition-opacity"
          onClick={resetForm}
        />
      )}

      {/* Drawer Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-[101] w-full sm:w-[450px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${showCreateForm ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="h-full flex flex-col bg-white">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white pt-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{isEditing ? 'Edit User' : 'Create New User'}</h3>
              <p className="text-sm text-gray-500 mt-0.5">{isEditing ? 'Update user details' : 'Add a new member to the team'}</p>
            </div>
            <button
              onClick={resetForm}
              className="p-2 -mr-2 text-gray-400 hover:text-gray-500 hover:bg-gray-50 rounded-full transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={handleCreateOrUpdateUser} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  placeholder="e.g. John Doe"
                  className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    required
                    placeholder="name@company.com"
                    className="block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-2">
                  {isEditing ? 'New Password (Optional)' : 'Password'}
                </label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  required={!isEditing}
                  minLength={6}
                  placeholder="••••••••"
                  className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                />
                <p className="mt-1.5 text-xs text-gray-500">Must be at least 6 characters long.{isEditing && ' Leave blank to keep current.'}</p>
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-semibold text-gray-900 mb-2">
                  Role & Permissions
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setNewUser({ ...newUser, role: 'field_work' })}
                    className={`cursor-pointer border rounded-xl p-4 flex flex-col gap-2 transition-all ${newUser.role === 'field_work'
                      ? 'border-red-500 bg-red-50/50 ring-1 ring-red-500'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${newUser.role === 'field_work' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
                      }`}>
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <span className={`block text-sm font-bold ${newUser.role === 'field_work' ? 'text-red-900' : 'text-gray-900'}`}>Field Work</span>
                      <span className="text-xs text-gray-500">Can submit reports</span>
                    </div>
                  </div>

                  <div
                    onClick={() => setNewUser({ ...newUser, role: 'admin' })}
                    className={`cursor-pointer border rounded-xl p-4 flex flex-col gap-2 transition-all ${newUser.role === 'admin'
                      ? 'border-purple-500 bg-purple-50/50 ring-1 ring-purple-500'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${newUser.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'
                      }`}>
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <span className={`block text-sm font-bold ${newUser.role === 'admin' ? 'text-purple-900' : 'text-gray-900'}`}>Admin</span>
                      <span className="text-xs text-gray-500">Full system access</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 flex gap-3">
                <button
                  type="button"
                  className="flex-1 px-4 py-3 bg-white text-gray-700 font-bold rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-all"
                  onClick={resetForm}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-12 flex items-center justify-center px-4 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:filter disabled:grayscale disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>{isEditing ? 'Updating...' : 'Creating...'}</span>
                    </div>
                  ) : (
                    <span>{isEditing ? 'Update User' : 'Create User'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
