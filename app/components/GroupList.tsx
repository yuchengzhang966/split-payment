'use client';

import { useApp } from '../context/AppContext';

export function GroupList() {
  const { groups, setCurrentGroup, user } = useApp();

  const userGroups = groups.filter(group => 
    group.members.some(member => member.userId === user?.id)
  );

  if (userGroups.length === 0) {
    return (
      <div className="card text-center py-12">
        <div className="text-6xl mb-4">🐝</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No groups yet</h3>
        <p className="text-gray-600 mb-6">Create your first group to start splitting expenses with friends!</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {userGroups.map((group) => {
        const totalExpenses = group.expenses.filter(e => e.isAuthorized).length;
        const totalAmount = group.expenses
          .filter(e => e.isAuthorized)
          .reduce((sum, expense) => sum + expense.amount, 0);

        return (
          <div
            key={group.id}
            onClick={() => setCurrentGroup(group)}
            className="card hover:shadow-md cursor-pointer transition-shadow border-l-4 border-l-primary-500"
          >
            <h4 className="text-lg font-semibold text-gray-900 mb-2">{group.name}</h4>
            {group.description && (
              <p className="text-gray-600 text-sm mb-3">{group.description}</p>
            )}
            
            <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
              <span>{group.members.length} members</span>
              <span>{totalExpenses} expenses</span>
            </div>
            
            {totalAmount > 0 && (
              <div className="text-lg font-semibold text-primary-600">
                ${totalAmount.toFixed(2)} total
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
