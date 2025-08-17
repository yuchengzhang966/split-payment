import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExpenseList } from '../../app/components/ExpenseList'
import { render, createMockGroup, createMockUser, createMockExpense } from '../utils/test-utils'

// Mock the useApp hook
const mockApproveExpense = jest.fn()
const mockUseApp = {
  user: createMockUser({ id: 'user1', name: 'User 1' }),
  approveExpense: mockApproveExpense,
}

jest.mock('../../app/context/AppContext', () => ({
  ...jest.requireActual('../../app/context/AppContext'),
  useApp: () => mockUseApp,
}))

describe('ExpenseList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should display message when no expenses exist', () => {
    const group = createMockGroup({ expenses: [] })

    render(<ExpenseList group={group} />)

    expect(screen.getByText('No expenses yet')).toBeInTheDocument()
    expect(screen.getByText('Add the first expense to get started!')).toBeInTheDocument()
  })

  it('should display expense details correctly', () => {
    const group = createMockGroup({
      expenses: [
        createMockExpense({
          description: 'Dinner at restaurant',
          amount: 120,
          paidByName: 'User 2',
          participants: ['user1', 'user2'],
          participantNames: ['User 1', 'User 2'],
          approvals: ['user1'],
          isAuthorized: false,
        })
      ]
    })

    render(<ExpenseList group={group} />)

    expect(screen.getByText('Dinner at restaurant')).toBeInTheDocument()
    expect(screen.getByText(/Paid by User 2 • \$120\.00/)).toBeInTheDocument()
    expect(screen.getByText(/Split between User 1, User 2 • \$60\.00 each/)).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(screen.getByText('Approvals: 1/1')).toBeInTheDocument()
  })

  it('should show approved status for authorized expenses', () => {
    const group = createMockGroup({
      members: [
        { userId: 'user1', email: 'user1@test.com', name: 'User 1', joinedAt: new Date() },
        { userId: 'user2', email: 'user2@test.com', name: 'User 2', joinedAt: new Date() },
      ],
      expenses: [
        createMockExpense({
          description: 'Hotel booking',
          approvals: ['user1', 'user2'],
          isAuthorized: true,
          participants: ['user1', 'user2'],
        })
      ]
    })

    render(<ExpenseList group={group} />)

    expect(screen.getByText('Authorized')).toBeInTheDocument()
    expect(screen.getByText('✓')).toBeInTheDocument()
  })

  it('should show approve button for pending expenses', async () => {
    const user = userEvent.setup()
    const group = createMockGroup({
      members: [
        { userId: 'user1', email: 'user1@test.com', name: 'User 1', joinedAt: new Date() },
        { userId: 'user2', email: 'user2@test.com', name: 'User 2', joinedAt: new Date() },
      ],
      expenses: [
        createMockExpense({
          id: 'test-expense',
          participants: ['user1', 'user2'],
          approvals: [], // No approvals yet
          isAuthorized: false,
        })
      ]
    })

    render(<ExpenseList group={group} />)

    const approveButton = screen.getByText('Approve')
    expect(approveButton).toBeInTheDocument()

    await user.click(approveButton)

    expect(mockApproveExpense).toHaveBeenCalledWith('test-group-1', 'test-expense', 'user1')
  })

  it('should not show approve button if user already approved', () => {
    const group = createMockGroup({
      expenses: [
        createMockExpense({
          participants: ['user1', 'user2'],
          approvals: ['user1'], // User 1 already approved
          isAuthorized: false,
        })
      ]
    })

    render(<ExpenseList group={group} />)

    expect(screen.queryByText('Approve')).not.toBeInTheDocument()
    expect(screen.getByText('✓ You approved')).toBeInTheDocument()
  })

  it('should not show approve button if user is not a participant', () => {
    const group = createMockGroup({
      expenses: [
        createMockExpense({
          participants: ['user2', 'user3'], // User 1 not a participant
          approvals: [],
          isAuthorized: false,
        })
      ]
    })

    render(<ExpenseList group={group} />)

    expect(screen.queryByText('Approve')).not.toBeInTheDocument()
    expect(screen.queryByText('✓ You approved')).not.toBeInTheDocument()
  })

  it('should show amount owed for authorized expenses', () => {
    const group = createMockGroup({
      expenses: [
        createMockExpense({
          amount: 100,
          paidBy: 'user2', // Different from current user
          paidByName: 'User 2',
          participants: ['user1', 'user2'],
          isAuthorized: true,
        })
      ]
    })

    render(<ExpenseList group={group} />)

    expect(screen.getByText('You owe: $50.00')).toBeInTheDocument()
    expect(screen.getByText('To: User 2')).toBeInTheDocument()
  })

  it('should not show "To:" if user paid the expense', () => {
    const group = createMockGroup({
      expenses: [
        createMockExpense({
          amount: 100,
          paidBy: 'user1', // Current user paid
          paidByName: 'User 1',
          participants: ['user1', 'user2'],
          isAuthorized: true,
        })
      ]
    })

    render(<ExpenseList group={group} />)

    expect(screen.getByText('You owe: $50.00')).toBeInTheDocument()
    expect(screen.queryByText('To:')).not.toBeInTheDocument()
  })

  it('should sort expenses by creation date (newest first)', () => {
    const group = createMockGroup({
      expenses: [
        createMockExpense({
          id: 'old-expense',
          description: 'Old Expense',
          createdAt: new Date('2024-08-10'),
        }),
        createMockExpense({
          id: 'new-expense',
          description: 'New Expense',
          createdAt: new Date('2024-08-15'),
        }),
      ]
    })

    render(<ExpenseList group={group} />)

    const expenseElements = screen.getAllByText(/Expense/)
    expect(expenseElements[0]).toHaveTextContent('New Expense')
    expect(expenseElements[1]).toHaveTextContent('Old Expense')
  })
})