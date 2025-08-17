'use client';

import { useState } from 'react';
import { Group } from '../types';
import { ExpenseList } from './ExpenseList';
import { AddExpenseModal } from './AddExpenseModal';
import { GroupLedger } from './GroupLedger';
import { TransactionHistory } from './TransactionHistory';

interface GroupDetailProps {
  group: Group;
}

export function GroupDetail({ group }: GroupDetailProps) {
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [activeTab, setActiveTab] = useState<'expenses' | 'ledger' | 'history'>('expenses');

  const authorizedExpenses = group.expenses.filter(expense => expense.isAuthorized);
  const totalAmount = authorizedExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div>
      {/* Group Header */}
      <div className="card mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
            {group.description && (
              <p className="text-gray-600 mt-1">{group.description}</p>
            )}
          </div>
          <button
            onClick={() => setShowAddExpense(true)}
            className="btn-primary"
          >
            + Add Expense
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{group.members.length}</div>
            <div className="text-sm text-gray-600">Members</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{authorizedExpenses.length}</div>
            <div className="text-sm text-gray-600">Expenses</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-primary-600">${totalAmount.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
        </div>
      </div>

      {/* Members */}
      <div className="card mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Members</h3>
        <div className="grid gap-2">
          {group.members.map((member) => (
            <div key={member.userId} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary-600">
                  {(member.name || member.email).charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="font-medium text-gray-900">{member.name || member.email}</div>
                {member.name && (
                  <div className="text-sm text-gray-600">{member.email}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('expenses')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'expenses'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Expenses
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'ledger'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Ledger
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              History
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'expenses' && <ExpenseList group={group} />}
      {activeTab === 'ledger' && <GroupLedger group={group} />}
      {activeTab === 'history' && <TransactionHistory groupId={group.id} />}

      {/* Add Expense Modal */}
      {showAddExpense && (
        <AddExpenseModal group={group} onClose={() => setShowAddExpense(false)} />
      )}
    </div>
  );
}
