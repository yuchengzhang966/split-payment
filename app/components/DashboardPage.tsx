'use client';

import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { GroupList } from './GroupList';
import { GroupDetail } from './GroupDetail';
import { CreateGroupModal } from './CreateGroupModal';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';

export function DashboardPage() {
  const { user, currentGroup, setCurrentGroup } = useApp();
  const { setShowDynamicUserProfile } = useDynamicContext();
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  if (currentGroup) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => setCurrentGroup(null)}
            className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
          >
            ← Back to Groups
          </button>
          <button
            onClick={() => setShowDynamicUserProfile(true)}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            {user?.name || user?.email}
          </button>
        </div>
        <GroupDetail group={currentGroup} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Welcome back!</h2>
          <p className="text-gray-600 mt-2">Manage your shared expenses and settle up with friends.</p>
        </div>
        <button
          onClick={() => setShowDynamicUserProfile(true)}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          {user?.name || user?.email}
        </button>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">Your Groups</h3>
        <button
          onClick={() => setShowCreateGroup(true)}
          className="btn-primary"
        >
          + Create Group
        </button>
      </div>

      <GroupList />

      {showCreateGroup && (
        <CreateGroupModal onClose={() => setShowCreateGroup(false)} />
      )}
    </div>
  );
}
