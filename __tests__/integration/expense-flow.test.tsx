import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GroupDetail } from '../../app/components/GroupDetail'
import { render, createMockGroup, createMockUser } from '../utils/test-utils'

// Mock the useApp hook with actual functionality
const mockUser = createMockUser({ id: 'user1', name: 'User 1' })
let mockGroups: any[] = []
let mockCurrentGroup: any = null

const mockUseApp = {
  user: mockUser,
  groups: mockGroups,
  currentGroup: mockCurrentGroup,
  setUser: jest.fn(),
  setCurrentGroup: (group: any) => { mockCurrentGroup = group },
  addGroup: (group: any) => { mockGroups.push(group) },
  addExpense: jest.fn((expense: any) => {
    mockGroups = mockGroups.map(g => 
      g.id === expense.groupId 
        ? { ...g, expenses: [...g.expenses, expense] }
        : g
    )
  }),
  approveExpense: jest.fn((groupId: string, expenseId: string, userId: string) => {
    mockGroups = mockGroups.map(group => 
      group.id === groupId 
        ? {
            ...group, 
            expenses: group.expenses.map((expense: any) => 
              expense.id === expenseId && !expense.approvals.includes(userId)
                ? { ...expense, approvals: [...expense.approvals, userId] }
                : expense
            )
          }
        : group
    )
  }),
  updateExpenseAuthorization: jest.fn(),
  seedDemoData: jest.fn(),
}

jest.mock('../../app/context/AppContext', () => ({
  ...jest.requireActual('../../app/context/AppContext'),
  useApp: () => mockUseApp,
}))

