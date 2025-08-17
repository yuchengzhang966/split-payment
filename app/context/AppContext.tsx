'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Group, Expense, User, GroupMember } from '../types';

interface AppContextType {
  user: User | null;
  groups: Group[];
  currentGroup: Group | null;
  setUser: (user: User | null) => void;
  setCurrentGroup: (group: Group | null) => void;
  addGroup: (group: Group) => void;
  addExpense: (expense: Expense) => void;
  approveExpense: (groupId: string, expenseId: string, userId: string) => void;
  updateExpenseAuthorization: (groupId: string, expenseId: string) => void;
  seedDemoData: (userId: string, userEmail: string, userName?: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Set client flag after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load data from localStorage on mount (client-side only)
  useEffect(() => {
    if (!isClient) return;
    
    const savedGroups = localStorage.getItem('payhive-groups');
    if (savedGroups) {
      try {
        const parsed = JSON.parse(savedGroups);
        setGroups(parsed.map((group: any) => ({
          ...group,
          createdAt: new Date(group.createdAt),
          expenses: group.expenses.map((expense: any) => ({
            ...expense,
            createdAt: new Date(expense.createdAt),
            settledAt: expense.settledAt ? new Date(expense.settledAt) : undefined,
          }))
        })));
      } catch (error) {
        console.error('Error loading groups from localStorage:', error);
      }
    }
  }, [isClient]);

  // Save groups to localStorage whenever groups change (client-side only)
  useEffect(() => {
    if (!isClient || groups.length === 0) return;
    localStorage.setItem('payhive-groups', JSON.stringify(groups));
  }, [groups, isClient]);

  const addGroup = (group: Group) => {
    setGroups(prev => [...prev, group]);
  };

  const addExpense = (expense: Expense) => {
    setGroups(prev => prev.map(group => 
      group.id === expense.groupId 
        ? { ...group, expenses: [...group.expenses, expense] }
        : group
    ));
    
    // Update current group if it's the same
    if (currentGroup && currentGroup.id === expense.groupId) {
      setCurrentGroup(prev => prev ? { ...prev, expenses: [...prev.expenses, expense] } : null);
    }
  };

  const approveExpense = (groupId: string, expenseId: string, userId: string) => {
    setGroups(prev => prev.map(group => 
      group.id === groupId 
        ? {
            ...group, 
            expenses: group.expenses.map(expense => 
              expense.id === expenseId && !expense.approvals.includes(userId)
                ? { ...expense, approvals: [...expense.approvals, userId] }
                : expense
            )
          }
        : group
    ));
    
    // Update current group if it's the same
    if (currentGroup && currentGroup.id === groupId) {
      setCurrentGroup(prev => prev ? {
        ...prev,
        expenses: prev.expenses.map(expense => 
          expense.id === expenseId && !expense.approvals.includes(userId)
            ? { ...expense, approvals: [...expense.approvals, userId] }
            : expense
        )
      } : null);
    }
    
    // Check if expense should be authorized
    updateExpenseAuthorization(groupId, expenseId);
  };

  const updateExpenseAuthorization = (groupId: string, expenseId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    
    const expense = group.expenses.find(e => e.id === expenseId);
    if (!expense) return;
    
    const requiredApprovals = Math.ceil(group.members.length / 2);
    const isAuthorized = expense.approvals.length >= requiredApprovals;
    
    if (expense.isAuthorized !== isAuthorized) {
      setGroups(prev => prev.map(g => 
        g.id === groupId 
          ? {
              ...g, 
              expenses: g.expenses.map(e => 
                e.id === expenseId 
                  ? { ...e, isAuthorized }
                  : e
              )
            }
          : g
      ));
      
      if (currentGroup && currentGroup.id === groupId) {
        setCurrentGroup(prev => prev ? {
          ...prev,
          expenses: prev.expenses.map(e => 
            e.id === expenseId 
              ? { ...e, isAuthorized }
              : e
          )
        } : null);
      }
    }
  };

  const seedDemoData = (userId: string, userEmail: string, userName?: string) => {
    // Clear existing data first
    setGroups([]);
    
    const demoMembers: GroupMember[] = [
      {
        userId,
        email: userEmail,
        name: userName || userEmail.split('@')[0],
        joinedAt: new Date('2024-08-10')
      },
      {
        userId: 'demo_charlie',
        email: 'charlie@example.com',
        name: 'Charlie Wilson',
        joinedAt: new Date('2024-08-10')
      },
      {
        userId: 'demo_diana',
        email: 'diana@example.com',
        name: 'Diana Martinez',
        joinedAt: new Date('2024-08-11')
      },
      {
        userId: 'demo_evan',
        email: 'evan@example.com',
        name: 'Evan Thompson',
        joinedAt: new Date('2024-08-11')
      }
    ];

    const demoExpenses: Expense[] = [
      {
        id: 'exp_1',
        groupId: 'demo_group',
        description: 'Hotel booking',
        amount: 480,
        paidBy: userId,
        paidByName: userName || userEmail.split('@')[0],
        participants: [userId, 'demo_charlie', 'demo_diana', 'demo_evan'],
        participantNames: [userName || userEmail.split('@')[0], 'Charlie Wilson', 'Diana Martinez', 'Evan Thompson'],
        approvals: [userId, 'demo_charlie', 'demo_diana'], // 3/4 approved = authorized
        isAuthorized: true,
        createdAt: new Date('2024-08-15T10:30:00')
      },
      {
        id: 'exp_2',
        groupId: 'demo_group',
        description: 'Ski lift tickets',
        amount: 240,
        paidBy: 'demo_charlie',
        paidByName: 'Charlie Wilson',
        participants: [userId, 'demo_charlie', 'demo_diana', 'demo_evan'],
        participantNames: [userName || userEmail.split('@')[0], 'Charlie Wilson', 'Diana Martinez', 'Evan Thompson'],
        approvals: ['demo_charlie', userId], // 2/4 approved = authorized
        isAuthorized: true,
        createdAt: new Date('2024-08-15T14:15:00')
      },
      {
        id: 'exp_3',
        groupId: 'demo_group',
        description: 'Group dinner',
        amount: 160,
        paidBy: 'demo_diana',
        paidByName: 'Diana Martinez',
        participants: [userId, 'demo_charlie', 'demo_diana', 'demo_evan'],
        participantNames: [userName || userEmail.split('@')[0], 'Charlie Wilson', 'Diana Martinez', 'Evan Thompson'],
        approvals: ['demo_diana'], // 1/4 approved = pending
        isAuthorized: false,
        createdAt: new Date('2024-08-15T19:30:00')
      }
    ];

    const demoGroup: Group = {
      id: 'demo_group',
      name: 'Ski Trip to Colorado',
      description: 'Weekend getaway to the mountains',
      members: demoMembers,
      expenses: demoExpenses,
      createdAt: new Date('2024-08-10'),
      createdBy: userId
    };

    setGroups([demoGroup]);
  };

  return (
    <AppContext.Provider value={{
      user,
      groups,
      currentGroup,
      setUser,
      setCurrentGroup,
      addGroup,
      addExpense,
      approveExpense,
      updateExpenseAuthorization,
      seedDemoData,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
