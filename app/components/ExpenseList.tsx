'use client';

import { useApp } from '../context/AppContext';
import { Group } from '../types';

interface ExpenseListProps {
  group: Group;
}

export function ExpenseList({ group }: ExpenseListProps) {
  const { user, approveExpense } = useApp();

  const handleApprove = (expenseId: string) => {
    if (!user) return;
    approveExpense(group.id, expenseId, user.id);
  };

  if (group.expenses.length === 0) {
    return (
      <div className="card text-center py-12">
        <div className="text-6xl mb-4">💸</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No expenses yet</h3>
        <p className="text-gray-600">Add the first expense to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {group.expenses
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map((expense) => {
          const requiredApprovals = Math.ceil(group.members.length / 2);
          const hasUserApproved = expense.approvals.includes(user?.id || '');
          const canApprove = !hasUserApproved && !expense.isAuthorized;
          const splitAmount = expense.amount / expense.participants.length;
          const isParticipant = expense.participants.includes(user?.id || '');

          return (
            <div
              key={expense.id}
              className={`card ${expense.isAuthorized ? 'border-l-4 border-l-success-500' : 'border-l-4 border-l-warning-500'}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900">{expense.description}</h4>
                  <p className="text-sm text-gray-600">
                    Paid by {expense.paidByName} • ${expense.amount.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Split between {expense.participantNames.join(', ')} • ${splitAmount.toFixed(2)} each
                  </p>
                </div>
                <div className="text-right">
                  <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    expense.isAuthorized 
                      ? 'bg-success-100 text-success-800'
                      : 'bg-warning-100 text-warning-800'
                  }`}>
                    {expense.isAuthorized ? 'Authorized' : 'Pending'}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    Approvals: {expense.approvals.length}/{requiredApprovals}
                  </span>
                  {expense.isAuthorized && (
                    <span className="text-success-600">✓</span>
                  )}
                </div>

                {isParticipant && canApprove && (
                  <button
                    onClick={() => handleApprove(expense.id)}
                    className="btn-primary text-sm"
                  >
                    Approve
                  </button>
                )}

                {hasUserApproved && !expense.isAuthorized && (
                  <span className="text-sm text-gray-500">✓ You approved</span>
                )}
              </div>

              {isParticipant && expense.isAuthorized && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">
                    You owe: ${splitAmount.toFixed(2)}
                  </p>
                  {expense.paidBy !== user?.id && (
                    <p className="text-sm text-gray-600">
                      To: {expense.paidByName}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}
