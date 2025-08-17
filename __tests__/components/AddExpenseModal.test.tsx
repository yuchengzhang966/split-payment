import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddExpenseModal } from '../../app/components/AddExpenseModal'
import { render, createMockGroup, createMockUser } from '../utils/test-utils'

// Mock the useApp hook
const mockAddExpense = jest.fn()
const mockUseApp = {
  user: createMockUser({ id: 'user1', name: 'User 1' }),
  addExpense: mockAddExpense,
}

jest.mock('../../app/context/AppContext', () => ({
  ...jest.requireActual('../../app/context/AppContext'),
  useApp: () => mockUseApp,
}))

describe('AddExpenseModal', () => {
  const mockOnClose = jest.fn()
  const mockGroup = createMockGroup({
    members: [
      { userId: 'user1', email: 'user1@test.com', name: 'User 1', joinedAt: new Date() },
      { userId: 'user2', email: 'user2@test.com', name: 'User 2', joinedAt: new Date() },
      { userId: 'user3', email: 'user3@test.com', name: 'User 3', joinedAt: new Date() },
    ],
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render modal with form fields', () => {
    render(<AddExpenseModal group={mockGroup} onClose={mockOnClose} />)

    expect(screen.getByRole('heading', { name: 'Add Expense' })).toBeInTheDocument()
    expect(screen.getByLabelText(/Description/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Amount/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Paid by/)).toBeInTheDocument()
    expect(screen.getByText(/Split between/)).toBeInTheDocument()
  })

  it('should close modal when X button is clicked', async () => {
    const user = userEvent.setup()
    render(<AddExpenseModal group={mockGroup} onClose={mockOnClose} />)

    const closeButton = screen.getByText('✕')
    await user.click(closeButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should close modal when Cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(<AddExpenseModal group={mockGroup} onClose={mockOnClose} />)

    const cancelButton = screen.getByText('Cancel')
    await user.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should have all members selected by default', () => {
    render(<AddExpenseModal group={mockGroup} onClose={mockOnClose} />)

    const checkboxes = screen.getAllByRole('checkbox')
    checkboxes.forEach(checkbox => {
      expect(checkbox).toBeChecked()
    })
  })

  it('should show per-person cost calculation', async () => {
    const user = userEvent.setup()
    render(<AddExpenseModal group={mockGroup} onClose={mockOnClose} />)

    const amountInput = screen.getByLabelText(/Amount/)
    await user.type(amountInput, '120')

    expect(screen.getByText('$40.00 per person')).toBeInTheDocument()
  })

  it('should update per-person cost when participants change', async () => {
    const user = userEvent.setup()
    render(<AddExpenseModal group={mockGroup} onClose={mockOnClose} />)

    const amountInput = screen.getByLabelText(/Amount/)
    await user.type(amountInput, '120')

    // Uncheck one participant
    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[0])

    expect(screen.getByText('$60.00 per person')).toBeInTheDocument()
  })

  it('should disable submit button when required fields are missing', () => {
    render(<AddExpenseModal group={mockGroup} onClose={mockOnClose} />)

    const submitButton = screen.getByRole('button', { name: 'Add Expense' })
    expect(submitButton).toBeDisabled()
  })

  it('should enable submit button when all required fields are filled', async () => {
    const user = userEvent.setup()
    render(<AddExpenseModal group={mockGroup} onClose={mockOnClose} />)

    await user.type(screen.getByLabelText(/Description/), 'Test Expense')
    await user.type(screen.getByLabelText(/Amount/), '100')

    const submitButton = screen.getByRole('button', { name: 'Add Expense' })
    expect(submitButton).not.toBeDisabled()
  })

  it('should submit expense with correct data', async () => {
    const user = userEvent.setup()
    render(<AddExpenseModal group={mockGroup} onClose={mockOnClose} />)

    await user.type(screen.getByLabelText(/Description/), 'Test Expense')
    await user.type(screen.getByLabelText(/Amount/), '120.50')
    
    // Select a different payer
    await user.selectOptions(screen.getByLabelText(/Paid by/), 'user2')

    const submitButton = screen.getByRole('button', { name: 'Add Expense' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockAddExpense).toHaveBeenCalledWith({
        id: expect.any(String),
        groupId: mockGroup.id,
        description: 'Test Expense',
        amount: 120.5,
        paidBy: 'user2',
        paidByName: 'User 2',
        participants: ['user1', 'user2', 'user3'],
        participantNames: ['User 1', 'User 2', 'User 3'],
        approvals: ['user2'], // Payer automatically approves
        isAuthorized: false,
        createdAt: expect.any(Date),
      })
    })

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should show loading state during submission', async () => {
    const user = userEvent.setup()
    render(<AddExpenseModal group={mockGroup} onClose={mockOnClose} />)

    await user.type(screen.getByLabelText(/Description/), 'Test Expense')
    await user.type(screen.getByLabelText(/Amount/), '100')

    const submitButton = screen.getByRole('button', { name: 'Add Expense' })
    await user.click(submitButton)

    expect(screen.getByText('Adding...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })

  it('should validate that at least one participant is selected', async () => {
    const user = userEvent.setup()
    render(<AddExpenseModal group={mockGroup} onClose={mockOnClose} />)

    await user.type(screen.getByLabelText(/Description/), 'Test Expense')
    await user.type(screen.getByLabelText(/Amount/), '100')

    // Uncheck all participants
    const checkboxes = screen.getAllByRole('checkbox')
    for (const checkbox of checkboxes) {
      await user.click(checkbox)
    }

    const submitButton = screen.getByRole('button', { name: 'Add Expense' })
    expect(submitButton).toBeDisabled()
  })

  it('should display member information correctly', () => {
    const groupWithEmailOnly = createMockGroup({
      members: [
        { userId: 'user1', email: 'user1@test.com', name: '', joinedAt: new Date() },
        { userId: 'user2', email: 'user2@test.com', name: 'User 2', joinedAt: new Date() },
      ],
    })

    render(<AddExpenseModal group={groupWithEmailOnly} onClose={mockOnClose} />)

    // Should show email for member without name
    expect(screen.getByText('user1@test.com')).toBeInTheDocument()
    
    // Should show name and email for member with name
    expect(screen.getByText('User 2')).toBeInTheDocument()
    expect(screen.getByText('user2@test.com')).toBeInTheDocument()
  })
})