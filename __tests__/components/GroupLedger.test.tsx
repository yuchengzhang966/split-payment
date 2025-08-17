import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GroupLedger } from '../../app/components/GroupLedger'
import { render, createMockGroup, createMockUser, createMockExpense } from '../utils/test-utils'

// Mock the useApp hook
const mockUseApp = {
  user: createMockUser({ id: 'user1' }),
}

jest.mock('../../app/context/AppContext', () => ({
  ...jest.requireActual('../../app/context/AppContext'),
  useApp: () => mockUseApp,
}))

describe('GroupLedger', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.alert = jest.fn()
  })

  it('should display "all settled up" when no settlements needed', () => {
    const group = createMockGroup({
      members: [
        { userId: 'user1', email: 'user1@test.com', name: 'User 1', joinedAt: new Date() },
        { userId: 'user2', email: 'user2@test.com', name: 'User 2', joinedAt: new Date() },
      ],
      expenses: []
    })

    render(<GroupLedger group={group} />)

    expect(screen.getByText("You're all settled up!")).toBeInTheDocument()
    expect(screen.getByText("Everyone is settled up!")).toBeInTheDocument()
  })

  it('should calculate and display settlements correctly', () => {
    const group = createMockGroup({
      members: [
        { userId: 'user1', email: 'user1@test.com', name: 'User 1', joinedAt: new Date() },
        { userId: 'user2', email: 'user2@test.com', name: 'User 2', joinedAt: new Date() },
      ],
      expenses: [
        createMockExpense({
          id: 'exp1',
          amount: 100,
          paidBy: 'user2',
          paidByName: 'User 2',
          participants: ['user1', 'user2'],
          isAuthorized: true,
        })
      ]
    })

    render(<GroupLedger group={group} />)

    // User 1 owes User 2 $50 (half of $100)
    expect(screen.getByText(/You owe User 2 \$50\.00/)).toBeInTheDocument()
    expect(screen.getByText(/User 1 owes User 2/)).toBeInTheDocument()
    expect(screen.getByText('$50.00')).toBeInTheDocument()
  })

  it('should show settle up button for debts', async () => {
    const user = userEvent.setup()
    const group = createMockGroup({
      members: [
        { userId: 'user1', email: 'user1@test.com', name: 'User 1', joinedAt: new Date() },
        { userId: 'user2', email: 'user2@test.com', name: 'User 2', joinedAt: new Date() },
      ],
      expenses: [
        createMockExpense({
          amount: 100,
          paidBy: 'user2',
          paidByName: 'User 2',
          participants: ['user1', 'user2'],
          isAuthorized: true,
        })
      ]
    })

    render(<GroupLedger group={group} />)

    const settleButton = screen.getByText('Settle Up')
    expect(settleButton).toBeInTheDocument()

    // Click settle up button
    await user.click(settleButton)

    expect(settleButton).toBeDisabled()
    expect(screen.getByText('Sending...')).toBeInTheDocument()

    // Wait for the mock payment to complete
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining('Payment of $50.00 USD sent successfully!')
      )
    }, { timeout: 3000 })
  })

  it('should handle complex multi-person settlements', () => {
    const group = createMockGroup({
      members: [
        { userId: 'user1', email: 'user1@test.com', name: 'User 1', joinedAt: new Date() },
        { userId: 'user2', email: 'user2@test.com', name: 'User 2', joinedAt: new Date() },
        { userId: 'user3', email: 'user3@test.com', name: 'User 3', joinedAt: new Date() },
      ],
      expenses: [
        // User 1 pays $120 for all 3 people ($40 each)
        createMockExpense({
          id: 'exp1',
          amount: 120,
          paidBy: 'user1',
          paidByName: 'User 1',
          participants: ['user1', 'user2', 'user3'],
          isAuthorized: true,
        }),
        // User 2 pays $60 for user2 and user3 ($30 each)
        createMockExpense({
          id: 'exp2',
          amount: 60,
          paidBy: 'user2',
          paidByName: 'User 2',
          participants: ['user2', 'user3'],
          isAuthorized: true,
        })
      ]
    })

    render(<GroupLedger group={group} />)

    // Complex calculation:
    // User 1: paid $120, owes $40 (from exp1) → net: +$80
    // User 2: paid $60, owes $40 (from exp1) + $30 (from exp2) = $70 → net: -$10
    // User 3: paid $0, owes $40 (from exp1) + $30 (from exp2) = $70 → net: -$70

    // Should show settlements in the group summary
    expect(screen.getByText(/User 2 owes User 1/)).toBeInTheDocument()
    expect(screen.getByText(/User 3 owes User 1/)).toBeInTheDocument()
  })

  it('should not show settlements for unauthorized expenses', () => {
    const group = createMockGroup({
      members: [
        { userId: 'user1', email: 'user1@test.com', name: 'User 1', joinedAt: new Date() },
        { userId: 'user2', email: 'user2@test.com', name: 'User 2', joinedAt: new Date() },
      ],
      expenses: [
        createMockExpense({
          amount: 100,
          paidBy: 'user2',
          paidByName: 'User 2',
          participants: ['user1', 'user2'],
          isAuthorized: false, // Not authorized
        })
      ]
    })

    render(<GroupLedger group={group} />)

    // Should show as all settled up since expense is not authorized
    expect(screen.getByText("You're all settled up!")).toBeInTheDocument()
  })

  it('should show correct PYUSD information', () => {
    const group = createMockGroup({ expenses: [] })

    render(<GroupLedger group={group} />)

    expect(screen.getByText('Powered by PYUSD')).toBeInTheDocument()
    expect(screen.getByText(/PayPal USD \(PYUSD\), a dollar-backed stablecoin/)).toBeInTheDocument()
  })
})