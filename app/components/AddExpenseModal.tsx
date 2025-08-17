'use client';

import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Group, Expense } from '../types';

interface AddExpenseModalProps {
  group: Group;
  onClose: () => void;
}

export function AddExpenseModal({ group, onClose }: AddExpenseModalProps) {
  const { user, addExpense } = useApp();
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    paidBy: user?.id || '',
    participants: group.members.map(member => member.userId)
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const payer = group.members.find(member => member.userId === formData.paidBy);
      if (!payer) {
        alert('Invalid payer selected');
        return;
      }

      const participantNames = formData.participants
        .map(participantId => group.members.find(member => member.userId === participantId)?.name || '')
        .filter(name => name);

      const newExpense: Expense = {
        id: `expense_${Math.random().toString(36).substr(2, 9)}`,
        groupId: group.id,
        description: formData.description,
        amount: parseFloat(formData.amount),
        paidBy: formData.paidBy,
        paidByName: payer.name || payer.email,
        participants: formData.participants,
        participantNames,
        approvals: [formData.paidBy], // Payer automatically approves
        isAuthorized: false, // Will be updated based on approval logic
        createdAt: new Date()
      };

      addExpense(newExpense);
      onClose();
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Failed to add expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleParticipant = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.includes(userId)
        ? prev.participants.filter(id => id !== userId)
        : [...prev.participants, userId]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Add Expense</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <input
              type="text"
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="input"
              placeholder="e.g., Dinner at restaurant"
              required
            />
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Amount ($) *
            </label>
            <input
              type="number"
              id="amount"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              className="input"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label htmlFor="paidBy" className="block text-sm font-medium text-gray-700 mb-1">
              Paid by *
            </label>
            <select
              id="paidBy"
              value={formData.paidBy}
              onChange={(e) => setFormData(prev => ({ ...prev, paidBy: e.target.value }))}
              className="input"
              required
            >
              {group.members.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.name || member.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Split between *
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {group.members.map((member) => (
                <label
                  key={member.userId}
                  className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.participants.includes(member.userId)}
                    onChange={() => toggleParticipant(member.userId)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{member.name || member.email}</div>
                    {member.name && (
                      <div className="text-sm text-gray-600">{member.email}</div>
                    )}
                  </div>
                </label>
              ))}
            </div>
            {formData.participants.length > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                ${(parseFloat(formData.amount) / formData.participants.length || 0).toFixed(2)} per person
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={isSubmitting || !formData.description || !formData.amount || formData.participants.length === 0}
            >
              {isSubmitting ? 'Adding...' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
