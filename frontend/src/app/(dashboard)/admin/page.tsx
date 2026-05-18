'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Table, Pagination } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { User, UserRole } from '@/types';
import { useAuth } from '@/hooks/useAuth';

const roleOptions = Object.values(UserRole).map((r) => ({
  value: r,
  label: r.charAt(0).toUpperCase() + r.slice(1),
}));

const roleColors: Record<UserRole, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'> = {
  admin: 'danger',
  manager: 'warning',
  executor: 'info',
  client: 'default',
};

export default function AdminPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState('');

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin', 'users', { page, role: roleFilter }],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (roleFilter) params.append('role', roleFilter);
      const response = await api.get(`/admin/users?${params}`);
      return response.data;
    },
  });

  const { data: systemStats } = useQuery({
    queryKey: ['admin', 'system-stats'],
    queryFn: async () => {
      const response = await api.get('/admin/system/stats');
      return response.data;
    },
  });

  const updateUser = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.put(`/admin/users/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User updated successfully');
      setEditUser(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Update failed');
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const endpoint = isActive ? 'deactivate' : 'activate';
      const response = await api.post(`/admin/users/${id}/${endpoint}`);
      return response.data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success(`User ${vars.isActive ? 'deactivated' : 'activated'} successfully`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Action failed');
    },
  });

  const formatDate = (date: string) =>
    new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (_: any, user: User) => (
        <div>
          <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (_: any, user: User) => (
        <Badge variant={roleColors[user.role]} size="sm">
          {user.role}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (_: any, user: User) => (
        <Badge variant={user.isActive ? 'success' : 'default'} dot>
          {user.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'lastLogin',
      header: 'Last Login',
      render: (_: any, user: User) => (
        <span className="text-sm text-gray-500">
          {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Joined',
      render: (_: any, user: User) => (
        <span className="text-sm text-gray-500">{formatDate(user.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_: any, user: User) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditUser(user);
              setEditRole(user.role);
            }}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit role"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          {user.id !== currentUser?.id && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleActive.mutate({ id: user.id, isActive: user.isActive });
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                user.isActive
                  ? 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                  : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
              }`}
              title={user.isActive ? 'Deactivate' : 'Activate'}
            >
              {user.isActive ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-500 text-sm mt-1">Manage users, roles, and system settings</p>
      </div>

      {/* System Stats */}
      {systemStats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Total Users</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{systemStats.users?.total || 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Active Executors</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{systemStats.users?.activeExecutors || 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">System Uptime</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {systemStats.system?.uptime ? `${Math.floor(systemStats.system.uptime / 60)}m` : 'N/A'}
            </p>
          </div>
        </div>
      )}

      {/* Users Management */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
          <Select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            options={[{ value: '', label: 'All Roles' }, ...roleOptions]}
            className="w-40"
          />
        </div>

        <Table
          data={usersData?.data || []}
          columns={columns}
          isLoading={isLoading}
          emptyMessage="No users found"
        />
        {usersData && usersData.total > 0 && (
          <Pagination total={usersData.total} page={page} limit={20} onPageChange={setPage} />
        )}
      </div>

      {/* Edit User Role Modal */}
      <Modal
        isOpen={!!editUser}
        onClose={() => setEditUser(null)}
        title="Edit User Role"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (editUser) {
                  updateUser.mutate({ id: editUser.id, data: { role: editRole } });
                }
              }}
              isLoading={updateUser.isPending}
            >
              Save Changes
            </Button>
          </>
        }
      >
        {editUser && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700">User</p>
              <p className="text-gray-900 mt-1">{editUser.firstName} {editUser.lastName}</p>
              <p className="text-sm text-gray-500">{editUser.email}</p>
            </div>
            <Select
              label="Role"
              value={editRole}
              onChange={(e) => setEditRole(e.target.value)}
              options={roleOptions}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
