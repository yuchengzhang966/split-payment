'use client';

import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Group, GroupMember } from '../types';

interface CreateGroupModalProps {
  onClose: () => void;
}

export function CreateGroupModal({ onClose }: CreateGroupModalProps) {
  const { user, addGroup } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    memberEmails: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Parse member emails
      const emails = formData.memberEmails
        .split(',')
        .map(email => email.trim())
        .filter(email => email.length > 0);

      // Create group members (including creator)
      const members: GroupMember[] = [
        {
          userId: user.id,
          email: user.email || '',
          name: user.name,
          joinedAt: new Date()
        }
      ];

      // Add other members (in a real app, these would be actual users)
      emails.forEach((email) => {
        if (email !== user.email) {
          members.push({
            userId: `user_${Math.random().toString(36).substr(2, 9)}`, // Mock user ID
            email,
            name: email.split('@')[0], // Use email prefix as name
            joinedAt: new Date()
          });
        }
      });

      const newGroup: Group = {
        id: `group_${Math.random().toString(36).substr(2, 9)}`,
        name: formData.name,
        description: formData.description,
        members,
        expenses: [],
        createdAt: new Date(),
        createdBy: user.id
      };

      addGroup(newGroup);
      onClose();
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Create New Group</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Group Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="input"
              placeholder="e.g., Ski Trip to Colorado"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="input"
              rows={3}
              placeholder="Optional description for the group"
            />
          </div>

          <div>
            <label htmlFor="members" className="block text-sm font-medium text-gray-700 mb-1">
              Member Emails
            </label>
            <textarea
              id="members"
              value={formData.memberEmails}
              onChange={(e) => setFormData(prev => ({ ...prev, memberEmails: e.target.value }))}
              className="input"
              rows={3}
              placeholder="friend1@email.com, friend2@email.com"
            />
            <p className="text-xs text-gray-500 mt-1">
              Separate multiple emails with commas. You'll be added automatically.
            </p>
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
              disabled={isSubmitting || !formData.name}
            >
              {isSubmitting ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