describe('Expense Flow Integration', () => {
  let testGroup: any

  beforeEach(() => {
    jest.clearAllMocks()
    window.alert = jest.fn()
    
    testGroup = createMockGroup({
      id: 'integration-test-group',
      name: 'Integration Test Group',
      members: [
        { userId: 'user1', email: 'user1@test.com', name: 'User 1', joinedAt: new Date() },
        { userId: 'user2', email: 'user2@test.com', name: 'User 2', joinedAt: new Date() },
        { userId: 'user3', email: 'user3@test.com', name: 'User 3', joinedAt: new Date() },
      ],
      expenses: []
    })
    
    mockGroups = [testGroup]
    mockCurrentGroup = testGroup
  })

  it('should complete full expense lifecycle: add -> approve -> settle', async () => {
    const user = userEvent.setup()
    
    render(<GroupDetail group={testGroup} />)

    // Step 1: Add new expense
    expect(screen.getByText('No expenses yet')).toBeInTheDocument()
    
    const addExpenseButton = screen.getByText('+ Add Expense')
    await user.click(addExpenseButton)

    // Fill expense form
    await user.type(screen.getByLabelText(/Description/), 'Team Dinner')
    await user.type(screen.getByLabelText(/Amount/), '150')
    
    const submitButton = screen.getByText('Add Expense')
    await user.click(submitButton)

    // Wait for expense to be added
    await waitFor(() => {
      expect(mockUseApp.addExpense).toHaveBeenCalledWith({
        id: expect.any(String),
        groupId: 'integration-test-group',
        description: 'Team Dinner',
        amount: 150,
        paidBy: 'user1',
        paidByName: 'User 1',
        participants: ['user1', 'user2', 'user3'],
        participantNames: ['User 1', 'User 2', 'User 3'],
        approvals: ['user1'], // Payer automatically approves
        isAuthorized: false,
        createdAt: expect.any(Date),
      })
    })

    // Step 2: Switch to Ledger tab to check settlements
    const ledgerTab = screen.getByText('Ledger')
    await user.click(ledgerTab)

    // Should show no settlements yet since expense isn't authorized
    expect(screen.getByText("You're all settled up!")).toBeInTheDocument()
  })

  it('should handle expense approval workflow correctly', async () => {
    const user = userEvent.setup()
    
    // Start with a group that has a pending expense
    const groupWithExpense = {
      ...testGroup,
      expenses: [{
        id: 'pending-expense',
        groupId: 'integration-test-group',
        description: 'Hotel Booking',
        amount: 300,
        paidBy: 'user2',
        paidByName: 'User 2',
        participants: ['user1', 'user2', 'user3'],
        participantNames: ['User 1', 'User 2', 'User 3'],
        approvals: ['user2'], // Only payer approved
        isAuthorized: false,
        createdAt: new Date(),
      }]
    }

    render(<GroupDetail group={groupWithExpense} />)

    // Should show pending expense
    expect(screen.getByText('Hotel Booking')).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(screen.getByText('Approvals: 1/2')).toBeInTheDocument()

    // Current user should be able to approve
    const approveButton = screen.getByText('Approve')
    await user.click(approveButton)

    expect(mockUseApp.approveExpense).toHaveBeenCalledWith(
      'integration-test-group',
      'pending-expense',
      'user1'
    )
  })

  it('should show correct settlement calculations in ledger', async () => {
    const user = userEvent.setup()
    
    // Group with authorized expenses
    const groupWithAuthorizedExpenses = {
      ...testGroup,
      expenses: [
        {
          id: 'expense-1',
          groupId: 'integration-test-group',
          description: 'Dinner',
          amount: 120,
          paidBy: 'user1',
          paidByName: 'User 1',
          participants: ['user1', 'user2', 'user3'],
          participantNames: ['User 1', 'User 2', 'User 3'],
          approvals: ['user1', 'user2'], // Authorized (2/3 >= 50%)
          isAuthorized: true,
          createdAt: new Date(),
        },
        {
          id: 'expense-2',
          groupId: 'integration-test-group',
          description: 'Uber',
          amount: 60,
          paidBy: 'user2',
          paidByName: 'User 2',
          participants: ['user1', 'user2', 'user3'],
          participantNames: ['User 1', 'User 2', 'User 3'],
          approvals: ['user1', 'user2'], // Authorized
          isAuthorized: true,
          createdAt: new Date(),
        }
      ]
    }

    render(<GroupDetail group={groupWithAuthorizedExpenses} />)

    // Switch to ledger tab
    const ledgerTab = screen.getByText('Ledger')
    await user.click(ledgerTab)

    // Check calculations:
    // User 1: paid $120, owes $40 (from dinner) + $20 (from uber) = $60 → net: +$60
    // User 2: paid $60, owes $40 (from dinner) + $20 (from uber) = $60 → net: $0
    // User 3: paid $0, owes $40 (from dinner) + $20 (from uber) = $60 → net: -$60

    // Should show User 3 owes User 1 $60
    expect(screen.getByText(/You owe User 1|User 3 owes User 1/)).toBeInTheDocument()
    expect(screen.getByText('$60.00')).toBeInTheDocument()
  })

  it('should handle settlement simulation', async () => {
    const user = userEvent.setup()
    
    // Group where current user owes money
    const groupWithDebt = {
      ...testGroup,
      expenses: [{
        id: 'expensive-item',
        groupId: 'integration-test-group',
        description: 'Hotel',
        amount: 200,
        paidBy: 'user2',
        paidByName: 'User 2',
        participants: ['user1', 'user2'],
        participantNames: ['User 1', 'User 2'],
        approvals: ['user1', 'user2'],
        isAuthorized: true,
        createdAt: new Date(),
      }]
    }

    render(<GroupDetail group={groupWithDebt} />)

    // Switch to ledger tab
    const ledgerTab = screen.getByText('Ledger')
    await user.click(ledgerTab)

    // Should show debt
    expect(screen.getByText(/You owe User 2 \$100\.00/)).toBeInTheDocument()

    // Click settle up
    const settleButton = screen.getByText('Settle Up')
    await user.click(settleButton)

    // Should show loading state
    expect(screen.getByText('Sending...')).toBeInTheDocument()

    // Wait for settlement simulation to complete
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining('Payment of $100.00 USD sent successfully!')
      )
    }, { timeout: 3000 })
  })

  it('should show correct group statistics', () => {
    const groupWithStats = {
      ...testGroup,
      expenses: [
        {
          id: 'stats-expense-1',
          groupId: 'integration-test-group',
          description: 'Authorized Expense',
          amount: 100,
          paidBy: 'user1',
          paidByName: 'User 1',
          participants: ['user1', 'user2'],
          participantNames: ['User 1', 'User 2'],
          approvals: ['user1', 'user2'],
          isAuthorized: true,
          createdAt: new Date(),
        },
        {
          id: 'stats-expense-2',
          groupId: 'integration-test-group',
          description: 'Pending Expense',
          amount: 50,
          paidBy: 'user2',
          paidByName: 'User 2',
          participants: ['user1', 'user2'],
          participantNames: ['User 1', 'User 2'],
          approvals: ['user2'],
          isAuthorized: false,
          createdAt: new Date(),
        }
      ]
    }

    render(<GroupDetail group={groupWithStats} />)

    // Should show correct statistics in header
    expect(screen.getByText('3')).toBeInTheDocument() // Members count
    expect(screen.getByText('1')).toBeInTheDocument() // Authorized expenses count
    expect(screen.getByText('$100.00')).toBeInTheDocument() // Total authorized amount
  })
})