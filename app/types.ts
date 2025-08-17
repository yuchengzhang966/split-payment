export interface User {
  id: string;
  email?: string;
  name?: string;
  walletAddress?: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  members: GroupMember[];
  expenses: Expense[];
  createdAt: Date;
  createdBy: string;
}

export interface GroupMember {
  userId: string;
  email: string;
  name?: string;
  joinedAt: Date;
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  paidBy: string; // userId
  paidByName: string;
  participants: string[]; // userIds
  participantNames: string[];
  approvals: string[]; // userIds who approved
  isAuthorized: boolean;
  createdAt: Date;
  settledAt?: Date;
}

export interface Settlement {
  fromUserId: string;
  toUserId: string;
  amount: number;
  isSettled: boolean;
  paymentMethod?: 'pyusd' | 'paypal';
  transactionId?: string;
  transactionStatus?: 'pending' | 'completed' | 'failed';
  settledAt?: Date;
  fees?: number;
}

export interface PaymentHistory {
  id: string;
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  method: 'pyusd' | 'paypal';
  transactionId: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  fees?: number;
  description: string;
}

export interface PaymentMethod {
  type: 'pyusd' | 'paypal';
  name: string;
  enabled: boolean;
  fees: number;
}
