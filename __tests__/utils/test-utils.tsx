import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { AppProvider } from '../../app/context/AppContext'
import { Group, User, Expense, GroupMember } from '../../app/types'

// Mock providers wrapper
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <AppProvider>
      {children}
    </AppProvider>
  )
}

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'

// Override render method
export { customRender as render }

// Test data factories
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'test-user-1',
  email: 'test@example.com',
  name: 'Test User',
  walletAddress: '0x123...abc',
  ...overrides,
})

export const createMockGroupMember = (overrides: Partial<GroupMember> = {}): GroupMember => ({
  userId: 'test-user-1',
  email: 'test@example.com',
  name: 'Test User',
  joinedAt: new Date('2024-08-15'),
  ...overrides,
})

export const createMockExpense = (overrides: Partial<Expense> = {}): Expense => ({
  id: 'test-expense-1',
  groupId: 'test-group-1',
  description: 'Test Expense',
  amount: 100,
  paidBy: 'test-user-1',
  paidByName: 'Test User',
  participants: ['test-user-1', 'test-user-2'],
  participantNames: ['Test User', 'Test User 2'],
  approvals: ['test-user-1'],
  isAuthorized: false,
  createdAt: new Date('2024-08-15'),
  ...overrides,
})

export const createMockGroup = (overrides: Partial<Group> = {}): Group => ({
  id: 'test-group-1',
  name: 'Test Group',
  description: 'A test group',
  members: [
    createMockGroupMember(),
    createMockGroupMember({
      userId: 'test-user-2',
      email: 'test2@example.com',
      name: 'Test User 2',
    }),
  ],
  expenses: [createMockExpense()],
  createdAt: new Date('2024-08-15'),
  createdBy: 'test-user-1',
  ...overrides,
})

// Add a simple test to prevent "no tests" error
describe('test-utils', () => {
  it('should create mock data correctly', () => {
    const user = createMockUser()
    expect(user.id).toBeDefined()
    expect(user.email).toBeDefined()
  })
})